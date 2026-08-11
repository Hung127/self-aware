import React, { useState, useEffect } from 'react';
import { TaskItem, SleepRecord, AppSettings, TaskCategory } from '../types';
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
  onDeleteTask: (taskId: string) => void;
  onOpenNewTask: () => void;
  onOpenSleepLog: () => void;
  onQuickAddTask: (title: string, category: TaskCategory, estMins: number) => void;
  onTriggerReflection: (task: TaskItem) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  sleepRecords,
  settings,
  onUpdateTaskExecution,
  onDeleteTask,
  onOpenNewTask,
  onOpenSleepLog,
  onQuickAddTask,
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
  const todayTasks = tasks.filter(t => t.execution.originalScheduledDate === todayStr);

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
    onQuickAddTask(quickTitle.trim(), quickCategory, quickEstMins);
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
    onUpdateTaskExecution(task.id, {
      status: 'postponed',
      postponedCount: (task.execution.postponedCount || 0) + 1
    });
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-slate-900">
      {/* 1. Sleep Context Banner (Light Blue Widget) */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 shadow-2xs text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-xl bg-blue-100 border border-blue-200 text-blue-600 shrink-0">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base text-slate-900">Last Night Sleep Context</span>
              <span className="text-xs text-slate-500 font-medium">({todayStr})</span>
            </div>
            {todaySleep ? (
              <p className="text-xs text-slate-600 mt-1">
                Actual sleep: <strong className="text-slate-900 font-bold">{formatMinutesToHours(todaySleep.actualSleepDurationMinutes)}</strong> ({todaySleep.actualBedtime} bedtime → {todaySleep.actualWakeTime} wake).
                {todaySleep.isShortSleep && (
                  <span className="text-amber-700 font-semibold ml-1">
                    ⚠ Short sleep day (&lt;6h). Focus and historical completion rates tend to drop on short sleep days.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                No sleep recorded for last night. Logging sleep helps correlate execution gaps.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onOpenSleepLog}
          className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 shadow-2xs transition-colors"
        >
          {todaySleep ? 'Update Sleep Record' : '+ Log Last Night Sleep'}
        </button>
      </div>

      {/* 2. Quick Task Prediction Creator Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs text-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Quick Plan &amp; Calibrate
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Instant Reality Check</span>
        </div>

        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5">
            <input
              type="text"
              placeholder="Task name (e.g., Read ML paper, DSA Practice)..."
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value as TaskCategory)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-blue-600 font-semibold text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-2xs transition-colors flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
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
            <button
              type="button"
              onClick={() => setQuickEstMins(quickReality.suggestedDurationMinutes)}
              className="font-bold underline text-amber-800 hover:text-amber-950 ml-2 text-xs shrink-0"
            >
              Calibrate to {formatMinutesToHours(quickReality.suggestedDurationMinutes)}
            </button>
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
                            <span>In Progress: {formatSecondsToHMS(elapsedSecs)}</span>
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
                        <span>Planned: <strong className="text-slate-800">{formatMinutesToHours(task.estimatedDurationMinutes)}</strong></span>
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
                    <div className="flex items-center space-x-2 shrink-0">
                      {!isDone && !isRunning && (
                        <button
                          onClick={() => handleStartTask(task)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      {isRunning && (
                        <button
                          onClick={() => handleFinishTask(task)}
                          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finish Task</span>
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
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete prediction"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
