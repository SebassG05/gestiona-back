import opportunityWorkbookService from '../services/opportunityWorkbookService.js';

const opportunityWorkbookController = {
  list: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.list({
        portalId: req.params.portalId,
        userId: req.user.id,
        category: req.query.category,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.getById({
        portalId: req.params.portalId,
        workbookId: req.params.workbookId,
        userId: req.user.id,
        page: req.query.page,
        limit: req.query.limit,
        filters: req.query.filters,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  search: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.search({
        portalId: req.params.portalId,
        userId: req.user.id,
        query: req.query.q,
        category: req.query.category,
      });
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  import: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.import({
        portalId: req.params.portalId,
        userId: req.user.id,
        data: req.body,
      });
      return res.status(201).json({
        success: true,
        message: 'Excel importado correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.remove({
        portalId: req.params.portalId,
        workbookId: req.params.workbookId,
        userId: req.user.id,
      });
      return res.json({
        success: true,
        message: 'Página eliminada correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  createRow: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.createRow({
        portalId: req.params.portalId,
        workbookId: req.params.workbookId,
        userId: req.user.id,
        values: req.body.values,
      });
      return res.status(201).json({
        success: true,
        message: 'Contacto creado correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  updateRow: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.updateRow({
        portalId: req.params.portalId,
        workbookId: req.params.workbookId,
        rowId: req.params.rowId,
        userId: req.user.id,
        values: req.body.values,
      });
      return res.json({
        success: true,
        message: 'Contacto actualizado correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  removeRow: async (req, res, next) => {
    try {
      const data = await opportunityWorkbookService.removeRow({
        portalId: req.params.portalId,
        workbookId: req.params.workbookId,
        rowId: req.params.rowId,
        userId: req.user.id,
      });
      return res.json({
        success: true,
        message: 'Contacto eliminado correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default opportunityWorkbookController;
