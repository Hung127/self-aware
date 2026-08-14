import {
  TaskItem,
  TaskCategory,
  SleepRecord,
  AppSettings,
  ReferenceClassStatistics,
  RealityCheckSuggestion,
  DurationCalibration,
  StartTimeCalibration,
  SleepImpactCalibration,
  ConfidenceCalibration,
  CompletionCalibration,
  WeeklyAccuracyTrend,
  AccuracyOverTimeCalibration,
  OverallCalibrationInsights,
  RealityCheckEffectiveness,
  StrongestCalibrationInsight,
  ExperimentComparison,
  EvidenceLevel,
  BehavioralTaskType
} from '../types';

export const CATEGORIES: TaskCategory[] = [
  'Programming',
  'Studying',
  'Reading',
  'Writing',
  'Exercise',
  'Personal',
  'Other'
];

export const EVIDENCE_LEVELS: EvidenceLevel[] = ['no_pattern', 'early_pattern', 'established', 'strong_reference'];

/**
 * Maps observation count to evidence level for UI display.
 * - 0-4: no_pattern
 * - 5-9: early_pattern
 * - 10-19: established
 * - 20+: strong_reference
 */
export function getEvidenceLevel(observationCount: number): EvidenceLevel {
  if (observationCount >= 20) return 'strong_reference';
  if (observationCount >= 10) return 'established';
  if (observationCount >= 5) return 'early_pattern';
  return 'no_pattern';
}

/**
 * Behavioral task type labels for Programming category.
 * Used for reference-class filtering before ML classification.
 */
export const PROGRAMMING_TASK_TYPES: BehavioralTaskType[] = [
  'implementation',
  'debugging',
  'testing',
  'documentation'
];

/** Canonical accessors keep plan, forecast, and outcome semantics consistent. */
export function getOriginalPredictionMinutes(task: TaskItem): number {
  return task.originalEstimatedDurationMinutes || 0;
}

export function getFinalPredictionMinutes(task: TaskItem): number {
  return task.estimatedDurationMinutes || 0;
}

export function getHistoricalCalibrationBaseline(task: TaskItem): number {
  return getOriginalPredictionMinutes(task) || getFinalPredictionMinutes(task);
}

export function isDurationCalibrationEligible(task: TaskItem): boolean {
  return task.predictionStatus !== 'not_recorded' &&
    task.execution.status === 'completed' &&
    task.execution.durationMeasurementStatus !== 'unknown' &&
    !!task.execution.actualDurationMinutes &&
    task.execution.actualDurationMinutes > 0 &&
    getHistoricalCalibrationBaseline(task) > 0;
}

export function isCompletionCalibrationEligible(task: TaskItem): boolean {
  return task.predictionStatus !== 'not_recorded' &&
    (task.execution.status === 'completed' || task.execution.status === 'postponed' || task.execution.status === 'skipped');
}

/**
 * Calculates arithmetic mean of a number array.
 */
export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculates statistical median of a number array.
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculates signed percentage error between predicted and actual duration.
 * signed_error = (actual_duration - predicted_duration) / predicted_duration
 * Example: predicted = 120 (2h), actual = 210 (3.5h) => (210 - 120)/120 = +0.75 (+75%)
 */
export function calculateEstimationError(predictedMinutes: number, actualMinutes: number): number {
  if (!predictedMinutes || predictedMinutes <= 0) return 0;
  if (actualMinutes < 0) return 0;
  return (actualMinutes - predictedMinutes) / predictedMinutes;
}

/**
 * Calculates relative absolute percentage error:
 * absolute_error = abs(actual_duration - predicted_duration) / predicted_duration
 */
export function calculateAbsoluteError(predictedMinutes: number, actualMinutes: number): number {
  if (!predictedMinutes || predictedMinutes <= 0) return 0;
  if (actualMinutes < 0) return 0;
  return Math.abs(actualMinutes - predictedMinutes) / predictedMinutes;
}

/**
 * Calculates absolute duration difference in minutes:
 * diff = abs(actual_duration - predicted_duration)
 */
export function calculateAbsoluteDifferenceMinutes(predictedMinutes: number, actualMinutes: number): number {
  if (!predictedMinutes || predictedMinutes <= 0) return 0;
  if (actualMinutes < 0) return 0;
  return Math.abs(actualMinutes - predictedMinutes);
}

/**
 * Calculates start delay in minutes against the original planned start time.
 */
export function calculateStartDelayMinutes(originalPlannedStart: string, actualStart: string): number {
  if (!originalPlannedStart || !actualStart) return 0;
  const plannedMs = new Date(originalPlannedStart).getTime();
  const actualMs = new Date(actualStart).getTime();
  if (isNaN(plannedMs) || isNaN(actualMs)) return 0;
  return Math.round((actualMs - plannedMs) / (1000 * 60));
}

/**
 * Calculates completion delay in days between original scheduled date and actual completion date.
 */
export function calculateCompletionDelayDays(originalScheduledDate: string, actualCompletionDate: string): number {
  if (!originalScheduledDate || !actualCompletionDate) return 0;
  const schedDate = new Date(originalScheduledDate).getTime();
  const compDate = new Date(actualCompletionDate).getTime();
  if (isNaN(schedDate) || isNaN(compDate)) return 0;
  return Math.max(0, Math.round((compDate - schedDate) / (1000 * 60 * 60 * 24)));
}

/**
 * Moves the current planned time window to a new calendar date without changing its duration.
 */
export function calculateRescheduledPlan(
  plannedStart: string,
  plannedDurationMinutes: number,
  toDate: string
): { plannedStart: string; plannedEnd: string } {
  const currentStart = new Date(plannedStart);
  if (isNaN(currentStart.getTime()) || !toDate || plannedDurationMinutes <= 0) {
    return { plannedStart, plannedEnd: plannedStart };
  }

  const nextStart = new Date(`${toDate}T${currentStart.toISOString().substring(11, 19)}.000Z`);
  if (isNaN(nextStart.getTime())) {
    return { plannedStart, plannedEnd: plannedStart };
  }

  return {
    plannedStart: nextStart.toISOString(),
    plannedEnd: new Date(nextStart.getTime() + plannedDurationMinutes * 60000).toISOString()
  };
}

/**
 * Identifies and computes the Reference Class for a proposed prediction.
 * Matching hierarchy:
 * 1. Same category and same tag (if tag provided)
 * 2. Same category
 * 3. Otherwise return insufficient data
 *
 * For Programming category, behavioral task types (implementation/debugging/testing/documentation)
 * are considered as sub-filtering before falling back to broad category match.
 */
export function getReferenceClass(
  taskPrediction: { category: TaskCategory; tag?: string; id?: string; taskType?: BehavioralTaskType },
  allTasks: TaskItem[],
  minObservations: number = 5
): ReferenceClassStatistics {
  // Filter eligible historical completed tasks:
  // - status === 'completed'
  // - actualDurationMinutes > 0
  // - valid original prediction duration > 0
  // - exclude current task if editing
  const eligibleTasks = allTasks.filter(t => {
    if (taskPrediction.id && t.id === taskPrediction.id) return false;
    return isDurationCalibrationEligible(t);
  });

  let matchedTasks: TaskItem[] = [];
  let matchedBy: ReferenceClassStatistics['matchedBy'] = 'none';

  // Step 1: Category + Tag match (if tag provided)
  if (taskPrediction.tag && taskPrediction.tag.trim().length > 0) {
    const cleanTag = taskPrediction.tag.trim().toLowerCase();
    const tagMatches = eligibleTasks.filter(
      t => t.category === taskPrediction.category && t.tag && t.tag.trim().toLowerCase() === cleanTag
    );
    if (tagMatches.length >= minObservations) {
      matchedTasks = tagMatches;
      matchedBy = 'category_and_tag';
    }
  }

  // Step 2: Category match with behavioral task type sub-filtering for Programming
  if (matchedTasks.length === 0) {
    const categoryMatches = eligibleTasks.filter(t => t.category === taskPrediction.category);

    // If Programming category, further filter by behavioral task type
    if (taskPrediction.category === 'Programming' && taskPrediction.taskType) {
      const typeMatches = categoryMatches.filter(
        t => t.behavioralTaskType === taskPrediction.taskType
      );
      if (typeMatches.length >= minObservations) {
        matchedTasks = typeMatches;
        matchedBy = 'category_and_task_type';
      } else if (typeMatches.length > 0 && categoryMatches.length >= minObservations) {
        // Task type sample too small, fall back to broad category
        matchedTasks = categoryMatches;
        matchedBy = 'category';
      }
    }

    if (matchedTasks.length === 0 && categoryMatches.length >= minObservations) {
      matchedTasks = categoryMatches;
      matchedBy = 'category';
    }
  }

  // If no reference class met min observations
  if (matchedTasks.length === 0) {
    return {
      sampleCount: 0,
      meanActualDuration: 0,
      medianActualDuration: 0,
      minActualDuration: 0,
      maxActualDuration: 0,
      meanSignedError: 0,
      medianSignedError: 0,
      meanAbsoluteError: 0,
      medianAbsoluteError: 0,
      matchedBy: 'none',
      tasks: []
    };
  }

  const actualDurations = matchedTasks.map(t => t.execution.actualDurationMinutes!);
  const signedErrors = matchedTasks.map(t => {
    const pred = getHistoricalCalibrationBaseline(t);
    return calculateEstimationError(pred, t.execution.actualDurationMinutes!);
  });
  const absErrors = matchedTasks.map(t => {
    const pred = getHistoricalCalibrationBaseline(t);
    return calculateAbsoluteError(pred, t.execution.actualDurationMinutes!);
  });

  return {
    sampleCount: matchedTasks.length,
    meanActualDuration: Math.round(calculateMean(actualDurations)),
    medianActualDuration: Math.round(calculateMedian(actualDurations)),
    minActualDuration: Math.min(...actualDurations),
    maxActualDuration: Math.max(...actualDurations),
    meanSignedError: calculateMean(signedErrors),
    medianSignedError: calculateMedian(signedErrors),
    meanAbsoluteError: calculateMean(absErrors),
    medianAbsoluteError: calculateMedian(absErrors),
    matchedBy,
    tasks: matchedTasks
  };
}

/**
 * Evaluates whether a Reality Check should be triggered for a proposed task estimate.
 * Uses reference class median actual duration and symmetric configurable thresholds:
 * - < 15%: no check
 * - 15% - 30%: soft suggestion
 * - > 30%: strong Reality Check
 */
export function getRealityCheck(
  category: TaskCategory,
  estimatedDurationMinutes: number,
  allTasks: TaskItem[],
  settings: AppSettings,
  tag?: string,
  taskType?: BehavioralTaskType,
  currentTaskId?: string
): RealityCheckSuggestion {
  if (!estimatedDurationMinutes || estimatedDurationMinutes <= 0) {
    return {
      shouldWarn: false,
      severity: 'none',
      state: 'no_data',
      historicalAverageMinutes: 0,
      medianActualDurationMinutes: 0,
      meanActualDurationMinutes: 0,
      sampleCount: 0,
      averageErrorPercent: 0,
      message: 'Please enter a valid estimated duration.',
      suggestedDurationMinutes: estimatedDurationMinutes || 0,
      matchedBy: 'none'
    };
  }

  const minObs = settings.minObservationsForRealityCheck || 5;
  const refClass = getReferenceClass(
    { category, tag, id: currentTaskId, taskType },
    allTasks,
    minObs
  );

  if (refClass.sampleCount < minObs) {
    // Count how many eligible tasks exist for informational message
    const eligibleInCategory = allTasks.filter(
      t => t.category === category &&
           t.execution.status === 'completed' &&
           t.execution.actualDurationMinutes &&
           t.execution.actualDurationMinutes > 0
    ).length;

    return {
      shouldWarn: false,
      severity: 'none',
      state: eligibleInCategory > 0 ? 'insufficient_data' : 'no_data',
      historicalAverageMinutes: estimatedDurationMinutes,
      medianActualDurationMinutes: refClass.medianActualDuration,
      meanActualDurationMinutes: refClass.meanActualDuration,
      sampleCount: eligibleInCategory,
      averageErrorPercent: 0,
      message: `Need at least ${minObs} completed ${category.toLowerCase()} tasks for calibrated reality checks (currently ${eligibleInCategory}).`,
      suggestedDurationMinutes: estimatedDurationMinutes,
      matchedBy: 'none'
    };
  }

  const medianActual = refClass.medianActualDuration;
  const meanActual = refClass.meanActualDuration;

  // relative discrepancy against median actual: (medianActual - estimated) / estimated
  const difference = (medianActual - estimatedDurationMinutes) / estimatedDurationMinutes;
  const absDifference = Math.abs(difference);
  const diffPercent = Math.round(difference * 100);

  const smallThresh = (settings.smallSuggestionThresholdPercent || 15) / 100;
  const strongThresh = (settings.realityCheckThresholdPercent || 30) / 100;

  const tagLabel = tag ? ` (${tag})` : '';

  // Case 1: < 15% -> No check
  if (absDifference < smallThresh) {
    return {
      shouldWarn: false,
      severity: 'none',
      state: 'within_expected_range',
      historicalAverageMinutes: medianActual,
      medianActualDurationMinutes: medianActual,
      meanActualDurationMinutes: meanActual,
      sampleCount: refClass.sampleCount,
      averageErrorPercent: diffPercent,
      message: `Your prediction for ${category.toLowerCase()}${tagLabel} tasks aligns closely with your historical typical duration (${formatMinutesToHours(medianActual)}).`,
      suggestedDurationMinutes: estimatedDurationMinutes,
      matchedBy: refClass.matchedBy
    };
  }

  // Case 2: 15% - 30% -> Soft suggestion
  if (absDifference <= strongThresh) {
    const isUnderestimate = difference > 0;
    const msg = isUnderestimate
      ? `Your estimate is slightly optimistic. Historical typical duration for ${category.toLowerCase()}${tagLabel} is ${formatMinutesToHours(medianActual)} based on ${refClass.sampleCount} completed tasks.`
      : `Your estimate is slightly conservative. Historical typical duration for ${category.toLowerCase()}${tagLabel} is ${formatMinutesToHours(medianActual)} based on ${refClass.sampleCount} completed tasks.`;

    return {
      shouldWarn: true,
      severity: 'small',
      state: 'soft_warning',
      historicalAverageMinutes: medianActual,
      medianActualDurationMinutes: medianActual,
      meanActualDurationMinutes: meanActual,
      sampleCount: refClass.sampleCount,
      averageErrorPercent: diffPercent,
      message: msg,
      suggestedDurationMinutes: medianActual,
      matchedBy: refClass.matchedBy
    };
  }

  // Case 3: > 30% -> Strong Reality Check
  const isUnderestimate = difference > 0;
  const msg = isUnderestimate
    ? `You estimated ${formatMinutesToHours(estimatedDurationMinutes)}. Similar ${category.toLowerCase()}${tagLabel} tasks usually take you about ${formatMinutesToHours(medianActual)} (+${diffPercent}% longer than your estimate).`
    : `You estimated ${formatMinutesToHours(estimatedDurationMinutes)}. Similar ${category.toLowerCase()}${tagLabel} tasks usually take you about ${formatMinutesToHours(medianActual)} (${diffPercent}% under your estimate).`;

  return {
    shouldWarn: true,
    severity: 'reality_check',
    state: 'strong_warning',
    historicalAverageMinutes: medianActual,
    medianActualDurationMinutes: medianActual,
    meanActualDurationMinutes: meanActual,
    sampleCount: refClass.sampleCount,
    averageErrorPercent: diffPercent,
    message: msg,
    suggestedDurationMinutes: medianActual,
    matchedBy: refClass.matchedBy
  };
}

/**
 * Returns the single strongest evidence-backed calibration pattern for Today's primary UI.
 * Only categories with at least `minObservations` completed measured sessions and a
 * median signed error magnitude of at least `minErrorPercent` are considered.
 *
 * @returns The strongest insight, or null when evidence is insufficient or no meaningful pattern exists
 */
export function getStrongestCalibrationInsight(
  tasks: TaskItem[],
  minObservations: number = 5,
  minErrorPercent: number = 15
): StrongestCalibrationInsight | null {
  const candidates: StrongestCalibrationInsight[] = [];

  CATEGORIES.forEach(cat => {
    const ref = getReferenceClass({ category: cat }, tasks, minObservations);
    if (ref.sampleCount < minObservations) return;
    candidates.push({
      category: cat,
      medianSignedErrorPercent: ref.medianSignedError * 100,
      sampleCount: ref.sampleCount,
      evidenceLevel: getEvidenceLevel(ref.sampleCount),
      message: ''
    });
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => Math.abs(b.medianSignedErrorPercent) - Math.abs(a.medianSignedErrorPercent));
  const top = candidates[0];

  if (Math.abs(top.medianSignedErrorPercent) < minErrorPercent) return null;

  const absPct = Math.abs(Math.round(top.medianSignedErrorPercent));
  const direction = top.medianSignedErrorPercent > 0
    ? 'take longer than you forecast'
    : 'finish faster than you forecast';
  top.message = `On ${top.category.toLowerCase()} tasks you usually ${direction} by about ${absPct}%.`;
  return top;
}

/**
 * Compares baseline (no Reality Check) vs intervention (Reality Check shown) forecast
 * error for the within-user experiment (Phase A vs Phase B). Uses the same absolute
 * error definition in both phases.
 */
export function getExperimentComparison(
  tasks: TaskItem[],
  minObservations: number = 5
): ExperimentComparison {
  const measured = tasks.filter(t =>
    t.predictionStatus !== 'not_recorded' &&
    t.execution.status === 'completed' &&
    t.execution.durationMeasurementStatus !== 'unknown' &&
    !!t.execution.actualDurationMinutes &&
    t.execution.actualDurationMinutes > 0 &&
    getHistoricalCalibrationBaseline(t) > 0
  );

  const baseline = measured.filter(t => !t.realityCheck);
  const intervention = measured.filter(t => t.realityCheck && t.realityCheck.shown);

  const absErrPercent = (t: TaskItem) =>
    calculateAbsoluteError(getHistoricalCalibrationBaseline(t), t.execution.actualDurationMinutes!) * 100;

  const baseErrors = baseline.map(absErrPercent);
  const intErrors = intervention.map(absErrPercent);

  const enough = (n: number) => n >= minObservations;

  return {
    baseline: {
      count: baseErrors.length,
      meanAbsoluteErrorPercent: Math.round(calculateMean(baseErrors)),
      medianAbsoluteErrorPercent: Math.round(calculateMedian(baseErrors))
    },
    intervention: {
      count: intErrors.length,
      meanAbsoluteErrorPercent: Math.round(calculateMean(intErrors)),
      medianAbsoluteErrorPercent: Math.round(calculateMedian(intErrors))
    },
    baselineSufficient: enough(baseErrors.length),
    interventionSufficient: enough(intErrors.length),
    improved: enough(baseErrors.length) && enough(intErrors.length)
      ? calculateMean(intErrors) < calculateMean(baseErrors)
      : null
  };
}

/**
 * Calculates duration calibration across all tasks and per category.
 * Uses immutable original predictions.
 */
export function calculateDurationCalibration(tasks: TaskItem[]): DurationCalibration {
  const completedTasks = tasks.filter(isDurationCalibrationEligible);

  let overallRatioSum = 0;
  const allSignedErrors: number[] = [];
  const allAbsErrors: number[] = [];
  const allActualDurations: number[] = [];

  completedTasks.forEach(t => {
    const est = getHistoricalCalibrationBaseline(t) || 1;
    const act = t.execution.actualDurationMinutes || est;
    overallRatioSum += (act / est);
    allSignedErrors.push(calculateEstimationError(est, act));
    allAbsErrors.push(calculateAbsoluteDifferenceMinutes(est, act));
    allActualDurations.push(act);
  });

  const overallAvgRatio = completedTasks.length > 0 ? (overallRatioSum / completedTasks.length) : 1;
  const overallErrorPercent = Math.round((overallAvgRatio - 1) * 100);

  const meanSignedErrorPercent = completedTasks.length > 0 ? calculateMean(allSignedErrors) * 100 : 0;
  const medianSignedErrorPercent = completedTasks.length > 0 ? calculateMedian(allSignedErrors) * 100 : 0;
  const meanAbsoluteErrorMinutes = completedTasks.length > 0 ? Math.round(calculateMean(allAbsErrors)) : 0;
  const medianAbsoluteErrorMinutes = completedTasks.length > 0 ? Math.round(calculateMedian(allAbsErrors)) : 0;
  const meanActualDurationMinutes = completedTasks.length > 0 ? Math.round(calculateMean(allActualDurations)) : 0;
  const medianActualDurationMinutes = completedTasks.length > 0 ? Math.round(calculateMedian(allActualDurations)) : 0;

  const categoryBreakdown: DurationCalibration['categoryBreakdown'] = {} as any;

  CATEGORIES.forEach(cat => {
    const catTasks = completedTasks.filter(t => t.category === cat);
    if (catTasks.length === 0) {
      categoryBreakdown[cat] = {
        averageErrorPercent: 0,
        meanSignedErrorPercent: 0,
        medianSignedErrorPercent: 0,
        meanAbsoluteErrorMinutes: 0,
        medianAbsoluteErrorMinutes: 0,
        meanActualDurationMinutes: 0,
        medianActualDurationMinutes: 0,
        multiplier: 1,
        taskCount: 0,
        sampleSufficient: false
      };
    } else {
      let catRatioSum = 0;
      const catSigned: number[] = [];
      const catAbs: number[] = [];
      const catActs: number[] = [];

      catTasks.forEach(t => {
        const est = getHistoricalCalibrationBaseline(t) || 1;
        const act = t.execution.actualDurationMinutes || est;
        catRatioSum += (act / est);
        catSigned.push(calculateEstimationError(est, act));
        catAbs.push(calculateAbsoluteDifferenceMinutes(est, act));
        catActs.push(act);
      });
      const mult = catRatioSum / catTasks.length;
      categoryBreakdown[cat] = {
        averageErrorPercent: Math.round((mult - 1) * 100),
        meanSignedErrorPercent: calculateMean(catSigned) * 100,
        medianSignedErrorPercent: calculateMedian(catSigned) * 100,
        meanAbsoluteErrorMinutes: Math.round(calculateMean(catAbs)),
        medianAbsoluteErrorMinutes: Math.round(calculateMedian(catAbs)),
        meanActualDurationMinutes: Math.round(calculateMean(catActs)),
        medianActualDurationMinutes: Math.round(calculateMedian(catActs)),
        multiplier: Math.round(mult * 100) / 100,
        taskCount: catTasks.length,
        sampleSufficient: catTasks.length >= 5
      };
    }
  });

  return {
    overallErrorPercent,
    meanSignedErrorPercent,
    medianSignedErrorPercent,
    meanAbsoluteErrorMinutes,
    medianAbsoluteErrorMinutes,
    meanActualDurationMinutes,
    medianActualDurationMinutes,
    totalTasksCount: completedTasks.length,
    categoryBreakdown
  };
}

/**
 * Extracts nominal hour (0-23) from a date/time string without timezone drift issues.
 * Supports ISO strings ("2026-08-10T19:00:00.000Z"), standard times ("19:00"), etc.
 */
export function getNominalHour(dateStr: string): number {
  if (!dateStr) return 0;
  if (dateStr.includes('T')) {
    const timePart = dateStr.split('T')[1];
    const hourPart = parseInt(timePart.split(':')[0], 10);
    if (!isNaN(hourPart)) return hourPart;
  }
  if (dateStr.includes(':')) {
    const hourPart = parseInt(dateStr.split(':')[0], 10);
    if (!isNaN(hourPart)) return hourPart;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.getHours();
  }
  return 0;
}

/**
 * Calculates start time delays and on-time adherence measured against the original planned start time.
 */
export function calculateStartTimeCalibration(tasks: TaskItem[]): StartTimeCalibration {
  const startedTasks = tasks.filter(
    t => t.predictionStatus !== 'not_recorded' && t.execution.actualStart && (t.execution.status === 'completed' || t.execution.status === 'in_progress')
  );

  if (startedTasks.length === 0) {
    return {
      averageDelayMinutes: 0,
      medianDelayMinutes: 0,
      onTimeStartRatePercent: 100,
      totalSessionsCount: 0,
      eveningDelayMinutes: 0,
      hasEnoughData: false
    };
  }

  const delays: number[] = [];
  let onTimeCount = 0;
  const eveningDelays: number[] = [];
  let eveningCount = 0;

  startedTasks.forEach(t => {
    // Measure against original planned start if available
    const plannedStartStr = t.originalPlannedStart || t.plannedStart;
    const delayMins = calculateStartDelayMinutes(plannedStartStr, t.execution.actualStart!);

    delays.push(delayMins);

    if (delayMins <= 5) {
      onTimeCount++;
    }

    const startHour = getNominalHour(plannedStartStr);
    if (startHour >= 18) {
      eveningDelays.push(delayMins);
      eveningCount++;
    }
  });

  const avgDelay = Math.round(calculateMean(delays));
  const medianDelay = Math.round(calculateMedian(delays));
  const onTimeRate = Math.round((onTimeCount / startedTasks.length) * 100);
  const avgEveningDelay = eveningCount > 0 ? Math.round(calculateMean(eveningDelays)) : avgDelay;

  return {
    averageDelayMinutes: avgDelay,
    medianDelayMinutes: medianDelay,
    onTimeStartRatePercent: onTimeRate,
    totalSessionsCount: startedTasks.length,
    eveningDelayMinutes: avgEveningDelay,
    hasEnoughData: startedTasks.length >= 5
  };
}

/**
 * Calculates the impact of sleep duration on task completion rates and estimation accuracy.
 * Strictly non-judgmental and evidence-focused.
 * Requires at least 7 comparable observations per group for strong insights.
 */
export function calculateSleepImpact(tasks: TaskItem[], sleepRecords: SleepRecord[]): SleepImpactCalibration {
  if (sleepRecords.length === 0 || tasks.length === 0) {
    return {
      normalSleepCompletionRate: 0,
      shortSleepCompletionRate: 0,
      completionDropPercent: 0,
      normalSleepDaysCount: 0,
      shortSleepDaysCount: 0,
      hasEnoughData: false
    };
  }

  // Map of date (YYYY-MM-DD) -> SleepRecord
  const sleepMap = new Map<string, SleepRecord>();
  sleepRecords.forEach(s => sleepMap.set(s.date, s));

  let normalSleepTotalTasks = 0;
  let normalSleepCompletedTasks = 0;
  const normalSignedErrors: number[] = [];
  const normalAbsErrors: number[] = [];

  let shortSleepTotalTasks = 0;
  let shortSleepCompletedTasks = 0;
  const shortSignedErrors: number[] = [];
  const shortAbsErrors: number[] = [];

  const normalSleepDays = new Set<string>();
  const shortSleepDays = new Set<string>();

  tasks.forEach(t => {
    if (!isCompletionCalibrationEligible(t)) return;
    const dateKey = t.execution.originalScheduledDate;
    const sleep = sleepMap.get(dateKey);

    if (sleep) {
      const isShort = sleep.isShortSleep;
      if (isShort) {
        shortSleepDays.add(dateKey);
        shortSleepTotalTasks++;
        if (t.execution.status === 'completed' && t.execution.actualDurationMinutes !== undefined && t.execution.actualDurationMinutes > 0) {
          shortSleepCompletedTasks++;
          const pred = getHistoricalCalibrationBaseline(t) || 1;
          const act = t.execution.actualDurationMinutes;
          shortSignedErrors.push(calculateEstimationError(pred, act));
          shortAbsErrors.push(calculateAbsoluteDifferenceMinutes(pred, act));
        } else if (t.execution.status === 'completed') {
          shortSleepCompletedTasks++;
        }
      } else {
        normalSleepDays.add(dateKey);
        normalSleepTotalTasks++;
        if (t.execution.status === 'completed' && t.execution.actualDurationMinutes !== undefined && t.execution.actualDurationMinutes > 0) {
          normalSleepCompletedTasks++;
          const pred = getHistoricalCalibrationBaseline(t) || 1;
          const act = t.execution.actualDurationMinutes;
          normalSignedErrors.push(calculateEstimationError(pred, act));
          normalAbsErrors.push(calculateAbsoluteDifferenceMinutes(pred, act));
        } else if (t.execution.status === 'completed') {
          normalSleepCompletedTasks++;
        }
      }
    }
  });

  const hasEnoughData = normalSleepTotalTasks >= 7 && shortSleepTotalTasks >= 7;

  const normalRate = normalSleepTotalTasks > 0 ? Math.round((normalSleepCompletedTasks / normalSleepTotalTasks) * 100) : 0;
  const shortRate = shortSleepTotalTasks > 0 ? Math.round((shortSleepCompletedTasks / shortSleepTotalTasks) * 100) : 0;

  const dropPercent = normalRate > 0 ? Math.max(0, Math.round(((normalRate - shortRate) / normalRate) * 100)) : 0;

  const normalSleepMetrics = {
    eligibleTaskCount: normalSleepTotalTasks,
    completedTaskCount: normalSleepCompletedTasks,
    completionRatePercent: normalRate,
    meanSignedErrorPercent: normalSignedErrors.length > 0 ? calculateMean(normalSignedErrors) * 100 : 0,
    medianSignedErrorPercent: normalSignedErrors.length > 0 ? calculateMedian(normalSignedErrors) * 100 : 0,
    meanAbsoluteErrorMinutes: normalAbsErrors.length > 0 ? Math.round(calculateMean(normalAbsErrors)) : 0,
    medianAbsoluteErrorMinutes: normalAbsErrors.length > 0 ? Math.round(calculateMedian(normalAbsErrors)) : 0,
  };

  const shortSleepMetrics = {
    eligibleTaskCount: shortSleepTotalTasks,
    completedTaskCount: shortSleepCompletedTasks,
    completionRatePercent: shortRate,
    meanSignedErrorPercent: shortSignedErrors.length > 0 ? calculateMean(shortSignedErrors) * 100 : 0,
    medianSignedErrorPercent: shortSignedErrors.length > 0 ? calculateMedian(shortSignedErrors) * 100 : 0,
    meanAbsoluteErrorMinutes: shortAbsErrors.length > 0 ? Math.round(calculateMean(shortAbsErrors)) : 0,
    medianAbsoluteErrorMinutes: shortAbsErrors.length > 0 ? Math.round(calculateMedian(shortAbsErrors)) : 0,
  };

  return {
    normalSleepCompletionRate: normalRate,
    shortSleepCompletionRate: shortRate,
    completionDropPercent: dropPercent,
    normalSleepDaysCount: normalSleepDays.size,
    shortSleepDaysCount: shortSleepDays.size,
    normalSleepMetrics,
    shortSleepMetrics,
    hasEnoughData
  };
}

/**
 * Calculates confidence calibration by comparing stated confidence with actual outcomes.
 * Uses standard confidence ranges:
 * - 0–49%
 * - 50–69%
 * - 70–89%
 * - 90–100%
 */
export function calculateConfidenceCalibration(tasks: TaskItem[]): ConfidenceCalibration[] {
  const eligibleTasks = tasks.filter(isCompletionCalibrationEligible);

  const bracketsConfig = [
    { bracket: 30, rangeLabel: '0–49%', min: 0, max: 49 },
    { bracket: 60, rangeLabel: '50–69%', min: 50, max: 69 },
    { bracket: 80, rangeLabel: '70–89%', min: 70, max: 89 },
    { bracket: 95, rangeLabel: '90–100%', min: 90, max: 100 }
  ];

  return bracketsConfig.map(b => {
    const inRangeTasks = eligibleTasks.filter(t => t.confidence >= b.min && t.confidence <= b.max);
    
    if (inRangeTasks.length === 0) {
      return {
        bracket: b.bracket,
        rangeLabel: b.rangeLabel,
        predictedCount: 0,
        successfulCount: 0,
        actualSuccessRatePercent: 0,
        sampleSufficient: false
      };
    }

    // Success definition: task completed on the originally scheduled date
    let successfulCount = 0;
    inRangeTasks.forEach(t => {
      if (
        t.execution.status === 'completed' &&
        t.execution.actualCompletionDate &&
        t.execution.actualCompletionDate === t.execution.originalScheduledDate
      ) {
        successfulCount++;
      }
    });

    const successRate = Math.round((successfulCount / inRangeTasks.length) * 100);

    return {
      bracket: b.bracket,
      rangeLabel: b.rangeLabel,
      predictedCount: inRangeTasks.length,
      successfulCount,
      actualSuccessRatePercent: successRate,
      sampleSufficient: inRangeTasks.length >= 5
    };
  });
}

/**
 * Calculates complete task completion calibration metrics.
 */
export function calculateCompletionCalibration(tasks: TaskItem[]): CompletionCalibration {
  const eligibleTasks = tasks.filter(isCompletionCalibrationEligible);

  const completed = eligibleTasks.filter(t => t.execution.status === 'completed');
  const postponed = eligibleTasks.filter(t => t.execution.status === 'postponed');
  const skipped = eligibleTasks.filter(t => t.execution.status === 'skipped');

  const sameDayCompleted = completed.filter(
    t => t.execution.actualCompletionDate && t.execution.actualCompletionDate === t.execution.originalScheduledDate
  );

  const sameDayRate = eligibleTasks.length > 0
    ? Math.round((sameDayCompleted.length / eligibleTasks.length) * 100)
    : 100;

  // Completion delay in days for completed tasks
  let totalDelayDays = 0;
  let delayCount = 0;
  completed.forEach(t => {
    if (t.execution.actualCompletionDate && t.execution.originalScheduledDate) {
      const delay = calculateCompletionDelayDays(t.execution.originalScheduledDate, t.execution.actualCompletionDate);
      totalDelayDays += delay;
      delayCount++;
    }
  });

  const avgDelayDays = delayCount > 0 ? Math.round((totalDelayDays / delayCount) * 10) / 10 : 0;

  const categoryCompletionRates: CompletionCalibration['categoryCompletionRates'] = {} as any;
  CATEGORIES.forEach(cat => {
    const catEligible = eligibleTasks.filter(t => t.category === cat);
    const catCompleted = catEligible.filter(t => t.execution.status === 'completed');
    categoryCompletionRates[cat] = {
      total: catEligible.length,
      completed: catCompleted.length,
      completionRatePercent: catEligible.length > 0 ? Math.round((catCompleted.length / catEligible.length) * 100) : 0
    };
  });

  return {
    totalEligibleCount: eligibleTasks.length,
    completedCount: completed.length,
    postponedCount: postponed.length,
    skippedCount: skipped.length,
    sameDayCompletionRatePercent: sameDayRate,
    averageCompletionDelayDays: avgDelayDays,
    categoryCompletionRates
  };
}

/**
 * Calculates same-day completion rate.
 */
export function calculateSameDayCompletionRate(tasks: TaskItem[]): number {
  const eligible = tasks.filter(isCompletionCalibrationEligible);
  if (eligible.length === 0) return 100;

  const sameDayCompleted = eligible.filter(
    t => t.execution.status === 'completed' && t.execution.actualCompletionDate === t.execution.originalScheduledDate
  );

  return Math.round((sameDayCompleted.length / eligible.length) * 100);
}

/**
 * Calculates prediction accuracy over time (e.g. Week 1 -> Week 4).
 * Groups completed tasks chronologically to observe how estimation error changes.
 */
export function calculateAccuracyOverTime(tasks: TaskItem[]): AccuracyOverTimeCalibration {
  const completedTasks = tasks
    .filter(isDurationCalibrationEligible)
    .sort((a, b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime());

  if (completedTasks.length < 3) {
    return {
      hasEnoughData: false,
      weeklyTrends: [],
      overallTrendDirection: 'needs_more_data'
    };
  }

  const startTimeMs = new Date(completedTasks[0].plannedStart).getTime();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const buckets: Map<number, TaskItem[]> = new Map();

  completedTasks.forEach(task => {
    const taskTimeMs = new Date(task.plannedStart).getTime();
    const weekIndex = Math.max(0, Math.floor((taskTimeMs - startTimeMs) / ONE_WEEK_MS));
    if (!buckets.has(weekIndex)) {
      buckets.set(weekIndex, []);
    }
    buckets.get(weekIndex)!.push(task);
  });

  const weeklyTrends: WeeklyAccuracyTrend[] = [];

  if (buckets.size > 1) {
    const sortedWeeks = Array.from(buckets.keys()).sort((a, b) => a - b);
    sortedWeeks.forEach(weekIdx => {
      const weekTasks = buckets.get(weekIdx)!;
      let totalPercentError = 0;
      let totalAbsErrorMinutes = 0;

      weekTasks.forEach(t => {
        const est = getHistoricalCalibrationBaseline(t) || 1;
        const act = t.execution.actualDurationMinutes || est;
        totalPercentError += Math.abs((act - est) / est);
        totalAbsErrorMinutes += Math.abs(act - est);
      });

      const avgPercent = Math.round((totalPercentError / weekTasks.length) * 100);
      const avgAbsMins = Math.round(totalAbsErrorMinutes / weekTasks.length);

      weeklyTrends.push({
        periodLabel: `Week ${weekIdx + 1}`,
        completedTaskCount: weekTasks.length,
        averageEstimationErrorPercent: avgPercent,
        averageAbsoluteErrorMinutes: avgAbsMins
      });
    });
  } else {
    // Partition sequentially (First Half vs Second Half)
    const mid = Math.ceil(completedTasks.length / 2);
    const batch1 = completedTasks.slice(0, mid);
    const batch2 = completedTasks.slice(mid);

    const computeBatch = (batch: TaskItem[], label: string): WeeklyAccuracyTrend => {
      let totalPercentError = 0;
      let totalAbsErrorMinutes = 0;
      batch.forEach(t => {
        const est = getHistoricalCalibrationBaseline(t) || 1;
        const act = t.execution.actualDurationMinutes || est;
        totalPercentError += Math.abs((act - est) / est);
        totalAbsErrorMinutes += Math.abs(act - est);
      });
      return {
        periodLabel: label,
        completedTaskCount: batch.length,
        averageEstimationErrorPercent: Math.round((totalPercentError / batch.length) * 100),
        averageAbsoluteErrorMinutes: Math.round(totalAbsErrorMinutes / batch.length)
      };
    };

    weeklyTrends.push(computeBatch(batch1, 'Earlier Sessions'));
    if (batch2.length > 0) {
      weeklyTrends.push(computeBatch(batch2, 'Recent Sessions'));
    }
  }

  const earliest = weeklyTrends.length > 0 ? weeklyTrends[0].averageEstimationErrorPercent : undefined;
  const recent = weeklyTrends.length > 1 ? weeklyTrends[weeklyTrends.length - 1].averageEstimationErrorPercent : earliest;

  let trendDirection: 'improving' | 'stable' | 'needs_more_data' = 'needs_more_data';
  if (earliest !== undefined && recent !== undefined && weeklyTrends.length >= 2) {
    if (recent < earliest - 5) {
      trendDirection = 'improving';
    } else {
      trendDirection = 'stable';
    }
  }

  return {
    hasEnoughData: completedTasks.length >= 5,
    weeklyTrends,
    overallTrendDirection: trendDirection,
    earliestErrorPercent: earliest,
    recentErrorPercent: recent
  };
}

/** Compares original and post-Reality-Check forecasts without changing history. */
export function calculateRealityCheckEffectiveness(tasks: TaskItem[]): RealityCheckEffectiveness {
  const eligible = tasks.filter(task =>
    isDurationCalibrationEligible(task) &&
    task.realityCheck?.shown === true &&
    !!task.realityCheck.originalPredictionMinutes &&
    !!task.realityCheck.finalPredictionMinutes
  );

  const originalErrors = eligible.map(task => calculateAbsoluteError(
    task.realityCheck!.originalPredictionMinutes!,
    task.execution.actualDurationMinutes!
  ));
  const finalErrors = eligible.map(task => calculateAbsoluteError(
    task.realityCheck!.finalPredictionMinutes!,
    task.execution.actualDurationMinutes!
  ));
  const improvements = originalErrors.map((error, index) => error - finalErrors[index]);

  return {
    eligibleTaskCount: eligible.length,
    improvedTaskCount: improvements.filter(value => value > 0).length,
    unchangedTaskCount: improvements.filter(value => value === 0).length,
    worsenedTaskCount: improvements.filter(value => value < 0).length,
    meanOriginalAbsoluteErrorPercent: Math.round(calculateMean(originalErrors) * 100),
    meanFinalPlanAbsoluteErrorPercent: Math.round(calculateMean(finalErrors) * 100),
    meanImprovementPercent: Math.round(calculateMean(improvements) * 100),
    hasEnoughData: eligible.length >= 5
  };
}

/**
 * Helper to compute full insights object.
 */
export function calculateOverallInsights(
  tasks: TaskItem[],
  sleepRecords: SleepRecord[]
): OverallCalibrationInsights {
  return {
    duration: calculateDurationCalibration(tasks),
    startTime: calculateStartTimeCalibration(tasks),
    sleepImpact: calculateSleepImpact(tasks, sleepRecords),
    confidenceBrackets: calculateConfidenceCalibration(tasks),
    sameDayCompletionRatePercent: calculateSameDayCompletionRate(tasks),
    completion: calculateCompletionCalibration(tasks),
    accuracyOverTime: calculateAccuracyOverTime(tasks),
    realityCheckEffectiveness: calculateRealityCheckEffectiveness(tasks)
  };
}

/**
 * Formats minutes into human-readable string (e.g., 145 => "2h 25m", 45 => "45m").
 */
export function formatMinutesToHours(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}
