import mongoose from 'mongoose';
import portalRepository from '../repositories/portalRepository.js';
import teamVacationRepository from '../repositories/teamVacationRepository.js';

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

const toObjectId = (value) => value?._id?.toString?.() || value?.toString?.() || String(value);

const normalizeDate = (value, fieldName) => {
  if (!value) {
    const error = new Error(`La ${fieldName} es obligatoria`);
    error.statusCode = 400;
    throw error;
  }

  const date = new Date(`${value}`.slice(0, 10) + 'T12:00:00.000Z');

  if (Number.isNaN(date.getTime())) {
    const error = new Error(`La ${fieldName} no es valida`);
    error.statusCode = 400;
    throw error;
  }

  return date;
};

const parseRangeDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}`.slice(0, 10) + (endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateToValue = (date) => date.toISOString().slice(0, 10);

const countInclusiveDays = (startDate, endDate) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate - startDate) / msPerDay) + 1;
};

const mapUser = (user) => ({
  id: user?._id || user?.id,
  username: user?.username || user?.email || 'Usuario',
  email: user?.email || '',
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

const mapVacation = (vacation) => ({
  id: vacation._id,
  startDate: dateToValue(vacation.startDate),
  endDate: dateToValue(vacation.endDate),
  days: vacation.days,
  color: vacation.color || getUserActivityColor(vacation.user?._id || vacation.user?.id || vacation.user),
  user: mapUser(vacation.user),
  createdAt: vacation.createdAt,
  updatedAt: vacation.updatedAt,
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

  const canAccess = portal.members.some((member) => toObjectId(member) === toObjectId(userId));
  if (!canAccess) {
    const error = new Error('No tienes acceso a este portal');
    error.statusCode = 403;
    throw error;
  }

  return portal;
};

const assertCanRemoveVacation = ({ portal, vacation, userId }) => {
  const isOwner = toObjectId(portal.owner) === toObjectId(userId);
  const isVacationOwner = toObjectId(vacation.user) === toObjectId(userId);

  if (!isOwner && !isVacationOwner) {
    const error = new Error('No puedes quitar estas vacaciones');
    error.statusCode = 403;
    throw error;
  }
};

const teamVacationService = {
  list: async ({ portalId, userId, startDate, endDate }) => {
    await getPortalForMember({ portalId, userId });

    const vacations = await teamVacationRepository.findByPortal({
      portalId,
      startDate: parseRangeDate(startDate),
      endDate: parseRangeDate(endDate, true),
    });

    return vacations.map(mapVacation);
  },

  create: async ({ portalId, userId, vacationData }) => {
    await getPortalForMember({ portalId, userId });

    const startDate = normalizeDate(vacationData.startDate, 'fecha de inicio');
    const endDate = normalizeDate(vacationData.endDate, 'fecha de fin');

    if (startDate > endDate) {
      const error = new Error('La fecha de fin debe ser igual o posterior a la fecha de inicio');
      error.statusCode = 400;
      throw error;
    }

    const vacation = await teamVacationRepository.create({
      portal: portalId,
      user: userId,
      startDate,
      endDate,
      days: countInclusiveDays(startDate, endDate),
      color: getUserActivityColor(userId),
    });

    const populatedVacation = await teamVacationRepository.findById(vacation._id);
    return mapVacation(populatedVacation);
  },

  remove: async ({ portalId, vacationId, userId }) => {
    const portal = await getPortalForMember({ portalId, userId });

    if (!mongoose.Types.ObjectId.isValid(vacationId)) {
      const error = new Error('Las vacaciones no son validas');
      error.statusCode = 400;
      throw error;
    }

    const vacation = await teamVacationRepository.findById(vacationId);

    if (!vacation || toObjectId(vacation.portal) !== toObjectId(portalId)) {
      const error = new Error('Las vacaciones no existen');
      error.statusCode = 404;
      throw error;
    }

    assertCanRemoveVacation({ portal, vacation, userId });
    await teamVacationRepository.deleteById(vacationId);

    return { id: vacationId };
  },
};

export default teamVacationService;
