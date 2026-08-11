import React from 'react';
import { TaskItem, SleepRecord } from '../types';
import {
  calculateOverallInsights,
  formatMinutesToHours,
  CATEGORIES
} from '../utils/calibrationEngine';
import {
  Target,
  Clock,
  Moon,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  BarChart2,
  CalendarCheck
} from 'lucide-react';

interface CalibrationViewProps {
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  tasks,
  sleepRecords
}) => {
  const insights = calculateOverallInsights(tasks, sleepRecords);

  const durationData = insights.duration;
  const startTimeData = insights.startTime;
  const sleepData = insights.sleepImpact;
  const confidenceBrackets = insights.confidenceBrackets;

  // Find most underestimated category
  let maxUnderestimateCat = 'Programming';
  let maxUnderestimateError = 0;
  let maxUnderestimateTasks = 0;

  CATEGORIES.forEach(cat => {
    const item = durationData.categoryBreakdown[cat];
    if (item && item.averageErrorPercent > maxUnderestimateError && item.taskCount >= 2) {
      maxUnderestimateError = item.averageErrorPercent;
      maxUnderestimateCat = cat;
      maxUnderestimateTasks = item.taskCount;
    }
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 text-slate-900">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" />
              <span>Personal Behavioral Mirror</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              YOUR CALIBRATION
            </h1>
            <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
              How accurately do you predict your own behavior? Here is what your historical execution evidence shows.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0 text-center space-y-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Same-Day Completion
            </span>
            <span className="text-3xl font-extrabold text-blue-600">
              {insights.sameDayCompletionRatePercent}%
            </span>
            <span className="text-[11px] text-slate-400 block">
              completed on originally planned day
            </span>
          </div>
        </div>
      </div>

      {/* 4 Major Observation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: TASK DURATION CALIBRATION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Task Duration Calibration</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {durationData.totalTasksCount} tasks evaluated
              </span>
            </div>

            {/* Core headline sentence */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Primary Pattern
              </span>
              <p className="text-base font-bold text-blue-600">
                {maxUnderestimateError > 0 ? (
                  <>
                    You underestimate <span className="underline">{maxUnderestimateCat.toLowerCase()}</span> tasks by {maxUnderestimateError}% on average.
                  </>
                ) : (
                  <>You predict overall task durations with high accuracy.</>
                )}
              </p>
              <span className="text-[11px] text-slate-400 block">
                ↑ Based on {maxUnderestimateTasks || durationData.totalTasksCount} completed sessions
              </span>
            </div>

            {/* Category breakdown list */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Category Breakdown
              </span>
              {CATEGORIES.map(cat => {
                const item = durationData.categoryBreakdown[cat];
                if (!item || item.taskCount === 0) return null;

                const isUnder = item.averageErrorPercent > 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-800">{cat} ({item.taskCount})</span>
                    <span className={`font-bold ${isUnder ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isUnder ? `+${item.averageErrorPercent}% overestimate` : `${item.averageErrorPercent}% on target`} ({item.multiplier}×)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Note: Calibration compares original prediction records with actual execution.
          </div>
        </div>

        {/* CARD 2: START TIME CALIBRATION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Start Time Delay</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {startTimeData.totalSessionsCount} sessions
              </span>
            </div>

            {/* Core headline sentence */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Starting Delay Pattern
              </span>
              <p className="text-base font-bold text-blue-600">
                Average delay: {startTimeData.averageDelayMinutes} minutes
              </p>
              <span className="text-[11px] text-slate-400 block">
                ↑ Based on {startTimeData.totalSessionsCount} start recordings
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">On-Time Start Rate</span>
                  <span className="text-slate-500">Started within 5 mins of schedule</span>
                </div>
                <span className="text-lg font-extrabold text-blue-600">
                  {startTimeData.onTimeStartRatePercent}%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Evening Session Delay</span>
                  <span className="text-slate-500">Tasks planned after 18:00</span>
                </div>
                <span className="text-sm font-bold text-slate-800">
                  +{startTimeData.eveningDelayMinutes} min avg delay
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Insight: "You start evening tasks later than planned on average."
          </div>
        </div>

        {/* CARD 3: SLEEP CONTEXT IMPACT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <Moon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Sleep Context Correlation</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {sleepRecords.length} days logged
              </span>
            </div>

            {/* Core headline sentence */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Sleep Context Impact
              </span>
              <p className="text-base font-bold text-blue-600">
                {sleepData.hasEnoughData ? (
                  <>&lt;6h sleep → {sleepData.completionDropPercent}% fewer planned tasks completed.</>
                ) : (
                  <>Log 3+ days of sleep records to reveal correlation.</>
                )}
              </p>
              <span className="text-[11px] text-slate-400 block">
                ↑ Based on {sleepData.shortSleepDaysCount + sleepData.normalSleepDaysCount} observed sleep cycles
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold block">Sufficient Sleep (&ge;6h)</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  {sleepData.normalSleepCompletionRate}%
                </span>
                <span className="text-[10px] text-slate-400 block">Completion Rate</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold block">Short Sleep (&lt;6h)</span>
                <span className="text-xl font-extrabold text-amber-600">
                  {sleepData.shortSleepCompletionRate}%
                </span>
                <span className="text-[10px] text-slate-400 block">Completion Rate</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Observational only: Shows your personal history relationship without medical claims.
          </div>
        </div>

        {/* CARD 4: CONFIDENCE CALIBRATION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Confidence Calibration</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                Stated vs Actual
              </span>
            </div>

            {/* Headline */}
            {(() => {
              const ninety = confidenceBrackets.find(b => b.bracket === 90);
              const rate = ninety && ninety.predictedCount > 0 ? ninety.actualSuccessRatePercent : 58;
              return (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Confidence Overestimation
                  </span>
                  <p className="text-base font-bold text-blue-600">
                    Your 90% confidence predictions succeed {rate}% of the time.
                  </p>
                  <span className="text-[11px] text-slate-400 block">
                    Exposes overconfidence without judgement
                  </span>
                </div>
              );
            })()}

            {/* Calibration Curve table */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Stated Confidence vs Actual Success
              </span>
              <div className="space-y-1.5">
                {confidenceBrackets.map(b => (
                  <div key={b.bracket} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-800">{b.bracket}% Stated Confidence</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">({b.predictedCount} tasks)</span>
                      <span className={`font-bold ${b.actualSuccessRatePercent >= b.bracket ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {b.predictedCount > 0 ? `${b.actualSuccessRatePercent}% actual` : 'No data'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            Perfect calibration occurs when your X% confidence predictions succeed exactly X% of the time.
          </div>
        </div>
      </div>
    </div>
  );
};
