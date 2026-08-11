import React, { useState } from 'react';
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
  Database
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRunValidationSuite: () => void;
  onSeedSampleData: () => void;
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

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      minObservationsForRealityCheck: minObs,
      smallSuggestionThresholdPercent: smallThresh,
      realityCheckThresholdPercent: realityThresh,
      autoImportGCal: autoSync
    });
  };

  const handleExportJson = () => {
    const exportObject = {
      version: '1.0',
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
          alert('Successfully imported calibration backup!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings &amp; Integrations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure Google Calendar sync, reality check heuristic thresholds, and data backup.
        </p>
      </div>

      {/* 1. Google Calendar Integration */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4361ee]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Google Calendar Integration</h2>
              <p className="text-xs text-slate-500">Primary source for planned calendar activities</p>
            </div>
          </div>

          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            settings.googleCalendarConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {settings.googleCalendarConnected ? 'Connected (Read-only)' : 'Disconnected'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <p className="text-xs text-slate-600 max-w-md leading-relaxed">
            Personal Calibration reads your scheduled calendar events to record original predictions. Original predictions are kept even if calendar events are shifted later.
          </p>

          <button
            onClick={onConnectGoogleCalendar}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              settings.googleCalendarConnected
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                : 'bg-[#4361ee] hover:bg-[#3852d0] text-white shadow-xs'
            }`}
          >
            {settings.googleCalendarConnected ? 'Re-Sync Google Calendar' : 'Connect Google Calendar'}
          </button>
        </div>
      </div>

      {/* 2. Calibration Heuristic Parameters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4361ee]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Calibration Heuristic Parameters</h2>
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
              Update Parameters
            </button>
          </div>
        </form>
      </div>

      {/* 3. Data Validation Suite Runner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">System Data &amp; Edge Case Validation</h2>
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

      {/* 4. Data Backup & Reset */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Data Management</h2>
            <p className="text-xs text-slate-500">Export, import, or seed sample calibration records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={onSeedSampleData}
            className="flex items-center justify-center space-x-1.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-[#4361ee]" />
            <span>Seed Sample Data</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center justify-center space-x-1.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export Backup</span>
          </button>

          <label className="flex items-center justify-center space-x-1.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={onClearAllData}
            className="flex items-center justify-center space-x-1.5 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
