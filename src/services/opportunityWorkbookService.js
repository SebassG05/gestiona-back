import opportunityWorkbookRepository from '../repositories/opportunityWorkbookRepository.js';
import portalRepository from '../repositories/portalRepository.js';

const assertPortalAccess = async ({ portalId, userId }) => {
  const portal = await portalRepository.findById(portalId);

  if (!portal) {
    const error = new Error('El portal no existe');
    error.statusCode = 404;
    throw error;
  }

  if (!portal.members.some((member) => member.equals(userId))) {
    const error = new Error('No tienes acceso a este portal');
    error.statusCode = 403;
    throw error;
  }
};

const normalizeCell = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value).trim();
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeCategory = (category) =>
  category === 'contacts' ? 'contacts' : 'opportunities';

const parseFilters = (rawFilters) => {
  if (!rawFilters) return [];
  if (Array.isArray(rawFilters)) return rawFilters;

  try {
    const parsed = JSON.parse(rawFilters);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const buildMongoRowFilters = ({ headers, rawFilters }) => {
  const filters = parseFilters(rawFilters)
    .map((filter) => ({
      header: String(filter?.header || '').trim(),
      value: String(filter?.value || '').trim(),
    }))
    .filter((filter) => filter.header && filter.value);

  if (!filters.length) return {};

  const conditions = filters
    .map((filter) => {
      const columnIndex = headers.findIndex((header) => header === filter.header);
      if (columnIndex < 0) return null;

      return {
        $expr: {
          $regexMatch: {
            input: {
              $toString: {
                $ifNull: [{ $arrayElemAt: ['$values', columnIndex] }, ''],
              },
            },
            regex: escapeRegex(filter.value),
            options: 'i',
          },
        },
      };
    })
    .filter(Boolean);

  return conditions.length ? { $and: conditions } : {};
};

const normalizeRowValues = ({ values, headers }) => {
  const nextValues = Array.isArray(values) ? values : [];
  return headers.map((_, index) => normalizeCell(nextValues[index]));
};

const buildPagination = ({ page, limit, total }) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 80, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
  const currentPage = Math.min(safePage, totalPages);

  return {
    page: currentPage,
    limit: safeLimit,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

const opportunityWorkbookService = {
  list: async ({ portalId, userId, category }) => {
    await assertPortalAccess({ portalId, userId });
    return opportunityWorkbookRepository.listByPortal(portalId, normalizeCategory(category));
  },

  search: async ({ portalId, userId, query, category }) => {
    await assertPortalAccess({ portalId, userId });

    const normalizedQuery = String(query || '').trim();
    if (normalizedQuery.length < 2) {
      return [];
    }

    return opportunityWorkbookRepository.searchRows({
      portalId,
      term: escapeRegex(normalizedQuery),
      category: normalizeCategory(category),
      limit: 80,
    });
  },

  getById: async ({ portalId, workbookId, userId, page, limit, filters }) => {
    await assertPortalAccess({ portalId, userId });
    const workbook = await opportunityWorkbookRepository.findByIdAndPortal(
      workbookId,
      portalId
    );

    if (!workbook) {
      const error = new Error('La página de oportunidades no existe');
      error.statusCode = 404;
      throw error;
    }

    const mongoFilters = buildMongoRowFilters({
      headers: workbook.headers || [],
      rawFilters: filters,
    });
    const hasFilters = Object.keys(mongoFilters).length > 0;
    const total = hasFilters
      ? await opportunityWorkbookRepository.countRowsFiltered({
          workbookId,
          portalId,
          filters: mongoFilters,
        })
      : workbook.rowCount ?? (await opportunityWorkbookRepository.countRows(workbookId, portalId));
    const pagination = buildPagination({ page, limit, total });
    const rows = hasFilters
      ? await opportunityWorkbookRepository.listRowsFilteredPaginated({
          workbookId,
          portalId,
          filters: mongoFilters,
          skip: (pagination.page - 1) * pagination.limit,
          limit: pagination.limit,
        })
      : await opportunityWorkbookRepository.listRowsPaginated({
          workbookId,
          portalId,
          skip: (pagination.page - 1) * pagination.limit,
          limit: pagination.limit,
        });

    return { workbook, rows, pagination };
  },

  import: async ({ portalId, userId, data }) => {
    await assertPortalAccess({ portalId, userId });

    const namedColumnIndexes = data.headers
      .map((header, index) => ({ header: String(header || '').trim(), index }))
      .filter(({ header }) => header);
    const headers = namedColumnIndexes.map(({ header }) => header);
    const normalizedRows = data.rows.map((row) =>
      namedColumnIndexes.map(({ index }) => normalizeCell(row[index]))
    );

    const workbook = await opportunityWorkbookRepository.createWorkbook({
      portal: portalId,
      createdBy: userId,
      name: data.name.trim(),
      sourceFileName: data.sourceFileName.trim(),
      sheetName: data.sheetName.trim(),
      category: normalizeCategory(data.category),
      headerRow: data.headerRow,
      headers,
      rowCount: normalizedRows.length,
    });

    try {
      if (normalizedRows.length) {
        await opportunityWorkbookRepository.createRows(
          normalizedRows.map((values, index) => ({
            portal: portalId,
            workbook: workbook._id,
            rowNumber: data.headerRow + index + 1,
            values,
          }))
        );
      }
    } catch (error) {
      await opportunityWorkbookRepository.deleteRows(workbook._id, portalId);
      await opportunityWorkbookRepository.deleteWorkbook(workbook._id, portalId);
      throw error;
    }

    return workbook.toObject();
  },

  remove: async ({ portalId, workbookId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    const workbook = await opportunityWorkbookRepository.findByIdAndPortal(
      workbookId,
      portalId
    );

    if (!workbook) {
      const error = new Error('La página de oportunidades no existe');
      error.statusCode = 404;
      throw error;
    }

    await opportunityWorkbookRepository.deleteRows(workbookId, portalId);
    await opportunityWorkbookRepository.deleteWorkbook(workbookId, portalId);

    return { id: workbook._id.toString(), name: workbook.name };
  },

  createRow: async ({ portalId, workbookId, userId, values }) => {
    await assertPortalAccess({ portalId, userId });
    const workbook = await opportunityWorkbookRepository.findByIdAndPortal(
      workbookId,
      portalId
    );

    if (!workbook) {
      const error = new Error('La pagina de contactos no existe');
      error.statusCode = 404;
      throw error;
    }

    const lastRow = await opportunityWorkbookRepository.getLastRow(workbookId, portalId);
    const row = await opportunityWorkbookRepository.createRow({
      portal: portalId,
      workbook: workbookId,
      rowNumber: (lastRow?.rowNumber || workbook.headerRow || 1) + 1,
      values: normalizeRowValues({ values, headers: workbook.headers || [] }),
    });

    await opportunityWorkbookRepository.incrementWorkbookRowCount({
      workbookId,
      portalId,
      amount: 1,
    });

    return row.toObject();
  },

  updateRow: async ({ portalId, workbookId, rowId, userId, values }) => {
    await assertPortalAccess({ portalId, userId });
    const workbook = await opportunityWorkbookRepository.findByIdAndPortal(
      workbookId,
      portalId
    );

    if (!workbook) {
      const error = new Error('La pagina de contactos no existe');
      error.statusCode = 404;
      throw error;
    }

    const row = await opportunityWorkbookRepository.updateRow({
      rowId,
      workbookId,
      portalId,
      values: normalizeRowValues({ values, headers: workbook.headers || [] }),
    });

    if (!row) {
      const error = new Error('El contacto no existe');
      error.statusCode = 404;
      throw error;
    }

    return row;
  },

  removeRow: async ({ portalId, workbookId, rowId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    const row = await opportunityWorkbookRepository.deleteRow({
      rowId,
      workbookId,
      portalId,
    });

    if (!row) {
      const error = new Error('El contacto no existe');
      error.statusCode = 404;
      throw error;
    }

    await opportunityWorkbookRepository.incrementWorkbookRowCount({
      workbookId,
      portalId,
      amount: -1,
    });

    return { id: row._id.toString() };
  },
};

export default opportunityWorkbookService;
