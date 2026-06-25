import crypto from 'crypto';
import portalExcelRepository from '../repositories/portalExcelRepository.js';
import portalRepository from '../repositories/portalRepository.js';
import microsoftGraphService from './microsoftGraphService.js';

const normalizeHeader = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[€%/()_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

const columnMap = {
  ID: 'externalId',
  'PROPUESTA ID': 'externalId',
  'NOMBRE DE LA PROPUESTA': 'nombre',
  NOMBRE: 'nombre',
  PROGRAMA: 'programa',
  CONVOCATORIA: 'convocatoria',
  ACRONIMO: 'acronimo',
  TIPO: 'tipo',
  DEADLINE: 'deadlineApertura',
  'DEADLINE APERTURA': 'deadlineApertura',
  FASE: 'fase',
  ESTADO: 'estado',
  PRIORIDAD: 'prioridad',
  RESPONSABLE: 'responsable',
  'ROL EVENOR': 'rolEvenor',
  'COORDINADOR LEAD': 'coordinadorLead',
  'PRESUPUESTO TOTAL': 'presupuestoTotal',
  'PRESUPUESTO EVENOR': 'presupuestoEvenor',
  PROBABILIDAD: 'probabilidad',
  'VALOR ESPERADO': 'valorEsperado',
  'PROYECTO EJECUCION VINCULADO': 'proyectoEjecucionVinculado',
  'PAGOS RECIBIDOS VINCULADOS': 'pagosRecibidosVinculados',
  'BALANCE PENDIENTE': 'balancePendiente',
  'PROXIMA ACCION': 'proximaAccion',
  'FUENTE URL': 'fuenteUrl',
  NOTAS: 'notas',
};

const numericFields = new Set([
  'presupuestoTotal',
  'presupuestoEvenor',
  'probabilidad',
  'valorEsperado',
  'pagosRecibidosVinculados',
  'balancePendiente',
]);

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
  return portal;
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const normalized = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value === 'number') {
    return new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
  }
  const parts = String(value).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (parts) return new Date(`${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00:00Z`);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizePriority = (value) => {
  const map = { A: 'Alta', ALTA: 'Alta', B: 'Media', MEDIA: 'Media', C: 'Baja', BAJA: 'Baja' };
  return map[normalizeHeader(value)] || String(value || '').trim();
};

const parseRows = (values) => {
  if (!Array.isArray(values) || values.length < 2) {
    throw new Error('La hoja no contiene cabeceras y propuestas');
  }
  const headers = values[0].map(normalizeHeader);
  const fields = headers.map((header) => columnMap[header]);
  if (!fields.includes('externalId') && !fields.includes('nombre')) {
    throw new Error('La hoja debe incluir una columna ID o NOMBRE DE LA PROPUESTA');
  }

  return values
    .slice(1)
    .map((row, index) => {
      if (!Array.isArray(row) || row.every((cell) => cell === null || cell === undefined || cell === '')) {
        return null;
      }
      const result = { rowNumber: index + 2 };
      row.forEach((cell, columnIndex) => {
        const field = fields[columnIndex];
        if (!field || cell === null || cell === undefined || cell === '') return;
        if (field === 'deadlineApertura') result[field] = parseDate(cell);
        else if (field === 'prioridad') result[field] = normalizePriority(cell);
        else if (numericFields.has(field)) result[field] = parseNumber(cell);
        else result[field] = String(cell).trim();
      });
      result.externalId = result.externalId || result.nombre;
      result.nombre = result.nombre || result.externalId;
      if (!result.externalId || !result.nombre) return null;
      result.sourceHash = crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex');
      return result;
    })
    .filter(Boolean);
};

const getLinkAndToken = async (portalId) => {
  const link = await portalExcelRepository.findLinkByPortal(portalId);
  if (!link) {
    const error = new Error('Primero debes conectar una cuenta de Microsoft');
    error.statusCode = 404;
    throw error;
  }
  const accessToken = await microsoftGraphService.getAccessToken(link, (tokenData) =>
    portalExcelRepository.updateLink(portalId, tokenData)
  );
  return { link, accessToken };
};

const serializeLink = (link) => ({
  connected: Boolean(link),
  microsoftAccount: link?.microsoftAccount || '',
  fileSelected: Boolean(link?.itemId && link?.worksheetId),
  fileName: link?.fileName || '',
  webUrl: link?.webUrl || '',
  worksheetName: link?.worksheetName || '',
  lastSyncedAt: link?.lastSyncedAt || null,
  lastSyncCount: link?.lastSyncCount || 0,
  lastSyncError: link?.lastSyncError || '',
});

const portalExcelService = {
  getStatus: async ({ portalId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    const link = await portalExcelRepository.findLinkByPortal(portalId);
    return { configured: microsoftGraphService.isConfigured(), ...serializeLink(link) };
  },

  getAuthorizationUrl: async ({ portalId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    return microsoftGraphService.getAuthorizationUrl({ portalId, userId });
  },

  completeAuthorization: async ({ code, state }) => {
    const payload = microsoftGraphService.verifyState(state);
    await assertPortalAccess({ portalId: payload.portalId, userId: payload.userId });
    const tokenData = await microsoftGraphService.exchangeCode(code);
    await portalExcelRepository.upsertConnection(payload.portalId, {
      connectedBy: payload.userId,
      ...tokenData,
      lastSyncError: '',
    });
    return payload.portalId;
  },

  listFiles: async ({ portalId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    const { accessToken } = await getLinkAndToken(portalId);
    return microsoftGraphService.listExcelFiles(accessToken);
  },

  listWorksheets: async ({ portalId, userId, driveId, itemId }) => {
    await assertPortalAccess({ portalId, userId });
    const { accessToken } = await getLinkAndToken(portalId);
    return microsoftGraphService.listWorksheets(accessToken, { driveId, itemId });
  },

  selectWorkbook: async ({ portalId, userId, data }) => {
    await assertPortalAccess({ portalId, userId });
    const link = await portalExcelRepository.updateLink(portalId, {
      driveId: data.driveId,
      itemId: data.itemId,
      fileName: data.fileName,
      webUrl: data.webUrl || '',
      worksheetId: data.worksheetId,
      worksheetName: data.worksheetName,
      lastSyncError: '',
    });
    if (!link) {
      const error = new Error('Primero debes conectar una cuenta de Microsoft');
      error.statusCode = 404;
      throw error;
    }
    return serializeLink(link);
  },

  sync: async ({ portalId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    const { link, accessToken } = await getLinkAndToken(portalId);
    if (!link.itemId || !link.worksheetId) {
      const error = new Error('Selecciona un archivo y una hoja antes de sincronizar');
      error.statusCode = 422;
      throw error;
    }

    try {
      const values = await microsoftGraphService.readUsedRange(accessToken, link);
      const rows = parseRows(values);
      await portalExcelRepository.syncRows({
        portalId,
        excelLinkId: link._id,
        rows,
      });
      const updatedLink = await portalExcelRepository.updateLink(portalId, {
        lastSyncedAt: new Date(),
        lastSyncCount: rows.length,
        lastSyncError: '',
      });
      return { count: rows.length, link: serializeLink(updatedLink) };
    } catch (error) {
      await portalExcelRepository.updateLink(portalId, { lastSyncError: error.message });
      throw error;
    }
  },

  listRows: async ({ portalId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    return portalExcelRepository.listRows(portalId);
  },

  disconnect: async ({ portalId, userId }) => {
    await assertPortalAccess({ portalId, userId });
    await Promise.all([
      portalExcelRepository.deleteLink(portalId),
      portalExcelRepository.deleteRows(portalId),
    ]);
    return { disconnected: true };
  },
};

export default portalExcelService;
