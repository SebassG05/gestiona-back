import businessTripService from '../services/businessTripService.js';

const getUserId = (req) => req.user?.id || req.user?._id;

const businessTripController = {
  list: async (req, res, next) => {
    try {
      const trips = await businessTripService.list({
        portalId: req.params.portalId,
        userId: getUserId(req),
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      });

      res.json(trips);
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const trip = await businessTripService.create({
        portalId: req.params.portalId,
        userId: getUserId(req),
        tripData: req.body,
      });

      res.status(201).json(trip);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const trip = await businessTripService.update({
        portalId: req.params.portalId,
        userId: getUserId(req),
        tripId: req.params.tripId,
        tripData: req.body,
      });

      res.json(trip);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req, res, next) => {
    try {
      const result = await businessTripService.remove({
        portalId: req.params.portalId,
        userId: getUserId(req),
        tripId: req.params.tripId,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default businessTripController;
