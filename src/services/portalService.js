import crypto from 'crypto';
import mailService from './mailService.js';
import portalRepository from '../repositories/portalRepository.js';

const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const mapPortal = (portal, userId, email) => {
  const isOwner = portal.owner?._id?.toString?.() === userId.toString();
  const isInvited = portal.invites?.some(
    (invite) => invite.email === email && ['pending', 'accepted'].includes(invite.status)
  );

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
    ].map((email) => ({
      email,
      code: generateInviteCode(),
      invitedBy: ownerId,
      status: 'pending',
      sentAt: new Date(),
      respondedAt: null,
    }));

    const portal = await portalRepository.create({
      name,
      tags: normalizedTags,
      invites: normalizedInvites,
      owner: ownerId,
      members: [ownerId],
    });

    try {
      await Promise.all(
        normalizedInvites.map((invite) =>
          mailService.sendPortalInvitation({
            to: invite.email,
            portalName: name,
            inviteCode: invite.code,
          })
        )
      );
    } catch (error) {
      await portalRepository.deleteById(portal._id);
      if (!error.statusCode || error.statusCode < 400) {
        error.statusCode = 502;
      }
      throw error;
    }

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

  getInvitationByCode: async ({ code, email }) => {
    const portal = await portalRepository.findByInviteCode(code).populate('owner', 'username email');

    if (!portal) {
      const error = new Error('La invitacion no existe');
      error.statusCode = 404;
      throw error;
    }

    const invite = portal.invites.find((item) => item.code === code);

    if (!invite || invite.email !== email) {
      const error = new Error('Esta invitacion no corresponde al usuario autenticado');
      error.statusCode = 403;
      throw error;
    }

    return {
      portalId: portal._id,
      portalName: portal.name,
      code: invite.code,
      email: invite.email,
      status: invite.status,
      owner: portal.owner,
      tags: portal.tags,
    };
  },

  respondToInvitation: async ({ code, email, userId, action }) => {
    const portal = await portalRepository.findByInviteCode(code);

    if (!portal) {
      const error = new Error('La invitacion no existe');
      error.statusCode = 404;
      throw error;
    }

    const invite = portal.invites.find((item) => item.code === code);

    if (!invite || invite.email !== email) {
      const error = new Error('Esta invitacion no corresponde al usuario autenticado');
      error.statusCode = 403;
      throw error;
    }

    if (invite.status !== 'pending') {
      const error = new Error('Esta invitacion ya ha sido gestionada');
      error.statusCode = 409;
      throw error;
    }

    invite.status = action === 'accept' ? 'accepted' : 'rejected';
    invite.respondedAt = new Date();

    if (action === 'accept' && !portal.members.some((member) => member.equals(userId))) {
      portal.members.push(userId);
    }

    await portal.save();

    return {
      portalId: portal._id,
      invitationStatus: invite.status,
    };
  },

  deleteOwnedPortal: async ({ portalId, userId }) => {
    const portal = await portalRepository.findById(portalId);

    if (!portal) {
      const error = new Error('El portal no existe');
      error.statusCode = 404;
      throw error;
    }

    if (!portal.owner.equals(userId)) {
      const error = new Error('Solo el propietario puede eliminar este portal');
      error.statusCode = 403;
      throw error;
    }

    await portalRepository.deleteById(portalId);

    return { id: portalId };
  },
};

export default portalService;
