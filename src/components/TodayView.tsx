import React, { useState, useEffect } from 'react';
import { TaskItem, SleepRecord, AppSettings, TaskCategory } from '../types';
import type { TaskFormDefaults } from './TaskModal';
import { CATEGORIES, getRealityCheck, formatMinutesToHours } from '../utils/calibrationEngine';
import {
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Moon,
  Plus,
  RotateCcw,
  SkipForward,
  Trash2,
  Sparkles,
  Calendar
} from 'lucide-react';

interface TodayViewProps {
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  settings: AppSettings;
  onUpdateTaskExecution: (taskId: string, updates: Partial<TaskItem['execution']>) => void;
  onPostponeTask: (taskId: string, toDate: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTask: (defaults?: TaskFormDefaults) => void;
  onOpenSleepLog: () => void;
  onTriggerReflection: (task: TaskItem) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  sleepRecords,
  settings,
  onUpdateTaskExecution,
  onPostponeTask,
  onDeleteTask,
  onOpenNewTask,
  onOpenSleepLog,
  onTriggerReflection
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Quick inline task form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Programming');
  const [quickEstMins, setQuickEstMins] = useState<number>(120);

  // Active running timer state (taskId -> seconds)
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<Record<string, number>>({});

  // Filter tasks for Today
  // Today follows the current plan; calibration keeps using original dates separately.
  const todayTasks = tasks.filter(t => t.plannedStart.split('T')[0] === todayStr);

  // Find sleep record for today
  const todaySleep = sleepRecords.find(s => s.date === todayStr);

  // Reality Check evaluation for quick add form
  const quickReality = getRealityCheck(quickCategory, quickEstMins, tasks, settings);

  // Timer interval effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimerSeconds(prev => {
        const next = { ...prev };
        todayTasks.forEach(t => {
          if (t.execution.status === 'in_progress' && t.execution.actualStart) {
            const startMs = new Date(t.execution.actualStart).getTime();
            const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
            next[t.id] = elapsed;
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [todayTasks]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onOpenNewTask({
      title: quickTitle.trim(),
      category: quickCategory,
      plannedMinutes: quickEstMins,
      estimatedMinutes: quickEstMins
    });
    setQuickTitle('');
  };

  const handleStartTask = (task: TaskItem) => {
    const nowISO = new Date().toISOString();
    onUpdateTaskExecution(task.id, {
      status: 'in_progress',
      actualStart: task.execution.actualStart || nowISO
    });
  };

  const handleFinishTask = (task: TaskItem) => {
    const nowISO = new Date().toISOString();
    let actualMins = 0;

    if (task.execution.actualStart) {
      const startMs = new Date(task.execution.actualStart).getTime();
      actualMins = Math.max(1, Math.round((Date.now() - startMs) / (1000 * 60)));
    } else {
      actualMins = task.estimatedDurationMinutes;
    }

    onUpdateTaskExecution(task.id, {
      status: 'completed',
      actualEnd: nowISO,
      actualDurationMinutes: actualMins,
      actualCompletionDate: todayStr
    });

    // If actual deviation is > 20%, trigger reflection prompt
    const est = task.estimatedDurationMinutes;
    const dev = Math.abs((actualMins - est) / est);
    if (dev >= 0.20) {
      onTriggerReflection({
        ...task,
        execution: {
          ...task.execution,
          status: 'completed',
          actualEnd: nowISO,
          actualDurationMinutes: actualMins,
          actualCompletionDate: todayStr
        }
      });
    }
  };

  const handlePostponeTask = (task: TaskItem) => {
    const nextDate = new Date(task.plannedStart);
    nextDate.setDate(nextDate.getDate() + 1);
    const toDateStr = nextDate.toISOString().split('T')[0];
    onPostponeTask(task.id, toDateStr);
  };

  const handleSkipTask = (task: TaskItem) => {
    onUpdateTaskExecution(task.id, {
      status: 'skipped'
    });
  };

  const formatSecondsToHMS = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 text-slate-900">
      <div>
        <div>
          <p className="mb-2 text-sm font-medium text-blue-700">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Today</h1>
          <p className="mt-1 text-sm text-slate-600">Your planned tasks and active predictions for today.</p>
        </div>
      </div>
      {/* 1. Sleep Context Banner (Light Blue Widget) */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 sm:flex-row sm:items-center">
        <div className="flex items-start space-x-3.5">
          <Moon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <span className="font-semibold text-slate-900">Sleep context</span>
            {todaySleep ? (
              <p className="mt-1 text-sm text-slate-600">
                {formatMinutesToHours(todaySleep.actualSleepDurationMinutes)} recorded last night. <span className="text-slate-500">Available for later comparison.</span>
                {todaySleep.isShortSleep && (
                  <span className="ml-1 font-medium text-amber-700">Short-sleep context</span>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">No sleep record for last night.</p>
            )}
          </div>
        </div>

        <button
          onClick={onOpenSleepLog}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          {todaySleep ? 'Update sleep' : 'Log sleep'}
        </button>
      </div>

      {/* 2. Quick Task Prediction Creator Bar */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <div><h2 className="font-semibold text-slate-900">Make a prediction</h2><p className="mt-0.5 text-sm text-slate-600">Start with a task name, then review your forecast and history.</p></div>
          </div>
           <span className="hidden text-xs font-medium text-slate-500 sm:inline">Plan → Prediction → Reality Check</span>
        </div>

        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5">
            <input
              type="text"
               aria-label="Task name"
               placeholder="Task name"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
               className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value as TaskCategory)}
               aria-label="Category"
               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={quickEstMins}
              onChange={e => setQuickEstMins(parseInt(e.target.value))}
               aria-label="Forecast duration"
               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:bg-white"
            >
              <option value={30}>30 mins</option>
              <option value={60}>1h 00m</option>
              <option value={90}>1h 30m</option>
              <option value={120}>2h 00m</option>
              <option value={180}>3h 00m</option>
              <option value={240}>4h 00m</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
               className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
               <span>Review prediction</span>
            </button>
          </div>
        </form>

        {/* Live Reality check hint if user typed duration */}
         {quickReality.shouldWarn && (
           <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-medium">{quickReality.message}</span>
            </div>
             <span className="ml-2 shrink-0 text-xs font-medium text-amber-800">Review in the next step</span>
          </div>
        )}
      </div>

      {/* 3. Today's Planned Activities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Active &amp; Upcoming</h2>
            <p className="text-xs text-slate-500">Focus on what requires execution now</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} scheduled
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No tasks planned for today yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add a new task prediction above or connect Google Calendar to automatically import planned events.
            </p>
            <button
              onClick={onOpenNewTask}
              className="inline-flex items-center space-x-1.5 bg-[#4361ee] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#3852d0] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map(task => {
              const taskReality = getRealityCheck(task.category, task.estimatedDurationMinutes, tasks, settings);
              const isRunning = task.execution.status === 'in_progress';
              const isDone = task.execution.status === 'completed';
              const isPostponed = task.execution.status === 'postponed';
              const isSkipped = task.execution.status === 'skipped';

              const elapsedSecs = activeTimerSeconds[task.id] || 0;

              const startTimeFormatted = new Date(task.plannedStart).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isRunning
                      ? 'bg-blue-50/40 border-blue-600 border-l-4 shadow-2xs'
                      : isDone
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                          {startTimeFormatted}
                        </span>
                        <h3 className={`font-bold text-base text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </h3>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {task.category}
                        </span>

                        {task.googleCalendarEventId && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200" title="Synced from Google Calendar">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>GCal Synced</span>
                          </span>
                        )}

                        {/* Status Badges */}
                        {isDone && (
                          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed ({formatMinutesToHours(task.execution.actualDurationMinutes || 0)})</span>
                          </span>
                        )}

                        {isRunning && (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In progress: {formatSecondsToHMS(elapsedSecs)}</span>
                          </span>
                        )}

                        {isPostponed && (
                          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Postponed ({task.execution.postponedCount}x)</span>
                          </span>
                        )}

                        {isSkipped && (
                          <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            <SkipForward className="w-3.5 h-3.5" />
                            <span>Skipped</span>
                          </span>
                        )}

                        {taskReality.shouldWarn && !isDone && (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Reality Check</span>
                          </span>
                        )}
                      </div>

                      {/* Prediction metrics line */}
                      <div className="flex items-center space-x-4 text-xs text-slate-500 pt-0.5">
               <span>Forecast: <strong className="text-slate-800">{formatMinutesToHours(task.estimatedDurationMinutes)}</strong></span>
                        <span>Confidence: <strong className="text-slate-800">{task.confidence}%</strong></span>
                        {task.execution.actualStart && (
                          <span>Actual Start: <strong className="text-slate-800">{new Date(task.execution.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        )}
                      </div>

                      {/* Reflection comment if present */}
                      {task.execution.reflection && (
                        <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <strong>Reflection:</strong> "{task.execution.reflection.notes || task.execution.reflection.reason.replace(/_/g, ' ')}"
                        </p>
                      )}
                    </div>

                    {/* Right execution controls */}
                     <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      {!isDone && !isRunning && (
                        <button
                          onClick={() => handleStartTask(task)}
                           className="flex min-h-10 items-center space-x-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      {isRunning && (
                        <button
                          onClick={() => handleFinishTask(task)}
                           className="flex min-h-10 items-center space-x-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                           <span>Finish</span>
                        </button>
                      )}

                      {!isDone && (
                        <button
                          onClick={() => handlePostponeTask(task)}
                          title="Postpone task"
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                        >
                          Postpone
                        </button>
                      )}

                      {!isDone && (
                        <button
                          onClick={() => handleSkipTask(task)}
                          title="Skip task"
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-colors"
                        >
                          Skip
                        </button>
                      )}

                      <button
                           onClick={() => window.confirm(`Delete "${task.title}" from predictions?`) && onDeleteTask(task.id)}
                           aria-label="Delete prediction"
                           className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
  );
};
