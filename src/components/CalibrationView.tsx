import React from 'react';
import { Target } from 'lucide-react';
import type { TaskItem, SleepRecord, AppSettings } from '../types';
import { calculateOverallInsights, getExperimentComparison } from '../utils/calibrationEngine';
import { InfoTip } from './ui/InfoTip';
import { RealityCheckCard } from './calibration/RealityCheckCard';
import { ExperimentCard } from './calibration/ExperimentCard';
import { DurationCalibrationCard } from './calibration/DurationCalibrationCard';
import { StartTimeCard } from './calibration/StartTimeCard';
import { SleepImpactCard } from './calibration/SleepImpactCard';
import { ConfidenceCard } from './calibration/ConfidenceCard';
import { AccuracyOverTimeCard } from './calibration/AccuracyOverTimeCard';

interface CalibrationViewProps {
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenNewTask?: () => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  tasks,
  sleepRecords,
  settings,
  onUpdateSettings,
  onOpenNewTask
}) => {
  const insights = calculateOverallInsights(tasks, sleepRecords);
  const minObservations = settings.minObservationsForRealityCheck || 5;
  const experiment = getExperimentComparison(tasks, minObservations);

  return (
    <div className="mx-auto max-w-content space-y-8 pb-16">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary-ink">
          <Target className="h-3.5 w-3.5" />
          <span>Personal Behavioral Mirror</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Your calibration</h1>
        <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
          How your predictions compare with your execution history.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-text-muted">
          <span><strong className="text-text-primary">Plan</strong> — what is scheduled</span>
          <span><strong className="text-text-primary">Forecast</strong> — what you believe will happen</span>
          <span><strong className="text-text-primary">Actual</strong> — what was measured</span>
          <span className="inline-flex items-center gap-1">
            <strong className="text-text-primary">Calibration</strong> — how different the forecast was from actual
            <InfoTip text="Calibration is the gap between your forecast and the measured result. The goal is to shrink that gap over time with personal evidence." label="What does Calibration mean?" />
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RealityCheckCard
          className="md:col-span-2"
          data={insights.realityCheckEffectiveness}
          sameDayCompletionRatePercent={insights.sameDayCompletionRatePercent}
          minObservations={minObservations}
          onOpenNewTask={onOpenNewTask}
        />
        <ExperimentCard
          experiment={experiment}
          minObservations={minObservations}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
        <DurationCalibrationCard data={insights.duration} />
        <StartTimeCard data={insights.startTime} />
        <SleepImpactCard data={insights.sleepImpact} sleepRecordsCount={sleepRecords.length} />
        <ConfidenceCard brackets={insights.confidenceBrackets} />
      </div>

      <AccuracyOverTimeCard data={insights.accuracyOverTime} />
    </div>
  );
};
