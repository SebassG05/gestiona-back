import portalFavoriteService from '../services/portalFavoriteService.js';

const portalFavoriteController = {
  list: async (req, res, next) => {
    try {
      const data = await portalFavoriteService.list({ portalId: req.params.portalId, userId: req.user.id });
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },
  set: async (req, res, next) => {
    try {
      const data = await portalFavoriteService.set({
        portalId: req.params.portalId,
        userId: req.user.id,
        entityType: req.params.entityType,
        entityId: req.params.entityId,
        favorite: req.body.favorite,
      });
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },
};

export default portalFavoriteController;
