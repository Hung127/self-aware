import React, { useState, useEffect } from 'react';
import {
  TaskItem,
  SleepRecord,
  AppSettings,
  TaskCategory,
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
import { convertGCalEventToTask, getMockGCalEvents } from './utils/googleCalendar';
import {
  getStoredAccessToken,
  signInWithGoogleCalendar,
  fetchRealGoogleCalendarEvents
} from './utils/googleAuthService';
import { runSystemValidationSuite } from './utils/validationSuite';

import { Navigation } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { GoogleCalendarView } from './components/GoogleCalendarView';
import { CalibrationView } from './components/CalibrationView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

import { TaskModal } from './components/TaskModal';
import { SleepLogModal } from './components/SleepLogModal';
import { TaskReflectionModal } from './components/TaskReflectionModal';
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

  const [isSleepLogModalOpen, setIsSleepLogModalOpen] = useState(false);

  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [reflectionTask, setReflectionTask] = useState<TaskItem | null>(null);

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
      handleSetTasks(tasks.map(t => t.id === savedTask.id ? savedTask : t));
    } else {
      handleSetTasks([savedTask, ...tasks]);
    }
  };

  const handleQuickAddTask = (title: string, category: TaskCategory, estMins: number) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startTimeStr = now.toTimeString().substring(0, 5);

    const startISO = new Date(`${today}T${startTimeStr}:00.000Z`).toISOString();
    const endISO = new Date(new Date(`${today}T${startTimeStr}:00.000Z`).getTime() + estMins * 60000).toISOString();

    const prefilledTask: TaskItem = {
      id: `task-quick-${Date.now()}`,
      title,
      category,
      plannedStart: startISO,
      plannedEnd: endISO,
      plannedDurationMinutes: estMins,
      estimatedDurationMinutes: estMins,
      confidence: 80,
      originalPlannedStart: startISO,
      originalEstimatedDurationMinutes: estMins,
      createdAt: now.toISOString(),
      execution: {
        status: 'not_started',
        postponedCount: 0,
        originalScheduledDate: today,
      }
    };

    setEditingTask(prefilledTask);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTaskExecution = (taskId: string, updates: Partial<TaskItem['execution']>) => {
    handleSetTasks(
      tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            execution: {
              ...t.execution,
              ...updates
            }
          };
        }
        return t;
      })
    );
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

      const realEvents = await fetchRealGoogleCalendarEvents(token);
      const newGCalTasks = realEvents.map(convertGCalEventToTask);

      // Merge non-duplicate GCal tasks
      const existingGCalIds = new Set(tasks.map(t => t.googleCalendarEventId).filter(Boolean));
      const toAdd = newGCalTasks.filter(t => t.googleCalendarEventId && !existingGCalIds.has(t.googleCalendarEventId));

      if (toAdd.length > 0) {
        handleSetTasks([...toAdd, ...tasks]);
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
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans selection:bg-[#4361ee] selection:text-white flex flex-col">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTask={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onOpenSleepLog={() => setIsSleepLogModalOpen(true)}
        gcalConnected={settings.googleCalendarConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'today' && (
          <TodayView
            tasks={tasks}
            sleepRecords={sleepRecords}
            settings={settings}
            onUpdateTaskExecution={handleUpdateTaskExecution}
            onDeleteTask={handleDeleteTask}
            onOpenNewTask={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            onOpenSleepLog={() => setIsSleepLogModalOpen(true)}
            onQuickAddTask={handleQuickAddTask}
            onTriggerReflection={handleTriggerReflection}
          />
        )}

        {activeTab === 'calendar' && (
          <GoogleCalendarView
            tasks={tasks}
            onAddGCalTask={(task) => {
              const exists = tasks.some(t => t.id === task.id || (task.googleCalendarEventId && t.googleCalendarEventId === task.googleCalendarEventId));
              if (!exists) {
                handleSetTasks([task, ...tasks]);
              }
            }}
            gcalConnected={settings.googleCalendarConnected}
            onConnectGCal={handleConnectGoogleCalendar}
          />
        )}

        {activeTab === 'calibration' && (
          <CalibrationView
            tasks={tasks}
            sleepRecords={sleepRecords}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            tasks={tasks}
            onDeleteTask={handleDeleteTask}
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
      <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs py-6 mt-12">
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
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaveTask={handleSaveTask}
        existingTask={editingTask}
        allTasks={tasks}
        settings={settings}
      />

      <SleepLogModal
        isOpen={isSleepLogModalOpen}
        onClose={() => setIsSleepLogModalOpen(false)}
        onSaveSleep={handleSaveSleep}
      />

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

      <ValidationReportModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        results={validationResults}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center space-x-3 text-sm animate-fade-in font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
