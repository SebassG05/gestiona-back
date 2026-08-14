import OpportunityConceptNote from '../models/OpportunityConceptNote.js';
import OpportunityConceptNoteVersion from '../models/OpportunityConceptNoteVersion.js';
import opportunityWorkbookRepository from '../repositories/opportunityWorkbookRepository.js';
import portalRepository from '../repositories/portalRepository.js';

const TEMPLATE = [
  ['purposeAmbition', '1. Purpose and ambition'],
  ['impactModel', '2. Impact model'],
  ['methodologicalLogic', '3. Core methodological logic'],
  ['serviceFramework', '4. Service framework'],
  ['digitalImplementation', '5. Digital implementation'],
  ['workPackages', '6. Work Package structure'],
  ['scopeExclusions', '7. What the project does not do'],
  ['exploitationSustainability', '8. Exploitation and sustainability strategy'],
  ['trlPositioning', '9. TRL positioning'],
  ['coCreation', '10. Co-creation, citizen science and social innovation'],
  ['ethicsAi', '11. Ethics and AI governance'],
  ['communication', '12. Communication and dissemination strategy'],
  ['europeanValue', '13. European added value'],
];

const defaultSections = () => TEMPLATE.map(([key, title]) => ({ key, title, content: '' }));

const assertAccess = async ({ portalId, workbookId, rowId, userId }) => {
  const portal = await portalRepository.findById(portalId);
  if (!portal || !portal.members.some((member) => member.equals(userId))) {
    const error = new Error(portal ? 'No tienes acceso a este portal' : 'El portal no existe');
    error.statusCode = portal ? 403 : 404;
    throw error;
  }
  const [row] = await opportunityWorkbookRepository.findRowsByIds({ portalId, rowIds: [rowId], category: 'opportunities' });
  if (!row || String(row.workbook?._id) !== String(workbookId)) {
    const error = new Error('La oportunidad no existe');
    error.statusCode = 404;
    throw error;
  }
  return row;
};

const sanitizeSections = (sections) => {
  const byKey = new Map((Array.isArray(sections) ? sections : []).map((section) => [String(section.key), section]));
  return TEMPLATE.map(([key, title]) => ({ key, title, content: String(byKey.get(key)?.content || '').slice(0, 50000) }));
};

const get = async ({ portalId, workbookId, rowId, userId }) => {
  const row = await assertAccess({ portalId, workbookId, rowId, userId });
  const note = await OpportunityConceptNote.findOne({ portal: portalId, opportunityRow: rowId }).lean();
  return {
    opportunity: { id: row._id, rowNumber: row.rowNumber, values: row.values, workbook: row.workbook },
    conceptNote: note || { title: '', subtitle: '', status: 'draft', sections: defaultSections(), versions: [] },
  };
};

const save = async ({ portalId, workbookId, rowId, userId, data }) => {
  await assertAccess({ portalId, workbookId, rowId, userId });
  const fileName = String(data.fileName || '').trim();
  const mimeType = String(data.mimeType || '').trim();
  const fileData = Buffer.from(String(data.fileBase64 || ''), 'base64');
  const allowedExtension = /\.(docx|doc|pdf)$/i.test(fileName);
  if (!fileName || !allowedExtension || !fileData.length) {
    const error = new Error('Selecciona un archivo Word o PDF valido');
    error.statusCode = 400;
    throw error;
  }
  if (fileData.length > 7 * 1024 * 1024) {
    const error = new Error('El Concept Note no puede superar 7 MB');
    error.statusCode = 413;
    throw error;
  }
  const existing = await OpportunityConceptNote.findOne({ portal: portalId, opportunityRow: rowId }).select('+fileData').lean();
  let versions = existing?.versions || [];
  if (existing?.fileData?.length) {
    const archived = await OpportunityConceptNoteVersion.create({
      portal: portalId,
      conceptNote: existing._id,
      opportunityRow: rowId,
      fileName: existing.fileName,
      mimeType: existing.mimeType,
      fileSize: existing.fileSize,
      fileData: existing.fileData,
      uploadedBy: existing.updatedBy,
      originalUploadedAt: existing.updatedAt || existing.createdAt,
    });
    versions = [...versions, { versionId: archived._id, status: 'completed', sections: [], fileName: existing.fileName, mimeType: existing.mimeType, fileSize: existing.fileSize, savedBy: existing.updatedBy, savedAt: existing.updatedAt }];
  }
  return OpportunityConceptNote.findOneAndUpdate(
    { portal: portalId, opportunityRow: rowId },
    {
      $set: {
        workbook: workbookId,
        title: String(data.title || fileName.replace(/\.(docx|doc|pdf)$/i, '')).trim().slice(0, 300),
        subtitle: '',
        status: 'completed',
        sections: [],
        fileName,
        mimeType,
        fileSize: fileData.length,
        fileData,
        versions,
        updatedBy: userId,
      },
      $setOnInsert: { portal: portalId, opportunityRow: rowId, createdBy: userId },
    },
    { new: true, upsert: true, runValidators: true }
  ).lean();
};

const download = async ({ portalId, workbookId, rowId, userId }) => {
  await assertAccess({ portalId, workbookId, rowId, userId });
  const note = await OpportunityConceptNote.findOne({ portal: portalId, opportunityRow: rowId }).select('+fileData').lean();
  if (!note?.fileData) {
    const error = new Error('Esta oportunidad no tiene un Concept Note adjunto');
    error.statusCode = 404;
    throw error;
  }
  return note;
};

const downloadVersion = async ({ portalId, workbookId, rowId, versionId, userId }) => {
  await assertAccess({ portalId, workbookId, rowId, userId });
  const version = await OpportunityConceptNoteVersion.findOne({ _id: versionId, portal: portalId, opportunityRow: rowId }).select('+fileData').lean();
  if (!version?.fileData) {
    const error = new Error('La version solicitada ya no esta disponible');
    error.statusCode = 404;
    throw error;
  }
  return version;
};

const remove = async ({ portalId, workbookId, rowId, userId }) => {
  await assertAccess({ portalId, workbookId, rowId, userId });
  await OpportunityConceptNote.deleteOne({ portal: portalId, opportunityRow: rowId });
  await OpportunityConceptNoteVersion.deleteMany({ portal: portalId, opportunityRow: rowId });
  return { rowId };
};

export default { get, save, download, downloadVersion, remove };
