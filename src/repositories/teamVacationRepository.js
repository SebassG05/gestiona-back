import TeamVacation from '../models/TeamVacation.js';

const populateUser = (query) => query.populate('user', 'username email');

const teamVacationRepository = {
  create: (vacationData) => TeamVacation.create(vacationData),

  findById: (vacationId) => populateUser(TeamVacation.findById(vacationId)),

  findByPortal: ({ portalId, startDate, endDate }) => {
    const query = { portal: portalId };

    if (startDate) query.endDate = { ...(query.endDate || {}), $gte: startDate };
    if (endDate) query.startDate = { ...(query.startDate || {}), $lte: endDate };

    return populateUser(TeamVacation.find(query).sort({ startDate: 1, createdAt: 1 }));
  },

  deleteById: (vacationId) => TeamVacation.findByIdAndDelete(vacationId),
};

export default teamVacationRepository;
