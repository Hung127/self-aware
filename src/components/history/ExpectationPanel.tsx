import React from 'react';
import type { TaskItem } from '../../types';
import { calculateEstimationError, formatMinutesToHours } from '../../utils/calibrationEngine';
import { DetailCell } from './DetailCell';

interface ExpectationPanelProps {
  task: TaskItem;
  est: number;
  act: number;
  hasActual: boolean;
}

const errorTone = (fraction: number) => (Math.round(fraction * 100) === 0 ? 'text-success-ink' : 'text-warning-ink');

export const ExpectationPanel: React.FC<ExpectationPanelProps> = ({ task, est, act, hasActual }) => (
  <div className="space-y-2.5 rounded-xl border border-border bg-surface-secondary p-4">
    <span className="block text-xs font-bold uppercase tracking-wider text-text-muted">What I Expected</span>

    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      <DetailCell label="Original Forecast" value={formatMinutesToHours(est)} />
      {task.realityCheck?.shown && task.realityCheck.suggestedDurationMinutes ? (
        <DetailCell
          label="Suggested"
          value={formatMinutesToHours(task.realityCheck.suggestedDurationMinutes)}
          valueClassName="text-primary-ink"
        />
      ) : null}
      <DetailCell label="Final Plan" value={formatMinutesToHours(task.estimatedDurationMinutes)} />
      <DetailCell label="Confidence" value={`${task.confidence}%`} valueClassName="text-primary-ink" />
    </div>

    {task.realityCheck?.shown && (
      <div className="border-t border-border pt-2">
        <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-text-muted">Decision</span>
        <span className="text-xs font-semibold text-text-primary">
          {task.realityCheck.userDecision === 'accepted_suggestion'
            ? 'Used historical suggestion'
            : task.realityCheck.userDecision === 'kept_original'
              ? 'Kept original forecast'
              : task.realityCheck.userDecision === 'custom_adjusted'
                ? 'Custom adjusted'
                : 'Prediction recorded'}
        </span>
      </div>
    )}

    {hasActual && task.estimatedDurationMinutes !== est && (
      <div className="flex items-center gap-3 pt-1 text-xs text-text-secondary">
        <span>
          Original error:{' '}
          <strong className={errorTone(calculateEstimationError(est, act))}>
            {Math.round(calculateEstimationError(est, act) * 100)}%
          </strong>
        </span>
        <span className="text-text-disabled">→</span>
        <span>
          Final error:{' '}
          <strong className={errorTone(calculateEstimationError(task.estimatedDurationMinutes, act))}>
            {Math.round(calculateEstimationError(task.estimatedDurationMinutes, act) * 100)}%
          </strong>
        </span>
      </div>
    )}
  </div>
);
