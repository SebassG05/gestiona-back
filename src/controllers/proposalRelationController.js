import proposalRelationService from '../services/proposalRelationService.js';

const getParams = (req) => ({
  resource: req.params.resource,
  portalId: req.params.portalId,
  proposalId: req.params.proposalId,
  userId: req.user.id,
});

const proposalRelationController = {
  list: async (req, res, next) => {
    try {
      const result = await proposalRelationService.list(getParams(req));
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const item = await proposalRelationService.create({
        ...getParams(req),
        data: req.body,
      });
      return res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const item = await proposalRelationService.update({
        ...getParams(req),
        itemId: req.params.itemId,
        data: req.body,
      });
      return res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const item = await proposalRelationService.remove({
        ...getParams(req),
        itemId: req.params.itemId,
      });
      return res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },
};

export default proposalRelationController;
