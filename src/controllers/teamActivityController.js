import teamActivityService from '../services/teamActivityService.js';

const teamActivityController = {
  list: async (req, res, next) => {
    try {
      const activities = await teamActivityService.list({
        portalId: req.params.portalId,
        userId: req.user.id,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });

      return res.status(200).json({
        success: true,
        message: 'Actividades recuperadas correctamente',
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const activity = await teamActivityService.create({
        portalId: req.params.portalId,
        userId: req.user.id,
        activityData: req.body,
      });

      return res.status(201).json({
        success: true,
        message: 'Actividad creada correctamente',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const activity = await teamActivityService.update({
        portalId: req.params.portalId,
        activityId: req.params.activityId,
        userId: req.user.id,
        activityData: req.body,
      });

      return res.status(200).json({
        success: true,
        message: 'Actividad actualizada correctamente',
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const result = await teamActivityService.remove({
        portalId: req.params.portalId,
        activityId: req.params.activityId,
        userId: req.user.id,
      });

      return res.status(200).json({
        success: true,
        message: 'Actividad eliminada correctamente',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default teamActivityController;
