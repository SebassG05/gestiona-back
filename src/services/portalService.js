import crypto from 'crypto';
import mongoose from 'mongoose';
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

  listMembers: async ({ portalId, userId }) => {
    const portal = await portalRepository
      .findById(portalId)
      .populate('owner', 'username email')
      .populate('members', 'username email')
      .lean();

    if (!portal) {
      const error = new Error('El portal no existe');
      error.statusCode = 404;
      throw error;
    }

    const canAccess = portal.members.some((member) => member._id.toString() === userId.toString());

    if (!canAccess) {
      const error = new Error('No tienes acceso a este portal');
      error.statusCode = 403;
      throw error;
    }

    const ownerId = portal.owner?._id?.toString();

    return portal.members.map((member) => ({
      id: member._id,
      username: member.username,
      email: member.email,
      role: member._id.toString() === ownerId ? 'owner' : 'member',
    }));
  },

  inviteMembers: async ({ portalId, userId, invites = [] }) => {
    const portal = await portalRepository.findById(portalId);

    if (!portal) {
      const error = new Error('El portal no existe');
      error.statusCode = 404;
      throw error;
    }

    const canInvite = portal.members.some((member) => member.equals(userId));

    if (!canInvite) {
      const error = new Error('No tienes acceso a este portal');
      error.statusCode = 403;
      throw error;
    }

    const normalizedEmails = [
      ...new Set(invites.map((email) => email.trim().toLowerCase()).filter(Boolean)),
    ];

    const createdInvites = normalizedEmails.map((email) => {
      const existingInvite = portal.invites.find((invite) => invite.email === email);

      if (existingInvite?.status === 'accepted') {
        return existingInvite;
      }

      if (existingInvite) {
        existingInvite.status = 'pending';
        existingInvite.code = existingInvite.code || generateInviteCode();
        existingInvite.invitedBy = userId;
        existingInvite.sentAt = new Date();
        existingInvite.respondedAt = null;
        return existingInvite;
      }

      const nextInvite = {
        email,
        code: generateInviteCode(),
        invitedBy: userId,
        status: 'pending',
        sentAt: new Date(),
        respondedAt: null,
      };

      portal.invites.push(nextInvite);
      return nextInvite;
    });

    try {
      await Promise.all(
        createdInvites
          .filter((invite) => invite.status !== 'accepted')
          .map((invite) =>
            mailService.sendPortalInvitation({
              to: invite.email,
              portalName: portal.name,
              inviteCode: invite.code,
            })
          )
      );
    } catch (error) {
      if (!error.statusCode || error.statusCode < 400) {
        error.statusCode = 502;
      }
      throw error;
    }

    await portal.save();

    return {
      portalId: portal._id,
      portalName: portal.name,
      invites: createdInvites.map((invite) => ({
        email: invite.email,
        code: invite.code,
        status: invite.status,
        sentAt: invite.sentAt,
      })),
    };
  },

  getInvitationByCode: async ({ code, email }) => {
    const portal = await portalRepository.findByInviteCode(code).populate('owner', 'username email');

    if (!portal && mongoose.Types.ObjectId.isValid(code)) {
      const portalById = await portalRepository.findById(code).populate('owner', 'username email');

      if (portalById) {
        return {
          portalId: portalById._id,
          portalName: portalById.name,
          code: portalById._id,
          email,
          status: 'portal-code',
          owner: portalById.owner,
          tags: portalById.tags,
          accessMode: 'portal-code',
        };
      }
    }

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

    if (!portal && mongoose.Types.ObjectId.isValid(code)) {
      const portalById = await portalRepository.findById(code);

      if (!portalById) {
        const error = new Error('El portal no existe');
        error.statusCode = 404;
        throw error;
      }

      if (action === 'accept' && !portalById.members.some((member) => member.equals(userId))) {
        portalById.members.push(userId);
        await portalById.save();
      }

      return {
        portalId: portalById._id,
        invitationStatus: action === 'accept' ? 'accepted' : 'rejected',
        accessMode: 'portal-code',
      };
    }

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
