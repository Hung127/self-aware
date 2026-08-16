import React from 'react';
import { Check, SkipForward, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import type { TaskItem } from '../../types';
import { getHistoricalCalibrationBaseline, calculateEstimationError, formatMinutesToHours } from '../../utils/calibrationEngine';

interface CompletedTasksSectionProps {
  tasks: TaskItem[];
  onDelete: (task: TaskItem) => void;
}

export const CompletedTasksSection: React.FC<CompletedTasksSectionProps> = ({ tasks, onDelete }) => {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-text-primary">Finished Today ({tasks.length})</h2>
        <span className="text-xs text-text-muted">Recorded for calibration</span>
      </div>

      <div className="space-y-3">
        {tasks.map(task => {
          const isSkipped = task.execution.status === 'skipped';
          const est = getHistoricalCalibrationBaseline(task);
          const actual = task.execution.actualDurationMinutes || 0;
          const error = est > 0 && actual > 0 ? calculateEstimationError(est, actual) : 0;
          const errorSign = error > 0 ? '+' : '';
          const errorFormatted = `${errorSign}${Math.round(error * 100)}%`;

          return (
            <div
              key={task.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface-secondary/60 p-4 text-xs sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">{task.title}</h3>
                  <Badge tone="neutral">{task.category}</Badge>
                  {isSkipped ? (
                    <Badge tone="neutral">
                      <SkipForward className="h-3 w-3" />
                      <span>Skipped ({task.execution.skipReason || 'no reason'})</span>
                    </Badge>
                  ) : (
                    <Badge tone="success">
                      <Check className="h-3 w-3" />
                      <span>Completed</span>
                    </Badge>
                  )}
                </div>

                {!isSkipped && task.execution.durationMeasurementStatus === 'measured' && (
                  <div className="flex items-center gap-3 pt-0.5 text-text-muted">
                    <span>Forecast: <strong className="text-text-primary">{formatMinutesToHours(est)}</strong></span>
                    <span>Actual: <strong className="text-text-primary">{formatMinutesToHours(actual)}</strong></span>
                    <span className={`font-bold ${Math.abs(error) > 0.3 ? 'text-warning' : 'text-success'}`}>
                      Difference: {errorFormatted}
                    </span>
                  </div>
                )}
              </div>

              <IconButton size="sm" label="Delete record" onClick={() => onDelete(task)} className="hover:bg-danger-soft hover:text-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          );
        })}
      </div>
    </div>
  );
};
