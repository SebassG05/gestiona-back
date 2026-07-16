import teamVacationService from '../services/teamVacationService.js';

const teamVacationController = {
  list: async (req, res, next) => {
    try {
      const data = await teamVacationService.list({
        portalId: req.params.portalId,
        userId: req.user.id,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = await teamVacationService.create({
        portalId: req.params.portalId,
        userId: req.user.id,
        vacationData: req.body,
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const data = await teamVacationService.remove({
        portalId: req.params.portalId,
        vacationId: req.params.vacationId,
        userId: req.user.id,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

export default teamVacationController;
