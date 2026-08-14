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

interface CalibrationViewProps {
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const EXPERIMENT_QUESTIONS = [
  'Did the historical comparison change your estimate?',
  'Did you understand why the suggestion appeared?',
  'Did you trust the evidence?',
  'Did the final estimate feel more realistic?',
  'Would you use this before planning a similar task again?'
];

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  tasks,
  sleepRecords,
  settings,
  onUpdateSettings
}) => {
  const insights = calculateOverallInsights(tasks, sleepRecords);

  const durationData = insights.duration;
  const startTimeData = insights.startTime;
  const sleepData = insights.sleepImpact;
  const confidenceBrackets = insights.confidenceBrackets;
  const realityCheckData = insights.realityCheckEffectiveness;
  const experiment = getExperimentComparison(tasks, settings.minObservationsForRealityCheck || 5);

  const [surveyAnswers, setSurveyAnswers] = useState<string[]>(() => {
    const saved = settings.experimentAnswers || [];
    return EXPERIMENT_QUESTIONS.map(q => saved.find(a => a.question === q)?.answer || '');
  });
  const [surveySaved, setSurveySaved] = useState(false);

  const handleSaveSurvey = () => {
    const answers: ExperimentAnswer[] = EXPERIMENT_QUESTIONS.map((question, i) => ({
      question,
      answer: surveyAnswers[i]?.trim() || '',
      createdAt: new Date().toISOString()
    })).filter(a => a.answer.length > 0);
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
    <div className="mx-auto max-w-6xl space-y-8 pb-16 text-slate-900">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8">
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
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
              <span><strong className="text-slate-700">Plan</strong> — what is scheduled</span>
              <span><strong className="text-slate-700">Forecast</strong> — what you believe will happen</span>
              <span><strong className="text-slate-700">Actual</strong> — what was measured</span>
              <span><strong className="text-slate-700">Calibration</strong> — how different the forecast was from actual</span>
            </div>
          </div>

           <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center min-w-[200px]">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Same-Day Completion
            </span>
               <span className="text-3xl font-bold text-blue-600">
              {insights.sameDayCompletionRatePercent}%
            </span>
            <span className="text-[11px] text-slate-400 block">
              completed on originally planned day
            </span>
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
                   <h2 className="font-bold text-lg text-slate-900">Reality Check Effectiveness</h2>
                   <p className="text-xs text-slate-500">Did the final planning estimate get closer to actual execution?</p>
                 </div>
               </div>
                <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  {realityCheckData.eligibleTaskCount} evaluated · {getEvidenceLevel(realityCheckData.eligibleTaskCount).replace(/_/g, ' ')}
                </span>
             </div>
             {realityCheckData.hasEnoughData ? (
               <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                   <span className="text-[11px] text-slate-500 block">Original error</span>
                   <strong className="text-xl text-slate-900">{realityCheckData.meanOriginalAbsoluteErrorPercent}%</strong>
                 </div>
                 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                   <span className="text-[11px] text-slate-500 block">Final-plan error</span>
                   <strong className="text-xl text-slate-900">{realityCheckData.meanFinalPlanAbsoluteErrorPercent}%</strong>
                 </div>
                 <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                   <span className="text-[11px] text-emerald-700 block">Mean improvement</span>
                   <strong className={`text-xl ${realityCheckData.meanImprovementPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                     {realityCheckData.meanImprovementPercent > 0 ? '+' : ''}{realityCheckData.meanImprovementPercent}%
                   </strong>
                 </div>
                 <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                   <span className="text-[11px] text-slate-500 block">Outcomes</span>
                   <strong className="text-sm text-slate-900">{realityCheckData.improvedTaskCount} improved / {realityCheckData.worsenedTaskCount} worsened</strong>
                 </div>
               </div>
             ) : (
               <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                 Record at least 5 completed tasks where Reality Check was shown to measure whether the intervention improves forecast accuracy.
               </div>
             )}
           </div>
            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
              Positive improvement means the final planning estimate was closer to actual duration. This is separate from general calibration accuracy.
            </div>
          </div>

          {/* EXPERIMENT: BASELINE VS INTERVENTION (Phase A vs Phase B) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">Forecast Accuracy Experiment</h2>
                  <p className="text-xs text-slate-500">Before Reality Check vs after Reality Check, using the same error definition.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Phase A · baseline (no Reality Check)</span>
                <div className="mt-1 flex items-baseline gap-3">
                  <strong className="text-xl text-slate-900">{experiment.baseline.meanAbsoluteErrorPercent}%</strong>
                  <span className="text-xs text-slate-500">median {experiment.baseline.medianAbsoluteErrorPercent}% · {experiment.baseline.count} predictions</span>
                </div>
                {!experiment.baselineSufficient && (
                  <span className="text-[11px] text-amber-700 block mt-1">Needs at least {settings.minObservationsForRealityCheck || 5} baseline predictions.</span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                <span className="text-[11px] text-violet-700 block">Phase B · intervention (Reality Check shown)</span>
                <div className="mt-1 flex items-baseline gap-3">
                  <strong className="text-xl text-violet-900">{experiment.intervention.meanAbsoluteErrorPercent}%</strong>
                  <span className="text-xs text-violet-600">median {experiment.intervention.medianAbsoluteErrorPercent}% · {experiment.intervention.count} predictions</span>
                </div>
                {!experiment.interventionSufficient && (
                  <span className="text-[11px] text-amber-700 block mt-1">Needs at least {settings.minObservationsForRealityCheck || 5} intervention predictions.</span>
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
                <span className="font-semibold text-rose-700">
                  Post-Reality-Check absolute error is not lower than baseline in this sample.
                </span>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Qualitative questions</h3>
              <p className="text-xs text-slate-500 mb-3">Optional answers help evaluate trust and understanding, separate from accuracy.</p>
              <div className="space-y-3">
                {EXPERIMENT_QUESTIONS.map((q, i) => (
                  <div key={q}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{i + 1}. {q}</label>
                    <textarea
                      value={surveyAnswers[i]}
                      onChange={e => {
                        const next = [...surveyAnswers];
                        next[i] = e.target.value;
                        setSurveyAnswers(next);
                      }}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleSaveSurvey}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
              >
                <Send className="w-3.5 h-3.5" />
                {surveySaved ? 'Saved' : 'Save answers'}
              </button>
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
              <p className="text-base font-bold text-blue-600">
                {maxPatternTasks >= 5 && maxPatternType === 'underestimate' ? (
                  <>
                    You underestimate <span className="underline">{maxPatternCat.toLowerCase()}</span> tasks by {Math.abs(maxPatternError)}% on average.
                  </>
                ) : maxPatternTasks >= 5 && maxPatternType === 'overestimate' ? (
                  <>
                    You overestimate <span className="underline">{maxPatternCat.toLowerCase()}</span> tasks by {Math.abs(maxPatternError)}% on average.
                  </>
                ) : durationData.totalTasksCount >= 5 ? (
                   <>No recurring duration pattern is supported yet.</>
                ) : (
                  <>Not enough data yet.</>
                )}
              </p>
              <span className="text-[11px] text-slate-400 block">
                {maxPatternTasks >= 5
                  ? `↑ Based on ${maxPatternTasks} completed sessions in ${maxPatternCat}`
                  : durationData.totalTasksCount >= 5
                  ? `↑ Based on ${durationData.totalTasksCount} completed sessions overall`
                  : 'Need at least 5 completed sessions in a category to identify recurring patterns'}
              </span>
              {maxPatternTasks >= 5 && (
                <span className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {getEvidenceLevel(maxPatternTasks).replace(/_/g, ' ')}
                </span>
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
                      <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
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
                  {startTimeData.hasEnoughData
                    ? `Usually start ${Math.abs(startTimeData.medianDelayMinutes)} minutes ${startTimeData.medianDelayMinutes >= 0 ? 'later' : 'earlier'} than planned.`
                    : startTimeData.totalSessionsCount > 0 ? 'Early start-time signal, not a recurring pattern yet.' : 'Not enough data for a start-time pattern yet.'}
              </p>
              <span className="text-[11px] text-slate-400 block">
                  {startTimeData.totalSessionsCount > 0 ? `Based on ${startTimeData.totalSessionsCount} start recordings${startTimeData.hasEnoughData ? '' : '; need 5 for a recurring pattern'}` : 'Record task starts to build this comparison.'}
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
                   {startTimeData.eveningDelayMinutes >= 0 ? '+' : ''}{startTimeData.eveningDelayMinutes} min signed delay
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
                   <>&lt;6h sleep sessions had {sleepData.completionDropPercent}% fewer planned tasks completed.</>
                ) : (
                  <>Not enough data yet.</>
                )}
              </p>
              <span className="text-[11px] text-slate-400 block">
                {sleepData.hasEnoughData
                  ? `↑ Based on ${sleepData.shortSleepDaysCount + sleepData.normalSleepDaysCount} observed sleep cycles`
                  : 'Log at least 7 tasks under each sleep condition to reveal correlations'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold block">Sufficient Sleep (&ge;6h)</span>
                <span className="text-xl font-extrabold text-emerald-600">
                   {sleepData.hasEnoughData ? `${sleepData.normalSleepCompletionRate}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 block">Completion Rate</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[11px] text-slate-500 font-semibold block">Short Sleep (&lt;6h)</span>
                <span className="text-xl font-extrabold text-amber-600">
                   {sleepData.hasEnoughData ? `${sleepData.shortSleepCompletionRate}%` : '—'}
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
              const ninety = confidenceBrackets.find(b => b.bracket === 95 || b.rangeLabel.includes('90'));
              const hasData = !!(ninety && ninety.sampleSufficient && ninety.predictedCount > 0);
              const rate = hasData ? ninety.actualSuccessRatePercent : 0;
              return (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    High Confidence Outcome
                  </span>
                  <p className="text-base font-bold text-blue-600">
                    {hasData ? (
                      `Your 90%+ confidence predictions succeed ${rate}% of the time.`
                    ) : (
                      'Not enough data yet.'
                    )}
                  </p>
                  <span className="text-[11px] text-slate-400 block">
                    {hasData
                      ? `↑ Based on ${ninety.predictedCount} high-certainty predictions`
                      : 'Need at least 5 predictions in the 90%+ confidence bracket to evaluate certainty'}
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

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
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
            <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
              insights.accuracyOverTime.overallTrendDirection === 'improving'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {insights.accuracyOverTime.overallTrendDirection === 'improving'
                ? 'Calibration Improving'
                : 'Calibration Stable'}
            </span>
          )}
        </div>

        {insights.accuracyOverTime.hasEnoughData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {insights.accuracyOverTime.weeklyTrends.map((trend, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {trend.periodLabel}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {trend.completedTaskCount} tasks
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {trend.averageEstimationErrorPercent}%
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Avg error ({trend.averageAbsoluteErrorMinutes}m diff)
                  </span>
                </div>
              ))}
            </div>

             <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs text-slate-700">
              <span className="font-medium">
                Initial error: <strong>{insights.accuracyOverTime.earliestErrorPercent}%</strong> → Recent error: <strong>{insights.accuracyOverTime.recentErrorPercent}%</strong>
              </span>
              <span className="text-slate-500 text-[11px]">
                 Closer to 0% means more accurate
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="text-sm font-semibold text-slate-700">Not enough data yet</p>
            <p className="text-xs text-slate-400">
              Complete at least 5 tasks across multiple sessions to reveal chronological accuracy trends.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
