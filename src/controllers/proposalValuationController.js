import service from '../services/proposalValuationService.js';

const context = (req) => ({ portalId: req.params.portalId, userId: req.user?.id || req.user?._id });

export default {
  list: async (req, res, next) => {
    try { res.json(await service.list(context(req))); } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try { res.status(201).json(await service.create(context(req), req.body)); } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try { res.json(await service.update(context(req), req.params.rowId, req.body)); } catch (error) { next(error); }
  },
  remove: async (req, res, next) => {
    try { res.json(await service.remove(context(req), req.params.rowId)); } catch (error) { next(error); }
  },
};
