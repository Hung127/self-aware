import React from 'react';
import { BarChart2 } from 'lucide-react';
import { CardSection } from '../ui/CardSection';
import { Badge } from '../ui/Badge';
import { InfoTip } from '../ui/InfoTip';
import { PatternBox } from './PatternBox';
import { NotEnoughData } from './NotEnoughData';
import type { DurationCalibration, TaskCategory } from '../../types';
import { CATEGORIES, getEvidenceLevel } from '../../utils/calibrationEngine';

interface DurationCalibrationCardProps {
  data: DurationCalibration;
}

export const DurationCalibrationCard: React.FC<DurationCalibrationCardProps> = ({ data }) => {
  // Find strongest recurring category pattern (requires >= 5 completed observations)
  let maxPatternCat = '';
  let maxPatternError = 0;
  let maxPatternTasks = 0;
  let maxPatternType: string = 'none';

  for (const cat of CATEGORIES) {
    const item = data.categoryBreakdown[cat];
    if (item && item.sampleSufficient && Math.abs(item.averageErrorPercent) > Math.abs(maxPatternError)) {
      maxPatternError = item.averageErrorPercent;
      maxPatternCat = cat;
      maxPatternTasks = item.taskCount;
      maxPatternType = item.averageErrorPercent > 0 ? 'underestimate' : item.averageErrorPercent < 0 ? 'overestimate' : 'none';
    }
  }

  const evidenceTip =
    'Evidence level reflects how many completed observations support a claim — the more observations, the stronger the evidence.';

  return (
    <CardSection
      icon={<BarChart2 className="h-5 w-5" />}
      title="Task Duration Calibration"
      right={
        <Badge tone="neutral">
          {data.totalTasksCount} tasks evaluated
        </Badge>
      }
      footer="Note: Calibration compares original prediction records with actual execution."
    >
      <PatternBox eyebrow="Primary Pattern">
        {data.totalTasksCount < 5 ? (
          <NotEnoughData
            message="Complete at least 5 prediction sessions to identify recurring duration patterns."
            threshold="At least 5 completed sessions in a category"
          />
        ) : (
          <>
            <p className="text-base font-bold text-text-primary">
              {maxPatternTasks >= 5 && maxPatternType === 'underestimate' ? (
                <>
                  You underestimate <span className="font-extrabold text-primary-ink underline decoration-primary-border-strong underline-offset-2">{maxPatternCat.toLowerCase()}</span> tasks by {Math.abs(maxPatternError)}% on average.
                </>
              ) : maxPatternTasks >= 5 && maxPatternType === 'overestimate' ? (
                <>
                  You overestimate <span className="font-extrabold text-primary-ink underline decoration-primary-border-strong underline-offset-2">{maxPatternCat.toLowerCase()}</span> tasks by {Math.abs(maxPatternError)}% on average.
                </>
              ) : (
                <>No recurring duration pattern is supported yet.</>
              )}
            </p>
            <span className="block text-xs text-text-muted">
              {maxPatternTasks >= 5
                ? `Based on ${maxPatternTasks} completed sessions in ${maxPatternCat}`
                : `Based on ${data.totalTasksCount} completed sessions overall`}
            </span>
            {maxPatternTasks >= 5 && (
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-secondary shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {getEvidenceLevel(maxPatternTasks).replace(/_/g, ' ')}
                <InfoTip text={evidenceTip} label="What does evidence level mean?" />
              </span>
            )}
          </>
        )}
      </PatternBox>

      <div className="space-y-2 pt-1">
        <span className="block text-xs font-bold uppercase tracking-wider text-text-muted">
          Category Breakdown
        </span>
        {CATEGORIES.map(cat => {
          const item = data.categoryBreakdown[cat];
          if (!item || item.taskCount === 0) return null;

          const isUnder = item.averageErrorPercent > 0;
          return (
            <div key={cat} className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-2.5 text-xs">
              <span className="flex items-center gap-2 font-semibold text-text-primary">
                {cat} ({item.taskCount})
                <Badge tone="neutral">
                  {getEvidenceLevel(item.taskCount).replace(/_/g, ' ')}
                </Badge>
              </span>
              <span className={`font-bold ${isUnder ? 'text-warning-ink' : 'text-success-ink'}`}>
                {isUnder ? `+${item.averageErrorPercent}% underestimate` : item.averageErrorPercent < 0 ? `${item.averageErrorPercent}% overestimate` : `${item.averageErrorPercent}% on target`} ({item.multiplier}×)
              </span>
            </div>
          );
        })}
      </div>
    </CardSection>
  );
};
