import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CardSection } from '../ui/CardSection';
import { StatTile } from '../ui/StatTile';
import { Badge } from '../ui/Badge';
import { NotEnoughData } from './NotEnoughData';
import type { AccuracyOverTimeCalibration } from '../../types';

interface AccuracyOverTimeCardProps {
  data: AccuracyOverTimeCalibration;
}

export const AccuracyOverTimeCard: React.FC<AccuracyOverTimeCardProps> = ({ data }) => (
  <CardSection
    icon={<TrendingUp className="h-5 w-5" />}
    title="Prediction Accuracy Over Time"
    subtitle="The primary measure of calibration: tracking if your estimation error decreases as you incorporate personal evidence."
    right={
      data.hasEnoughData ? (
        <Badge tone={data.overallTrendDirection === 'improving' ? 'success' : 'info'}>
          {data.overallTrendDirection === 'improving' ? 'Calibration Improving' : 'Calibration Stable'}
        </Badge>
      ) : undefined
    }
  >
    {data.hasEnoughData ? (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {data.weeklyTrends.map((trend, idx) => (
            <StatTile
              key={idx}
              label={`${trend.periodLabel} · ${trend.completedTaskCount} tasks`}
              value={`${trend.averageEstimationErrorPercent}%`}
              subLabel={`Avg error (${trend.averageAbsoluteErrorMinutes}m diff)`}
              valueClassName="text-primary-ink"
            />
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-primary-border bg-primary-soft/60 px-4 py-3 text-xs text-text-primary">
          <span className="font-medium">
            Initial error: <strong>{data.earliestErrorPercent}%</strong> → Recent error: <strong>{data.recentErrorPercent}%</strong>
          </span>
          <span className="text-text-muted">Closer to 0% means more accurate</span>
        </div>
      </div>
    ) : (
      <NotEnoughData
        message="Complete more tasks across multiple sessions to reveal chronological accuracy trends."
        threshold="At least 5 completed tasks across multiple sessions"
      />
    )}
  </CardSection>
);
