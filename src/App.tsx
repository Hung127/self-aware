import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { HowItWorksModal } from './components/HowItWorksModal';
import { Toast } from './components/ui/Toast';
import type { ToastData, ToastVariant } from './components/ui/Toast';
import { AnimatePresence } from 'motion/react';

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

  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);

  const clearToastTimer = () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  };

  const dismissToast = useCallback((id: number) => {
    setToast(prev => (prev && prev.id === id ? null : prev));
    clearToastTimer();
  }, []);

  const showToast = useCallback((
    msg: string,
    variant: ToastVariant = 'success',
    options?: { actionLabel?: string; onAction?: () => void }
  ) => {
    const id = ++toastId.current;
    clearToastTimer();
    setToast({ id, message: msg, variant, actionLabel: options?.actionLabel, onAction: options?.onAction });
    toastTimer.current = setTimeout(() => {
      setToast(prev => (prev && prev.id === id ? null : prev));
    }, 4000);
  }, []);

  const handleToastAction = useCallback((t: ToastData) => {
    t.onAction?.();
    dismissToast(t.id);
  }, [dismissToast]);

  // Load initial data on mount
  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedSleep = loadSleepRecords();
    const loadedSet = loadSettings();

    setTasks(loadedTasks);
    setSleepRecords(loadedSleep);
    setSettings(loadedSet);

    // First run detection: open guide if user hasn't seen it yet
    const hasSeenGuide = localStorage.getItem('personal_calibration_onboarded_v1');
    if (!hasSeenGuide && loadedTasks.length === 0) {
      setIsHowItWorksOpen(true);
      localStorage.setItem('personal_calibration_onboarded_v1', 'true');
    }
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

  const handleDeleteTask = (taskId: string, options?: { permanent?: boolean }) => {
    const removed = tasks.find(t => t.id === taskId);
    handleSetTasks(tasks.filter(t => t.id !== taskId));

    if (options?.permanent) {
      showToast('Prediction record removed from history.', 'info');
      return;
    }

    // Low-risk removal from predictions: offer undo (GS-4)
    showToast('Task removed from predictions.', 'warning', {
      actionLabel: 'Undo',
      onAction: () => {
        if (removed) {
          handleSetTasks([removed, ...tasks.filter(t => t.id !== removed.id)]);
          showToast('Task restored to predictions.', 'success');
        }
      }
    });
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
  const handleConnectGoogleCalendar = async (): Promise<{ success: boolean; count: number; errorMessage?: string }> => {
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
      return { success: false, count: 0, errorMessage: msg };
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
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        gcalConnected={settings.googleCalendarConnected}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            onTriggerReflection={handleTriggerReflection}
            onOpenCalendarTab={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'calendar' && (
          <GoogleCalendarView
            tasks={tasks}
            onRecordGCalPrediction={handleRecordGCalPrediction}
            gcalConnected={settings.googleCalendarConnected}
            onConnectGCal={handleConnectGoogleCalendar}
            calendarId={settings.gcalCalendarId}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'calibration' && (
          <CalibrationView
            tasks={tasks}
            sleepRecords={sleepRecords}
            settings={settings}
            onUpdateSettings={handleSetSettings}
            onOpenNewTask={() => {
              setEditingTask(null);
              setTaskFormDefaults(undefined);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            tasks={tasks}
            onDeleteTask={handleDeleteTask}
            onCorrectTask={handleCorrectTask}
            onOpenNewTask={() => {
              setEditingTask(null);
              setTaskFormDefaults(undefined);
              setIsTaskModalOpen(true);
            }}
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
        <div className="max-w-content mx-auto px-4 text-center">
          <p>
            Personal Calibration — Don't optimize your schedule. Understand the accuracy of your own predictions. • Evidence-based self-knowledge mirror • Google Calendar integration
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

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onOpenNewPrediction={() => {
          setEditingTask(null);
          setTaskFormDefaults(undefined);
          setIsTaskModalOpen(true);
        }}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end space-y-2 px-4">
            <Toast toast={toast} onClose={dismissToast} onAction={handleToastAction} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
