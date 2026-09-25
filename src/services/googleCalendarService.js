import { JWT } from 'google-auth-library';
import {
  GOOGLE_CALENDAR_CLIENT_EMAIL,
  GOOGLE_CALENDAR_ID,
  GOOGLE_CALENDAR_PORTAL_ID,
  GOOGLE_CALENDAR_PRIVATE_KEY,
  GOOGLE_CALENDAR_TIME_ZONE,
} from '../config/env.js';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

const isConfigured = () =>
  Boolean(
    GOOGLE_CALENDAR_ID &&
      GOOGLE_CALENDAR_PORTAL_ID &&
      GOOGLE_CALENDAR_CLIENT_EMAIL &&
      GOOGLE_CALENDAR_PRIVATE_KEY
  );

const isEnabledForPortal = (portalId) =>
  isConfigured() && String(portalId) === String(GOOGLE_CALENDAR_PORTAL_ID);

const configurationError = () => {
  const error = new Error('Google Calendar no esta configurado en el servidor');
  error.statusCode = 503;
  return error;
};

const createAuthClient = () => {
  if (!isConfigured()) throw configurationError();

  return new JWT({
    email: GOOGLE_CALENDAR_CLIENT_EMAIL,
    key: GOOGLE_CALENDAR_PRIVATE_KEY,
    scopes: [GOOGLE_CALENDAR_SCOPE],
  });
};

const getAccessToken = async () => {
  const authClient = createAuthClient();
  const { token } = await authClient.getAccessToken();

  if (!token) {
    const error = new Error('Google no devolvio un token de acceso');
    error.statusCode = 502;
    throw error;
  }

  return token;
};

const requestGoogle = async (path, options = {}) => {
  const token = await getAccessToken();
  const response = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'La API de Google Calendar devolvio un error');
    error.statusCode = response.status === 401 || response.status === 403 ? 502 : response.status;
    error.googleStatus = response.status;
    throw error;
  }

  return payload;
};

const toDateOnly = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const addDays = (value, amount) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
};

const getActivityDate = (value) => {
  const source = value instanceof Date ? value : new Date(value);
  return toDateOnly(source) || new Date().toISOString().slice(0, 10);
};

const buildActivityEvent = (activity) => {
  const startDate = getActivityDate(activity.workDate);
  const endDate = getActivityDate(activity.endDate || activity.workDate);
  const assignedName = activity.assignedTo?.username || activity.assignedTo?.email || 'Usuario';
  const description = [
    activity.description,
    `Responsable: ${assignedName}`,
    `Estado: ${activity.status || 'in_progress'}`,
    `Prioridad: ${activity.priority || 'medium'}`,
    'Origen: Gestiona-2',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    summary: activity.title,
    description,
    start: { date: startDate },
    end: { date: addDays(endDate, 1) },
    extendedProperties: {
      private: {
        gestiona2: 'team-activity',
        gestiona2ActivityId: String(activity._id || activity.id),
        gestiona2PortalId: String(activity.portal || activity.portalId || ''),
      },
    },
  };
};

const getEvents = async ({ startDate, endDate }) => {
  const params = new URLSearchParams({
    timeMin: `${startDate}T00:00:00.000Z`,
    timeMax: `${addDays(endDate, 1)}T00:00:00.000Z`,
    singleEvents: 'true',
    orderBy: 'startTime',
    showDeleted: 'false',
    maxResults: '2500',
  });
  const events = [];
  let pageToken = '';

  do {
    if (pageToken) params.set('pageToken', pageToken);
    const payload = await requestGoogle(
      `/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events?${params.toString()}`
    );
    events.push(...(payload.items || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return events;
};

const mapGoogleEvent = (event) => {
  const isAllDay = Boolean(event.start?.date);
  const startDate = event.start?.date || toDateOnly(event.start?.dateTime);
  const endDate = isAllDay
    ? addDays(event.end?.date || startDate, -1)
    : startDate;

  return {
    id: `google-${event.id}`,
    source: 'google',
    googleEventId: event.id,
    title: event.summary || 'Evento de Google Calendar',
    description: event.description || '',
    workDate: startDate,
    endDate,
    color: '#4285f4',
    googleUrl: event.htmlLink || '',
  };
};

const googleCalendarService = {
  isConfigured,

  status: () => ({
    configured: isConfigured(),
    calendarId: GOOGLE_CALENDAR_ID || null,
    portalId: GOOGLE_CALENDAR_PORTAL_ID || null,
    timeZone: GOOGLE_CALENDAR_TIME_ZONE,
  }),

  listExternalEvents: async ({ portalId, startDate, endDate }) => {
    if (!isEnabledForPortal(portalId)) return { configured: false, events: [] };

    const events = await getEvents({ startDate, endDate });
    return {
      configured: true,
      events: events
        .filter((event) => event.extendedProperties?.private?.gestiona2ActivityId == null)
        .map(mapGoogleEvent),
    };
  },

  syncActivity: async (activity) => {
    if (!isEnabledForPortal(activity.portal || activity.portalId)) return null;

    const event = buildActivityEvent(activity);
    let savedEvent;

    if (activity.googleEventId) {
      try {
        savedEvent = await requestGoogle(
          `/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events/${encodeURIComponent(activity.googleEventId)}`,
          { method: 'PUT', body: JSON.stringify(event) }
        );
      } catch (error) {
        if (error.googleStatus !== 404) throw error;
      }
    }

    if (!savedEvent) {
      savedEvent = await requestGoogle(
        `/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`,
        { method: 'POST', body: JSON.stringify(event) }
      );
    }

    return savedEvent?.id || null;
  },

  deleteEvent: async ({ portalId, googleEventId }) => {
    if (!isEnabledForPortal(portalId) || !googleEventId) return;

    try {
      await requestGoogle(
        `/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events/${encodeURIComponent(googleEventId)}`,
        { method: 'DELETE' }
      );
    } catch (error) {
      if (error.googleStatus !== 404) throw error;
    }
  },
};

export default googleCalendarService;
