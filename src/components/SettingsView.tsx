import React, { useState, useEffect } from 'react';
import { AppSettings, TaskItem, SleepRecord } from '../types';
import {
  Calendar,
  ShieldCheck,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Sliders,
  Database,
  RefreshCw,
  LogOut,
  UserCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  getStoredAccessToken,
  signInWithGoogleCalendar,
  signOutGoogle,
  fetchRealGoogleCalendarEvents,
  auth
} from '../utils/googleAuthService';
import { convertGCalEventToTask } from '../utils/googleCalendar';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRunValidationSuite: () => void;
  onSeedSampleData: (preset?: 'standard' | 'rich' | 'edge' | 'empty' | 'generated') => void;
  onClearAllData: () => void;
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  onImportData: (importedTasks: TaskItem[], importedSleep: SleepRecord[], importedSettings?: AppSettings) => void;
  onConnectGoogleCalendar: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onRunValidationSuite,
  onSeedSampleData,
  onClearAllData,
  tasks,
  sleepRecords,
  onImportData,
  onConnectGoogleCalendar
}) => {
  const [minObs, setMinObs] = useState(settings.minObservationsForRealityCheck);
  const [smallThresh, setSmallThresh] = useState(settings.smallSuggestionThresholdPercent);
  const [realityThresh, setRealityThresh] = useState(settings.realityCheckThresholdPercent);
  const [autoSync, setAutoSync] = useState(settings.autoImportGCal);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [dataStatusMsg, setDataStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

      setSyncStatusMsg({ type: 'info', text: 'Fetching events from your primary Google Calendar...' });
      const { events: realEvents } = await fetchRealGoogleCalendarEvents(token);

      // Convert real events into tasks
      const gcalTasks = realEvents.map(convertGCalEventToTask);
      const existingIds = new Set(tasks.map(t => t.googleCalendarEventId).filter(Boolean));
      const toAdd = gcalTasks.filter(t => t.googleCalendarEventId && !existingIds.has(t.googleCalendarEventId));

      if (toAdd.length > 0) {
        onImportData([...toAdd, ...tasks], sleepRecords, { ...settings, googleCalendarConnected: true });
        setSyncStatusMsg({
          type: 'success',
          text: `Synced successfully! Retrieved ${realEvents.length} events from your Google Calendar (${toAdd.length} new tasks added).`
        });
      } else {
        onUpdateSettings({ ...settings, googleCalendarConnected: true });
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

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      minObservationsForRealityCheck: minObs,
      smallSuggestionThresholdPercent: smallThresh,
      realityCheckThresholdPercent: realityThresh,
      autoImportGCal: autoSync
    });
    setDataStatusMsg({ type: 'success', text: 'Calibration parameters saved.' });
  };

  const handleExportJson = () => {
      const exportObject = {
        version: '2.0',
        schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      settings,
      tasks,
      sleepRecords
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `personal_calibration_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json.tasks) && Array.isArray(json.sleepRecords)) {
          onImportData(json.tasks, json.sleepRecords, json.settings);
           setDataStatusMsg({ type: 'success', text: 'Backup imported successfully.' });
        } else {
           setDataStatusMsg({ type: 'error', text: 'This file is not a valid calibration backup.' });
        }
      } catch (err) {
         setDataStatusMsg({ type: 'error', text: 'The backup file could not be read.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16 text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage Calendar connection, calibration behavior, backups, and developer tools.
        </p>
      </div>

      {/* 1. Calendar connection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Calendar connection</h2>
              <p className="text-xs text-slate-500">Primary source for planned calendar activities</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              settings.googleCalendarConnected && getStoredAccessToken()
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {settings.googleCalendarConnected && getStoredAccessToken() ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {currentUser && (
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-blue-900">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Account:</span>
              <span className="font-bold">{currentUser.email || currentUser.displayName || 'Google Account'}</span>
            </div>
            <button
              onClick={handleDisconnectGoogle}
              className="text-slate-500 hover:text-red-600 flex items-center space-x-1 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        )}

        {syncStatusMsg && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : syncStatusMsg.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {syncStatusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            ) : syncStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-blue-600" />
            )}
            <p className="leading-relaxed font-medium">{syncStatusMsg.text}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-600 max-w-md leading-relaxed">
            Personal Calibration connects directly to your Google Calendar to record predictions from actual events. Your original prediction timestamps are preserved even if events are rescheduled later.
          </p>

          <button
            onClick={handleSyncRealGoogleCalendar}
            disabled={isSyncing}
              aria-busy={isSyncing}
              className="flex shrink-0 items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing Calendar...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>{getStoredAccessToken() ? 'Sync Google Calendar Now' : 'Sign In & Sync Google Account'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Calibration behavior */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4361ee]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Calibration behavior</h2>
            <p className="text-xs text-slate-500">Control when reality check warnings and suggestions trigger</p>
          </div>
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Minimum Observations
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={minObs}
                onChange={e => setMinObs(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-[#4361ee] font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Completed tasks needed before warning</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Small Suggestion Threshold
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={smallThresh}
                  onChange={e => setSmallThresh(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-[#4361ee] font-semibold"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Historical error % for small tip</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#b45309] mb-1.5">
                Reality Check Threshold
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="15"
                  max="100"
                  value={realityThresh}
                  onChange={e => setRealityThresh(parseInt(e.target.value) || 15)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-[#b45309] text-sm focus:outline-none focus:border-[#4361ee] font-semibold"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Historical error % for Reality Check card</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4361ee] hover:bg-[#3852d0] text-white shadow-xs transition-colors"
            >
               Save parameters
            </button>
          </div>
        </form>
      </div>

      {/* 3. Developer tools */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
               <h2 className="font-bold text-base text-slate-900">Developer tools</h2>
              <p className="text-xs text-slate-500">Run automated verification suite for zero durations, midnight boundaries, and edge cases</p>
            </div>
          </div>

          <button
            onClick={onRunValidationSuite}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Run Test Suite</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Verifies division by zero protection, overnight task durations, sleep context correlation logic, and data schema consistency.
        </p>
      </div>

      {/* 4. Data Seeding & Test Presets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4361ee]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Testing &amp; Data Seeding Presets</h2>
              <p className="text-xs text-slate-500">Seed or generate calibrated test data to verify insights, reality checks, and history</p>
            </div>
          </div>

        </div>

        {dataStatusMsg && <p role="status" aria-live="polite" className={`rounded-lg border px-3 py-2 text-sm ${dataStatusMsg.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{dataStatusMsg.text}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onSeedSampleData('generated')}
            className="flex flex-col items-start p-3.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 text-left transition-all group"
          >
            <div className="flex items-center space-x-1.5 text-[#4361ee] font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Generate Data</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dynamically generates ~16 fresh calibrated tasks &amp; 8 sleep logs across past 7 days.
            </p>
          </button>

          <button
            onClick={() => onSeedSampleData('standard')}
            className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-left transition-all group"
          >
            <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs mb-1">
              <RotateCcw className="w-4 h-4 text-[#4361ee] group-hover:rotate-[-45deg] transition-transform" />
              <span>Standard Seed</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              10 tasks showing ~43% programming underestimate &amp; ~27m evening start delay.
            </p>
          </button>

          <button
            onClick={() => onSeedSampleData('rich')}
            className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 text-left transition-all group"
          >
            <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-xs mb-1">
              <Database className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Rich Multi-Category</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              16 items across all 6 categories (Programming, Writing, Reading, Personal, Studying).
            </p>
          </button>

          <button
            onClick={() => onSeedSampleData('edge')}
            className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 text-left transition-all group"
          >
            <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Edge &amp; Boundary</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Midnight boundary tasks, 0% exact duration error, and 3x postponed items.
            </p>
          </button>

          <button
            onClick={() => onSeedSampleData('empty')}
            className="flex flex-col items-start p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50/50 border border-slate-200 hover:border-rose-200 text-left transition-all group"
          >
            <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-xs mb-1">
              <Trash2 className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              <span>Empty Canvas</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Reset to 0 records to verify "Not enough data yet" initial state guidance.
            </p>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Active Dataset Status: <strong className="text-slate-800">{tasks.length} tasks</strong>, <strong className="text-slate-800">{sleepRecords.length} sleep logs</strong> stored.
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => window.confirm('Clear all tasks, sleep records, and settings? This cannot be undone.') && onClearAllData()}
              aria-label="Clear all calibration data"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
