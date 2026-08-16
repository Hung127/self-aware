import React from 'react';
import { Clock } from 'lucide-react';
import { CardSection } from '../ui/CardSection';
import { PatternBox } from './PatternBox';
import { MiniStatRow } from './MiniStatRow';
import { NotEnoughData } from './NotEnoughData';
import type { StartTimeCalibration } from '../../types';

interface StartTimeCardProps {
  data: StartTimeCalibration;
}

export const StartTimeCard: React.FC<StartTimeCardProps> = ({ data }) => (
  <CardSection
    icon={<Clock className="h-5 w-5" />}
    title="Start Time Delay"
    right={<MiniStatRow label="" value={`${data.totalSessionsCount} sessions`} />}
    footer='Insight: "You start evening tasks later than planned on average."'
  >
    <PatternBox eyebrow="Starting Delay Pattern">
      {data.hasEnoughData ? (
        <>
          <p className="text-base font-bold text-text-primary">
            Usually start <span className="font-extrabold text-primary-ink">{Math.abs(data.medianDelayMinutes)} minutes</span> {data.medianDelayMinutes >= 0 ? 'later' : 'earlier'} than planned.
          </p>
          <span className="block text-xs text-text-muted">
            Based on {data.totalSessionsCount} start recordings
          </span>
        </>
      ) : data.totalSessionsCount > 0 ? (
        <>
          <p className="text-base font-bold text-text-primary">
            Early start-time signal, not a recurring pattern yet.
          </p>
          <span className="block text-xs text-text-muted">
            Based on {data.totalSessionsCount} start recordings; need 5 for a recurring pattern
          </span>
        </>
      ) : (
        <NotEnoughData
          message="Record task starts to build this comparison."
          threshold="At least 5 start recordings"
        />
      )}
    </PatternBox>

    <div className="space-y-2.5 pt-1">
      <MiniStatRow
        label="On-Time Start Rate"
        subLabel="Started within 5 mins of schedule"
        value={`${data.onTimeStartRatePercent}%`}
        valueClassName="text-lg font-extrabold text-primary-ink"
      />

      <MiniStatRow
        label="Evening Session Delay"
        subLabel="Tasks planned after 18:00"
        value={`${data.eveningDelayMinutes >= 0 ? '+' : ''}${data.eveningDelayMinutes} min signed delay`}
      />
    </div>
  </CardSection>
);
