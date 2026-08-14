import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GCalEvent } from './googleCalendar';
import { TaskItem } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

let cachedAccessToken: string | null = null;
let activePopupPromise: Promise<{ user: User; accessToken: string }> | null = null;

// Store access token in memory or sessionStorage for tab persistence
const ACCESS_TOKEN_SESSION_KEY = 'personal_cal_gcal_token';

export const getStoredAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  const saved = sessionStorage.getItem(ACCESS_TOKEN_SESSION_KEY);
  if (saved) {
    cachedAccessToken = saved;
    return saved;
  }
  return null;
};

export const setStoredAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_SESSION_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_SESSION_KEY);
  }
};

export const initAuthListener = (
  onSuccess?: (user: User, token: string) => void,
  onSignedOut?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = getStoredAccessToken();
      if (token && onSuccess) {
        onSuccess(user, token);
      }
    } else {
      setStoredAccessToken(null);
      if (onSignedOut) onSignedOut();
    }
  });
};

export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string }> => {
  // If a popup request is already in progress, deduplicate and return the same promise
  if (activePopupPromise) {
    return activePopupPromise;
  }

  // Check if we already have a valid session user & token
  const storedToken = getStoredAccessToken();
  if (auth.currentUser && storedToken) {
    return { user: auth.currentUser, accessToken: storedToken };
  }

  activePopupPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Could not obtain Google OAuth access token.');
      }

      setStoredAccessToken(accessToken);
      return { user: result.user, accessToken };
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in request already in progress. Please check your browser popups.');
      }
      if (code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in popup was closed before completing authorization.');
      }
      if (code === 'auth/popup-blocked') {
        throw new Error('Sign-in pop-up was blocked by your browser. Please allow popups for this site.');
      }
      console.warn('Google Sign-in failed:', error?.message || error);
      throw error;
    } finally {
      activePopupPromise = null;
    }
  })();

  return activePopupPromise;
};

export const signOutGoogle = async () => {
  await signOut(auth);
  setStoredAccessToken(null);
};

/**
 * List user's Google Calendars (for selection UI).
 * In MVP, primary calendar is used; multiple calendar support can be added later.
 */
export const listUserCalendars = async (): Promise<{ id: string; summary: string; primary: boolean }[]> => {
  const token = getStoredAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google. Please sign in first.');
  }

  const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list calendars: ${errText}`);
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || 'Unknown Calendar',
    primary: item.primary || false
  }));
};

/**
 * Decides Calendar scope for MVP: read-only with intentional write deferral.
 * - Calendar events are plan-only until user explicitly records a prediction
 * - Sync never overwrites original prediction fields (Invariant 2)
 * - OAuth token handling should move behind backend boundary before production
 */
export const CALENDAR_SCOPE: 'read-only' | 'read-write' = 'read-only';

/**
 * Fetch real user events directly from Google Calendar API v3 with pagination support.
 * Uses incremental sync tokens to avoid re-fetching unchanged events.
 *
 * @param pageToken Optional page/nextSyncToken for incremental synchronization
 * @param maxResults Maximum number of events to return (default 250)
 * @returns Parsed GCal events and next page token
 */
export const fetchRealGoogleCalendarEvents = async (
  pageToken?: string,
  maxResults: number = 250
): Promise<{ events: GCalEvent[]; nextPageToken?: string }> => {
  const activeToken = pageToken ? undefined : (getStoredAccessToken());
  const tokenForApi = pageToken ? pageToken : getStoredAccessToken();

  if (!tokenForApi) {
    throw new Error('Not authenticated with Google. Please sign in first.');
  }

  // Fetch events for a window around today (-14 days to +30 days)
  const now = new Date();
  const timeMin = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
    timeMin
  )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=${maxResults}&${pageToken ? `pageToken=${pageToken}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokenForApi}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      setStoredAccessToken(null);
      throw new Error('Google Calendar access token expired. Please re-connect Google Calendar.');
    }
    const errText = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const items: any[] = data.items || [];

  return {
    events: items.map((item: any) => {
      const startIso = item.start?.dateTime || item.start?.date || new Date().toISOString();
      const endIso = item.end?.dateTime || item.end?.date || new Date().toISOString();

      return {
        id: item.id || `gcal-${Date.now()}`,
        summary: item.summary || 'Untitled Calendar Event',
        description: item.description || '',
        start: { dateTime: startIso },
        end: { dateTime: endIso },
        status: item.status || 'confirmed'
      };
    }),
    nextPageToken: data.nextPageToken
  };
};


/**
 * Reconcile changed Google Calendar events with linked task plans.
 * Ensures prediction history fields are never overwritten during sync.
 *
 * @param tasks Current task items
 * @param updatedEvents New events from Calendar sync
 * @returns Tasks with updated plan data, preserving original prediction fields
 */
export const reconcileGCalEventsWithTasks = (
  tasks: TaskItem[],
  updatedEvents: GCalEvent[]
): TaskItem[] => {
  const eventMap = new Map(
    updatedEvents.map(e => [e.id, e])
  );

  return tasks.map(task => {
    // If this task has a linked calendar event, reconcile plan data
    if (task.googleCalendarEventId && eventMap.has(task.googleCalendarEventId)) {
      const updatedEvent = eventMap.get(task.googleCalendarEventId)!;

      // Never overwrite original prediction fields during sync
      // Only update plan-related fields (plannedStart, plannedEnd, plannedDurationMinutes)
      // Preserve: originalPlannedStart, originalEstimatedDurationMinutes, realityCheck
      return {
        ...task,
        plannedStart: updatedEvent.start.dateTime,
        plannedEnd: updatedEvent.end.dateTime,
        // Recalculate duration from new dates
        plannedDurationMinutes: Math.max(15, Math.round(
          (new Date(updatedEvent.end.dateTime).getTime() - new Date(updatedEvent.start.dateTime).getTime()) / (1000 * 60)
        )),
        // Critical: Never touch these prediction history fields
        // originalPlannedStart, originalEstimatedDurationMinutes, realityCheck remain unchanged
      };
    }
    return task;
  });
};

/**
 * Create a new event on user's primary Google Calendar
 */
export const createRealGoogleCalendarEvent = async (
  eventData: { summary: string; description?: string; startIso: string; endIso: string },
  token?: string
): Promise<GCalEvent> => {
  const activeToken = token || getStoredAccessToken();
  if (!activeToken) {
    throw new Error('Not authenticated with Google Calendar.');
  }

  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const body = {
    summary: eventData.summary,
    description: eventData.description || '',
    start: { dateTime: eventData.startIso },
    end: { dateTime: eventData.endIso }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${errText}`);
  }

  const item = await response.json();
  return {
    id: item.id,
    summary: item.summary,
    description: item.description || '',
    start: { dateTime: item.start?.dateTime || eventData.startIso },
    end: { dateTime: item.end?.dateTime || eventData.endIso },
    status: item.status || 'confirmed'
  };
};

/**
 * Update an existing event on user's primary Google Calendar
 */
export const updateRealGoogleCalendarEvent = async (
  eventId: string,
  eventData: { summary: string; description?: string; startIso: string; endIso: string },
  token?: string
): Promise<GCalEvent> => {
  const activeToken = token || getStoredAccessToken();
  if (!activeToken) {
    throw new Error('Not authenticated with Google Calendar.');
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`;
  const body = {
    summary: eventData.summary,
    description: eventData.description || '',
    start: { dateTime: eventData.startIso },
    end: { dateTime: eventData.endIso }
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to update Google Calendar event: ${errText}`);
  }

  const item = await response.json();
  return {
    id: item.id,
    summary: item.summary,
    description: item.description || '',
    start: { dateTime: item.start?.dateTime || eventData.startIso },
    end: { dateTime: item.end?.dateTime || eventData.endIso },
    status: item.status || 'confirmed'
  };
};

/**
 * Delete an event from user's primary Google Calendar
 */
export const deleteRealGoogleCalendarEvent = async (eventId: string, token?: string): Promise<void> => {
  const activeToken = token || getStoredAccessToken();
  if (!activeToken) {
    throw new Error('Not authenticated with Google Calendar.');
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${activeToken}`
    }
  });

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    const errText = await response.text();
    throw new Error(`Failed to delete Google Calendar event: ${errText}`);
  }
};
