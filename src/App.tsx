import React, { useState, useEffect } from 'react';
import {
  TaskItem,
  SleepRecord,
  AppSettings,
  ReflectionCategory,
  TestResult
} from './types';
import {
  loadTasks,
  saveTasks,
  loadSleepRecords,
  saveSleepRecords,
  loadSettings,
  saveSettings,
  resetAllDataToSample,
  seedPresetData,
  clearAllData
} from './utils/storage';
import { convertGCalEventToTask, GCalEvent } from './utils/googleCalendar';
import { calculateRescheduledPlan } from './utils/calibrationEngine';
import { updateTaskExecution, mergeTaskEdit, correctCompletedObservation } from './utils/taskGuard';
import {
  getStoredAccessToken,
  signInWithGoogleCalendar,
  fetchAllGoogleCalendarEvents,
  reconcileGCalEventsWithTasks
} from './utils/googleAuthService';
import { runSystemValidationSuite } from './utils/validationSuite';

import { Navigation } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { GoogleCalendarView } from './components/GoogleCalendarView';
import { CalibrationView } from './components/CalibrationView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

import { TaskModal } from './components/TaskModal';
import type { TaskFormDefaults } from './components/TaskModal';
import { SleepLogModal } from './components/SleepLogModal';
import { TaskReflectionModal } from './components/TaskReflectionModal';
import { CorrectionModal } from './components/CorrectionModal';
import { ValidationReportModal } from './components/ValidationReportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'calibration' | 'history' | 'settings'>('today');

  // Core persistent state
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  // Modal controls
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskFormDefaults, setTaskFormDefaults] = useState<TaskFormDefaults | undefined>();

  const [isSleepLogModalOpen, setIsSleepLogModalOpen] = useState(false);

  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [reflectionTask, setReflectionTask] = useState<TaskItem | null>(null);

  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionTask, setCorrectionTask] = useState<TaskItem | null>(null);

  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationResults, setValidationResults] = useState<TestResult[]>([]);

  // Toast notification banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Load initial data on mount
  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedSleep = loadSleepRecords();
    const loadedSet = loadSettings();

    setTasks(loadedTasks);
    setSleepRecords(loadedSleep);
    setSettings(loadedSet);
  }, []);

  // Save changes
  const handleSetTasks = (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const handleSetSleepRecords = (newSleep: SleepRecord[]) => {
    setSleepRecords(newSleep);
    saveSleepRecords(newSleep);
  };

  const handleSetSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Task actions
  const handleSaveTask = (savedTask: TaskItem) => {
    const exists = tasks.some(t => t.id === savedTask.id);
    if (exists) {
      handleSetTasks(tasks.map(t => t.id === savedTask.id
        ? mergeTaskEdit(t, savedTask)
        : t));
    } else {
      handleSetTasks([savedTask, ...tasks]);
    }
  };

  const handleUpdateTaskExecution = (taskId: string, updates: Partial<TaskItem['execution']>) => {
    let rejected = false;
    const next = tasks.map(t => {
      if (t.id !== taskId) return t;
      const result = updateTaskExecution(t, updates);
      if (!result.ok) {
        rejected = true;
        return t;
      }
      return result.task;
    });
    if (rejected) {
      showToast('Completed execution is immutable. Use "Correct" to fix a mistaken observation.');
    }
    handleSetTasks(next);
  };

  // Explicit correction of a completed observation (audited)
  const handleCorrectTask = (task: TaskItem) => {
    setCorrectionTask(task);
    setIsCorrectionModalOpen(true);
  };

  const handleSaveCorrection = (
    taskId: string,
    correction: { actualDurationMinutes: number; actualCompletionDate: string; reason?: string }
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    handleSetTasks(tasks.map(t => t.id === taskId ? correctCompletedObservation(t, correction) : t));
    showToast('Completed observation corrected.');
  };

  const handleRecordGCalPrediction = (event: GCalEvent) => {
    const existing = tasks.find(t => t.googleCalendarEventId === event.id);
    const plan = existing || convertGCalEventToTask(event);
    if (!existing) handleSetTasks([plan, ...tasks]);
    setEditingTask(plan);
    setTaskFormDefaults(undefined);
    setIsTaskModalOpen(true);
  };

  const handlePostponeTask = (taskId: string, toDate: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const plannedDuration = task.plannedDurationMinutes || task.estimatedDurationMinutes;
    const rescheduledPlan = calculateRescheduledPlan(task.plannedStart, plannedDuration, toDate);
    const existingEvents = task.execution.postponedEvents || [];

    handleSetTasks(tasks.map(t => t.id === taskId ? {
      ...t,
      plannedStart: rescheduledPlan.plannedStart,
      plannedEnd: rescheduledPlan.plannedEnd,
      execution: {
        ...t.execution,
        status: 'postponed',
        postponedCount: (t.execution.postponedCount || 0) + 1,
        postponedEvents: [...existingEvents, {
          postponedAt: new Date().toISOString(),
          fromDate: t.plannedStart.split('T')[0],
          toDate
        }]
      }
    } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    handleSetTasks(tasks.filter(t => t.id !== taskId));
    showToast('Task removed from predictions.');
  };

  // Reflection handler
  const handleTriggerReflection = (task: TaskItem) => {
    setReflectionTask(task);
    setIsReflectionModalOpen(true);
  };

  const handleSaveReflection = (taskId: string, reason: ReflectionCategory, notes?: string) => {
    const nowISO = new Date().toISOString();
    handleSetTasks(
      tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            execution: {
              ...t.execution,
              reflection: {
                reason,
                notes,
                createdAt: nowISO
              }
            }
          };
        }
        return t;
      })
    );
  };

  // Sleep record save
  const handleSaveSleep = (record: SleepRecord) => {
    const exists = sleepRecords.some(s => s.id === record.id || s.date === record.date);
    if (exists) {
      handleSetSleepRecords(sleepRecords.map(s => (s.id === record.id || s.date === record.date) ? record : s));
    } else {
      handleSetSleepRecords([record, ...sleepRecords]);
    }
  };

  // Google Calendar Connection / Sync
  const handleConnectGoogleCalendar = async (): Promise<{ success: boolean; count: number }> => {
    try {
      let token = getStoredAccessToken();
      if (!token) {
        const authResult = await signInWithGoogleCalendar();
        token = authResult.accessToken;
      }

      const realEvents = await fetchAllGoogleCalendarEvents(token, { calendarId: settings.gcalCalendarId });
      const reconciledTasks = reconcileGCalEventsWithTasks(tasks, realEvents);

      // Convert real events into tasks (plan candidates only)
      const newGCalTasks = realEvents.map(convertGCalEventToTask);

      // Merge non-duplicate GCal tasks
      const existingGCalIds = new Set(reconciledTasks.map(t => t.googleCalendarEventId).filter(Boolean));
      const toAdd = newGCalTasks.filter(t => t.googleCalendarEventId && !existingGCalIds.has(t.googleCalendarEventId));

      if (toAdd.length > 0) {
        handleSetTasks([...toAdd, ...reconciledTasks]);
      } else {
        handleSetTasks(reconciledTasks);
      }
      handleSetSettings({ ...settings, googleCalendarConnected: true });
      return { success: true, count: realEvents.length };
    } catch (err: any) {
      const msg = err?.message || '';
      console.warn('Google Calendar Sync Notice:', msg);

      // If user popup was closed, cancelled, or auth failed, update settings to disconnected
      handleSetSettings({ ...settings, googleCalendarConnected: false });
      return { success: false, count: 0 };
    }
  };

  // Automated System Validation Suite Runner
  const handleRunValidationSuite = () => {
    const results = runSystemValidationSuite(tasks, sleepRecords, settings);
    setValidationResults(results);
    setIsValidationModalOpen(true);
  };

  // Reset / Seed / Generate Sample Data
  const handleSeedSampleData = (preset: 'standard' | 'rich' | 'edge' | 'empty' | 'generated' = 'standard') => {
    const presetNames: Record<string, string> = {
      generated: 'Generated 16 fresh tasks & 8 sleep records',
      standard: 'Loaded Standard Realistic Dataset (10 tasks)',
      rich: 'Loaded Rich Multi-Category Benchmark (16 tasks)',
      edge: 'Loaded Edge & Boundary Suite (midnight tasks)',
      empty: 'Dataset reset to Empty Canvas (0 tasks)'
    };

    const { tasks: sTasks, sleep: sSleep, settings: sSettings } = seedPresetData(preset);
    handleSetTasks(sTasks);
    handleSetSleepRecords(sSleep);
    handleSetSettings(sSettings);
    showToast(presetNames[preset] || 'Data preset loaded');
  };

  // Clear All Data
  const handleClearAllData = () => {
    const { tasks: cTasks, sleep: cSleep, settings: cSettings } = clearAllData();
    handleSetTasks(cTasks);
    handleSetSleepRecords(cSleep);
    handleSetSettings(cSettings);
    showToast('All calibration data & storage cleared.');
  };

  // Import Backup
  const handleImportData = (impTasks: TaskItem[], impSleep: SleepRecord[], impSettings?: AppSettings) => {
    handleSetTasks(impTasks);
    handleSetSleepRecords(impSleep);
    if (impSettings) {
      handleSetSettings(impSettings);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] font-sans text-[var(--color-text-primary)]">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTask={() => {
          setEditingTask(null);
          setTaskFormDefaults(undefined);
          setIsTaskModalOpen(true);
        }}
        onOpenSleepLog={() => setIsSleepLogModalOpen(true)}
        gcalConnected={settings.googleCalendarConnected}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'today' && (
          <TodayView
            tasks={tasks}
            sleepRecords={sleepRecords}
            settings={settings}
            onUpdateTaskExecution={handleUpdateTaskExecution}
            onPostponeTask={handlePostponeTask}
            onDeleteTask={handleDeleteTask}
            onOpenNewTask={(defaults) => {
              setEditingTask(null);
              setTaskFormDefaults(defaults);
              setIsTaskModalOpen(true);
            }}
            onOpenSleepLog={() => setIsSleepLogModalOpen(true)}
            onTriggerReflection={handleTriggerReflection}
          />
        )}

        {activeTab === 'calendar' && (
          <GoogleCalendarView
            tasks={tasks}
            onRecordGCalPrediction={handleRecordGCalPrediction}
            gcalConnected={settings.googleCalendarConnected}
            onConnectGCal={handleConnectGoogleCalendar}
            calendarId={settings.gcalCalendarId}
          />
        )}

        {activeTab === 'calibration' && (
          <CalibrationView
            tasks={tasks}
            sleepRecords={sleepRecords}
            settings={settings}
            onUpdateSettings={handleSetSettings}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            tasks={tasks}
            onDeleteTask={handleDeleteTask}
            onCorrectTask={handleCorrectTask}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleSetSettings}
            onRunValidationSuite={handleRunValidationSuite}
            onSeedSampleData={handleSeedSampleData}
            onClearAllData={handleClearAllData}
            tasks={tasks}
            sleepRecords={sleepRecords}
            onImportData={handleImportData}
            onConnectGoogleCalendar={handleConnectGoogleCalendar}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="font-medium text-slate-600">
            Personal Calibration — Don't optimize your schedule. Understand the accuracy of your own predictions.
          </p>
          <p className="text-slate-400">
            Evidence-based self-knowledge mirror • Google Calendar integration
          </p>
        </div>
      </footer>

      {/* Modals */}
      {isTaskModalOpen && <TaskModal
          isOpen
          onClose={() => setIsTaskModalOpen(false)}
          onSaveTask={handleSaveTask}
          existingTask={editingTask}
          allTasks={tasks}
          settings={settings}
          initialValues={taskFormDefaults}
        />}

      {isSleepLogModalOpen && <SleepLogModal
          isOpen
          onClose={() => setIsSleepLogModalOpen(false)}
          onSaveSleep={handleSaveSleep}
        />}

      {isReflectionModalOpen && reflectionTask && (
        <TaskReflectionModal
          isOpen={isReflectionModalOpen}
          onClose={() => {
            setIsReflectionModalOpen(false);
            setReflectionTask(null);
          }}
          task={reflectionTask}
          onSaveReflection={handleSaveReflection}
        />
      )}

      {isCorrectionModalOpen && correctionTask && (
        <CorrectionModal
          isOpen
          task={correctionTask}
          onClose={() => {
            setIsCorrectionModalOpen(false);
            setCorrectionTask(null);
          }}
          onSaveCorrection={handleSaveCorrection}
        />
      )}

      {isValidationModalOpen && <ValidationReportModal
          isOpen
          onClose={() => setIsValidationModalOpen(false)}
          results={validationResults}
        />}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-2rem)] items-center space-x-3 rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
