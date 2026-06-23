import Portal from '../models/Portal.js';

const portalRepository = {
  create: (portalData) => Portal.create(portalData),

  findById: (id) => Portal.findById(id),

  findByInviteCode: (code) => Portal.findOne({ invites: { $elemMatch: { code } } }),

  findByOwner: (ownerId) => Portal.find({ owner: ownerId }).sort({ createdAt: -1 }),

  findVisibleForUser: (userId, email) =>
    Portal.find({
      $or: [
        { owner: userId },
        { members: userId },
        { invites: { $elemMatch: { email, status: { $in: ['pending', 'accepted'] } } } },
      ],
    }).sort({ createdAt: -1 }),

  deleteById: (id) => Portal.findByIdAndDelete(id),
};

export default portalRepository;
