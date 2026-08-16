import React, { useEffect, useState } from 'react';
import { Calendar, LogOut, UserCheck } from 'lucide-react';
import type { AppSettings, TaskItem, SleepRecord } from '../../types';
import {
  getStoredAccessToken,
  signInWithGoogleCalendar,
  signOutGoogle,
  fetchAllGoogleCalendarEvents,
  reconcileGCalEventsWithTasks,
  listUserCalendars,
  auth
} from '../../utils/googleAuthService';
import { convertGCalEventToTask } from '../../utils/googleCalendar';
import { CardSection } from '../ui/CardSection';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StatusBanner } from './StatusBanner';

interface CalendarConnectionCardProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  onImportData: (tasks: TaskItem[], sleep: SleepRecord[], settings?: AppSettings) => void;
}

export const CalendarConnectionCard: React.FC<CalendarConnectionCardProps> = ({
  settings,
  onUpdateSettings,
  tasks,
  sleepRecords,
  onImportData
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);
  const [calendars, setCalendars] = useState<{ id: string; summary: string; primary: boolean }[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarId, setCalendarId] = useState(settings.gcalCalendarId || 'primary');

  const handleLoadCalendars = async () => {
    if (!getStoredAccessToken()) return;
    setCalendarLoading(true);
    try {
      const list = await listUserCalendars();
      setCalendars(list);
    } catch (err: any) {
      setSyncStatusMsg({ type: 'info', text: `Could not list calendars: ${err?.message || 'unknown error'}` });
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    if (getStoredAccessToken()) {
      handleLoadCalendars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleCalendarChange = (id: string) => {
    setCalendarId(id);
    onUpdateSettings({ ...settings, gcalCalendarId: id === 'primary' ? undefined : id });
  };

  const handleSyncRealGoogleCalendar = async () => {
    setIsSyncing(true);
    setSyncStatusMsg({ type: 'info', text: 'Connecting to Google Calendar API...' });

    try {
      let token = getStoredAccessToken();
      if (!token) {
        setSyncStatusMsg({ type: 'info', text: 'Opening Google OAuth sign-in popup...' });
        const res = await signInWithGoogleCalendar();
        token = res.accessToken;
        setCurrentUser(res.user);
      }

      setSyncStatusMsg({ type: 'info', text: 'Fetching events from your Google Calendar...' });
      const realEvents = await fetchAllGoogleCalendarEvents(token, { calendarId: settings.gcalCalendarId });

      const reconciledTasks = reconcileGCalEventsWithTasks(tasks, realEvents);

      const gcalTasks = realEvents.map(convertGCalEventToTask);
      const existingIds = new Set(reconciledTasks.map(t => t.googleCalendarEventId).filter(Boolean));
      const toAdd = gcalTasks.filter(t => t.googleCalendarEventId && !existingIds.has(t.googleCalendarEventId));

      if (toAdd.length > 0) {
        onImportData([...toAdd, ...reconciledTasks], sleepRecords, { ...settings, googleCalendarConnected: true });
        setSyncStatusMsg({
          type: 'success',
          text: `Synced successfully! Retrieved ${realEvents.length} events from your Google Calendar (${toAdd.length} new tasks added).`
        });
      } else {
        onImportData(reconciledTasks, sleepRecords, { ...settings, googleCalendarConnected: true });
        setSyncStatusMsg({
          type: 'success',
          text: `Synced successfully! Retrieved ${realEvents.length} events from your Google Calendar. All tasks are up to date.`
        });
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('closed') || msg.includes('cancelled') || msg.includes('popup')) {
        setSyncStatusMsg({
          type: 'info',
          text: 'Google sign-in popup was closed before completing authorization.'
        });
      } else {
        console.warn('Settings GCal sync notice:', msg);
        setSyncStatusMsg({
          type: 'error',
          text: `Sync notice: ${msg || 'Error communicating with Google Calendar API'}`
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await signOutGoogle();
    setCurrentUser(null);
    onUpdateSettings({ ...settings, googleCalendarConnected: false });
    setSyncStatusMsg({ type: 'info', text: 'Disconnected Google Calendar account.' });
  };

  const connected = settings.googleCalendarConnected && getStoredAccessToken();

  return (
    <CardSection
      icon={<Calendar className="h-5 w-5" />}
      title="Calendar connection"
      subtitle="Primary source for planned calendar activities"
      right={<Badge tone={connected ? 'success' : 'neutral'}>{connected ? 'Connected' : 'Disconnected'}</Badge>}
    >
      <div className="space-y-4">
        {currentUser && (
          <div className="flex items-center justify-between rounded-xl border border-primary-border bg-primary-soft p-3 text-xs">
            <div className="flex items-center gap-2 text-primary-ink">
              <UserCheck className="h-4 w-4" />
              <span className="font-medium">Account:</span>
              <span className="font-bold">{currentUser.email || currentUser.displayName || 'Google Account'}</span>
            </div>
            <Button
              onClick={handleDisconnectGoogle}
              variant="tertiary"
              size="sm"
              className="text-text-muted hover:text-danger-ink"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Disconnect</span>
            </Button>
          </div>
        )}

        {syncStatusMsg && <StatusBanner type={syncStatusMsg.type} text={syncStatusMsg.text} />}

        <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <p className="max-w-md text-xs leading-relaxed text-text-secondary">
            Personal Calibration connects directly to your Google Calendar to record predictions from actual events. Your original prediction timestamps are preserved even if events are rescheduled later.
          </p>

          <Button onClick={handleSyncRealGoogleCalendar} loading={isSyncing}>
            {isSyncing ? (
              <span>Syncing Calendar...</span>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                <span>{getStoredAccessToken() ? 'Sync Google Calendar Now' : 'Sign In & Sync Google Account'}</span>
              </>
            )}
          </Button>
        </div>

        {getStoredAccessToken() && (
          <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center">
            <label className="shrink-0 text-xs font-semibold text-text-secondary">Calendar</label>
            <div className="flex flex-1 items-center gap-2">
              <select
                value={calendarId}
                onChange={e => handleCalendarChange(e.target.value)}
                disabled={calendarLoading}
                className="flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-primary focus:bg-surface focus:outline-none"
              >
                <option value="primary">Primary calendar (default)</option>
                {calendars
                  .filter(c => !c.primary)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.summary}</option>
                  ))}
              </select>
              <Button
                onClick={handleLoadCalendars}
                disabled={calendarLoading}
                variant="secondary"
                loading={calendarLoading}
              >
                {calendarLoading ? 'Loading...' : 'Refresh list'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </CardSection>
  );
};
