import Portal from '../models/Portal.js';

const portalRepository = {
  create: (portalData) => Portal.create(portalData),

  findById: (id) => Portal.findById(id),

  findByOwner: (ownerId) => Portal.find({ owner: ownerId }).sort({ createdAt: -1 }),

  findVisibleForUser: (userId, email) =>
    Portal.find({
      $or: [
        { owner: userId },
        { members: userId },
        { invites: { $elemMatch: { email } } },
      ],
    }).sort({ createdAt: -1 }),
};

export default portalRepository;
