import proposalControlService from '../services/proposalControlService.js';

const proposalControlController = {
  get: async (req, res, next) => {
    try {
      const data = await proposalControlService.get({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        userId: req.user.id,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
  save: async (req, res, next) => {
    try {
      const control = await proposalControlService.save({
        portalId: req.params.portalId,
        proposalId: req.params.proposalId,
        userId: req.user.id,
        items: req.body.items,
      });
      res.json({ success: true, message: 'Control de propuesta guardado', data: control });
    } catch (error) {
      next(error);
    }
  },
};

export default proposalControlController;
