import opportunityConceptNoteService from '../services/opportunityConceptNoteService.js';

const opportunityConceptNoteController = {
  get: async (req, res, next) => {
    try {
      const data = await opportunityConceptNoteService.get({ portalId: req.params.portalId, workbookId: req.params.workbookId, rowId: req.params.rowId, userId: req.user.id });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },
  save: async (req, res, next) => {
    try {
      const data = await opportunityConceptNoteService.save({ portalId: req.params.portalId, workbookId: req.params.workbookId, rowId: req.params.rowId, userId: req.user.id, data: req.body });
      res.json({ success: true, message: 'Concept Note guardado', data });
    } catch (error) { next(error); }
  },
  download: async (req, res, next) => {
    try {
      const note = await opportunityConceptNoteService.download({ portalId: req.params.portalId, workbookId: req.params.workbookId, rowId: req.params.rowId, userId: req.user.id });
      res.setHeader('Content-Type', note.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(note.fileName)}`);
      res.send(note.fileData);
    } catch (error) { next(error); }
  },
  downloadVersion: async (req, res, next) => {
    try {
      const version = await opportunityConceptNoteService.downloadVersion({ portalId: req.params.portalId, workbookId: req.params.workbookId, rowId: req.params.rowId, versionId: req.params.versionId, userId: req.user.id });
      res.setHeader('Content-Type', version.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(version.fileName)}`);
      res.send(version.fileData);
    } catch (error) { next(error); }
  },
  remove: async (req, res, next) => {
    try {
      const data = await opportunityConceptNoteService.remove({ portalId: req.params.portalId, workbookId: req.params.workbookId, rowId: req.params.rowId, userId: req.user.id });
      res.json({ success: true, message: 'Concept Note eliminado', data });
    } catch (error) { next(error); }
  },
};

export default opportunityConceptNoteController;
