import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CardSection } from '../ui/CardSection';
import { StatTile } from '../ui/StatTile';
import { Badge } from '../ui/Badge';
import { InfoTip } from '../ui/InfoTip';
import { NotEnoughData } from './NotEnoughData';
import type { RealityCheckEffectiveness } from '../../types';
import { getEvidenceLevel } from '../../utils/calibrationEngine';

interface RealityCheckCardProps {
  data: RealityCheckEffectiveness;
  sameDayCompletionRatePercent: number;
  minObservations: number;
  onOpenNewTask?: () => void;
}

export const RealityCheckCard: React.FC<RealityCheckCardProps> = ({
  data,
  sameDayCompletionRatePercent,
  minObservations,
  onOpenNewTask
}) => (
  <CardSection
    className="md:col-span-2"
    icon={<TrendingUp className="h-5 w-5" />}
    title={
      <span className="inline-flex items-center gap-1.5">
        Reality Check Effectiveness
        <InfoTip
          text="The Reality Check compares your new forecast against your personal history and suggests a more realistic duration when a similar task has deviated before."
          label="What is the Reality Check?"
        />
      </span>
    }
    subtitle="Did the final planning estimate get closer to actual execution?"
    right={
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
        <Badge tone="neutral">
          {data.eligibleTaskCount} evaluated · {getEvidenceLevel(data.eligibleTaskCount).replace(/_/g, ' ')}
        </Badge>
        <InfoTip
          text="Evidence level reflects how many completed observations support a claim — the more observations, the stronger the evidence."
          label="What does evidence level mean?"
        />
      </span>
    }
    footer="Positive improvement means the final planning estimate was closer to actual duration. This is separate from general calibration accuracy."
  >
    {data.hasEnoughData ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <StatTile label="Same-day completion" value={`${sameDayCompletionRatePercent}%`} subLabel="finished on planned day" />
        <StatTile label="Original error" value={`${data.meanOriginalAbsoluteErrorPercent}%`} />
        <StatTile label="Final-plan error" value={`${data.meanFinalPlanAbsoluteErrorPercent}%`} />
        <StatTile
          label="Mean improvement"
          value={`${data.meanImprovementPercent > 0 ? '+' : ''}${data.meanImprovementPercent}%`}
          valueClassName={data.meanImprovementPercent >= 0 ? 'text-success-ink' : 'text-danger-ink'}
        />
        <StatTile
          label="Outcomes"
          value={`${data.improvedTaskCount} improved / ${data.worsenedTaskCount} worsened`}
          valueClassName="text-base text-text-primary"
        />
      </div>
    ) : (
      <NotEnoughData
        message="Record completed tasks where the Reality Check was shown to measure whether it improves forecast accuracy."
        threshold={`At least ${minObservations} completed tasks with Reality Check shown`}
        actionLabel="Record a prediction"
        onAction={onOpenNewTask}
      />
    )}
  </CardSection>
);
