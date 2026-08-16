import React from 'react';
import { Moon } from 'lucide-react';
import { CardSection } from '../ui/CardSection';
import { Badge } from '../ui/Badge';
import { PatternBox } from './PatternBox';
import { MiniStatRow } from './MiniStatRow';
import { NotEnoughData } from './NotEnoughData';
import type { SleepImpactCalibration } from '../../types';

interface SleepImpactCardProps {
  data: SleepImpactCalibration;
  sleepRecordsCount: number;
}

export const SleepImpactCard: React.FC<SleepImpactCardProps> = ({ data, sleepRecordsCount }) => (
  <CardSection
    icon={<Moon className="h-5 w-5" />}
    title="Sleep Context Correlation"
    right={<Badge tone="neutral">{sleepRecordsCount} days logged</Badge>}
    footer="Observational only: Shows your personal history relationship without medical claims."
  >
    <PatternBox eyebrow="Sleep Context Impact">
      {data.hasEnoughData ? (
        <>
          <p className="text-base font-bold text-text-primary">
            &lt;6h sleep sessions had <span className="font-extrabold text-warning-ink">{data.completionDropPercent}% fewer</span> planned tasks completed.
          </p>
          <span className="block text-xs text-text-muted">
            Based on {data.shortSleepDaysCount + data.normalSleepDaysCount} observed sleep cycles
          </span>
        </>
      ) : (
        <NotEnoughData
          message="Log tasks while tracking your sleep to see whether short sleep correlates with missed plans."
          threshold="At least 7 tasks under each sleep condition"
        />
      )}
    </PatternBox>

    <div className="grid grid-cols-2 gap-3 pt-1">
      <MiniStatRow
        centered
        label="Sufficient Sleep (≥6h)"
        value={data.hasEnoughData ? `${data.normalSleepCompletionRate}%` : '—'}
        valueClassName="text-success-ink"
        subLabel="Completion Rate"
      />
      <MiniStatRow
        centered
        label="Short Sleep (<6h)"
        value={data.hasEnoughData ? `${data.shortSleepCompletionRate}%` : '—'}
        valueClassName="text-warning-ink"
        subLabel="Completion Rate"
      />
    </div>
  </CardSection>
);
