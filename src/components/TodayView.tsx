import React, { useState, useEffect } from 'react';
import { TaskItem, SleepRecord, AppSettings, SkipReason } from '../types';
import type { TaskFormDefaults } from './TaskModal';
import { getHistoricalCalibrationBaseline, getStrongestCalibrationInsight } from '../utils/calibrationEngine';
import { TodayHeader } from './today/TodayHeader';
import { SleepContextStrip } from './today/SleepContextStrip';
import { QuickForecastForm } from './today/QuickForecastForm';
import { RunningTasksSection } from './today/RunningTasksSection';
import { PlannedTasksSection } from './today/PlannedTasksSection';
import { CompletedTasksSection } from './today/CompletedTasksSection';
import { SkipReasonModal } from './SkipReasonModal';
import { PostponeModal } from './PostponeModal';
import { ConfirmDialog } from './ui/ConfirmDialog';

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

  // Strongest calibration insight for the header banner
  const strongestInsight = getStrongestCalibrationInsight(tasks, settings.minObservationsForRealityCheck || 5);

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

  const handleQuickSubmit = (defaults: TaskFormDefaults) => {
    onOpenNewTask(defaults);
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

  return (
    <div className="mx-auto max-w-content space-y-7 pb-20 text-text-primary">
      <TodayHeader
        planOnlyCount={planOnlyCount}
        insight={strongestInsight}
        onOpenCalendarTab={onOpenCalendarTab}
      />

      <SleepContextStrip todaySleep={todaySleep} onOpenSleepLog={onOpenSleepLog} />

      <QuickForecastForm tasks={tasks} settings={settings} onSubmit={handleQuickSubmit} />

      <RunningTasksSection
        tasks={runningTasks}
        elapsed={activeTimerSeconds}
        onFinish={handleFinishTask}
      />

      <PlannedTasksSection
        tasks={plannedTasks}
        settings={settings}
        onStart={handleStartTask}
        onPostpone={setPostponeTask}
        onSkip={setSkipTask}
        onDelete={handleDeleteRequest}
        onOpenNewTask={() => onOpenNewTask()}
      />

      <CompletedTasksSection tasks={completedTasks} onDelete={handleDeleteRequest} />

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
