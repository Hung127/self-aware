import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { CardSection } from '../ui/CardSection';
import { Badge } from '../ui/Badge';
import { PatternBox } from './PatternBox';
import { NotEnoughData } from './NotEnoughData';
import type { ConfidenceCalibration } from '../../types';

interface ConfidenceCardProps {
  brackets: ConfidenceCalibration[];
}

export const ConfidenceCard: React.FC<ConfidenceCardProps> = ({ brackets }) => {
  const ninety = brackets.find(b => b.bracket === 95 || b.rangeLabel.includes('90'));
  const hasData = !!(ninety && ninety.sampleSufficient && ninety.predictedCount > 0);
  const rate = hasData ? ninety.actualSuccessRatePercent : 0;

  return (
    <CardSection
      icon={<ShieldCheck className="h-5 w-5" />}
      title="Confidence Calibration"
      right={<Badge tone="neutral">Stated vs Actual</Badge>}
      footer="Perfect calibration occurs when your X% confidence predictions succeed exactly X% of the time."
    >
      <PatternBox eyebrow="High Confidence Outcome">
        {hasData ? (
          <p className="text-base font-bold text-text-primary">
            Your 90%+ confidence predictions succeed <span className="font-extrabold text-primary-ink">{rate}%</span> of the time.
          </p>
        ) : null}
        <span className="block text-xs text-text-muted">
          {hasData
            ? `Based on ${ninety.predictedCount} high-certainty predictions`
            : 'Need at least 5 predictions in the 90%+ confidence bracket to evaluate certainty'}
        </span>
        {!hasData && (
          <NotEnoughData
            message="Complete more predictions and state high confidence to see whether your certainty matches reality."
            threshold="At least 5 predictions in the 90%+ confidence bracket"
          />
        )}
      </PatternBox>

      <div className="space-y-2 pt-1">
        <span className="block text-xs font-bold uppercase tracking-wider text-text-muted">
          Stated Confidence vs Actual Success
        </span>
        <div className="space-y-1.5">
          {brackets.map(b => (
            <div key={b.rangeLabel} className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-2.5 text-xs">
              <span className="font-semibold text-text-primary">{b.rangeLabel} Stated Confidence</span>
              <div className="flex items-center gap-2">
                <span className="text-text-disabled">({b.predictedCount} {b.predictedCount === 1 ? 'task' : 'tasks'})</span>
                <span className={`font-bold ${!b.sampleSufficient ? 'font-normal text-text-disabled' : b.actualSuccessRatePercent >= 70 ? 'text-success-ink' : 'text-warning-ink'}`}>
                  {b.sampleSufficient ? `${b.actualSuccessRatePercent}% actual` : 'Not enough data yet'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardSection>
  );
};
