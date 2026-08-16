import React from 'react';
import { Calendar, Clock, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { TaskMetaLine } from './TaskMetaLine';
import { RealityCheckAlert } from './RealityCheckAlert';
import type { TaskItem, AppSettings } from '../../types';
import { getRealityCheck, formatMinutesToHours } from '../../utils/calibrationEngine';

interface PlannedTasksSectionProps {
  tasks: TaskItem[];
  settings: AppSettings;
  onStart: (task: TaskItem) => void;
  onPostpone: (task: TaskItem) => void;
  onSkip: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onOpenNewTask: () => void;
}

export const PlannedTasksSection: React.FC<PlannedTasksSectionProps> = ({
  tasks,
  settings,
  onStart,
  onPostpone,
  onSkip,
  onDelete,
  onOpenNewTask
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-bold text-text-primary">Planned &amp; Scheduled</h2>
        <p className="text-xs text-text-muted">Upcoming tasks ready for execution</p>
      </div>
      <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-xs font-semibold text-text-secondary">
        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
      </span>
    </div>

    {tasks.length === 0 ? (
      <div className="space-y-2.5 rounded-xl border border-border bg-surface p-8 text-center">
        <Calendar className="mx-auto h-8 w-8 text-text-disabled" />
        <h3 className="text-sm font-bold text-text-primary">No scheduled tasks waiting</h3>
        <p className="mx-auto max-w-sm text-xs text-text-muted">
          Add a new task prediction above or sync with Google Calendar to import events.
        </p>
        <Button size="sm" onClick={onOpenNewTask}>
          <Plus className="h-4 w-4" />
          <span>Create Task</span>
        </Button>
      </div>
    ) : (
      <div className="space-y-3">
        {tasks.map(task => {
          const taskReality = getRealityCheck(task.category, task.estimatedDurationMinutes, tasks, settings, task.tag, task.behavioralTaskType, task.id);
          const isPostponed = task.execution.status === 'postponed';
          const isOverdue = new Date(task.plannedStart).getTime() < Date.now();
          const startTimeFormatted = new Date(task.plannedStart).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div key={task.id} className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-border bg-surface-secondary px-2 py-0.5 font-mono text-xs font-bold text-text-secondary">
                      {startTimeFormatted}
                    </span>
                    <h3 className="text-sm font-bold text-text-primary sm:text-base">
                      {task.title}
                    </h3>
                    <Badge tone="neutral">{task.category}</Badge>

                    {task.googleCalendarEventId && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary-border bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-ink">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>GCal</span>
                      </span>
                    )}

                    {isPostponed && (
                      <Badge tone="warning">
                        <RotateCcw className="h-3 w-3" />
                        <span>Postponed ({task.execution.postponedCount}x)</span>
                      </Badge>
                    )}

                    {isOverdue && (
                      <Badge tone="warning">
                        <Clock className="h-3 w-3" />
                        <span>Past planned start</span>
                      </Badge>
                    )}
                  </div>

                  <div>
                    <TaskMetaLine
                      items={[
                        { label: 'Forecast', value: formatMinutesToHours(task.estimatedDurationMinutes) },
                        { label: 'Confidence', value: `${task.confidence}%` },
                        { label: 'Schedule block', value: formatMinutesToHours(task.plannedDurationMinutes || task.estimatedDurationMinutes) }
                      ]}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => onStart(task)}>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Start</span>
                  </Button>

                  <Button size="sm" variant="secondary" onClick={() => onPostpone(task)}>
                    <span>Postpone</span>
                  </Button>

                  <Button size="sm" variant="secondary" onClick={() => onSkip(task)}>
                    <span>Skip</span>
                  </Button>

                  <IconButton size="sm" label="Delete task" onClick={() => onDelete(task)} className="hover:bg-danger-soft hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>

              {taskReality.shouldWarn && (
                <RealityCheckAlert
                  message={taskReality.message}
                  aside={
                    <span className="text-xs font-semibold text-text-muted">
                      Forecast: {formatMinutesToHours(task.estimatedDurationMinutes)} · History: {formatMinutesToHours(taskReality.suggestedDurationMinutes)}
                    </span>
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);
