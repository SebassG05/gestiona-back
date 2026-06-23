import portalRepository from '../repositories/portalRepository.js';

const mapPortal = (portal, userId, email) => {
  const isOwner = portal.owner?._id?.toString?.() === userId.toString();
  const isInvited = portal.invites?.some((invite) => invite.email === email);

  let accessLabel = 'Miembro';
  if (isOwner) {
    accessLabel = 'Creado por ti';
  } else if (isInvited) {
    accessLabel = 'Invitado';
  }

  return {
    id: portal._id,
    name: portal.name,
    tags: portal.tags,
    invites: portal.invites,
    owner: portal.owner,
    members: portal.members,
    createdAt: portal.createdAt,
    accessLabel,
  };
};

const portalService = {
  create: async ({ name, tags = [], invites = [], ownerId }) => {
    const normalizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
    const normalizedInvites = [
      ...new Set(invites.map((email) => email.trim().toLowerCase()).filter(Boolean)),
    ].map((email) => ({ email }));

    const portal = await portalRepository.create({
      name,
      tags: normalizedTags,
      invites: normalizedInvites,
      owner: ownerId,
      members: [ownerId],
    });

    return {
      id: portal._id,
      name: portal.name,
      tags: portal.tags,
      invites: portal.invites,
      owner: portal.owner,
      members: portal.members,
      createdAt: portal.createdAt,
    };
  },

  listMine: async ({ userId, email }) => {
    const portals = await portalRepository
      .findVisibleForUser(userId, email)
      .populate('owner', 'username email')
      .lean();

    return portals.map((portal) => mapPortal(portal, userId, email));
  },
};

export default portalService;
