import BusinessTrip from '../models/BusinessTrip.js';

const populateTrip = (query) =>
  query.populate('assignedTo', 'username email').populate('createdBy', 'username email');

const businessTripRepository = {
  create: (tripData) => BusinessTrip.create(tripData),

  findById: (tripId) => populateTrip(BusinessTrip.findById(tripId)),

  findByPortal: ({ portalId, startDate, endDate }) => {
    const query = { portal: portalId };

    if (startDate) {
      query.endDate = { ...(query.endDate || {}), $gte: startDate };
    }

    if (endDate) {
      query.startDate = { ...(query.startDate || {}), $lte: endDate };
    }

    return populateTrip(BusinessTrip.find(query).sort({ startDate: 1, createdAt: -1 }));
  },

  updateById: (tripId, tripData) =>
    populateTrip(
      BusinessTrip.findByIdAndUpdate(tripId, tripData, {
        new: true,
        runValidators: true,
      })
    ),

  deleteById: (tripId) => BusinessTrip.findByIdAndDelete(tripId),
};

export default businessTripRepository;
