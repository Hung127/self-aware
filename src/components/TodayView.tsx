import React, { useState, useEffect } from 'react';
import { TaskItem, SleepRecord, AppSettings, TaskCategory, SkipReason } from '../types';
import type { TaskFormDefaults } from './TaskModal';
import { CATEGORIES, getRealityCheck, formatMinutesToHours, getHistoricalCalibrationBaseline, calculateEstimationError, getStrongestCalibrationInsight } from '../utils/calibrationEngine';
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
  Calendar,
  Info,
  CalendarDays
} from 'lucide-react';
import { SkipReasonModal } from './SkipReasonModal';
import { PostponeModal } from './PostponeModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { InfoTip } from './ui/InfoTip';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

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
  onOpenCalendarTab?: () => void;
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
  onTriggerReflection,
  onOpenCalendarTab
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Quick inline task form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Programming');
  const [quickEstMins, setQuickEstMins] = useState<number>(120);

  // Active running timer state (taskId -> seconds)
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<Record<string, number>>({});

  // Modal targets
  const [skipTask, setSkipTask] = useState<TaskItem | null>(null);
  const [postponeTask, setPostponeTask] = useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Filter tasks for Today
  // Today follows the current plan; calibration keeps using original dates separately.
  const todayTasks = tasks.filter(t => t.plannedStart.split('T')[0] === todayStr && t.predictionStatus !== 'not_recorded');

  // Plan-only items imported from Calendar, not yet predicted (T-7)
  const planOnlyCount = tasks.filter(t => t.predictionStatus === 'not_recorded').length;

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
    }

    onUpdateTaskExecution(task.id, {
      status: 'completed',
      actualEnd: nowISO,
      actualDurationMinutes: task.execution.actualStart ? actualMins : undefined,
      durationMeasurementStatus: task.execution.actualStart ? 'measured' : 'unknown',
      actualCompletionDate: todayStr
    });

    // If actual deviation is > 20%, trigger reflection prompt
    const est = getHistoricalCalibrationBaseline(task);
    const dev = task.execution.actualStart ? Math.abs((actualMins - est) / est) : 0;
    if (dev >= 0.20) {
      onTriggerReflection({
        ...task,
        execution: {
          ...task.execution,
          status: 'completed',
          actualEnd: nowISO,
          actualDurationMinutes: task.execution.actualStart ? actualMins : undefined,
          durationMeasurementStatus: task.execution.actualStart ? 'measured' : 'unknown',
          actualCompletionDate: todayStr
        }
      });
    }
  };

  const handlePostponeRequest = (task: TaskItem) => {
    setPostponeTask(task);
  };

  const handleSkipRequest = (task: TaskItem) => {
    setSkipTask(task);
  };

  const handleSkipConfirm = (taskId: string, reason?: SkipReason) => {
    onUpdateTaskExecution(taskId, {
      status: 'skipped',
      skipReason: reason
    });
  };

  const handleDeleteRequest = (task: TaskItem) => {
    setDeleteTarget({ id: task.id, title: task.title });
  };

  const performDelete = () => {
    if (deleteTarget) onDeleteTask(deleteTarget.id);
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
    <div className="mx-auto max-w-content space-y-8 pb-12 text-slate-900">
      <div>
        <div>
          <p className="mb-2 text-sm font-medium text-blue-700">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Today</h1>
          <p className="mt-1 text-sm text-slate-600">Your planned tasks and active predictions for today.</p>
          {planOnlyCount > 0 && (
            <button
              type="button"
              onClick={onOpenCalendarTab}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{planOnlyCount} plan-only {planOnlyCount === 1 ? 'item' : 'items'} from Calendar not yet predicted</span>
            </button>
          )}
        </div>
      </div>
      {/* 1. Strongest calibration insight */}
      {(() => {
        const insight = getStrongestCalibrationInsight(tasks, settings.minObservationsForRealityCheck || 5);
        if (!insight) return null;
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-slate-900">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Calibration insight</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <strong className="text-slate-900">{insight.sampleCount}</strong> sessions
                <span className="rounded-full bg-white border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {insight.evidenceLevel.replace(/_/g, ' ')}
                </span>
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700">{insight.message}</p>
          </div>
        );
      })()}

      {/* 2. Sleep Context Banner (Light Blue Widget) */}
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

        <Button variant="secondary" onClick={onOpenSleepLog}>
          {todaySleep ? 'Update sleep' : 'Log sleep'}
        </Button>
      </div>

      {/* 2. Quick Task Prediction Creator Bar */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-card sm:p-6">
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
            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4" />
              Review prediction
            </Button>
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

        {!quickReality.shouldWarn && (quickReality.state === 'no_data' || quickReality.state === 'insufficient_data') && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="font-medium">
              {quickReality.state === 'no_data'
                ? `No completed ${quickCategory.toLowerCase()} tasks yet. Reality checks calibrate once you finish a few sessions.`
                : quickReality.message}
            </span>
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
            <Button size="sm" onClick={onOpenNewTask}>
              <Plus className="w-4 h-4" />
              Create First Task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map(task => {
               const taskReality = getRealityCheck(task.category, task.estimatedDurationMinutes, tasks, settings, task.tag, task.behavioralTaskType, task.id);
              const isRunning = task.execution.status === 'in_progress';
              const isDone = task.execution.status === 'completed';
              const isPostponed = task.execution.status === 'postponed';
              const isSkipped = task.execution.status === 'skipped';
              const isOverdue = task.execution.status === 'not_started' && new Date(task.plannedStart).getTime() < Date.now();

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
                          <span className="inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200" title="Synced from Google Calendar">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>GCal Synced</span>
                          </span>
                        )}

                        {/* Status Badges */}
                        {isDone && (
                          <Badge tone="success" className="rounded-full px-2.5 py-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{task.execution.durationMeasurementStatus === 'unknown' ? 'Completed; duration not measured' : `Completed (${formatMinutesToHours(task.execution.actualDurationMinutes || 0)})`}</span>
                          </Badge>
                        )}

                        {isRunning && (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>In progress: {formatSecondsToHMS(elapsedSecs)}</span>
                          </span>
                        )}

                        {isPostponed && (
                          <Badge tone="warning" className="rounded-full px-2.5 py-0.5">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Postponed ({task.execution.postponedCount}x)</span>
                          </Badge>
                        )}

                        {isSkipped && (
                          <Badge tone="neutral" className="rounded-full px-2.5 py-0.5">
                            <SkipForward className="w-3.5 h-3.5" />
                            <span>Skipped</span>
                          </Badge>
                        )}

                        {taskReality.shouldWarn && !isDone && (
                          <Badge tone="warning" className="rounded-full px-2.5 py-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Reality Check</span>
                          </Badge>
                        )}
                      </div>

                      {/* Prediction metrics line */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <span>Forecast: <strong className="text-slate-800">{formatMinutesToHours(task.estimatedDurationMinutes)}</strong></span>
                          <InfoTip text="Forecast = your recorded prediction at the time you saved it" label="What does Forecast mean?" />
                        </span>
                        <span>Confidence: <strong className="text-slate-800">{task.confidence}%</strong></span>
                        {task.execution.actualStart && (
                          <span>Actual Start: <strong className="text-slate-800">{new Date(task.execution.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        )}
                        {isOverdue && (
                          <Badge tone="warning" className="rounded-full px-2.5 py-0.5">
                            <Clock className="h-3 w-3 text-amber-600" />
                            Running late
                          </Badge>
                        )}
                      </div>

                      {/* Immediate prediction-vs-actual comparison after a measured completion */}
                      {isDone && task.execution.durationMeasurementStatus === 'measured' && task.execution.actualDurationMinutes ? (
                        <div className="mt-1.5 inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs text-slate-700">
                          <span>Forecast <strong className="text-slate-900">{formatMinutesToHours(getHistoricalCalibrationBaseline(task))}</strong></span>
                          <span className="text-slate-400">·</span>
                          <span>Actual <strong className="text-slate-900">{formatMinutesToHours(task.execution.actualDurationMinutes)}</strong></span>
                          <span className="text-slate-400">·</span>
                          <span className={Math.abs(calculateEstimationError(getHistoricalCalibrationBaseline(task), task.execution.actualDurationMinutes)) > 0.3 ? 'font-bold text-amber-700' : 'font-bold text-emerald-700'}>
                            {calculateEstimationError(getHistoricalCalibrationBaseline(task), task.execution.actualDurationMinutes) > 0 ? '+' : ''}
                            {Math.round(calculateEstimationError(getHistoricalCalibrationBaseline(task), task.execution.actualDurationMinutes) * 100)}%
                          </span>
                        </div>
                      ) : null}

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
                        <Button onClick={() => handleStartTask(task)}>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start
                        </Button>
                      )}

                      {isRunning && (
                        <Button
                          onClick={() => handleFinishTask(task)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Finish
                        </Button>
                      )}

                      {!isDone && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePostponeRequest(task)}
                          title="Postpone task"
                        >
                          Postpone
                        </Button>
                      )}

                      {!isDone && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSkipRequest(task)}
                          title="Skip task"
                        >
                          Skip
                        </Button>
                      )}

                      <button
                        onClick={() => handleDeleteRequest(task)}
                        aria-label="Delete prediction"
                        title="Delete prediction"
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
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

      {skipTask && (
        <SkipReasonModal
          task={skipTask}
          onClose={() => setSkipTask(null)}
          onConfirm={handleSkipConfirm}
        />
      )}

      {postponeTask && (
        <PostponeModal
          task={postponeTask}
          onClose={() => setPostponeTask(null)}
          onConfirm={(taskId, toDate) => onPostponeTask(taskId, toDate)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove prediction?"
          message={`"${deleteTarget.title}" will be removed from predictions; completed history is retained.`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={performDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
