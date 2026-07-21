import TeamActivity from '../models/TeamActivity.js';

const populateActivity = (query) =>
  query
    .populate('author', 'username email')
    .populate('assignedTo', 'username email')
    .populate('comments.author', 'username email');

const teamActivityRepository = {
  create: (activityData) => TeamActivity.create(activityData),

  findById: (id) => populateActivity(TeamActivity.findById(id)),

  findByPortal: ({ portalId, startDate, endDate }) => {
    const query = { portal: portalId };

    if (startDate || endDate) {
      query.$and = [];
      if (endDate) query.$and.push({ workDate: { $lte: endDate } });
      if (startDate) {
        query.$and.push({
          $or: [
            { endDate: { $gte: startDate } },
            { endDate: null, workDate: { $gte: startDate } },
            { endDate: { $exists: false }, workDate: { $gte: startDate } },
          ],
        });
      }
      if (!query.$and.length) delete query.$and;
    }

    return populateActivity(TeamActivity.find(query)).sort({ workDate: 1, createdAt: 1 });
  },

  updateById: (id, activityData) =>
    populateActivity(
      TeamActivity.findByIdAndUpdate(id, activityData, { new: true, runValidators: true })
    ),

  deleteById: (id) => TeamActivity.findByIdAndDelete(id),
};

export default teamActivityRepository;
