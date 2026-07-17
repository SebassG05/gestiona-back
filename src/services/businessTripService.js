import mongoose from 'mongoose';
import portalRepository from '../repositories/portalRepository.js';
import businessTripRepository from '../repositories/businessTripRepository.js';

const allowedTransports = ['Avion', 'Tren', 'Coche', 'Otro'];
const allowedStatuses = ['Planificado', 'En curso', 'Finalizado', 'Cancelado'];

const toObjectId = (value) => value?._id?.toString?.() || value?.toString?.() || String(value);

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeDate = (value, fieldName) => {
  if (!value) {
    throw createError(`${fieldName} es obligatorio`);
  }

  const date = new Date(`${value}`.slice(0, 10) + 'T12:00:00.000Z');

  if (Number.isNaN(date.getTime())) {
    throw createError(`${fieldName} no es una fecha valida`);
  }

  return date;
};

const parseRangeDate = (value, endOfDay = false) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}`.slice(0, 10) + (endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateToValue = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

const mapUser = (user) => ({
  id: toObjectId(user?._id || user?.id || user),
  username: user?.username || user?.email || 'Usuario',
  email: user?.email || '',
});

const mapTrip = (trip) => ({
  id: toObjectId(trip._id || trip.id),
  title: trip.title,
  destination: trip.destination,
  purpose: trip.purpose || '',
  startDate: dateToValue(trip.startDate),
  endDate: dateToValue(trip.endDate),
  transport: trip.transport || 'Otro',
  status: trip.status || 'Planificado',
  notes: trip.notes || '',
  assignedTo: mapUser(trip.assignedTo),
  createdBy: mapUser(trip.createdBy),
  createdAt: trip.createdAt,
  updatedAt: trip.updatedAt,
});

const getPortalForMember = async ({ portalId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(portalId)) {
    throw createError('Portal no valido');
  }

  const portal = await portalRepository.findById(portalId);

  if (!portal) {
    throw createError('Portal no encontrado', 404);
  }

  const canAccess = portal.members.some((member) => toObjectId(member) === toObjectId(userId));

  if (!canAccess) {
    throw createError('No tienes acceso a este portal', 403);
  }

  return portal;
};

const assertPortalMember = (portal, memberId) => {
  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    throw createError('Persona asignada no valida');
  }

  const isMember = portal.members.some((member) => toObjectId(member) === toObjectId(memberId));

  if (!isMember) {
    throw createError('La persona asignada debe pertenecer al portal');
  }
};

const buildTripPayload = ({ tripData, portal, userId, currentTrip = null }) => {
  const title =
    tripData.title !== undefined ? `${tripData.title || ''}`.trim() : currentTrip?.title;
  const destination =
    tripData.destination !== undefined
      ? `${tripData.destination || ''}`.trim()
      : currentTrip?.destination;

  if (!title) {
    throw createError('El nombre del viaje es obligatorio');
  }

  if (!destination) {
    throw createError('El destino es obligatorio');
  }

  const assignedTo =
    tripData.assignedTo !== undefined ? tripData.assignedTo : toObjectId(currentTrip?.assignedTo);

  assertPortalMember(portal, assignedTo);

  const startDate =
    tripData.startDate !== undefined
      ? normalizeDate(tripData.startDate, 'Fecha de salida')
      : currentTrip?.startDate;
  const endDate =
    tripData.endDate !== undefined
      ? normalizeDate(tripData.endDate, 'Fecha de vuelta')
      : currentTrip?.endDate;

  if (endDate < startDate) {
    throw createError('La fecha de vuelta no puede ser anterior a la salida');
  }

  const creatorId = currentTrip?.createdBy?._id || currentTrip?.createdBy || userId;

  return {
    title,
    destination,
    purpose:
      tripData.purpose !== undefined
        ? `${tripData.purpose || ''}`.trim()
        : currentTrip?.purpose || '',
    startDate,
    endDate,
    assignedTo,
    createdBy: toObjectId(creatorId),
    transport: allowedTransports.includes(tripData.transport)
      ? tripData.transport
      : currentTrip?.transport || 'Otro',
    status: allowedStatuses.includes(tripData.status)
      ? tripData.status
      : currentTrip?.status || 'Planificado',
    notes:
      tripData.notes !== undefined
        ? `${tripData.notes || ''}`.trim()
        : currentTrip?.notes || '',
  };
};

const businessTripService = {
  list: async ({ portalId, userId, startDate, endDate }) => {
    await getPortalForMember({ portalId, userId });

    const trips = await businessTripRepository.findByPortal({
      portalId,
      startDate: parseRangeDate(startDate),
      endDate: parseRangeDate(endDate, true),
    });

    return trips.map(mapTrip);
  },

  create: async ({ portalId, userId, tripData }) => {
    const portal = await getPortalForMember({ portalId, userId });
    const payload = buildTripPayload({ tripData, portal, userId });
    const createdTrip = await businessTripRepository.create({
      portal: portal._id,
      ...payload,
    });
    const populatedTrip = await businessTripRepository.findById(createdTrip._id);

    return mapTrip(populatedTrip);
  },

  update: async ({ portalId, userId, tripId, tripData }) => {
    const portal = await getPortalForMember({ portalId, userId });

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw createError('Viaje no valido');
    }

    const currentTrip = await businessTripRepository.findById(tripId);

    if (!currentTrip || toObjectId(currentTrip.portal) !== toObjectId(portal._id)) {
      throw createError('Viaje no encontrado', 404);
    }

    const payload = buildTripPayload({ tripData, portal, userId, currentTrip });
    const updatedTrip = await businessTripRepository.updateById(tripId, payload);

    return mapTrip(updatedTrip);
  },

  remove: async ({ portalId, userId, tripId }) => {
    await getPortalForMember({ portalId, userId });

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw createError('Viaje no valido');
    }

    const trip = await businessTripRepository.findById(tripId);

    if (!trip || toObjectId(trip.portal) !== toObjectId(portalId)) {
      throw createError('Viaje no encontrado', 404);
    }

    await businessTripRepository.deleteById(tripId);

    return { id: tripId };
  },
};

export default businessTripService;
