import mongoose from 'mongoose';
import portalRepository from '../repositories/portalRepository.js';
import teamActivityRepository from '../repositories/teamActivityRepository.js';

const toObjectId = (value) => value?.toString?.() || String(value);
const getEntityId = (value) => value?._id || value?.id || value;
const idsEqual = (first, second) => toObjectId(getEntityId(first)) === toObjectId(getEntityId(second));
const DEFAULT_ACTIVITY_COLOR = '#ff5a1f';
const USER_ACTIVITY_COLORS = [
  '#ff5a1f',
  '#ff3048',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#3b1208',
];

const normalizeDate = (value) => {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(`${value}`.slice(0, 10) + 'T12:00:00.000Z');

  if (Number.isNaN(date.getTime())) {
    const error = new Error('La fecha de trabajo no es valida');
    error.statusCode = 400;
    throw error;
  }

  return date;
};

const assertNotPastDate = (date) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const workDate = new Date(date);
  workDate.setUTCHours(0, 0, 0, 0);

  if (workDate < today) {
    const error = new Error('No se pueden crear tareas en dias anteriores a hoy');
    error.statusCode = 400;
    throw error;
  }
};

const parseRangeDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}`.slice(0, 10) + (endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'));

  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const mapUser = (user) => ({
  id: user?._id || user?.id,
  username: user?.username || user?.email || 'Usuario',
  email: user?.email || '',
});

const mapComment = (comment) => ({
  id: comment?._id,
  author: mapUser(comment?.author),
  message: comment?.message || '',
  createdAt: comment?.createdAt,
  updatedAt: comment?.updatedAt,
});

const getUserActivityColor = (userId) => {
  const source = toObjectId(userId || '');
  if (!source) return DEFAULT_ACTIVITY_COLOR;

  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % USER_ACTIVITY_COLORS.length;
  }

  return USER_ACTIVITY_COLORS[hash] || DEFAULT_ACTIVITY_COLOR;
};

const mapActivity = (activity) => ({
  id: activity._id,
  title: activity.title,
  description: activity.description,
  status: activity.status,
  priority: activity.priority,
  color: getUserActivityColor(activity.assignedTo?._id || activity.assignedTo?.id || activity.assignedTo),
  workDate: activity.workDate,
  author: mapUser(activity.author),
  assignedTo: mapUser(activity.assignedTo),
  comments: (activity.comments || []).map(mapComment),
  createdAt: activity.createdAt,
  updatedAt: activity.updatedAt,
});

const getPortalForMember = async ({ portalId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(portalId)) {
    const error = new Error('El portal no es valido');
    error.statusCode = 400;
    throw error;
  }

  const portal = await portalRepository.findById(portalId);

  if (!portal) {
    const error = new Error('El portal no existe');
    error.statusCode = 404;
    throw error;
  }

  const canAccess = portal.members.some((member) => idsEqual(member, userId));
  if (!canAccess) {
    const error = new Error('No tienes acceso a este portal');
    error.statusCode = 403;
    throw error;
  }

  return portal;
};

const assertPortalMember = (portal, memberId) => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    const error = new Error('El responsable no es valido');
    error.statusCode = 400;
    throw error;
  }

  const isMember = portal.members.some((member) => idsEqual(member, memberId));
  if (!isMember) {
    const error = new Error('El responsable debe pertenecer al portal');
    error.statusCode = 400;
    throw error;
  }
};

const assertCanManageActivity = ({ portal, activity, userId }) => {
  const isOwner = idsEqual(portal.owner, userId);
  const isAuthor = idsEqual(activity.author, userId);
  const isAssigned = idsEqual(activity.assignedTo, userId);

  if (!isOwner && !isAuthor && !isAssigned) {
    const error = new Error('No puedes modificar esta actividad');
    error.statusCode = 403;
    throw error;
  }
};

const teamActivityService = {
  list: async ({ portalId, userId, startDate, endDate }) => {
    await getPortalForMember({ portalId, userId });

    const activities = await teamActivityRepository.findByPortal({
      portalId,
      startDate: parseRangeDate(startDate),
      endDate: parseRangeDate(endDate, true),
    });

    return activities.map(mapActivity);
  },

  create: async ({ portalId, userId, activityData }) => {
    const portal = await getPortalForMember({ portalId, userId });
    const assignedTo = userId;

    assertPortalMember(portal, assignedTo);
    const workDate = normalizeDate(activityData.workDate);
    assertNotPastDate(workDate);

    const activity = await teamActivityRepository.create({
      portal: portalId,
      author: userId,
      assignedTo,
      title: activityData.title,
      description: activityData.description || '',
      workDate,
      status: activityData.status || 'in_progress',
      priority: activityData.priority || 'medium',
      color: getUserActivityColor(userId),
    });

    const populated = await teamActivityRepository.findById(activity._id);

    return mapActivity(populated);
  },

  update: async ({ portalId, activityId, userId, activityData }) => {
    const portal = await getPortalForMember({ portalId, userId });
    const activity = await teamActivityRepository.findById(activityId);

    if (!activity || !idsEqual(activity.portal, portalId)) {
      const error = new Error('La actividad no existe');
      error.statusCode = 404;
      throw error;
    }

    assertCanManageActivity({ portal, activity, userId });

    const nextData = {};
    const allowedFields = ['title', 'description', 'status', 'priority'];

    allowedFields.forEach((field) => {
      if (activityData[field] !== undefined) {
        nextData[field] = activityData[field];
      }
    });

    if (activityData.workDate) {
      nextData.workDate = normalizeDate(activityData.workDate);
      assertNotPastDate(nextData.workDate);
    }

    const updated = await teamActivityRepository.updateById(activityId, nextData);
    return mapActivity(updated);
  },

  remove: async ({ portalId, activityId, userId }) => {
    const portal = await getPortalForMember({ portalId, userId });
    const activity = await teamActivityRepository.findById(activityId);

    if (!activity || !idsEqual(activity.portal, portalId)) {
      const error = new Error('La actividad no existe');
      error.statusCode = 404;
      throw error;
    }

    assertCanManageActivity({ portal, activity, userId });
    await teamActivityRepository.deleteById(activityId);

    return { id: activityId };
  },

  addComment: async ({ portalId, activityId, userId, message }) => {
    await getPortalForMember({ portalId, userId });
    const activity = await teamActivityRepository.findById(activityId);

    if (!activity || !idsEqual(activity.portal, portalId)) {
      const error = new Error('La actividad no existe');
      error.statusCode = 404;
      throw error;
    }

    const cleanMessage = `${message || ''}`.trim();
    if (!cleanMessage) {
      const error = new Error('Escribe un comentario antes de enviarlo');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(activity.comments)) {
      activity.comments = [];
    }

    activity.comments.push({
      author: userId,
      message: cleanMessage,
    });
    await activity.save();

    const populated = await teamActivityRepository.findById(activity._id);
    return mapActivity(populated);
  },

  removeComment: async ({ portalId, activityId, commentId, userId }) => {
    const portal = await getPortalForMember({ portalId, userId });
    const activity = await teamActivityRepository.findById(activityId);

    if (!activity || !idsEqual(activity.portal, portalId)) {
      const error = new Error('La actividad no existe');
      error.statusCode = 404;
      throw error;
    }

    const comment = activity.comments.id(commentId);
    if (!comment) {
      const error = new Error('El comentario no existe');
      error.statusCode = 404;
      throw error;
    }

    const canRemove =
      idsEqual(portal.owner, userId) ||
      idsEqual(activity.author, userId) ||
      idsEqual(activity.assignedTo, userId) ||
      idsEqual(comment.author, userId);

    if (!canRemove) {
      const error = new Error('No puedes eliminar este comentario');
      error.statusCode = 403;
      throw error;
    }

    activity.comments.pull(commentId);
    await activity.save();

    const populated = await teamActivityRepository.findById(activity._id);
    return mapActivity(populated);
  },
};

export default teamActivityService;
