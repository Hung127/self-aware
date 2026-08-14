import {
  TaskItem,
  TaskCategory,
  SleepRecord,
  AppSettings,
  RealityCheckSuggestion,
  DurationCalibration,
  StartTimeCalibration,
  SleepImpactCalibration,
  ConfidenceCalibration,
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
 * Calculates percentage error between predicted and actual duration.
 * error = (actual_duration - predicted_duration) / predicted_duration
 * Example: predicted = 120 (2h), actual = 210 (3.5h) => (210 - 120)/120 = +0.75 (+75%)
 */
export function calculateEstimationError(predictedMinutes: number, actualMinutes: number): number {
  if (!predictedMinutes || predictedMinutes <= 0) return 0;
  if (actualMinutes < 0) return 0;
  return (actualMinutes - predictedMinutes) / predictedMinutes;
}

/**
 * Calculates absolute duration error in minutes:
 * absolute_error = abs(actual_duration - predicted_duration)
 */
export function calculateAbsoluteError(predictedMinutes: number, actualMinutes: number): number {
  if (!predictedMinutes || predictedMinutes <= 0) return 0;
  if (actualMinutes < 0) return 0;
  return Math.abs(actualMinutes - predictedMinutes);
}

/**
 * Evaluates whether a Reality Check should be triggered for a proposed task estimate.
 */
export function getRealityCheck(
  category: TaskCategory,
  estimatedDurationMinutes: number,
  allTasks: TaskItem[],
  settings: AppSettings
): RealityCheckSuggestion {
  if (estimatedDurationMinutes <= 0) {
    return {
      shouldWarn: false,
      severity: 'none',
      historicalAverageMinutes: 0,
      sampleCount: 0,
      averageErrorPercent: 0,
      message: 'Please enter a valid estimated duration.',
      suggestedDurationMinutes: estimatedDurationMinutes
    };
  }

  // Filter completed tasks in the same category that have valid actual durations
  const completedCategoryTasks = allTasks.filter(
    t => t.category === category &&
         t.execution.status === 'completed' &&
         t.execution.actualDurationMinutes &&
         t.execution.actualDurationMinutes > 0
  );

  const sampleCount = completedCategoryTasks.length;
  const minObs = settings.minObservationsForRealityCheck || 3;

  if (sampleCount < minObs) {
    return {
      shouldWarn: false,
      severity: 'none',
      historicalAverageMinutes: estimatedDurationMinutes,
      sampleCount,
      averageErrorPercent: 0,
      message: `Need at least ${minObs} completed ${category.toLowerCase()} tasks for calibrated reality checks (currently ${sampleCount}).`,
      suggestedDurationMinutes: estimatedDurationMinutes
    };
  }

  // Calculate category multiplier (actual / estimated)
  let totalRatio = 0;
  completedCategoryTasks.forEach(t => {
    const est = t.estimatedDurationMinutes || t.plannedDurationMinutes || 1;
    const act = t.execution.actualDurationMinutes || est;
    totalRatio += (act / est);
  });

  const averageRatio = totalRatio / sampleCount; // e.g. 1.43
  const averageErrorPercent = Math.round((averageRatio - 1) * 100); // e.g. +43%
  const historicalAverageMinutes = Math.round(estimatedDurationMinutes * averageRatio);

  const absError = Math.abs(averageErrorPercent);

  if (averageErrorPercent > settings.realityCheckThresholdPercent) {
    // Underestimated significantly
    return {
      shouldWarn: true,
      severity: 'reality_check',
      historicalAverageMinutes,
      sampleCount,
      averageErrorPercent,
      message: `Similar ${category.toLowerCase()} tasks have taken you about ${formatMinutesToHours(historicalAverageMinutes)} on average (+${averageErrorPercent}% over estimate).`,
      suggestedDurationMinutes: historicalAverageMinutes
    };
  } else if (averageErrorPercent > settings.smallSuggestionThresholdPercent) {
    // Small suggestion
    return {
      shouldWarn: true,
      severity: 'small',
      historicalAverageMinutes,
      sampleCount,
      averageErrorPercent,
      message: `Your estimate is slightly optimistic. Historical average for ${category.toLowerCase()} is ${formatMinutesToHours(historicalAverageMinutes)}.`,
      suggestedDurationMinutes: historicalAverageMinutes
    };
  } else if (averageErrorPercent < -settings.realityCheckThresholdPercent) {
    // Overestimated significantly
    return {
      shouldWarn: true,
      severity: 'small',
      historicalAverageMinutes,
      sampleCount,
      averageErrorPercent,
      message: `You tend to overestimate ${category.toLowerCase()} tasks. Similar tasks usually take ${formatMinutesToHours(historicalAverageMinutes)}.`,
      suggestedDurationMinutes: historicalAverageMinutes
    };
  }

  return {
    shouldWarn: false,
    severity: 'none',
    historicalAverageMinutes,
    sampleCount,
    averageErrorPercent,
    message: `Your predictions for ${category.toLowerCase()} tasks align closely with your history!`,
    suggestedDurationMinutes: estimatedDurationMinutes
  };
}

/**
 * Calculates duration calibration across all tasks and per category.
 */
export function calculateDurationCalibration(tasks: TaskItem[]): DurationCalibration {
  const completedTasks = tasks.filter(
    t => t.execution.status === 'completed' &&
         t.execution.actualDurationMinutes !== undefined &&
         t.execution.actualDurationMinutes > 0
  );

  let overallRatioSum = 0;
  completedTasks.forEach(t => {
    const est = t.estimatedDurationMinutes || 1;
    const act = t.execution.actualDurationMinutes || est;
    overallRatioSum += (act / est);
  });

  const overallAvgRatio = completedTasks.length > 0 ? (overallRatioSum / completedTasks.length) : 1;
  const overallErrorPercent = Math.round((overallAvgRatio - 1) * 100);

  const categoryBreakdown: DurationCalibration['categoryBreakdown'] = {} as any;

  CATEGORIES.forEach(cat => {
    const catTasks = completedTasks.filter(t => t.category === cat);
    if (catTasks.length === 0) {
      categoryBreakdown[cat] = {
        averageErrorPercent: 0,
        multiplier: 1,
        taskCount: 0,
        sampleSufficient: false
      };
    } else {
      let catRatioSum = 0;
      catTasks.forEach(t => {
        const est = t.estimatedDurationMinutes || 1;
        const act = t.execution.actualDurationMinutes || est;
        catRatioSum += (act / est);
      });
      const mult = catRatioSum / catTasks.length;
      categoryBreakdown[cat] = {
        averageErrorPercent: Math.round((mult - 1) * 100),
        multiplier: Math.round(mult * 100) / 100,
        taskCount: catTasks.length,
        sampleSufficient: catTasks.length >= 3
      };
    }
  });

  return {
    overallErrorPercent,
    totalTasksCount: completedTasks.length,
    categoryBreakdown
  };
}

/**
 * Calculates start time delays and on-time adherence.
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
    const plannedStart = new Date(t.plannedStart).getTime();
    const actualStart = new Date(t.execution.actualStart!).getTime();
    const delayMins = Math.round((actualStart - plannedStart) / (1000 * 60));

    // Delay can be positive (late) or negative (early)
    totalDelay += Math.max(0, delayMins);

    if (delayMins <= 5) {
      onTimeCount++;
    }

    const startHour = new Date(t.plannedStart).getHours();
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
 * Calculates the impact of sleep duration on task completion rates.
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

  // Create a map of date (YYYY-MM-DD) -> SleepRecord
  const sleepMap = new Map<string, SleepRecord>();
  sleepRecords.forEach(s => sleepMap.set(s.date, s));

  let normalSleepTotalTasks = 0;
  let normalSleepCompletedTasks = 0;
  let shortSleepTotalTasks = 0;
  let shortSleepCompletedTasks = 0;

  const normalSleepDays = new Set<string>();
  const shortSleepDays = new Set<string>();

  tasks.forEach(t => {
    const dateKey = t.execution.originalScheduledDate;
    const sleep = sleepMap.get(dateKey);

    if (sleep) {
      if (sleep.isShortSleep) {
        shortSleepDays.add(dateKey);
        shortSleepTotalTasks++;
        if (t.execution.status === 'completed') {
          shortSleepCompletedTasks++;
        }
      } else {
        normalSleepDays.add(dateKey);
        normalSleepTotalTasks++;
        if (t.execution.status === 'completed') {
          normalSleepCompletedTasks++;
        }
      }
    }
  });

  const hasEnoughData = (normalSleepTotalTasks >= 3 && shortSleepTotalTasks >= 2) || (shortSleepDays.size >= 1 && normalSleepDays.size >= 1);

  const normalRate = normalSleepTotalTasks > 0 ? Math.round((normalSleepCompletedTasks / normalSleepTotalTasks) * 100) : 0;
  const shortRate = shortSleepTotalTasks > 0 ? Math.round((shortSleepCompletedTasks / shortSleepTotalTasks) * 100) : 0;

  const dropPercent = normalRate > 0 ? Math.max(0, Math.round(((normalRate - shortRate) / normalRate) * 100)) : 0;

  return {
    normalSleepCompletionRate: normalRate,
    shortSleepCompletionRate: shortRate,
    completionDropPercent: dropPercent,
    normalSleepDaysCount: normalSleepDays.size,
    shortSleepDaysCount: shortSleepDays.size,
    hasEnoughData
  };
}

/**
 * Calculates confidence calibration by comparing stated confidence with actual accuracy.
 */
export function calculateConfidenceCalibration(tasks: TaskItem[]): ConfidenceCalibration[] {
  const completedTasks = tasks.filter(
    t => t.execution.status === 'completed' && t.execution.actualDurationMinutes !== undefined
  );

  const brackets = [50, 70, 80, 90, 95];
  const results: ConfidenceCalibration[] = [];

  brackets.forEach(bracket => {
    // Match tasks with confidence within +/- 5%
    const bracketTasks = completedTasks.filter(
      t => Math.abs(t.confidence - bracket) <= 5
    );

    if (bracketTasks.length === 0) {
      results.push({
        bracket,
        predictedCount: 0,
        successfulCount: 0,
        actualSuccessRatePercent: 0
      });
      return;
    }

    // A prediction is considered "successful" if error is <= 25% (i.e. did not wildly underestimate)
    let successfulCount = 0;
    bracketTasks.forEach(t => {
      const est = t.estimatedDurationMinutes;
      const act = t.execution.actualDurationMinutes || est;
      const error = (act - est) / est;
      if (error <= 0.25) {
        successfulCount++;
      }
    });

    const successRate = Math.round((successfulCount / bracketTasks.length) * 100);

    results.push({
      bracket,
      predictedCount: bracketTasks.length,
      successfulCount,
      actualSuccessRatePercent: successRate
    });
  });

  return results;
}

/**
 * Calculates same-day completion rate.
 */
export function calculateSameDayCompletionRate(tasks: TaskItem[]): number {
  const finishedTasks = tasks.filter(t => t.execution.status === 'completed' || t.execution.status === 'postponed');
  if (finishedTasks.length === 0) return 100;

  const sameDayCompleted = finishedTasks.filter(
    t => t.execution.status === 'completed' && t.execution.actualCompletionDate === t.execution.originalScheduledDate
  );

  return Math.round((sameDayCompleted.length / finishedTasks.length) * 100);
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

  // Group tasks into temporal chunks (e.g. by 7-day windows or sequential batches)
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

  // If all tasks are in 1 week or span is narrow, group by sequential chunks of 4-5 tasks
  const weeklyTrends: WeeklyAccuracyTrend[] = [];

  if (buckets.size > 1) {
    const sortedWeeks = Array.from(buckets.keys()).sort((a, b) => a - b);
    sortedWeeks.forEach(weekIdx => {
      const weekTasks = buckets.get(weekIdx)!;
      let totalPercentError = 0;
      let totalAbsErrorMinutes = 0;

      weekTasks.forEach(t => {
        const est = t.estimatedDurationMinutes || 1;
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
    // Partition sequentially (e.g. First Half vs Second Half)
    const mid = Math.ceil(completedTasks.length / 2);
    const batch1 = completedTasks.slice(0, mid);
    const batch2 = completedTasks.slice(mid);

    const computeBatch = (batch: TaskItem[], label: string): WeeklyAccuracyTrend => {
      let totalPercentError = 0;
      let totalAbsErrorMinutes = 0;
      batch.forEach(t => {
        const est = t.estimatedDurationMinutes || 1;
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
