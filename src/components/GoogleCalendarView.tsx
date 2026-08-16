import React, { useState, useEffect } from 'react';
import { GCalEvent, inferCategoryFromTitle } from '../utils/googleCalendar';
import type { TaskItem } from '../types';
import {
  getStoredAccessToken,
  fetchAllGoogleCalendarEvents,
  createRealGoogleCalendarEvent,
  updateRealGoogleCalendarEvent,
  deleteRealGoogleCalendarEvent
} from '../utils/googleAuthService';
import { ConfirmDialog } from './ui/ConfirmDialog';
import type { ToastVariant } from './ui/Toast';
import { CalendarHeader } from './calendar/CalendarHeader';
import { ConnectPrompt } from './calendar/ConnectPrompt';
import { EventToolbar, type CalendarScope } from './calendar/EventToolbar';
import { EventsEmptyState } from './calendar/EventsEmptyState';
import { EventCard, type EventLinkStatus } from './calendar/EventCard';
import { EmbedPanel } from './calendar/EmbedPanel';
import { LinkedPredictionsPanel } from './calendar/LinkedPredictionsPanel';
import { EventDetailsModal } from './calendar/EventDetailsModal';
import { EventFormModal } from './calendar/EventFormModal';

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
  const [calendarScope, setCalendarScope] = useState<CalendarScope>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [embedLoading, setEmbedLoading] = useState(true);

  const [selectedEventForView, setSelectedEventForView] = useState<GCalEvent | null>(null);
  const [showDetailsPreview, setShowDetailsPreview] = useState(false);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GCalEvent | null>(null);

  const [eventSummary, setEventSummary] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const notify = (msg: string, variant: ToastVariant = 'success') => {
    onShowToast?.(msg, variant);
  };

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

    setEvents([]);
  }, []);

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

  useEffect(() => {
    setShowDetailsPreview(false);
  }, [selectedEventForView?.id]);

  const saveEventsToStorage = (newEvents: GCalEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem(STORAGE_GCAL_KEY, JSON.stringify(newEvents));
  };

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

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventSummary.trim()) return;

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

  const handleDeleteEvent = (evt: GCalEvent) => {
    setDeleteTarget({ id: evt.id, title: evt.summary });
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

  const handleCalibrateEvent = (evt: GCalEvent) => {
    const existing = tasks.find(t => t.googleCalendarEventId === evt.id);
    if (existing?.predictionStatus === 'recorded') {
      notify(`"${evt.summary}" already has a recorded prediction`, 'info');
      return;
    }
    onRecordGCalPrediction(evt);
  };

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

  const getEventLinkStatus = (evt: GCalEvent): EventLinkStatus => {
    const linkedTask = tasks.find(t => t.googleCalendarEventId === evt.id);
    const isRecorded = linkedTask?.predictionStatus === 'recorded';
    const isPlanLinked = !!linkedTask && !isRecorded;
    return { isRecorded, isPlanLinked };
  };

  const connected = gcalConnected && getStoredAccessToken();
  const embedSrc = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;

  return (
    <div className="mx-auto max-w-content space-y-6 pb-12">
      <CalendarHeader
        connected={connected}
        isSyncing={isSyncing}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSync={handleSyncGoogleCalendar}
        onCreate={handleOpenCreateModal}
      />

      {!gcalConnected && (
        <ConnectPrompt isSyncing={isSyncing} onConnect={handleSyncGoogleCalendar} />
      )}

      {viewMode === 'list' ? (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <EventToolbar
            scope={calendarScope}
            onScopeChange={setCalendarScope}
            onPrev={handlePrevDate}
            onNext={handleNextDate}
            onToday={handleToday}
            dateHeader={formattedDateHeader}
            totalEvents={events.length}
          />

          <div className="space-y-4 p-6">
            {filteredEvents.length === 0 ? (
              <EventsEmptyState
                scope={calendarScope}
                eventsCount={events.length}
                onSync={handleSyncGoogleCalendar}
                onViewAll={() => setCalendarScope('all')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredEvents.map(evt => (
                  <EventCard
                    key={evt.id}
                    evt={evt}
                    category={inferCategoryFromTitle(evt.summary)}
                    linkStatus={getEventLinkStatus(evt)}
                    onCalibrate={handleCalibrateEvent}
                    onViewDetails={setSelectedEventForView}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <EmbedPanel
            isSyncing={isSyncing}
            embedSrc={embedSrc}
            embedLoading={embedLoading}
            onSync={handleSyncGoogleCalendar}
            onEmbedLoad={() => setEmbedLoading(false)}
          />

          <LinkedPredictionsPanel
            events={events}
            getLinkStatus={getEventLinkStatus}
            isSyncing={isSyncing}
            onSync={handleSyncGoogleCalendar}
            onInspect={setSelectedEventForView}
          />
        </div>
      )}

      {selectedEventForView && (
        <EventDetailsModal
          evt={selectedEventForView}
          category={inferCategoryFromTitle(selectedEventForView.summary)}
          showPreview={showDetailsPreview}
          embedSrc={embedSrc}
          hasRecordedPrediction={tasks.some(
            t => t.googleCalendarEventId === selectedEventForView.id && t.predictionStatus === 'recorded'
          )}
          onTogglePreview={() => setShowDetailsPreview(prev => !prev)}
          onClose={() => setSelectedEventForView(null)}
          onDelete={handleDeleteEvent}
          onEdit={evt => {
            setSelectedEventForView(null);
            handleOpenEditModal(evt);
          }}
          onCalibrate={handleCalibrateEvent}
        />
      )}

      {isEventModalOpen && (
        <EventFormModal
          editingEvent={editingEvent}
          summary={eventSummary}
          description={eventDescription}
          startDate={eventStartDate}
          endDate={eventEndDate}
          startTime={eventStartTime}
          endTime={eventEndTime}
          formError={formError}
          onSummaryChange={setEventSummary}
          onDescriptionChange={setEventDescription}
          onStartDateChange={setEventStartDate}
          onEndDateChange={setEventEndDate}
          onStartTimeChange={setEventStartTime}
          onEndTimeChange={setEventEndTime}
          onSubmit={handleSaveEvent}
          onClose={() => setIsEventModalOpen(false)}
        />
      )}

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
