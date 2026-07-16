import TeamActivity from '../models/TeamActivity.js';

const teamActivityRepository = {
  create: (activityData) => TeamActivity.create(activityData),

  findById: (id) => TeamActivity.findById(id),

  findByPortal: ({ portalId, startDate, endDate }) => {
    const query = { portal: portalId };

    if (startDate || endDate) {
      query.workDate = {};
      if (startDate) query.workDate.$gte = startDate;
      if (endDate) query.workDate.$lte = endDate;
    }

    return TeamActivity.find(query)
      .populate('author', 'username email')
      .populate('assignedTo', 'username email')
      .sort({ workDate: 1, createdAt: 1 });
  },

  updateById: (id, activityData) =>
    TeamActivity.findByIdAndUpdate(id, activityData, { new: true, runValidators: true })
      .populate('author', 'username email')
      .populate('assignedTo', 'username email'),

  deleteById: (id) => TeamActivity.findByIdAndDelete(id),
};

export default teamActivityRepository;
