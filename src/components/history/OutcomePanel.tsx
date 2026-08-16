import React from 'react';
import type { TaskItem } from '../../types';
import { formatMinutesToHours } from '../../utils/calibrationEngine';
import { DetailCell } from './DetailCell';

interface OutcomePanelProps {
  task: TaskItem;
  act: number;
  hasActual: boolean;
  errorPercent: number;
}

export const OutcomePanel: React.FC<OutcomePanelProps> = ({ task, act, hasActual, errorPercent }) => (
  <div className="space-y-2.5 rounded-xl border border-border bg-surface-secondary p-4">
    <div className="flex items-center justify-between gap-2">
      <span className="block text-xs font-bold uppercase tracking-wider text-text-muted">What Actually Happened</span>
      {hasActual && (
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-extrabold ${
            errorPercent === 0
              ? 'border-success-border bg-success-soft text-success-ink'
              : 'border-warning-border bg-warning-soft text-warning-ink'
          }`}
        >
          {errorPercent > 0
            ? `+${errorPercent}% Underestimate`
            : errorPercent < 0
              ? `${errorPercent}% Overestimate`
              : '0% On Target'}
        </span>
      )}
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs">
      <DetailCell label="Actual Duration" value={hasActual ? formatMinutesToHours(act) : 'Not recorded'} />
      <DetailCell
        label="Actual Start"
        value={
          task.execution.actualStart
            ? new Date(task.execution.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Scheduled'
        }
      />
    </div>
  </div>
);
