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
  Globe,
  CalendarDays,
  Plug,
  CalendarClock,
  Loader2
} from 'lucide-react';
import { GCalEvent, inferCategoryFromTitle } from '../utils/googleCalendar';
import { TaskItem } from '../types';
import {
  getStoredAccessToken,
  fetchAllGoogleCalendarEvents,
  createRealGoogleCalendarEvent,
  updateRealGoogleCalendarEvent,
  deleteRealGoogleCalendarEvent
} from '../utils/googleAuthService';
import { SegmentedControl } from './ui/SegmentedControl';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { ToastVariant } from './ui/Toast';

interface GoogleCalendarViewProps {
  tasks: TaskItem[];
  onRecordGCalPrediction: (event: GCalEvent) => void;
  gcalConnected: boolean;
  onConnectGCal: () => void;
  calendarId?: string;
  onShowToast?: (message: string, variant?: ToastVariant) => void;
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
  onRecordGCalPrediction,
  gcalConnected,
  onConnectGCal,
  calendarId = 'primary',
  onShowToast
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'embed'>('list');
  const [calendarScope, setCalendarScope] = useState<'day' | 'week' | 'all'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calendar events state
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [embedLoading, setEmbedLoading] = useState(true);

  // Dedicated Interaction Layer / Event Details Modal
  const [selectedEventForView, setSelectedEventForView] = useState<GCalEvent | null>(null);
  const [showDetailsPreview, setShowDetailsPreview] = useState(false);

  // Form modal state (for Create & Edit)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GCalEvent | null>(null);

  // Form states
  const [eventSummary, setEventSummary] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const notify = (msg: string, variant: ToastVariant = 'success') => {
    onShowToast?.(msg, variant);
  };

  // Load initial events from local storage (no fake seeding in production)
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

    // No saved events: show an empty calendar until a real sync or import happens
    setEvents([]);
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
              description: task.predictionStatus === 'not_recorded'
                ? `Category: ${task.category}. Plan imported; prediction not recorded yet.`
                : `Category: ${task.category}. Forecast: ${task.estimatedDurationMinutes}m (${task.confidence}% confidence).`,
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

  // Reset details-modal preview toggle when a new event is selected
  useEffect(() => {
    setShowDetailsPreview(false);
  }, [selectedEventForView?.id]);

  const saveEventsToStorage = (newEvents: GCalEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem(STORAGE_GCAL_KEY, JSON.stringify(newEvents));
  };

  // Sync Google Calendar action
  const handleSyncGoogleCalendar = async () => {
    setIsSyncing(true);

    try {
      const token = getStoredAccessToken();
      if (!token) {
        notify('Opening Google Sign-In popup...', 'info');
      }

      const res = await onConnectGCal();

      if (res.success) {
        const activeToken = getStoredAccessToken();
        if (activeToken) {
          const realEvents = await fetchAllGoogleCalendarEvents(activeToken);
          saveEventsToStorage(realEvents);
        }
        notify(`Synced! ${res.count} events retrieved from your Google Calendar.`, 'success');
      } else {
        notify('Google Calendar sign-in was closed or cancelled.', 'warning');
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('closed') || msg.includes('cancelled') || msg.includes('popup')) {
        notify('Google sign-in popup was closed.', 'warning');
      } else {
        console.warn('Google Calendar view sync notice:', msg);
        notify(`Calendar sync notice: ${msg || 'Sync failed'}`, 'error');
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
    setEventEndDate(dateStr);
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setFormError(null);
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
    setEventEndDate(formatLocalDate(endObj));
    setEventStartTime(startObj.toTimeString().substring(0, 5));
    setEventEndTime(endObj.toTimeString().substring(0, 5));
    setFormError(null);

    setIsEventModalOpen(true);
  };

  // Save (Create or Update) Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary.trim()) return;

    // Build ISO from local date parts (no fake UTC suffix)
    const startISO = new Date(`${eventStartDate}T${eventStartTime}:00`).toISOString();
    const endISO = new Date(`${eventEndDate}T${eventEndTime}:00`).toISOString();

    if (new Date(endISO).getTime() <= new Date(startISO).getTime()) {
      setFormError('End must be after start.');
      return;
    }
    setFormError(null);

    const token = getStoredAccessToken();
    const savedLocally = (msg: string) => {
      if (token) {
        notify(`Saved locally. Couldn't reach Google Calendar (${msg}). It will re-sync.`, 'warning');
      } else {
        notify('Saved locally. Sign in & sync to push to Google Calendar.', 'info');
      }
    };

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
          }, token, calendarId);
          notify(`Updated "${eventSummary}" on Google Calendar.`, 'success');
        } catch (err: any) {
          console.warn('Real GCal API update failed, updating local state:', err);
          savedLocally(err?.message || 'update failed');
        }
      } else {
        savedLocally('');
      }

      const updatedEvents = events.map(evt => evt.id === editingEvent.id ? updatedEvt : evt);
      saveEventsToStorage(updatedEvents);

      if (selectedEventForView && selectedEventForView.id === editingEvent.id) {
        setSelectedEventForView(updatedEvt);
      }
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
          }, token, calendarId);
          notify(`Created event: "${eventSummary}" on Google Calendar.`, 'success');
        } catch (err: any) {
          console.warn('Real GCal API creation failed, storing local event:', err);
          savedLocally(err?.message || 'creation failed');
        }
      } else {
        savedLocally('');
      }

      saveEventsToStorage([newEvt, ...events]);
    }

    setIsEventModalOpen(false);
  };

  // Delete Event (opens confirmation)
  const handleDeleteEvent = (eventId: string, title: string) => {
    setDeleteTarget({ id: eventId, title });
  };

  const performDeleteEvent = async () => {
    if (!deleteTarget) return;
    const token = getStoredAccessToken();

    if (token) {
      try {
        await deleteRealGoogleCalendarEvent(deleteTarget.id, token, calendarId);
        notify(`Deleted "${deleteTarget.title}" from Google Calendar.`, 'success');
      } catch (err: any) {
        console.warn('Real GCal API delete failed, removing locally:', err);
        notify(`Removed locally. Couldn't reach Google Calendar (${err?.message || 'delete failed'}).`, 'warning');
      }
    } else {
      notify(`Deleted "${deleteTarget.title}" locally.`, 'info');
    }

    const remaining = events.filter(e => e.id !== deleteTarget.id);
    saveEventsToStorage(remaining);
    if (selectedEventForView?.id === deleteTarget.id) {
      setSelectedEventForView(null);
    }
    setDeleteTarget(null);
  };

  // Calibrate an event into prediction task
  const handleCalibrateEvent = (evt: GCalEvent) => {
    const existing = tasks.find(t => t.googleCalendarEventId === evt.id);
    if (existing?.predictionStatus === 'recorded') {
      notify(`"${evt.summary}" already has a recorded prediction`, 'info');
      return;
    }
    onRecordGCalPrediction(evt);
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

  const getEventLinkStatus = (evt: GCalEvent) => {
    const linkedTask = tasks.find(t => t.googleCalendarEventId === evt.id);
    const isRecorded = linkedTask?.predictionStatus === 'recorded';
    const isPlanLinked = !!linkedTask && !isRecorded;
    return { isRecorded, isPlanLinked };
  };

  const embedSrc = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;

  return (
    <div className="mx-auto max-w-content space-y-6 pb-12 text-slate-900">
       {/* Calendar is the source of the plan. */}
       <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start space-x-4">
           <CalendarIcon className="h-6 w-6 shrink-0 text-blue-600" />
          <div>
            <div className="flex items-center space-x-2.5">
               <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                 Calendar
              </h1>
              <Badge tone={gcalConnected && getStoredAccessToken() ? 'success' : 'warning'}>
                {gcalConnected && getStoredAccessToken() ? 'Connected' : 'Not connected'}
              </Badge>
            </div>
             <p className="mt-1 max-w-xl text-sm text-slate-600">
               Your calendar is the plan. Record a prediction before you start to compare it with reality.
            </p>
          </div>
        </div>

        {/* View Mode & Primary Action Buttons (SYNC & NEW EVENT) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary action: Sync when connected, Connect via panel when not */}
          <Button
            onClick={handleSyncGoogleCalendar}
            loading={isSyncing}
            variant={gcalConnected && getStoredAccessToken() ? 'primary' : 'secondary'}
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isSyncing ? 'Syncing...' : 'Sync calendar'}</span>
          </Button>

          <SegmentedControl
            ariaLabel="Calendar view mode"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'list', label: 'List view' },
              { value: 'embed', label: 'Embed view' }
            ]}
          />

          <Button
            onClick={handleOpenCreateModal}
            variant="secondary"
          >
            <Plus className="w-4 h-4" />
            <span>New event</span>
          </Button>
        </div>
      </div>

      {/* Connect prompt (only when not connected) */}
      {!gcalConnected && (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-900 sm:flex-row sm:items-center">
          <div className="flex items-start space-x-3">
            <Plug className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <span className="font-semibold text-slate-900">Connect your Google Calendar</span>
              <p className="mt-0.5 text-sm text-slate-600">
                Import planned events automatically and keep your plan and predictions in sync.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSyncGoogleCalendar}
            loading={isSyncing}
            className="shrink-0"
          >
            {isSyncing ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
        </div>
      )}

      {/* Plan vs Prediction Clarification Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <CalendarClock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Calendar events are plans, not automatic predictions.</strong> Click <strong>[Predict]</strong> on any event to record your duration forecast and track estimation accuracy.
          </span>
        </div>
      </div>

      {/* Mode 1: Interactive App Calendar View */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Calendar Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              {calendarScope !== 'all' && (
                <>
                  <button
                    onClick={handlePrevDate}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Previous Date/Week"
                    aria-label="Previous date or week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <Button
                    onClick={handleToday}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                  >
                    Today
                  </Button>
                  <button
                    onClick={handleNextDate}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Next Date/Week"
                    aria-label="Next date or week"
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
              <SegmentedControl
                ariaLabel="Calendar scope"
                value={calendarScope}
                onChange={setCalendarScope}
                options={[
                  { value: 'day', label: 'Day' },
                  { value: 'week', label: 'Week' },
                  { value: 'all', label: `All Events (${events.length})` }
                ]}
              />

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                title="Open Google Calendar in New Tab"
                aria-label="Open Google Calendar in new tab"
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
                  Click <strong>"Sync calendar"</strong> to pull down events, or create a new event for this day.
                </p>
                <div className="flex items-center justify-center space-x-3 mt-4">
                  <Button
                    onClick={handleSyncGoogleCalendar}
                    size="sm"
                    className="rounded-xl"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Google Calendar</span>
                  </Button>
                  <Button
                    onClick={() => setCalendarScope('all')}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                  >
                    View All {events.length} Events
                  </Button>
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

                   const { isRecorded, isPlanLinked } = getEventLinkStatus(evt);

                   return (
                     <div
                       key={evt.id}
                       className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                     >
                       <div className="space-y-2">
                         <div className="flex items-start justify-between gap-2">
                           <h3 className="font-bold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                             {evt.summary}
                           </h3>
                           <span className="shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                             {category}
                           </span>
                         </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isRecorded ? (
                            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Target className="w-3 h-3" />
                              <span>Prediction recorded</span>
                            </span>
                          ) : isPlanLinked ? (
                            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <Target className="w-3 h-3" />
                              <span>Plan linked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                              <span>Not linked</span>
                            </span>
                          )}
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
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <Button
                            onClick={() => handleCalibrateEvent(evt)}
                            disabled={isRecorded}
                            variant="secondary"
                            size="sm"
                            className={`rounded-xl ${
                              isRecorded
                                ? 'cursor-default border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>{isRecorded ? 'Prediction recorded' : 'Record a prediction'}</span>
                          </Button>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedEventForView(evt)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                             title="Open event details"
                          >
                             View details
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(evt)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                             aria-label="Edit calendar event"
                             title="Edit calendar event"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.summary)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                             aria-label="Delete calendar event"
                             title="Delete calendar event"
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
        /* Mode 2: Official Web Embed & Linked Predictions */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px]">
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Calendar embed</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSyncGoogleCalendar}
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 text-blue-600 font-bold hover:underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync calendar</span>
                </button>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-blue-700 font-bold hover:underline"
                >
                  <span>Open in full tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div className="relative flex-1 bg-slate-50">
              {embedLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="text-sm font-medium">Loading calendar preview...</span>
                </div>
              )}
              <iframe
                src={embedSrc}
                title="Google Calendar Embed View"
                className="w-full h-full border-none"
                onLoad={() => setEmbedLoading(false)}
              />
              {!embedLoading && (
                <div className="pointer-events-none absolute bottom-3 right-3 z-10">
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="pointer-events-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    Open in Google Calendar
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Linked Predictions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Linked predictions</h3>
                  <p className="text-xs text-slate-500">
                    Events that have a prediction recorded in your calibration history.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSyncGoogleCalendar}
                loading={isSyncing}
                variant="secondary"
                size="sm"
                className="rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Sync</span>
              </Button>
            </div>

            {events.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-slate-500">
                  No events synced yet. Sync your calendar to see linked predictions here.
                </p>
                <Button
                  onClick={handleSyncGoogleCalendar}
                  loading={isSyncing}
                  size="sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync calendar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {events.map(evt => {
                  const { isRecorded, isPlanLinked } = getEventLinkStatus(evt);
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
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{dateStr} at {timeStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                        <Badge tone={isRecorded ? 'success' : isPlanLinked ? 'info' : 'neutral'}>
                          {isRecorded ? 'Prediction recorded' : isPlanLinked ? 'Plan linked' : 'Not linked'}
                        </Badge>

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
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEventForView && (
        <ModalShell
          title={selectedEventForView.summary}
          description="Calendar event"
          icon={<CalendarIcon className="h-6 w-6" />}
          onClose={() => setSelectedEventForView(null)}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between">
              <Button
                onClick={() => handleDeleteEvent(selectedEventForView.id, selectedEventForView.summary)}
                variant="danger"
                size="sm"
                className="rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete event</span>
              </Button>

              <Button
                onClick={() => setSelectedEventForView(null)}
                size="sm"
                variant="secondary"
                className="rounded-xl"
              >
                Done
              </Button>
            </div>
          }
        >
          <div className="space-y-5 p-6">
            {/* Event Metadata */}
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
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
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
                Event actions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const evt = selectedEventForView;
                    setSelectedEventForView(null);
                    handleOpenEditModal(evt);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center space-x-2.5 shadow-xs transition-all"
                >
                  <Edit2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="text-left">
                    <div>Edit title & schedule</div>
                    <div className="text-xs font-normal text-slate-500">Edit directly in app</div>
                  </div>
                </button>

                {selectedEventForView.htmlLink ? (
                  <a
                    href={selectedEventForView.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center space-x-2.5 shadow-xs transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="text-left">
                      <div>Open in Google Calendar</div>
                      <div className="text-xs font-normal text-blue-700">Edit in Google Calendar</div>
                    </div>
                  </a>
                ) : null}
              </div>
            </div>

            {/* Calibration Link */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-blue-800 flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>Calibration prediction</span>
                </div>
                <p className="text-xs text-blue-700">
                  Record what you think it'll take before starting.
                </p>
              </div>

              <button
                onClick={() => {
                  handleCalibrateEvent(selectedEventForView);
                }}
                 disabled={tasks.some(t => t.googleCalendarEventId === selectedEventForView.id && t.predictionStatus === 'recorded')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                   tasks.some(t => t.googleCalendarEventId === selectedEventForView.id && t.predictionStatus === 'recorded')
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                 {tasks.some(t => t.googleCalendarEventId === selectedEventForView.id && t.predictionStatus === 'recorded')
                   ? 'Prediction recorded'
                   : 'Record a prediction'}
              </button>
            </div>

            {/* Embedded Google Calendar Quick Web View (collapsed by default) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDetailsPreview(prev => !prev)}
                aria-expanded={showDetailsPreview}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span>Calendar preview</span>
                <span className="text-blue-600">{showDetailsPreview ? 'Hide' : 'Show'}</span>
              </button>

              {showDetailsPreview && (
                <div className="h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <iframe
                    src={embedSrc}
                    title="Google Calendar Preview"
                    className="w-full h-full border-none"
                  />
                </div>
              )}
            </div>
          </div>
        </ModalShell>
      )}

      {/* Create / Edit Event Modal */}
      {isEventModalOpen && (
        <ModalShell
          title={editingEvent ? 'Edit Google Calendar event' : 'New Google Calendar event'}
          description="Set the title, date, and time window for this plan."
          icon={<CalendarClock className="h-5 w-5" />}
          onClose={() => setIsEventModalOpen(false)}
          maxWidth="max-w-lg"
          initialFocus="none"
        >
          <form onSubmit={handleSaveEvent} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Event title / summary
              </label>
              <input
                type="text"
                placeholder="e.g., Deep Learning Chapter Reading..."
                value={eventSummary}
                onChange={e => setEventSummary(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Start date
                </label>
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={e => setEventStartDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  End date
                </label>
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={e => setEventEndDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Start time
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
                  End time
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

            {formError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {formError}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Description / context (optional)
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
              <Button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                variant="tertiary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
              >
                {editingEvent ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.title}"?`}
          message="This also removes the event from your Google Calendar when connected."
          confirmLabel="Delete event"
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={performDeleteEvent}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
