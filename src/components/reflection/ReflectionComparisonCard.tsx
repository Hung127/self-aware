import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatMinutesToHours } from '../../utils/calibrationEngine';

interface ReflectionComparisonCardProps {
  taskTitle: string;
  forecastMinutes: number;
  actualMinutes: number | undefined;
}

export const ReflectionComparisonCard: React.FC<ReflectionComparisonCardProps> = ({ taskTitle, forecastMinutes, actualMinutes }) => {
  const diffPercent = actualMinutes === undefined ? null : Math.round(((actualMinutes - forecastMinutes) / forecastMinutes) * 100);

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-4">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Task</span>
        <span className="text-sm font-bold text-text-primary">{taskTitle}</span>
      </div>
      <div className="text-right">
        <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Forecast → Actual</span>
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">{formatMinutesToHours(forecastMinutes)}</span>
          <ArrowRight className="h-3.5 w-3.5 text-text-disabled" />
          <span className="text-sm font-bold text-primary-ink">
            {actualMinutes === undefined ? 'Unmeasured' : `${formatMinutesToHours(actualMinutes)} (${diffPercent! >= 0 ? `+${diffPercent}%` : `${diffPercent}%`})`}
          </span>
        </div>
      </div>
    </div>
  );
};
