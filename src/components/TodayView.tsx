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
  CalendarDays,
  Check,
  HelpCircle
} from 'lucide-react';
import { SkipReasonModal } from './SkipReasonModal';
import { PostponeModal } from './PostponeModal';
import { FirstDayGuidance } from './FirstDayGuidance';
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
  onOpenHowItWorks?: () => void;
  onTriggerReflection: (task: TaskItem) => void;
  onOpenCalendarTab?: () => void;
}

const QUICK_PRESETS = [30, 60, 90, 120, 180, 240];

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  sleepRecords,
  settings,
  onUpdateTaskExecution,
  onPostponeTask,
  onDeleteTask,
  onOpenNewTask,
  onOpenSleepLog,
  onOpenHowItWorks,
  onTriggerReflection,
  onOpenCalendarTab
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Quick inline task form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Programming');
  const [quickEstMins, setQuickEstMins] = useState<number>(120);

  // Onboarding guidance dismissal
  const [guidanceDismissed, setGuidanceDismissed] = useState<boolean>(() => {
    return localStorage.getItem('personal_calibration_guidance_dismissed') === 'true';
  });

  const handleDismissGuidance = () => {
    setGuidanceDismissed(true);
    localStorage.setItem('personal_calibration_guidance_dismissed', 'true');
  };

  // Active running timer state (taskId -> seconds)
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<Record<string, number>>({});

  // Modal targets
  const [skipTask, setSkipTask] = useState<TaskItem | null>(null);
  const [postponeTask, setPostponeTask] = useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Filter tasks for Today
  const todayTasks = tasks.filter(t => t.plannedStart.split('T')[0] === todayStr && t.predictionStatus !== 'not_recorded');

  // Plan-only items imported from Calendar, not yet predicted (T-7)
  const planOnlyCount = tasks.filter(t => t.predictionStatus === 'not_recorded').length;

  // Find sleep record for today
  const todaySleep = sleepRecords.find(s => s.date === todayStr);

  // Reality Check evaluation for quick add form
  const quickReality = getRealityCheck(quickCategory, quickEstMins, tasks, settings);

  // Split tasks by execution state
  const runningTasks = todayTasks.filter(t => t.execution.status === 'in_progress');
  const plannedTasks = todayTasks.filter(t => t.execution.status === 'not_started' || t.execution.status === 'postponed');
  const completedTasks = todayTasks.filter(t => t.execution.status === 'completed' || t.execution.status === 'skipped');

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

    // If actual deviation is >= 20%, trigger reflection prompt
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
    <div className="mx-auto max-w-content space-y-7 pb-20 text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">Today</h1>
          <p className="mt-1 text-sm text-slate-600">Track execution and observe predictions in real time.</p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenHowItWorks && (
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
              <span>How it works</span>
            </button>
          )}

          {planOnlyCount > 0 && (
            <button
              type="button"
              onClick={onOpenCalendarTab}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              <CalendarDays className="h-4 w-4" />
              <span>{planOnlyCount} calendar {planOnlyCount === 1 ? 'event' : 'events'} need prediction</span>
            </button>
          )}
        </div>
      </div>

      {/* Onboarding / 3-Step Guidance Banner */}
      {!guidanceDismissed && (
        <FirstDayGuidance
          tasks={tasks}
          onOpenNewTask={() => onOpenNewTask()}
          onOpenHowItWorks={onOpenHowItWorks || (() => {})}
          onDismiss={handleDismissGuidance}
        />
      )}

      {/* 1. Strongest Calibration Insight Banner */}
      {(() => {
        const insight = getStrongestCalibrationInsight(tasks, settings.minObservationsForRealityCheck || 5);
        if (!insight) return null;
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-slate-900 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Recurring Pattern</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span>Based on <strong className="text-slate-900">{insight.sampleCount}</strong> recorded sessions</span>
                <span className="rounded-full bg-white border border-blue-200 px-2 py-0.5 text-2xs font-bold uppercase text-blue-700">
                  {insight.evidenceLevel.replace(/_/g, ' ')}
                </span>
              </span>
            </div>
            <p className="mt-1.5 text-sm text-slate-800 leading-relaxed font-medium">{insight.message}</p>
          </div>
        );
      })()}

      {/* 2. Sleep Context Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-card">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Moon className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold leading-none text-slate-900">Sleep context</span>
              {todaySleep?.isShortSleep && (
                <Badge tone="warning" className="text-2xs font-bold leading-none py-0.5">
                  &lt; 6h Short sleep
                </Badge>
              )}
            </div>
            {todaySleep ? (
              <p className="mt-1 text-xs text-slate-600 leading-normal">
                <strong className="text-slate-800 font-semibold">{formatMinutesToHours(todaySleep.actualSleepDurationMinutes)}</strong> recorded last night. Stored as an objective context variable.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500 leading-normal">
                No sleep recorded for last night.
              </p>
            )}
          </div>
        </div>

        <Button size="sm" variant="secondary" onClick={onOpenSleepLog} className="shrink-0">
          {todaySleep ? 'Update sleep' : 'Log sleep'}
        </Button>
      </div>

      {/* 3. Quick Task Prediction Creator */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Quick Forecast &amp; Predict</h2>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">Set expectation before starting work</span>
        </div>

        <form onSubmit={handleQuickSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-6">
              <input
                type="text"
                aria-label="Task name"
                placeholder="What are you about to work on?"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={quickCategory}
                onChange={e => setQuickCategory(e.target.value as TaskCategory)}
                aria-label="Category"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex gap-2">
              <select
                value={quickEstMins}
                onChange={e => setQuickEstMins(parseInt(e.target.value))}
                aria-label="Forecast duration"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {QUICK_PRESETS.map(mins => (
                  <option key={mins} value={mins}>
                    {formatMinutesToHours(mins)}
                  </option>
                ))}
              </select>

              <Button type="submit" className="shrink-0 h-10 min-h-10 text-sm px-4">
                <Plus className="w-4 h-4" />
                <span>Record</span>
              </Button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-slate-500 mr-1">Quick Duration:</span>
            {QUICK_PRESETS.map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setQuickEstMins(mins)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  quickEstMins === mins
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {formatMinutesToHours(mins)}
              </button>
            ))}
          </div>
        </form>

        {/* Live Reality Check hint */}
        {quickReality.shouldWarn && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold leading-relaxed">{quickReality.message}</span>
              </div>
              <span className="shrink-0 text-2xs font-bold uppercase tracking-wider text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded-md">
                Reality Check
              </span>
            </div>

            {quickReality.suggestedDurationMinutes && quickReality.suggestedDurationMinutes !== quickEstMins && (
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
                <span className="text-xs text-amber-800">Calibrated average:</span>
                <button
                  type="button"
                  onClick={() => setQuickEstMins(quickReality.suggestedDurationMinutes!)}
                  className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 transition-colors"
                >
                  Adjust to {formatMinutesToHours(quickReality.suggestedDurationMinutes)}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Active In-Progress Tasks (Featured at Top) */}
      {runningTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-700">Currently Running ({runningTasks.length})</h2>
          </div>

          <div className="space-y-3">
            {runningTasks.map(task => {
              const elapsedSecs = activeTimerSeconds[task.id] || 0;
              return (
                <div
                  key={task.id}
                  className="p-5 rounded-xl border-2 border-blue-600 bg-blue-50/30 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge tone="info" className="font-mono font-bold">
                          {new Date(task.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Badge>
                        <h3 className="font-bold text-base text-slate-900">{task.title}</h3>
                        <Badge tone="neutral">{task.category}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        <span>Forecast: <strong className="text-slate-900">{formatMinutesToHours(task.estimatedDurationMinutes)}</strong></span>
                        <span>Confidence: <strong className="text-slate-900">{task.confidence}%</strong></span>
                        <span>Started at: <strong className="text-slate-900">{task.execution.actualStart ? new Date(task.execution.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-2xs uppercase tracking-wider text-slate-500 font-semibold">Elapsed time</span>
                        <span className="font-mono text-xl font-extrabold text-blue-700">{formatSecondsToHMS(elapsedSecs)}</span>
                      </div>

                      <Button
                        onClick={() => handleFinishTask(task)}
                        variant="success"
                        className="h-10 px-4 font-semibold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finish &amp; Record</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Planned & Upcoming Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Planned &amp; Scheduled</h2>
            <p className="text-xs text-slate-500">Upcoming tasks ready for execution</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {plannedTasks.length} {plannedTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {plannedTasks.length === 0 ? (
          <div className="p-8 rounded-xl bg-white border border-slate-200 text-center space-y-2.5">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No scheduled tasks waiting</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add a new task prediction above or sync with Google Calendar to import events.
            </p>
            <Button size="sm" onClick={() => onOpenNewTask()}>
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {plannedTasks.map(task => {
              const taskReality = getRealityCheck(task.category, task.estimatedDurationMinutes, tasks, settings, task.tag, task.behavioralTaskType, task.id);
              const isPostponed = task.execution.status === 'postponed';
              const isOverdue = new Date(task.plannedStart).getTime() < Date.now();
              const startTimeFormatted = new Date(task.plannedStart).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-card space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {startTimeFormatted}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          {task.title}
                        </h3>
                        <Badge tone="neutral">{task.category}</Badge>

                        {task.googleCalendarEventId && (
                          <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>GCal</span>
                          </span>
                        )}

                        {isPostponed && (
                          <Badge tone="warning">
                            <RotateCcw className="w-3 h-3" />
                            <span>Postponed ({task.execution.postponedCount}x)</span>
                          </Badge>
                        )}

                        {isOverdue && (
                          <Badge tone="warning">
                            <Clock className="w-3 h-3" />
                            <span>Past planned start</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Forecast: <strong className="text-slate-800">{formatMinutesToHours(task.estimatedDurationMinutes)}</strong></span>
                        <span>Confidence: <strong className="text-slate-800">{task.confidence}%</strong></span>
                        <span>Schedule block: <strong className="text-slate-800">{formatMinutesToHours(task.plannedDurationMinutes || task.estimatedDurationMinutes)}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => handleStartTask(task)}>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePostponeRequest(task)}
                      >
                        <span>Postpone</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSkipRequest(task)}
                      >
                        <span>Skip</span>
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(task)}
                        aria-label="Delete task"
                        title="Delete task"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reality Check Alert on Task Item */}
                  {taskReality.shouldWarn && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Reality Check: </span>
                          <span>{taskReality.message}</span>
                        </div>
                      </div>
                      <span className="text-2xs font-semibold text-slate-600 shrink-0">
                        Forecast: {formatMinutesToHours(task.estimatedDurationMinutes)} · History: {formatMinutesToHours(taskReality.suggestedDurationMinutes)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Completed Today */}
      {completedTasks.length > 0 && (
        <div className="space-y-4 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Finished Today ({completedTasks.length})</h2>
            <span className="text-xs text-slate-500">Recorded for calibration</span>
          </div>

          <div className="space-y-3">
            {completedTasks.map(task => {
              const isSkipped = task.execution.status === 'skipped';
              const est = getHistoricalCalibrationBaseline(task);
              const actual = task.execution.actualDurationMinutes || 0;
              const error = est > 0 && actual > 0 ? calculateEstimationError(est, actual) : 0;
              const errorSign = error > 0 ? '+' : '';
              const errorFormatted = `${errorSign}${Math.round(error * 100)}%`;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-slate-800">{task.title}</h3>
                      <Badge tone="neutral">{task.category}</Badge>
                      {isSkipped ? (
                        <Badge tone="neutral">
                          <SkipForward className="w-3 h-3" />
                          <span>Skipped ({task.execution.skipReason || 'no reason'})</span>
                        </Badge>
                      ) : (
                        <Badge tone="success">
                          <Check className="w-3 h-3" />
                          <span>Completed</span>
                        </Badge>
                      )}
                    </div>

                    {!isSkipped && task.execution.durationMeasurementStatus === 'measured' && (
                      <div className="flex items-center gap-3 text-slate-600 pt-0.5 flex-wrap">
                        <span>Forecast: <strong className="text-slate-800">{formatMinutesToHours(est)}</strong></span>
                        <span>Actual: <strong className="text-slate-800">{formatMinutesToHours(actual)}</strong></span>
                        <span className={`font-bold ${Math.abs(error) > 0.3 ? (error < 0 ? 'text-emerald-700' : 'text-amber-700') : 'text-slate-700'}`}>
                          Difference: {errorFormatted}
                        </span>
                        {task.execution.reflection && (
                          <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            <span>Reflection: {task.execution.reflection.reason.replace(/_/g, ' ')}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isSkipped && (
                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => onTriggerReflection(task)}
                        className="text-xs h-7 px-2.5 text-blue-700 hover:bg-blue-50"
                      >
                        {task.execution.reflection ? 'Edit reflection' : 'Reflect'}
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(task)}
                      aria-label="Delete record"
                      title="Delete record"
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
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

