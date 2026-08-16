import React from 'react';
import { AlertCircle, CheckCircle2, PenLine, RotateCcw, SkipForward, Trash2 } from 'lucide-react';
import type { TaskItem } from '../../types';
import {
  calculateEstimationError,
  formatMinutesToHours,
  getHistoricalCalibrationBaseline,
  isDurationCalibrationEligible
} from '../../utils/calibrationEngine';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { ExpectationPanel } from './ExpectationPanel';
import { OutcomePanel } from './OutcomePanel';

interface HistoryEntryCardProps {
  task: TaskItem;
  onDeleteRequest: (task: TaskItem) => void;
  onCorrect: (task: TaskItem) => void;
}

export const HistoryEntryCard: React.FC<HistoryEntryCardProps> = ({ task, onDeleteRequest, onCorrect }) => {
  const est = getHistoricalCalibrationBaseline(task);
  const act = task.execution.actualDurationMinutes || 0;
  const hasActual = isDurationCalibrationEligible(task);
  const errorFraction = hasActual ? calculateEstimationError(est, act) : 0;
  const errorPercent = Math.round(errorFraction * 100);

  const isDone = task.execution.status === 'completed';
  const isPostponed = task.execution.status === 'postponed';
  const isSkipped = task.execution.status === 'skipped';

  const scheduledDateFormatted = new Date(task.plannedStart).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const scheduledTimeFormatted = new Date(task.plannedStart).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-col justify-between gap-2 border-b border-border pb-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="rounded-md border border-primary-border bg-primary-soft px-2.5 py-0.5 font-mono text-xs font-bold text-primary-ink">
            {scheduledDateFormatted} @ {scheduledTimeFormatted}
          </span>
          <h3 className="text-base font-bold text-text-primary">{task.title}</h3>
          <Badge tone="neutral" className="rounded-full px-2.5 py-0.5">
            {task.category}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isDone && (
            <Badge tone="success" className="rounded-full px-2.5 py-0.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed</span>
            </Badge>
          )}

          {isPostponed && (
            <Badge tone="warning" className="rounded-full px-2.5 py-0.5">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Postponed</span>
            </Badge>
          )}

          {isSkipped && (
            <Badge tone="neutral" className="rounded-full px-2.5 py-0.5">
              <SkipForward className="h-3.5 w-3.5" />
              <span>Skipped{task.execution.skipReason ? `: ${task.execution.skipReason.replace(/_/g, ' ')}` : ''}</span>
            </Badge>
          )}

          <IconButton
            label="Delete prediction from history"
            onClick={() => onDeleteRequest(task)}
            className="hover:bg-danger-soft hover:text-danger-ink"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>

          {isDone && (
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => onCorrect(task)}
              title="Correct this completed observation"
              className="h-10 px-3 text-warning-ink hover:bg-warning-soft"
            >
              <PenLine className="h-3.5 w-3.5" />
              Correct
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ExpectationPanel task={task} est={est} act={act} hasActual={hasActual} />
        <OutcomePanel task={task} act={act} hasActual={hasActual} errorPercent={errorPercent} />
      </div>

      {task.execution.reflection && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-soft p-3 text-xs text-warning-ink">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider">
              Why? {task.execution.reflection.reason.replace(/_/g, ' ')}
            </span>
            {task.execution.reflection.notes && (
              <span className="mt-0.5 block italic">"{task.execution.reflection.notes}"</span>
            )}
          </div>
        </div>
      )}

      {task.execution.correction && (
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-soft p-3 text-xs text-warning-ink">
          <PenLine className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider">Observation corrected</span>
            <span className="mt-0.5 block">
              Previous:{' '}
              {task.execution.correction.previous.actualDurationMinutes !== undefined
                ? formatMinutesToHours(task.execution.correction.previous.actualDurationMinutes)
                : 'not measured'}
              {task.execution.correction.reason ? ` · ${task.execution.correction.reason}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
