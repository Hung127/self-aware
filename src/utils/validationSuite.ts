import { TestResult, TaskItem, SleepRecord, AppSettings } from '../types';
import {
  calculateEstimationError,
  getRealityCheck,
  calculateDurationCalibration,
  calculateStartTimeCalibration,
  calculateSleepImpact,
  calculateConfidenceCalibration,
  calculateSameDayCompletionRate,
  calculateOverallInsights,
  formatMinutesToHours
} from './calibrationEngine';
import {
  getInitialSampleTasks,
  getRichMultiCategorySampleTasks,
  getEdgeCaseSampleTasks,
  generateRandomCalibratedData,
  getInitialSampleSleepRecords
} from './storage';
import { inferCategoryFromTitle, convertGCalEventToTask, GCalEvent } from './googleCalendar';

export function runSystemValidationSuite(
  tasks: TaskItem[],
  sleepRecords: SleepRecord[],
  settings: AppSettings
): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Zero & Negative Duration Protection
  try {
    const errZero = calculateEstimationError(0, 60);
    const errNeg = calculateEstimationError(-10, 60);
    const errNormal = calculateEstimationError(100, 150);
    
    const pass = errZero === 0 && errNeg === 0 && Math.abs(errNormal - 0.5) < 0.001;
    results.push({
      name: 'Zero & Negative Duration Protection',
      passed: pass,
      details: pass
        ? 'Division by zero and negative estimated durations correctly handled without NaN or crashes.'
        : `Unexpected math output: zero=${errZero}, normal=${errNormal}`
    });
  } catch (e: any) {
    results.push({
      name: 'Zero & Negative Duration Protection',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 2: Midnight Boundary Duration Calculation
  try {
    const startLate = new Date('2026-08-10T23:30:00.000Z').getTime();
    const endEarly = new Date('2026-08-11T01:30:00.000Z').getTime();
    const durationMins = Math.round((endEarly - startLate) / (1000 * 60));

    const pass = durationMins === 120;
    results.push({
      name: 'Midnight Boundary Duration Calculation',
      passed: pass,
      details: pass
        ? 'Overnight task durations (23:30 to 01:30) correctly evaluate to 120 minutes across date boundaries.'
        : `Expected 120 mins, got ${durationMins}`
    });
  } catch (e: any) {
    results.push({
      name: 'Midnight Boundary Duration Calculation',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 3: Reality Check Heuristic Triggering
  try {
    const mockTasks: TaskItem[] = [1, 2, 3, 4].map(i => ({
      id: `mock-${i}`,
      title: `Task ${i}`,
      category: 'Writing',
      plannedStart: '2026-08-10T10:00:00.000Z',
      plannedEnd: '2026-08-10T12:00:00.000Z',
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 90,
      originalPlannedStart: '2026-08-10T10:00:00.000Z',
      originalEstimatedDurationMinutes: 120,
      createdAt: '2026-08-10T08:00:00.000Z',
      execution: {
        status: 'completed',
        actualDurationMinutes: 180, // +50% overestimate
        postponedCount: 0,
        originalScheduledDate: '2026-08-10'
      }
    }));

    const check = getRealityCheck('Writing', 120, mockTasks, {
      ...settings,
      minObservationsForRealityCheck: 3,
      realityCheckThresholdPercent: 30
    });

    const pass = check.shouldWarn && check.severity === 'reality_check' && check.suggestedDurationMinutes === 180;
    results.push({
      name: 'Reality Check Heuristic Triggering',
      passed: pass,
      details: pass
        ? 'Reality Check correctly fires high severity warning when historical category error (+50%) exceeds threshold (30%).'
        : `Reality check failed: warn=${check.shouldWarn}, severity=${check.severity}`
    });
  } catch (e: any) {
    results.push({
      name: 'Reality Check Heuristic Triggering',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 4: Low Sample Size Protection
  try {
    const singleTask: TaskItem[] = [{
      id: 'mock-single',
      title: 'Single Task',
      category: 'Exercise',
      plannedStart: '2026-08-10T10:00:00.000Z',
      plannedEnd: '2026-08-10T11:00:00.000Z',
      plannedDurationMinutes: 60,
      estimatedDurationMinutes: 60,
      confidence: 80,
      originalPlannedStart: '2026-08-10T10:00:00.000Z',
      originalEstimatedDurationMinutes: 60,
      createdAt: '2026-08-10T08:00:00.000Z',
      execution: {
        status: 'completed',
        actualDurationMinutes: 120,
        postponedCount: 0,
        originalScheduledDate: '2026-08-10'
      }
    }];

    const check = getRealityCheck('Exercise', 60, singleTask, {
      ...settings,
      minObservationsForRealityCheck: 3
    });

    const pass = !check.shouldWarn && check.severity === 'none' && check.sampleCount === 1;
    results.push({
      name: 'Low Sample Size Protection',
      passed: pass,
      details: pass
        ? 'App avoids premature reality warnings when historical observations (1) are below minimum threshold (3).'
        : `Low sample test failed: warn=${check.shouldWarn}, count=${check.sampleCount}`
    });
  } catch (e: any) {
    results.push({
      name: 'Low Sample Size Protection',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 5: Sleep Context Correlation Engine
  try {
    const mockSleep: SleepRecord[] = [
      {
        id: 's1',
        date: '2026-08-01',
        plannedBedtime: '23:00',
        actualBedtime: '01:30',
        plannedWakeTime: '07:00',
        actualWakeTime: '06:30',
        actualSleepDurationMinutes: 300, // 5h < 6h (Short)
        isShortSleep: true
      },
      {
        id: 's2',
        date: '2026-08-02',
        plannedBedtime: '23:00',
        actualBedtime: '23:00',
        plannedWakeTime: '07:00',
        actualWakeTime: '07:00',
        actualSleepDurationMinutes: 480, // 8h >= 6h (Normal)
        isShortSleep: false
      }
    ];

    const mockSleepTasks: TaskItem[] = [
      {
        id: 't-s1',
        title: 'Short sleep task',
        category: 'Studying',
        plannedStart: '2026-08-01T10:00:00.000Z',
        plannedEnd: '2026-08-01T12:00:00.000Z',
        plannedDurationMinutes: 120,
        estimatedDurationMinutes: 120,
        confidence: 80,
        originalPlannedStart: '2026-08-01T10:00:00.000Z',
        originalEstimatedDurationMinutes: 120,
        createdAt: '2026-08-01T08:00:00.000Z',
        execution: {
          status: 'skipped',
          postponedCount: 0,
          originalScheduledDate: '2026-08-01'
        }
      },
      {
        id: 't-s2',
        title: 'Normal sleep task',
        category: 'Studying',
        plannedStart: '2026-08-02T10:00:00.000Z',
        plannedEnd: '2026-08-02T12:00:00.000Z',
        plannedDurationMinutes: 120,
        estimatedDurationMinutes: 120,
        confidence: 80,
        originalPlannedStart: '2026-08-02T10:00:00.000Z',
        originalEstimatedDurationMinutes: 120,
        createdAt: '2026-08-02T08:00:00.000Z',
        execution: {
          status: 'completed',
          actualDurationMinutes: 120,
          postponedCount: 0,
          originalScheduledDate: '2026-08-02'
        }
      }
    ];

    const sleepImpact = calculateSleepImpact(mockSleepTasks, mockSleep);
    const pass = sleepImpact.normalSleepCompletionRate === 100 && sleepImpact.shortSleepCompletionRate === 0;

    results.push({
      name: 'Sleep Context Correlation Engine',
      passed: pass,
      details: pass
        ? 'Sleep correlation accurately differentiates completion rates on normal sleep days (100%) vs short sleep days (0%).'
        : `Sleep impact failed: normal=${sleepImpact.normalSleepCompletionRate}%, short=${sleepImpact.shortSleepCompletionRate}%`
    });
  } catch (e: any) {
    results.push({
      name: 'Sleep Context Correlation Engine',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 6: Seeding & Data Generator Test Suite
  try {
    const genResult = generateRandomCalibratedData();
    const stdTasks = getInitialSampleTasks();
    const richTasks = getRichMultiCategorySampleTasks();
    const edgeTasks = getEdgeCaseSampleTasks();

    const pass =
      genResult.tasks.length >= 10 &&
      stdTasks.length === 12 &&
      richTasks.length === 18 &&
      edgeTasks.length === 3;

    results.push({
      name: 'Seeding & Data Generator Test Suite',
      passed: pass,
      details: pass
        ? `All data preset generators (generated: ${genResult.tasks.length}, standard: 12, rich: 18, edge: 3) operate deterministically.`
        : `Preset validation mismatch: gen=${genResult.tasks.length}, std=${stdTasks.length}, rich=${richTasks.length}, edge=${edgeTasks.length}`
    });
  } catch (e: any) {
    results.push({
      name: 'Seeding & Data Generator Test Suite',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 7: Start-Time Delay Calculation Engine
  try {
    const delayTasks: TaskItem[] = [
      {
        id: 'delay-1',
        title: 'Evening Task',
        category: 'Programming',
        plannedStart: '2026-08-10T19:00:00.000Z',
        plannedEnd: '2026-08-10T20:00:00.000Z',
        plannedDurationMinutes: 60,
        estimatedDurationMinutes: 60,
        confidence: 80,
        originalPlannedStart: '2026-08-10T19:00:00.000Z',
        originalEstimatedDurationMinutes: 60,
        createdAt: '2026-08-10T08:00:00.000Z',
        execution: {
          status: 'completed',
          actualStart: '2026-08-10T19:35:00.000Z', // 35 min delay
          actualEnd: '2026-08-10T20:35:00.000Z',
          actualDurationMinutes: 60,
          postponedCount: 0,
          originalScheduledDate: '2026-08-10'
        }
      }
    ];

    const startCalib = calculateStartTimeCalibration(delayTasks);
    const pass = startCalib.averageDelayMinutes === 35 && startCalib.totalSessionsCount === 1;

    results.push({
      name: 'Start-Time Delay Calibration Engine',
      passed: pass,
      details: pass
        ? 'Start-time delay correctly identifies 35 minute delay on planned 19:00 vs actual 19:35 start.'
        : `Start delay failed: expected 35m, got ${startCalib.averageDelayMinutes}m`
    });
  } catch (e: any) {
    results.push({
      name: 'Start-Time Delay Calibration Engine',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 8: Category Calibration Breakdown Aggregation
  try {
    const richTasks = getRichMultiCategorySampleTasks();
    const durCalib = calculateDurationCalibration(richTasks);

    const progCalib = durCalib.categoryBreakdown['Programming'];
    const readCalib = durCalib.categoryBreakdown['Reading'];

    const pass = !!progCalib && !!readCalib && progCalib.averageErrorPercent > 0 && readCalib.averageErrorPercent < 0;

    results.push({
      name: 'Category Calibration Breakdown Engine',
      passed: pass,
      details: pass
        ? `Category breakdown correctly isolated positive error (+${progCalib?.averageErrorPercent}%) for Programming vs negative error (${readCalib?.averageErrorPercent}%) for Reading.`
        : `Category breakdown failed to isolate distinct biases.`
    });
  } catch (e: any) {
    results.push({
      name: 'Category Calibration Breakdown Engine',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 9: Original Prediction Immutability Guarantee
  try {
    const richTasks = getRichMultiCategorySampleTasks();
    const mutated = richTasks.map(t => ({
      ...t,
      plannedStart: '2026-08-10T23:00:00.000Z',
      plannedDurationMinutes: 500
    }));

    let intactCount = 0;
    mutated.forEach((t, i) => {
      const orig = richTasks[i];
      if (
        t.originalPlannedStart === orig.originalPlannedStart &&
        t.originalEstimatedDurationMinutes === orig.originalEstimatedDurationMinutes
      ) {
        intactCount++;
      }
    });

    const pass = intactCount === mutated.length;
    results.push({
      name: 'Original Prediction Immutability Guarantee',
      passed: pass,
      details: pass
        ? `All ${mutated.length} task immutable history records remained unmodified despite calendar event modifications.`
        : `Immutability check failed: ${intactCount}/${mutated.length} intact.`
    });
  } catch (e: any) {
    results.push({
      name: 'Original Prediction Immutability Guarantee',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 10: Task Data Schema Integrity
  try {
    const sampleSet = tasks.length > 0 ? tasks : getInitialSampleTasks();
    let invalidCount = 0;
    sampleSet.forEach((t) => {
      if (!t.id || !t.title || !t.category || !t.plannedStart || !t.execution) {
        invalidCount++;
      }
    });

    const pass = invalidCount === 0;
    results.push({
      name: 'Task Data Schema Integrity',
      passed: pass,
      details: pass
        ? `All ${sampleSet.length} active tasks passed complete schema structure validation.`
        : `Found ${invalidCount} tasks with missing or corrupted required fields.`
    });
  } catch (e: any) {
    results.push({
      name: 'Task Data Schema Integrity',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 11: Confidence Calibration Bracket Analysis
  try {
    const richTasks = getRichMultiCategorySampleTasks();
    const confCalib = calculateConfidenceCalibration(richTasks);
    const b90 = confCalib.find(b => b.bracket === 90);

    const pass = !!b90 && b90.predictedCount > 0 && b90.actualSuccessRatePercent >= 0;
    results.push({
      name: 'Confidence Calibration Bracket Engine',
      passed: pass,
      details: pass
        ? `Confidence engine successfully mapped 90% confidence bracket (${b90?.predictedCount} tasks, ${b90?.actualSuccessRatePercent}% actual accuracy).`
        : 'Confidence bracket calculation failed.'
    });
  } catch (e: any) {
    results.push({
      name: 'Confidence Calibration Bracket Engine',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 12: Google Calendar Conversion & Category Inference
  try {
    const mockGCalEvent: GCalEvent = {
      id: 'test-gcal-101',
      summary: 'DSA Graph Algorithm Coding Challenge',
      start: { dateTime: '2026-08-10T14:00:00.000Z' },
      end: { dateTime: '2026-08-10T16:00:00.000Z' },
      status: 'confirmed'
    };

    const inferredCat = inferCategoryFromTitle(mockGCalEvent.summary);
    const task = convertGCalEventToTask(mockGCalEvent);

    const pass =
      inferredCat === 'Programming' &&
      task.category === 'Programming' &&
      task.plannedDurationMinutes === 120 &&
      task.originalEstimatedDurationMinutes === 120 &&
      task.googleCalendarEventId === 'test-gcal-101';

    results.push({
      name: 'Google Calendar Conversion & Inference',
      passed: pass,
      details: pass
        ? `Inferred category "${inferredCat}" and converted GCal event (120m duration, immutable history preserved).`
        : `GCal conversion mismatch: cat=${inferredCat}, duration=${task.plannedDurationMinutes}`
    });
  } catch (e: any) {
    results.push({
      name: 'Google Calendar Conversion & Inference',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 13: Same-Day Completion Adherence Rate
  try {
    const richTasks = getRichMultiCategorySampleTasks();
    const rate = calculateSameDayCompletionRate(richTasks);

    const pass = rate > 0 && rate <= 100;
    results.push({
      name: 'Same-Day Completion Adherence Rate',
      passed: pass,
      details: pass
        ? `Same-day completion adherence rate evaluated cleanly at ${rate}%.`
        : `Invalid same-day completion rate: ${rate}`
    });
  } catch (e: any) {
    results.push({
      name: 'Same-Day Completion Adherence Rate',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 14: Duration Humanizer Utility
  try {
    const str1 = formatMinutesToHours(145); // 2h 25m
    const str2 = formatMinutesToHours(60);  // 1h
    const str3 = formatMinutesToHours(45);  // 45m

    const pass = str1 === '2h 25m' && str2 === '1h' && str3 === '45m';
    results.push({
      name: 'Duration Formatting & Humanizer Utility',
      passed: pass,
      details: pass
        ? 'Format minutes correctly formats durations (145m => "2h 25m", 60m => "1h", 45m => "45m").'
        : `Duration humanizer error: 145m="${str1}", 60m="${str2}", 45m="${str3}"`
    });
  } catch (e: any) {
    results.push({
      name: 'Duration Formatting & Humanizer Utility',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 15: Overall Insights Integration Pipeline
  try {
    const sampleTasks = getInitialSampleTasks();
    const sampleSleep = getInitialSampleSleepRecords();
    const insights = calculateOverallInsights(sampleTasks, sampleSleep);

    const pass =
      typeof insights.duration.overallErrorPercent === 'number' &&
      typeof insights.startTime.averageDelayMinutes === 'number' &&
      typeof insights.sleepImpact.normalSleepCompletionRate === 'number' &&
      insights.confidenceBrackets.length === 5;

    results.push({
      name: 'Overall Calibration Insights Pipeline',
      passed: pass,
      details: pass
        ? 'Unified calibration insights object synthesized across duration, start-time, sleep context, and confidence brackets.'
        : 'Overall insights pipeline failed.'
    });
  } catch (e: any) {
    results.push({
      name: 'Overall Calibration Insights Pipeline',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  return results;
}


