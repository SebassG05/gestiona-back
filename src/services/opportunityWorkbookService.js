import mongoose from 'mongoose';
import opportunityWorkbookRepository from '../repositories/opportunityWorkbookRepository.js';
import opportunityContactLinkRepository from '../repositories/opportunityContactLinkRepository.js';
import portalRepository from '../repositories/portalRepository.js';
import proposalRepository from '../repositories/proposalRepository.js';

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

const normalizeHeader = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const getRowValue = (row, names) => {
  const normalizedNames = names.map(normalizeHeader);
  const index = (row.workbook?.headers || []).findIndex((header) =>
    normalizedNames.includes(normalizeHeader(header))
  );
  const value = index >= 0 ? row.values?.[index] : '';
  return value === null || value === undefined ? '' : String(value).trim();
};

const parseOpportunityDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildProposalFromOpportunity = ({ row, portalId, userId }) => {
  const topicId = getRowValue(row, ['Topic ID', 'ID', 'Anuncio y n']);
  const project = getRowValue(row, ['Proyecto', 'Proyectos', 'Nombre', 'Destination']);
  const destination = getRowValue(row, ['Destination', 'Sub-destination', 'Sub destination']);
  const title = project || topicId || `Oportunidad fila ${row.rowNumber}`;
  const sourceLabel = `${row.workbook?.name || 'Oportunidades'} · fila ${row.rowNumber}`;

  return {
    portal: portalId,
    createdBy: userId,
    lifecycleStatus: 'active',
    nombre: title.slice(0, 140),
    proposalId: topicId,
    programa: getRowValue(row, ['Programa']) || 'Horizon Europe',
    convocatoria: getRowValue(row, ['Convocatoria', 'Call', 'Call identifier']),
    tipo: getRowValue(row, ['Type of action', 'Tipo']),
    deadlineApertura: parseOpportunityDate(getRowValue(row, ['Deadline', 'Deadline apertura'])),
    fase: 'Preparacion',
    estado: 'En preparacion',
    prioridad: 'Media',
    fuenteUrl: getRowValue(row, ['Link call', 'Fuente URL', 'URL']),
    proximaAccion: 'Revisar la oportunidad y completar los datos de la propuesta.',
    notas: `Propuesta creada desde ${sourceLabel}${destination ? ` · ${destination}` : ''}.`,
    sourceOpportunityWorkbook: row.workbook?._id,
    sourceOpportunityRow: row._id,
  };
};

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

const buildRowSnapshot = (row) => ({
  workbookId: row.workbook?._id,
  workbookName: row.workbook?.name,
  sourceFileName: row.workbook?.sourceFileName,
  sheetName: row.workbook?.sheetName,
  rowNumber: row.rowNumber,
  headers: row.workbook?.headers || [],
  values: row.values || [],
});

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
  promoteToProposals: async ({ portalId, userId, rowIds }) => {
    await assertPortalAccess({ portalId, userId });
    const uniqueRowIds = [...new Set(Array.isArray(rowIds) ? rowIds : [])];

    if (!uniqueRowIds.length || uniqueRowIds.length > 50 || uniqueRowIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      const error = new Error('Selecciona entre 1 y 50 oportunidades validas');
      error.statusCode = 400;
      throw error;
    }

    const rows = await opportunityWorkbookRepository.findRowsByIds({
      portalId,
      rowIds: uniqueRowIds,
      category: 'opportunities',
    });
    const rowById = new Map(rows.map((row) => [row._id.toString(), row]));
    const orderedRows = uniqueRowIds.map((id) => rowById.get(id)).filter(Boolean);

    if (orderedRows.length !== uniqueRowIds.length) {
      const error = new Error('Alguna oportunidad ya no existe o no pertenece al portal');
      error.statusCode = 404;
      throw error;
    }

    const existing = await proposalRepository.findBySourceOpportunityRows({
      portalId,
      rowIds: uniqueRowIds,
    });
    const existingIds = new Set(existing.map((proposal) => proposal.sourceOpportunityRow.toString()));
    const rowsToCreate = orderedRows.filter((row) => !existingIds.has(row._id.toString()));
    const created = rowsToCreate.length
      ? await proposalRepository.createMany(
          rowsToCreate.map((row) => buildProposalFromOpportunity({ row, portalId, userId }))
        )
      : [];

    return {
      created: created.map((proposal) => ({ id: proposal._id.toString(), nombre: proposal.nombre })),
      skipped: existing.length,
    };
  },

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
    const [, workbook] = await Promise.all([
      assertPortalAccess({ portalId, userId }),
      opportunityWorkbookRepository.findByIdAndPortal(workbookId, portalId),
    ]);

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
    const requestedLimit = Math.min(Math.max(Number(limit) || 80, 1), 200);
    const requestedPage = Math.max(Number(page) || 1, 1);
    const requestedRowsPromise = hasFilters
      ? opportunityWorkbookRepository.listRowsFilteredPaginated({
          workbookId,
          portalId,
          filters: mongoFilters,
          skip: (requestedPage - 1) * requestedLimit,
          limit: requestedLimit,
        })
      : opportunityWorkbookRepository.listRowsPaginated({
          workbookId,
          portalId,
          skip: (requestedPage - 1) * requestedLimit,
          limit: requestedLimit,
        });
    const totalPromise = hasFilters
      ? opportunityWorkbookRepository.countRowsFiltered({ workbookId, portalId, filters: mongoFilters })
      : workbook.rowCount == null
        ? opportunityWorkbookRepository.countRows(workbookId, portalId)
        : Promise.resolve(workbook.rowCount);
    const [total, requestedRows] = await Promise.all([totalPromise, requestedRowsPromise]);
    const pagination = buildPagination({ page, limit, total });
    const rows = pagination.page === requestedPage
      ? requestedRows
      : hasFilters
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

    if ((workbook.category || 'opportunities') !== 'contacts' && rows.length) {
      const counts = await opportunityContactLinkRepository.countByOpportunityRows(
        portalId,
        rows.map((row) => row._id)
      );
      const countsByRow = new Map(
        counts.map((item) => [item._id.toString(), item.count])
      );

      return {
        workbook,
        rows: rows.map((row) => ({
          ...row,
          contactLinkCount: countsByRow.get(row._id.toString()) || 0,
        })),
        pagination,
      };
    }

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
    await opportunityContactLinkRepository.deleteByWorkbook(workbookId, portalId);

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
    await opportunityContactLinkRepository.deleteByRow(rowId, portalId);

    return { id: row._id.toString() };
  },

  linkContactsToOpportunity: async ({
    portalId,
    workbookId,
    rowId,
    userId,
    contactRowIds,
  }) => {
    await assertPortalAccess({ portalId, userId });

    const uniqueContactRowIds = [
      ...new Set((Array.isArray(contactRowIds) ? contactRowIds : []).map(String)),
    ];

    if (!uniqueContactRowIds.length) {
      const error = new Error('Selecciona al menos un contacto');
      error.statusCode = 400;
      throw error;
    }

    const [opportunityRow] = await opportunityWorkbookRepository.findRowsByIds({
      portalId,
      rowIds: [rowId],
      category: 'opportunities',
    });

    if (!opportunityRow || opportunityRow.workbook?._id.toString() !== workbookId) {
      const error = new Error('La oportunidad no existe');
      error.statusCode = 404;
      throw error;
    }

    const contactRows = await opportunityWorkbookRepository.findRowsByIds({
      portalId,
      rowIds: uniqueContactRowIds,
      category: 'contacts',
    });

    if (!contactRows.length) {
      const error = new Error('No se encontraron contactos validos');
      error.statusCode = 404;
      throw error;
    }

    const existingLinks = await opportunityContactLinkRepository.findExisting({
      portalId,
      opportunityRowId: rowId,
      contactRowIds: contactRows.map((row) => row._id),
    });
    const existingContactIds = new Set(
      existingLinks.map((link) => link.contactRow.toString())
    );

    const linksToCreate = contactRows
      .filter((row) => !existingContactIds.has(row._id.toString()))
      .map((contactRow) => ({
        portal: portalId,
        opportunityWorkbook: opportunityRow.workbook._id,
        opportunityRow: opportunityRow._id,
        contactWorkbook: contactRow.workbook._id,
        contactRow: contactRow._id,
        createdBy: userId,
        opportunitySnapshot: buildRowSnapshot(opportunityRow),
        contactSnapshot: buildRowSnapshot(contactRow),
      }));

    if (linksToCreate.length) {
      try {
        await opportunityContactLinkRepository.createMany(linksToCreate);
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }

    return {
      linked: linksToCreate.length,
      skipped: contactRows.length - linksToCreate.length,
      total: contactRows.length,
      opportunityRowId: opportunityRow._id.toString(),
    };
  },

  listLinkedContactsForOpportunityRows: async ({
    portalId,
    workbookId,
    userId,
    rowIds,
  }) => {
    await assertPortalAccess({ portalId, userId });

    const uniqueRowIds = [...new Set((Array.isArray(rowIds) ? rowIds : []).map(String))];

    if (!uniqueRowIds.length) {
      const error = new Error('Selecciona al menos una oportunidad');
      error.statusCode = 400;
      throw error;
    }

    const opportunityRows = await opportunityWorkbookRepository.findRowsByIds({
      portalId,
      rowIds: uniqueRowIds,
      category: 'opportunities',
    });
    const validOpportunityRows = opportunityRows.filter(
      (row) => row.workbook?._id.toString() === workbookId
    );

    if (!validOpportunityRows.length) {
      const error = new Error('La oportunidad no existe');
      error.statusCode = 404;
      throw error;
    }

    const links = await opportunityContactLinkRepository.findByOpportunityRows({
      portalId,
      opportunityRowIds: validOpportunityRows.map((row) => row._id),
    });

    return links.map((link) => {
      const snapshot = link.contactSnapshot || {};
      const workbook = link.contactWorkbook || {};
      const row = link.contactRow || {};

      return {
        id: link._id.toString(),
        opportunityRowId: link.opportunityRow?.toString(),
        createdAt: link.createdAt,
        contact: {
          rowId: row._id?.toString() || link.contactRow?.toString() || null,
          workbookId: workbook._id?.toString() || link.contactWorkbook?.toString() || null,
          workbookName: workbook.name || snapshot.workbookName || 'Contactos',
          sourceFileName: workbook.sourceFileName || snapshot.sourceFileName || '',
          sheetName: workbook.sheetName || snapshot.sheetName || '',
          rowNumber: row.rowNumber || snapshot.rowNumber || null,
          headers: workbook.headers || snapshot.headers || [],
          values: row.values || snapshot.values || [],
        },
      };
    });
  },

  unlinkContactFromOpportunity: async ({ portalId, workbookId, linkId, userId }) => {
    await assertPortalAccess({ portalId, userId });

    const deletedLink = await opportunityContactLinkRepository.deleteById({
      portalId,
      workbookId,
      linkId,
    });

    if (!deletedLink) {
      const error = new Error('El contacto vinculado no existe');
      error.statusCode = 404;
      throw error;
    }

    return { id: deletedLink._id.toString() };
  },
};

export default opportunityWorkbookService;
