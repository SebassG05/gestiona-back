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
};

export default opportunityWorkbookController;
