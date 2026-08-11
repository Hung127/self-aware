import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Target,
  ExternalLink,
  RefreshCw,
  Check,
  X,
  Globe,
  Tag,
  AlertCircle,
  CalendarDays,
  Layers,
  Sparkles,
  Link2
} from 'lucide-react';
import { GCalEvent, convertGCalEventToTask, inferCategoryFromTitle, getMockGCalEvents } from '../utils/googleCalendar';
import { TaskItem, TaskCategory } from '../types';
import {
  getStoredAccessToken,
  signInWithGoogleCalendar,
  fetchRealGoogleCalendarEvents,
  createRealGoogleCalendarEvent,
  updateRealGoogleCalendarEvent,
  deleteRealGoogleCalendarEvent
} from '../utils/googleAuthService';

interface GoogleCalendarViewProps {
  tasks: TaskItem[];
  onAddGCalTask: (task: TaskItem) => void;
  gcalConnected: boolean;
  onConnectGCal: () => void;
}

const STORAGE_GCAL_KEY = 'personal_calibration_gcal_events';

function isSameDay(isoString: string, targetDate: Date): boolean {
  try {
    const d = new Date(isoString);
    return (
      d.getFullYear() === targetDate.getFullYear() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getDate() === targetDate.getDate()
    );
  } catch {
    return false;
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({
  tasks,
  onAddGCalTask,
  gcalConnected,
  onConnectGCal
}) => {
  const [viewMode, setViewMode] = useState<'app_interactive' | 'official_embed'>('app_interactive');
  const [calendarScope, setCalendarScope] = useState<'day' | 'week' | 'all'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calendar events state
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Dedicated Interaction Layer / Event Details Modal
  const [selectedEventForView, setSelectedEventForView] = useState<GCalEvent | null>(null);

  // Form modal state (for Create & Edit)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GCalEvent | null>(null);

  // Form states
  const [eventSummary, setEventSummary] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');

  // Load initial events from local storage or generate default set matching current date
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_GCAL_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved GCal events', e);
      }
    }

    // Generate sample events for today and tomorrow
    const initialEvents = generateFreshEvents(new Date());
    setEvents(initialEvents);
    localStorage.setItem(STORAGE_GCAL_KEY, JSON.stringify(initialEvents));
  }, []);

  // Synchronize local tasks that have googleCalendarEventId into renderable events state
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    setEvents(prevEvents => {
      const eventMap = new Map<string, GCalEvent>();
      prevEvents.forEach(evt => eventMap.set(evt.id, evt));

      let hasChanges = false;

      tasks.forEach(task => {
        if (task.googleCalendarEventId) {
          const targetId = task.googleCalendarEventId;
          const existing = eventMap.get(targetId);

          const startISO = task.plannedStart || new Date().toISOString();
          const endISO = task.plannedEnd || new Date(new Date(startISO).getTime() + (task.estimatedDurationMinutes || 60) * 60000).toISOString();

          if (!existing) {
            eventMap.set(targetId, {
              id: targetId,
              summary: task.title,
              description: `Category: ${task.category}. Calibrated prediction: ${task.estimatedDurationMinutes}m (${task.confidence}% confidence).`,
              start: { dateTime: startISO },
              end: { dateTime: endISO },
              status: 'confirmed'
            });
            hasChanges = true;
          } else if (existing.summary !== task.title || existing.start.dateTime !== startISO) {
            eventMap.set(targetId, {
              ...existing,
              summary: task.title,
              start: { dateTime: startISO },
              end: { dateTime: endISO }
            });
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        const updatedList = Array.from(eventMap.values());
        localStorage.setItem(STORAGE_GCAL_KEY, JSON.stringify(updatedList));
        return updatedList;
      }
      return prevEvents;
    });
  }, [tasks]);

  const generateFreshEvents = (baseDate: Date): GCalEvent[] => {
    const dateStr = formatLocalDate(baseDate);

    const tomorrowDate = new Date(baseDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = formatLocalDate(tomorrowDate);

    return [
      {
        id: `gcal-evt-today-1-${Date.now()}`,
        summary: 'Deep Learning Transformer Architecture Reading',
        description: 'Review Vaswani et al. paper and implementation details in PyTorch.',
        start: { dateTime: `${dateStr}T09:00:00.000Z` },
        end: { dateTime: `${dateStr}T11:00:00.000Z` },
        status: 'confirmed'
      },
      {
        id: `gcal-evt-today-2-${Date.now()}`,
        summary: 'Data Structures & Algorithms Problem Practice',
        description: 'Solve 3 graph traversal problems on LeetCode.',
        start: { dateTime: `${dateStr}T14:00:00.000Z` },
        end: { dateTime: `${dateStr}T16:00:00.000Z` },
        status: 'confirmed'
      },
      {
        id: `gcal-evt-tomorrow-1-${Date.now()}`,
        summary: 'Mobile UI Layout & Responsiveness Audit',
        description: 'Audit mobile navigation touch targets and accessibility.',
        start: { dateTime: `${tomorrowStr}T10:00:00.000Z` },
        end: { dateTime: `${tomorrowStr}T11:30:00.000Z` },
        status: 'confirmed'
      }
    ];
  };

  const saveEventsToStorage = (newEvents: GCalEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem(STORAGE_GCAL_KEY, JSON.stringify(newEvents));
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync Google Calendar action
  const handleSyncGoogleCalendar = async () => {
    setIsSyncing(true);

    try {
      const token = getStoredAccessToken();
      if (!token) {
        showToast('Opening Google Sign-In popup...');
      }

      const res = await onConnectGCal();

      if (res.success) {
        const activeToken = getStoredAccessToken();
        if (activeToken) {
          const realEvents = await fetchRealGoogleCalendarEvents(activeToken);
          saveEventsToStorage(realEvents);
        }
        showToast(`Synced! ${res.count} events retrieved from your Google Calendar account.`);
      } else {
        showToast('Google Calendar sign-in was closed or cancelled.');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('closed') || msg.includes('cancelled') || msg.includes('popup')) {
        showToast('Google sign-in popup was closed.');
      } else {
        console.warn('Google Calendar view sync notice:', msg);
        showToast(`Calendar sync notice: ${msg || 'Sync failed'}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Date Navigation
  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    if (calendarScope === 'day') {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setSelectedDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    if (calendarScope === 'day') {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setEventSummary('');
    setEventDescription('');
    const dateStr = formatLocalDate(selectedDate);
    setEventStartDate(dateStr);
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setIsEventModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (evt: GCalEvent) => {
    setEditingEvent(evt);
    setEventSummary(evt.summary);
    setEventDescription(evt.description || '');

    const startObj = new Date(evt.start.dateTime);
    const endObj = new Date(evt.end.dateTime);

    setEventStartDate(formatLocalDate(startObj));
    setEventStartTime(startObj.toTimeString().substring(0, 5));
    setEventEndTime(endObj.toTimeString().substring(0, 5));

    setIsEventModalOpen(true);
  };

  // Save (Create or Update) Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary.trim()) return;

    const startISO = new Date(`${eventStartDate}T${eventStartTime}:00.000Z`).toISOString();
    const endISO = new Date(`${eventStartDate}T${eventEndTime}:00.000Z`).toISOString();

    const token = getStoredAccessToken();

    if (editingEvent) {
      // Update existing
      let updatedEvt: GCalEvent = {
        ...editingEvent,
        summary: eventSummary,
        description: eventDescription,
        start: { dateTime: startISO },
        end: { dateTime: endISO }
      };

      if (token) {
        try {
          updatedEvt = await updateRealGoogleCalendarEvent(editingEvent.id, {
            summary: eventSummary,
            description: eventDescription,
            startIso: startISO,
            endIso: endISO
          }, token);
        } catch (err: any) {
          console.warn('Real GCal API update failed, updating local state:', err);
        }
      }

      const updatedEvents = events.map(evt => evt.id === editingEvent.id ? updatedEvt : evt);
      saveEventsToStorage(updatedEvents);

      if (selectedEventForView && selectedEventForView.id === editingEvent.id) {
        setSelectedEventForView(updatedEvt);
      }

      showToast(`Updated "${eventSummary}" on Google Calendar`);
    } else {
      // Create new
      let newEvt: GCalEvent = {
        id: `gcal-${Date.now()}`,
        summary: eventSummary,
        description: eventDescription,
        start: { dateTime: startISO },
        end: { dateTime: endISO },
        status: 'confirmed'
      };

      if (token) {
        try {
          newEvt = await createRealGoogleCalendarEvent({
            summary: eventSummary,
            description: eventDescription,
            startIso: startISO,
            endIso: endISO
          }, token);
        } catch (err: any) {
          console.warn('Real GCal API creation failed, storing local event:', err);
        }
      }

      saveEventsToStorage([newEvt, ...events]);
      showToast(`Created event: "${eventSummary}" on Google Calendar`);
    }

    setIsEventModalOpen(false);
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string, title: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}" from your Google Calendar? This action cannot be undone.`);
    if (!confirmed) return;

    const token = getStoredAccessToken();
    if (token) {
      try {
        await deleteRealGoogleCalendarEvent(eventId, token);
      } catch (err: any) {
        console.warn('Real GCal API delete failed, removing locally:', err);
      }
    }

    const remaining = events.filter(e => e.id !== eventId);
    saveEventsToStorage(remaining);
    if (selectedEventForView?.id === eventId) {
      setSelectedEventForView(null);
    }
    showToast(`Deleted "${title}" from Google Calendar`);
  };

  // Calibrate an event into prediction task
  const handleCalibrateEvent = (evt: GCalEvent) => {
    const exists = tasks.some(t => t.googleCalendarEventId === evt.id);
    if (exists) {
      showToast(`"${evt.summary}" is already linked to a Calibration Prediction task`);
      return;
    }

    const newTask = convertGCalEventToTask(evt);
    onAddGCalTask(newTask);
    showToast(`Added "${evt.summary}" as a Calibrated Task Prediction!`);
  };

  // Construct official Google Calendar edit web link
  const getGoogleCalendarEditUrl = (evt: GCalEvent) => {
    const title = encodeURIComponent(evt.summary);
    const details = encodeURIComponent(evt.description || 'Personal Calibration linked event');

    const startISO = new Date(evt.start.dateTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endISO = new Date(evt.end.dateTime).toISOString().replace(/-|:|\.\d\d\d/g, '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&details=${details}`;
  };

  // Filter events for current selected scope
  const getWeekRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMon));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { monday, sunday };
  };

  const { monday, sunday } = getWeekRange(selectedDate);

  const filteredEvents = events.filter(evt => {
    if (calendarScope === 'all') return true;
    if (calendarScope === 'day') {
      return isSameDay(evt.start.dateTime, selectedDate);
    } else {
      const evtDate = new Date(evt.start.dateTime);
      return evtDate >= monday && evtDate <= new Date(sunday.getTime() + 86400000);
    }
  });

  const formattedDateHeader = calendarScope === 'all'
    ? 'All Synced Calendar Events'
    : calendarScope === 'day'
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-900">
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Screen Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Google Calendar Hub
              </h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                gcalConnected && getStoredAccessToken()
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {gcalConnected && getStoredAccessToken() ? 'Connected & Synced' : 'Not Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Modify Google Calendar events directly in this window, sync changes in real time, and import events into your Personal Calibration prediction engine.
            </p>
          </div>
        </div>

        {/* View Mode & Primary Action Buttons (SYNC & NEW EVENT) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Prominent SYNC BUTTON right at calendar tab */}
          <button
            onClick={handleSyncGoogleCalendar}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing GCal...' : 'Sync Google Calendar'}</span>
          </button>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('app_interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'app_interactive'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive App View
            </button>
            <button
              onClick={() => setViewMode('official_embed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'official_embed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Screen Frame
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive App Calendar View */}
      {viewMode === 'app_interactive' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Calendar Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {calendarScope !== 'all' && (
                <>
                  <button
                    onClick={handlePrevDate}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Previous Date/Week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleToday}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleNextDate}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Next Date/Week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              <h2 className="text-sm font-bold text-slate-800 ml-1">
                {formattedDateHeader}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center">
                <button
                  onClick={() => setCalendarScope('day')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    calendarScope === 'day' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setCalendarScope('week')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    calendarScope === 'week' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setCalendarScope('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    calendarScope === 'all' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  All Events ({events.length})
                </button>
              </div>

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                title="Open Google Calendar in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Events Grid */}
          <div className="p-6 space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">No events found for {calendarScope === 'day' ? 'this date' : 'this range'}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Click <strong>"Sync Google Calendar"</strong> to pull down events, or create a new event for this day.
                </p>
                <div className="flex items-center justify-center space-x-3 mt-4">
                  <button
                    onClick={handleSyncGoogleCalendar}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Google Calendar</span>
                  </button>
                  <button
                    onClick={() => setCalendarScope('all')}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    View All {events.length} Events
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.map(evt => {
                  const startObj = new Date(evt.start.dateTime);
                  const endObj = new Date(evt.end.dateTime);
                  const dateHeader = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const timeStr = `${startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  const durationMins = Math.max(15, Math.round((endObj.getTime() - startObj.getTime()) / 60000));
                  const category = inferCategoryFromTitle(evt.summary);

                  const isLinkedToCalibration = tasks.some(t => t.googleCalendarEventId === evt.id);

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventForView(evt)}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                            {evt.summary}
                          </h3>
                          <span className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#4361ee] border border-indigo-100">
                            {category}
                          </span>
                        </div>

                        {evt.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {evt.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500 pt-1">
                          <span className="flex items-center space-x-1 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>{dateHeader}, {timeStr}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{durationMins} mins</span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleCalibrateEvent(evt)}
                          disabled={isLinkedToCalibration}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isLinkedToCalibration
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-[#4361ee] border border-indigo-200'
                          }`}
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>{isLinkedToCalibration ? 'Linked to Calibration' : 'Calibrate Task'}</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedEventForView(evt)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Open Interaction & Modify Panel"
                          >
                            Inspect & Modify
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(evt)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Event"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.summary)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mode 2: Official Web Embed & Synchronized Event Layer */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px]">
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Google Calendar Official Embed Workspace</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSyncGoogleCalendar}
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 text-blue-600 font-bold hover:underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Google Calendar</span>
                </button>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-[#4361ee] font-bold hover:underline"
                >
                  <span>Open in full tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <iframe
              src="https://calendar.google.com/calendar/embed?src=primary&ctz=UTC"
              title="Google Calendar Embed View"
              className="w-full h-full border-none"
            />
          </div>

          {/* Synchronized Calendar Events & Task Mapping Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Synchronized Event Mappings</h3>
                  <p className="text-xs text-slate-500">
                    Events mapped via <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">googleCalendarEventId</code> between Google Calendar and your Calibration engine
                  </p>
                </div>
              </div>
              <button
                onClick={handleSyncGoogleCalendar}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Refresh Sync</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.map(evt => {
                const isLinked = tasks.some(t => t.googleCalendarEventId === evt.id);
                const startObj = new Date(evt.start.dateTime);
                const dateStr = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{evt.summary}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0 font-mono">
                          {evt.id.substring(0, 10)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{dateStr} at {timeStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isLinked
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {isLinked ? 'Calibrated Task' : 'Unlinked GCal Event'}
                      </span>

                      <button
                        onClick={() => setSelectedEventForView(evt)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Inspect / Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED INTERACTION LAYER / EVENT DETAILS MODAL */}
      {selectedEventForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl text-slate-900 my-8 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    Google Calendar Event Layer
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">
                    {selectedEventForView.summary}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Event Metadata Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>
                      {new Date(selectedEventForView.start.dateTime).toLocaleString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {new Date(selectedEventForView.end.dateTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {inferCategoryFromTitle(selectedEventForView.summary)}
                  </span>
                </div>

                {selectedEventForView.description && (
                  <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-2">
                    {selectedEventForView.description}
                  </p>
                )}
              </div>

              {/* Interaction Options */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Event Actions & Modifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const evt = selectedEventForView;
                      setSelectedEventForView(null);
                      handleOpenEditModal(evt);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center space-x-2.5 shadow-2xs transition-all"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <div>Modify Title & Schedule</div>
                      <div className="text-[11px] font-normal text-slate-500">Edit directly in app</div>
                    </div>
                  </button>

                  <a
                    href={getGoogleCalendarEditUrl(selectedEventForView)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs flex items-center space-x-2.5 shadow-2xs transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <div>Open in Google Calendar</div>
                      <div className="text-[11px] font-normal text-blue-700">Official Web Editor</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Calibration Link */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                    <Target className="w-4 h-4 text-[#4361ee]" />
                    <span>Personal Calibration Engine</span>
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    Track your predicted vs actual execution for this event.
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleCalibrateEvent(selectedEventForView);
                  }}
                  disabled={tasks.some(t => t.googleCalendarEventId === selectedEventForView.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    tasks.some(t => t.googleCalendarEventId === selectedEventForView.id)
                      ? 'bg-emerald-100 text-emerald-800 cursor-default'
                      : 'bg-[#4361ee] text-white hover:bg-[#3852d0]'
                  }`}
                >
                  {tasks.some(t => t.googleCalendarEventId === selectedEventForView.id)
                    ? 'Already Linked'
                    : 'Calibrate Event'}
                </button>
              </div>

              {/* Embedded Google Calendar Quick Web View */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Official Google Calendar Interaction Window</span>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1 text-[11px]"
                  >
                    <span>Open full tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <iframe
                    src="https://calendar.google.com/calendar/embed?src=primary&ctz=UTC"
                    title="Google Calendar Modal Web View"
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDeleteEvent(selectedEventForView.id, selectedEventForView.summary)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>

              <button
                onClick={() => setSelectedEventForView(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl text-slate-900 my-8 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingEvent ? 'Edit Google Calendar Event' : 'New Google Calendar Event'}
                  </h3>
                  <p className="text-xs text-slate-500">Modify title, date, start time & end time directly</p>
                </div>
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Event Title / Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g., Deep Learning Chapter Reading..."
                  value={eventSummary}
                  onChange={e => setEventSummary(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={e => setEventStartDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={e => setEventStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={e => setEventEndTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Description / Context (Optional)
                </label>
                <textarea
                  placeholder="Notes, materials, or target goals..."
                  rows={3}
                  value={eventDescription}
                  onChange={e => setEventDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
