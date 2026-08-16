import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatMinutesToHours } from '../../utils/calibrationEngine';

interface CorrectionComparisonBannerProps {
  forecastMinutes: number;
  correctedMinutes: number;
}

export const CorrectionComparisonBanner: React.FC<CorrectionComparisonBannerProps> = ({ forecastMinutes, correctedMinutes }) => {
  const diffPercent = forecastMinutes > 0 ? Math.round(((Math.max(0, correctedMinutes) - forecastMinutes) / forecastMinutes) * 100) : 0;

  const box =
    diffPercent === 0
      ? 'bg-surface-secondary border-border text-text-primary'
      : diffPercent > 0
      ? 'bg-warning-soft border-warning-border text-warning-ink'
      : 'bg-success-soft border-success-border text-success-ink';

  const pill =
    diffPercent === 0
      ? 'border-border text-text-muted'
      : diffPercent > 0
      ? 'border-warning-border text-warning-ink'
      : 'border-success-border text-success-ink';

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${box}`}>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-text-muted">
          Forecast: <strong className="text-primary-ink">{formatMinutesToHours(forecastMinutes)}</strong>
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-text-disabled" />
        <span className="font-semibold text-text-muted">
          Corrected: <strong className="text-text-primary">{formatMinutesToHours(Math.max(0, correctedMinutes))}</strong>
        </span>
      </div>

      <span className={`rounded-md border bg-surface px-2.5 py-1 text-xs font-bold ${pill}`}>
        {diffPercent === 0 ? 'Exact match' : diffPercent > 0 ? `+${diffPercent}% longer` : `${diffPercent}% shorter`}
      </span>
    </div>
  );
};
