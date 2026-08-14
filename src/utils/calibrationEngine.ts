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
  OverallCalibrationInsights
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
 * Identifies and computes the Reference Class for a proposed prediction.
 * Matching hierarchy:
 * 1. Same category and same tag (if tag provided)
 * 2. Same category
 * 3. Otherwise return insufficient data
 */
export function getReferenceClass(
  taskPrediction: { category: TaskCategory; tag?: string; id?: string },
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
    if (t.execution.status !== 'completed') return false;
    const actualDur = t.execution.actualDurationMinutes;
    if (!actualDur || actualDur <= 0) return false;
    const origPred = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes;
    if (!origPred || origPred <= 0) return false;
    return true;
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

  // Step 2: Category match
  if (matchedTasks.length === 0) {
    const categoryMatches = eligibleTasks.filter(t => t.category === taskPrediction.category);
    if (categoryMatches.length >= minObservations) {
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
    const pred = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes;
    return calculateEstimationError(pred, t.execution.actualDurationMinutes!);
  });
  const absErrors = matchedTasks.map(t => {
    const pred = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes;
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
  currentTaskId?: string
): RealityCheckSuggestion {
  if (!estimatedDurationMinutes || estimatedDurationMinutes <= 0) {
    return {
      shouldWarn: false,
      severity: 'none',
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
    { category, tag, id: currentTaskId },
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
 * Calculates duration calibration across all tasks and per category.
 * Uses immutable original predictions.
 */
export function calculateDurationCalibration(tasks: TaskItem[]): DurationCalibration {
  const completedTasks = tasks.filter(
    t => t.execution.status === 'completed' &&
         t.execution.actualDurationMinutes !== undefined &&
         t.execution.actualDurationMinutes > 0
  );

  let overallRatioSum = 0;
  const allSignedErrors: number[] = [];
  const allAbsErrors: number[] = [];
  const allActualDurations: number[] = [];

  completedTasks.forEach(t => {
    const est = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes || 1;
    const act = t.execution.actualDurationMinutes || est;
    overallRatioSum += (act / est);
    allSignedErrors.push(calculateEstimationError(est, act));
    allAbsErrors.push(calculateAbsoluteDifferenceMinutes(est, act));
    allActualDurations.push(act);
  });

  const overallAvgRatio = completedTasks.length > 0 ? (overallRatioSum / completedTasks.length) : 1;
  const overallErrorPercent = Math.round((overallAvgRatio - 1) * 100);

  const meanSignedErrorPercent = completedTasks.length > 0 ? calculateMean(allSignedErrors) : 0;
  const medianSignedErrorPercent = completedTasks.length > 0 ? calculateMedian(allSignedErrors) : 0;
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
        const est = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes || 1;
        const act = t.execution.actualDurationMinutes || est;
        catRatioSum += (act / est);
        catSigned.push(calculateEstimationError(est, act));
        catAbs.push(calculateAbsoluteDifferenceMinutes(est, act));
        catActs.push(act);
      });
      const mult = catRatioSum / catTasks.length;
      categoryBreakdown[cat] = {
        averageErrorPercent: Math.round((mult - 1) * 100),
        meanSignedErrorPercent: calculateMean(catSigned),
        medianSignedErrorPercent: calculateMedian(catSigned),
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
    t => t.execution.actualStart && (t.execution.status === 'completed' || t.execution.status === 'in_progress')
  );

  if (startedTasks.length === 0) {
    return {
      averageDelayMinutes: 0,
      onTimeStartRatePercent: 100,
      totalSessionsCount: 0,
      eveningDelayMinutes: 0
    };
  }

  let totalDelay = 0;
  let onTimeCount = 0;
  let eveningDelayTotal = 0;
  let eveningCount = 0;

  startedTasks.forEach(t => {
    // Measure against original planned start if available
    const plannedStartStr = t.originalPlannedStart || t.plannedStart;
    const delayMins = calculateStartDelayMinutes(plannedStartStr, t.execution.actualStart!);

    totalDelay += Math.max(0, delayMins);

    if (delayMins <= 5) {
      onTimeCount++;
    }

    const startHour = getNominalHour(plannedStartStr);
    if (startHour >= 18) {
      eveningDelayTotal += Math.max(0, delayMins);
      eveningCount++;
    }
  });

  const avgDelay = Math.round(totalDelay / startedTasks.length);
  const onTimeRate = Math.round((onTimeCount / startedTasks.length) * 100);
  const avgEveningDelay = eveningCount > 0 ? Math.round(eveningDelayTotal / eveningCount) : avgDelay;

  return {
    averageDelayMinutes: avgDelay,
    onTimeStartRatePercent: onTimeRate,
    totalSessionsCount: startedTasks.length,
    eveningDelayMinutes: avgEveningDelay
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
    const dateKey = t.execution.originalScheduledDate;
    const sleep = sleepMap.get(dateKey);

    if (sleep) {
      const isShort = sleep.isShortSleep;
      if (isShort) {
        shortSleepDays.add(dateKey);
        shortSleepTotalTasks++;
        if (t.execution.status === 'completed' && t.execution.actualDurationMinutes !== undefined && t.execution.actualDurationMinutes > 0) {
          shortSleepCompletedTasks++;
          const pred = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes || 1;
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
          const pred = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes || 1;
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
    meanSignedErrorPercent: normalSignedErrors.length > 0 ? calculateMean(normalSignedErrors) : 0,
    medianSignedErrorPercent: normalSignedErrors.length > 0 ? calculateMedian(normalSignedErrors) : 0,
    meanAbsoluteErrorMinutes: normalAbsErrors.length > 0 ? Math.round(calculateMean(normalAbsErrors)) : 0,
    medianAbsoluteErrorMinutes: normalAbsErrors.length > 0 ? Math.round(calculateMedian(normalAbsErrors)) : 0,
  };

  const shortSleepMetrics = {
    eligibleTaskCount: shortSleepTotalTasks,
    completedTaskCount: shortSleepCompletedTasks,
    completionRatePercent: shortRate,
    meanSignedErrorPercent: shortSignedErrors.length > 0 ? calculateMean(shortSignedErrors) : 0,
    medianSignedErrorPercent: shortSignedErrors.length > 0 ? calculateMedian(shortSignedErrors) : 0,
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
  const eligibleTasks = tasks.filter(
    t => t.execution.status === 'completed' || t.execution.status === 'postponed' || t.execution.status === 'skipped'
  );

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
  const eligibleTasks = tasks.filter(
    t => t.execution.status === 'completed' || t.execution.status === 'postponed' || t.execution.status === 'skipped'
  );

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
  const eligible = tasks.filter(t => t.execution.status === 'completed' || t.execution.status === 'postponed' || t.execution.status === 'skipped');
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
    .filter(
      t => t.execution.status === 'completed' &&
           t.execution.actualDurationMinutes !== undefined &&
           t.execution.actualDurationMinutes > 0
    )
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
        const est = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes || 1;
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
        const est = t.originalEstimatedDurationMinutes || t.estimatedDurationMinutes || 1;
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
    accuracyOverTime: calculateAccuracyOverTime(tasks)
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
