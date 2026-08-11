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
  clearAllData
} from './utils/storage';
import { getMockGCalEvents, convertGCalEventToTask } from './utils/googleCalendar';
import { runSystemValidationSuite } from './utils/validationSuite';

import { Navigation } from './components/Navigation';
import { TodayView } from './components/TodayView';
import { CalibrationView } from './components/CalibrationView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

import { TaskModal } from './components/TaskModal';
import { SleepLogModal } from './components/SleepLogModal';
import { TaskReflectionModal } from './components/TaskReflectionModal';
import { ValidationReportModal } from './components/ValidationReportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'calibration' | 'history' | 'settings'>('today');

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

    const newTask: TaskItem = {
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

    handleSetTasks([newTask, ...tasks]);
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
    if (window.confirm('Delete this task prediction record?')) {
      handleSetTasks(tasks.filter(t => t.id !== taskId));
    }
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
  const handleConnectGoogleCalendar = () => {
    const events = getMockGCalEvents();
    const newGCalTasks = events.map(convertGCalEventToTask);

    // Merge non-duplicate GCal tasks
    const existingGCalIds = new Set(tasks.map(t => t.googleCalendarEventId).filter(Boolean));
    const toAdd = newGCalTasks.filter(t => !existingGCalIds.has(t.googleCalendarEventId));

    if (toAdd.length > 0) {
      handleSetTasks([...toAdd, ...tasks]);
      handleSetSettings({ ...settings, googleCalendarConnected: true });
      alert(`Google Calendar synced! Imported ${toAdd.length} new planned events.`);
    } else {
      handleSetSettings({ ...settings, googleCalendarConnected: true });
      alert('Google Calendar is up to date!');
    }
  };

  // Automated System Validation Suite Runner
  const handleRunValidationSuite = () => {
    const results = runSystemValidationSuite(tasks, sleepRecords, settings);
    setValidationResults(results);
    setIsValidationModalOpen(true);
  };

  // Reset / Seed Sample Data
  const handleSeedSampleData = () => {
    if (window.confirm('Reset all calibration data to initial realistic sample data?')) {
      const { tasks: sTasks, sleep: sSleep, settings: sSettings } = resetAllDataToSample();
      setTasks(sTasks);
      setSleepRecords(sSleep);
      setSettings(sSettings);
    }
  };

  // Clear All Data
  const handleClearAllData = () => {
    if (window.confirm('Clear ALL data? This will erase all tasks, sleep logs, and settings.')) {
      const { tasks: cTasks, sleep: cSleep, settings: cSettings } = clearAllData();
      setTasks(cTasks);
      setSleepRecords(cSleep);
      setSettings(cSettings);
    }
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

      {reflectionTask && (
        <TaskReflectionModal
          isOpen={isReflectionModalOpen}
          onClose={() => setIsReflectionModalOpen(false)}
          task={reflectionTask}
          onSaveReflection={handleSaveReflection}
        />
      )}

      <ValidationReportModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        results={validationResults}
      />
    </div>
  );
}
