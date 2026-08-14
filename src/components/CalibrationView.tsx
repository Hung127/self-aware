import React, { useState } from 'react';
import { TaskItem, SleepRecord, AppSettings, ExperimentAnswer } from '../types';
import {
  calculateOverallInsights,
  formatMinutesToHours,
  getEvidenceLevel,
  getExperimentComparison,
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
  CalendarCheck,
  FlaskConical,
  Send
} from 'lucide-react';
import { InfoTip } from './ui/InfoTip';
import { StatTile } from './ui/StatTile';
import { SegmentedControl } from './ui/SegmentedControl';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface CalibrationViewProps {
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenNewTask?: () => void;
}

const EXPERIMENT_QUESTIONS = [
  'Did the historical comparison change your estimate?',
  'Did you understand why the suggestion appeared?',
  'Did you trust the evidence?',
  'Did the final estimate feel more realistic?',
  'Would you use this before planning a similar task again?'
];

const SURVEY_OPTIONS = ['Yes', 'Partly', 'No'] as const;

const SURVEY_NOTE_SEP = ' — ';

function parseSurveyAnswer(saved: string): { value: string; note: string } {
  for (const opt of SURVEY_OPTIONS) {
    if (saved === opt) return { value: opt, note: '' };
    if (saved.startsWith(`${opt}${SURVEY_NOTE_SEP}`)) {
      return { value: opt, note: saved.slice(opt.length + SURVEY_NOTE_SEP.length) };
    }
  }
  return { value: '', note: saved };
}

const NotEnoughData: React.FC<{ message: string; threshold?: string; actionLabel?: string; onAction?: () => void }> = ({ message, threshold, actionLabel, onAction }) => (
  <div className="flex items-start justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4">
    <div className="flex items-start gap-2.5">
      <BarChart2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-sm font-semibold text-slate-700">Not enough data yet</p>
        <p className="mt-0.5 text-xs text-slate-500">{message}</p>
        {threshold && <p className="mt-1 text-xs font-semibold text-slate-600">Threshold: {threshold}</p>}
      </div>
    </div>
    {actionLabel && onAction && (
      <Button size="sm" variant="secondary" onClick={onAction} className="shrink-0">
        {actionLabel}
      </Button>
    )}
  </div>
);

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  tasks,
  sleepRecords,
  settings,
  onUpdateSettings,
  onOpenNewTask
}) => {
  const insights = calculateOverallInsights(tasks, sleepRecords);

  const durationData = insights.duration;
  const startTimeData = insights.startTime;
  const sleepData = insights.sleepImpact;
  const confidenceBrackets = insights.confidenceBrackets;
  const realityCheckData = insights.realityCheckEffectiveness;
  const experiment = getExperimentComparison(tasks, settings.minObservationsForRealityCheck || 5);

  const [surveyAnswers, setSurveyAnswers] = useState<{ value: string; note: string; touched: boolean }[]>(() => {
    const saved = settings.experimentAnswers || [];
    return EXPERIMENT_QUESTIONS.map(q => {
      const parsed = parseSurveyAnswer(saved.find(a => a.question === q)?.answer || '');
      return { value: parsed.value, note: parsed.note, touched: parsed.value !== '' };
    });
  });
  const [surveySaved, setSurveySaved] = useState(false);

  const handleSaveSurvey = () => {
    const answers: ExperimentAnswer[] = EXPERIMENT_QUESTIONS.map((question, i) => ({
      question,
      answer: surveyAnswers[i].note
        ? `${surveyAnswers[i].value}${SURVEY_NOTE_SEP}${surveyAnswers[i].note}`
        : surveyAnswers[i].value,
      createdAt: new Date().toISOString()
    })).filter((_, i) => surveyAnswers[i].touched);
    onUpdateSettings({ ...settings, experimentAnswers: answers });
    setSurveySaved(true);
    setTimeout(() => setSurveySaved(false), 2500);
  };

  // Find strongest recurring category pattern (requires >= 5 completed observations)
  let maxPatternCat = '';
  let maxPatternError = 0;
  let maxPatternTasks = 0;
  let maxPatternType: string = 'none';

  for (const cat of CATEGORIES) {
    const item = durationData.categoryBreakdown[cat];
    if (item && item.sampleSufficient && Math.abs(item.averageErrorPercent) > Math.abs(maxPatternError)) {
      maxPatternError = item.averageErrorPercent;
      maxPatternCat = cat;
      maxPatternTasks = item.taskCount;
      maxPatternType = item.averageErrorPercent > 0 ? 'underestimate' : item.averageErrorPercent < 0 ? 'overestimate' : 'none';
    }
  }

  return (
    <div className="mx-auto max-w-content space-y-8 pb-16 text-slate-900">
      {/* Top Banner */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
             <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Target className="w-3.5 h-3.5" />
              <span>Personal Behavioral Mirror</span>
            </div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900">
               Your calibration
            </h1>
             <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                How your predictions compare with your execution history.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
              <span><strong className="text-slate-700">Plan</strong> — what is scheduled</span>
              <span><strong className="text-slate-700">Forecast</strong> — what you believe will happen</span>
              <span><strong className="text-slate-700">Actual</strong> — what was measured</span>
              <span className="inline-flex items-center gap-1">
                <strong className="text-slate-700">Calibration</strong> — how different the forecast was from actual
                <InfoTip text="Calibration is the gap between your forecast and the measured result. The goal is to shrink that gap over time with personal evidence." label="What does Calibration mean?" />
              </span>
            </div>
          </div>
        </div>
      </div>

       {/* Evidence hierarchy: strongest pattern first, supporting observations below. */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* CARD: REALITY CHECK EFFECTIVENESS */}
         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-5 md:col-span-2">
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2.5">
                 <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                   <TrendingUp className="w-5 h-5" />
                 </div>
                  <div>
                    <h2 className="inline-flex items-center gap-1.5 font-bold text-lg text-slate-900">
                      Reality Check Effectiveness
                      <InfoTip text="The Reality Check compares your new forecast against your personal history and suggests a more realistic duration when a similar task has deviated before." label="What is the Reality Check?" />
                    </h2>
                    <p className="text-xs text-slate-500">Did the final planning estimate get closer to actual execution?</p>
                  </div>
                </div>
                 <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                   {realityCheckData.eligibleTaskCount} evaluated · {getEvidenceLevel(realityCheckData.eligibleTaskCount).replace(/_/g, ' ')}
                   <InfoTip text="Evidence level reflects how many completed observations support a claim — the more observations, the stronger the evidence." label="What does evidence level mean?" />
                 </span>
              </div>
              {realityCheckData.hasEnoughData ? (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <StatTile
                    label="Same-day completion"
                    value={`${insights.sameDayCompletionRatePercent}%`}
                    subLabel="finished on planned day"
                  />
                  <StatTile label="Original error" value={`${realityCheckData.meanOriginalAbsoluteErrorPercent}%`} />
                  <StatTile label="Final-plan error" value={`${realityCheckData.meanFinalPlanAbsoluteErrorPercent}%`} />
                  <StatTile
                    label="Mean improvement"
                    value={`${realityCheckData.meanImprovementPercent > 0 ? '+' : ''}${realityCheckData.meanImprovementPercent}%`}
                    valueClassName={realityCheckData.meanImprovementPercent >= 0 ? 'text-emerald-700' : 'text-red-700'}
                    className="border-emerald-100 bg-emerald-50"
                  />
                  <StatTile
                    label="Outcomes"
                    value={`${realityCheckData.improvedTaskCount} improved / ${realityCheckData.worsenedTaskCount} worsened`}
                    valueClassName="text-base text-slate-900"
                  />
                </div>
              ) : (
                <NotEnoughData
                  message="Record completed tasks where the Reality Check was shown to measure whether it improves forecast accuracy."
                  threshold={`At least ${settings.minObservationsForRealityCheck || 5} completed tasks with Reality Check shown`}
                  actionLabel="Record a prediction"
                  onAction={onOpenNewTask}
                />
              )}
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
              Positive improvement means the final planning estimate was closer to actual duration. This is separate from general calibration accuracy.
            </div>
          </div>

          {/* EXPERIMENT: BASELINE VS INTERVENTION (Phase A vs Phase B) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Forecast Accuracy Experiment</h2>
                  <p className="text-xs text-slate-500">Before Reality Check vs after Reality Check, using the same error definition.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <StatTile
                  label="Phase A · baseline (no Reality Check)"
                  value={`${experiment.baseline.meanAbsoluteErrorPercent}%`}
                  subLabel={`median ${experiment.baseline.medianAbsoluteErrorPercent}% · ${experiment.baseline.count} predictions`}
                />
                {!experiment.baselineSufficient && (
                  <p className="text-xs font-medium text-amber-700">
                    Needs at least {settings.minObservationsForRealityCheck || 5} baseline predictions.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <StatTile
                  label="Phase B · intervention (Reality Check shown)"
                  value={`${experiment.intervention.meanAbsoluteErrorPercent}%`}
                  subLabel={`median ${experiment.intervention.medianAbsoluteErrorPercent}% · ${experiment.intervention.count} predictions`}
                  valueClassName="text-blue-800"
                  className="border-blue-100 bg-blue-50"
                />
                {!experiment.interventionSufficient && (
                  <p className="text-xs font-medium text-amber-700">
                    Needs at least {settings.minObservationsForRealityCheck || 5} intervention predictions.
                  </p>
                )}
              </div>
            </div>

            <div className="text-sm">
              {experiment.improved === null ? (
                <span className="text-slate-500">
                  Collect {settings.minObservationsForRealityCheck || 5} predictions in each phase to compare forecast accuracy.
                </span>
              ) : experiment.improved ? (
                <span className="font-semibold text-emerald-700">
                  Post-Reality-Check absolute error is lower than baseline — the intervention is associated with more accurate forecasts.
                </span>
              ) : (
                <span className="font-semibold text-red-700">
                  Post-Reality-Check absolute error is not lower than baseline in this sample.
                </span>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Qualitative questions</h3>
              <p className="text-xs text-slate-500 mb-3">Optional answers help evaluate trust and understanding, separate from accuracy.</p>
              <div className="space-y-3">
                {EXPERIMENT_QUESTIONS.map((q, i) => (
                  <div key={q} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <label className="block text-sm font-semibold text-slate-800">{i + 1}. {q}</label>
                    <SegmentedControl
                      ariaLabel={`Question ${i + 1}: ${q}`}
                      value={(surveyAnswers[i].value as 'Yes' | 'Partly' | 'No') || 'Yes'}
                      onChange={val => {
                        const next = [...surveyAnswers];
                        next[i] = { ...next[i], value: val, touched: true };
                        setSurveyAnswers(next);
                      }}
                      options={SURVEY_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                    />
                    <input
                      type="text"
                      placeholder="Optional short note..."
                      value={surveyAnswers[i].note}
                      onChange={e => {
                        const next = [...surveyAnswers];
                        next[i] = { ...next[i], note: e.target.value };
                        setSurveyAnswers(next);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none placeholder-slate-400"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSaveSurvey}
                className="mt-4"
              >
                <Send className="w-3.5 h-3.5" />
                {surveySaved ? 'Saved' : 'Save answers'}
              </Button>
            </div>
          </div>

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
              {durationData.totalTasksCount < 5 ? (
                <NotEnoughData
                  message="Complete at least 5 prediction sessions to identify recurring duration patterns."
                  threshold="At least 5 completed sessions in a category"
                />
              ) : (
                <>
                  <p className="text-base font-bold text-blue-600">
                    {maxPatternTasks >= 5 && maxPatternType === 'underestimate' ? (
                      <>
                        You underestimate <span className="underline">{maxPatternCat.toLowerCase()}</span> tasks by {Math.abs(maxPatternError)}% on average.
                      </>
                    ) : maxPatternTasks >= 5 && maxPatternType === 'overestimate' ? (
                      <>
                        You overestimate <span className="underline">{maxPatternCat.toLowerCase()}</span> tasks by {Math.abs(maxPatternError)}% on average.
                      </>
                    ) : (
                      <>No recurring duration pattern is supported yet.</>
                    )}
                  </p>
                  <span className="text-xs text-slate-500 block">
                    {maxPatternTasks >= 5
                      ? `↑ Based on ${maxPatternTasks} completed sessions in ${maxPatternCat}`
                      : `↑ Based on ${durationData.totalTasksCount} completed sessions overall`}
                  </span>
                  {maxPatternTasks >= 5 && (
                    <span className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {getEvidenceLevel(maxPatternTasks).replace(/_/g, ' ')}
                      <InfoTip text="Evidence level reflects how many completed observations support a claim — the more observations, the stronger the evidence." label="What does evidence level mean?" />
                    </span>
                  )}
                </>
              )}
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
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      {cat} ({item.taskCount})
                      <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">
                        {getEvidenceLevel(item.taskCount).replace(/_/g, ' ')}
                      </span>
                    </span>
                    <span className={`font-bold ${isUnder ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {isUnder ? `+${item.averageErrorPercent}% underestimate` : item.averageErrorPercent < 0 ? `${item.averageErrorPercent}% overestimate` : `${item.averageErrorPercent}% on target`} ({item.multiplier}×)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
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
              {startTimeData.hasEnoughData ? (
                <>
                  <p className="text-base font-bold text-blue-600">
                    Usually start {Math.abs(startTimeData.medianDelayMinutes)} minutes {startTimeData.medianDelayMinutes >= 0 ? 'later' : 'earlier'} than planned.
                  </p>
                  <span className="text-xs text-slate-500 block">
                    Based on {startTimeData.totalSessionsCount} start recordings
                  </span>
                </>
              ) : startTimeData.totalSessionsCount > 0 ? (
                <>
                  <p className="text-base font-bold text-blue-600">
                    Early start-time signal, not a recurring pattern yet.
                  </p>
                  <span className="text-xs text-slate-500 block">
                    Based on {startTimeData.totalSessionsCount} start recordings; need 5 for a recurring pattern
                  </span>
                </>
              ) : (
                <NotEnoughData
                  message="Record task starts to build this comparison."
                  threshold="At least 5 start recordings"
                />
              )}
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
                   {startTimeData.eveningDelayMinutes >= 0 ? '+' : ''}{startTimeData.eveningDelayMinutes} min signed delay
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
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
              {sleepData.hasEnoughData ? (
                <>
                  <p className="text-base font-bold text-blue-600">
                    &lt;6h sleep sessions had {sleepData.completionDropPercent}% fewer planned tasks completed.
                  </p>
                  <span className="text-xs text-slate-500 block">
                    ↑ Based on {sleepData.shortSleepDaysCount + sleepData.normalSleepDaysCount} observed sleep cycles
                  </span>
                </>
              ) : (
                <NotEnoughData
                  message="Log tasks while tracking your sleep to see whether short sleep correlates with missed plans."
                  threshold="At least 7 tasks under each sleep condition"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-xs text-slate-500 font-semibold block">Sufficient Sleep (&ge;6h)</span>
                <span className="text-xl font-extrabold text-emerald-600">
                   {sleepData.hasEnoughData ? `${sleepData.normalSleepCompletionRate}%` : '—'}
                </span>
                <span className="text-xs text-slate-500 block">Completion Rate</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-xs text-slate-500 font-semibold block">Short Sleep (&lt;6h)</span>
                <span className="text-xl font-extrabold text-amber-600">
                   {sleepData.hasEnoughData ? `${sleepData.shortSleepCompletionRate}%` : '—'}
                </span>
                <span className="text-xs text-slate-500 block">Completion Rate</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
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
              const ninety = confidenceBrackets.find(b => b.bracket === 95 || b.rangeLabel.includes('90'));
              const hasData = !!(ninety && ninety.sampleSufficient && ninety.predictedCount > 0);
              const rate = hasData ? ninety.actualSuccessRatePercent : 0;
              return (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    High Confidence Outcome
                  </span>
                  {hasData ? (
                    <p className="text-base font-bold text-blue-600">
                      Your 90%+ confidence predictions succeed {rate}% of the time.
                    </p>
                  ) : null}
                  <span className="text-xs text-slate-500 block">
                    {hasData
                      ? `↑ Based on ${ninety.predictedCount} high-certainty predictions`
                      : 'Need at least 5 predictions in the 90%+ confidence bracket to evaluate certainty'}
                  </span>
                  {!hasData && (
                    <NotEnoughData
                      message="Complete more predictions and state high confidence to see whether your certainty matches reality."
                      threshold="At least 5 predictions in the 90%+ confidence bracket"
                    />
                  )}
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
                  <div key={b.rangeLabel} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-800">{b.rangeLabel} Stated Confidence</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">({b.predictedCount} {b.predictedCount === 1 ? 'task' : 'tasks'})</span>
                      <span className={`font-bold ${!b.sampleSufficient ? 'text-slate-400 font-normal' : b.actualSuccessRatePercent >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {b.sampleSufficient ? `${b.actualSuccessRatePercent}% actual` : 'Not enough data yet'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
            Perfect calibration occurs when your X% confidence predictions succeed exactly X% of the time.
          </div>
        </div>
      </div>

      {/* CARD 5: PREDICTION ACCURACY OVER TIME (Key Product Metric) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Prediction Accuracy Over Time</h2>
              <p className="text-xs text-slate-500">
                The primary measure of calibration: tracking if your estimation error decreases as you incorporate personal evidence.
              </p>
            </div>
          </div>

          {insights.accuracyOverTime.hasEnoughData && (
            <Badge tone={insights.accuracyOverTime.overallTrendDirection === 'improving' ? 'success' : 'info'} className="self-start px-3 py-1 sm:self-auto">
              {insights.accuracyOverTime.overallTrendDirection === 'improving'
                ? 'Calibration Improving'
                : 'Calibration Stable'}
            </Badge>
          )}
        </div>

        {insights.accuracyOverTime.hasEnoughData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {insights.accuracyOverTime.weeklyTrends.map((trend, idx) => (
                <StatTile
                  key={idx}
                  label={`${trend.periodLabel} · ${trend.completedTaskCount} tasks`}
                  value={`${trend.averageEstimationErrorPercent}%`}
                  subLabel={`Avg error (${trend.averageAbsoluteErrorMinutes}m diff)`}
                  valueClassName="text-blue-600"
                />
              ))}
            </div>

             <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs text-slate-700">
              <span className="font-medium">
                Initial error: <strong>{insights.accuracyOverTime.earliestErrorPercent}%</strong> → Recent error: <strong>{insights.accuracyOverTime.recentErrorPercent}%</strong>
              </span>
              <span className="text-xs text-slate-500">
                 Closer to 0% means more accurate
              </span>
            </div>
          </div>
        ) : (
          <NotEnoughData
            message="Complete more tasks across multiple sessions to reveal chronological accuracy trends."
            threshold="At least 5 completed tasks across multiple sessions"
          />
        )}
      </div>
    </div>
  );
};
