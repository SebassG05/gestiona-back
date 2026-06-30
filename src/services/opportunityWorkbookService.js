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
  list: async ({ portalId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    return opportunityWorkbookRepository.listByPortal(portalId);
  },

  search: async ({ portalId, userId, query }) => {
    await assertPortalAccess({ portalId, userId });

    const normalizedQuery = String(query || '').trim();
    if (normalizedQuery.length < 2) {
      return [];
    }

    return opportunityWorkbookRepository.searchRows({
      portalId,
      term: escapeRegex(normalizedQuery),
      limit: 80,
    });
  },

  getById: async ({ portalId, workbookId, userId, page, limit }) => {
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

    const total = workbook.rowCount ?? (await opportunityWorkbookRepository.countRows(workbookId, portalId));
    const pagination = buildPagination({ page, limit, total });
    const rows = await opportunityWorkbookRepository.listRowsPaginated({
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
};

export default opportunityWorkbookService;
