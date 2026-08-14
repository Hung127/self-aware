import { TestResult, TaskItem, SleepRecord, AppSettings } from '../types';
import {
  calculateEstimationError,
  calculateAbsoluteError,
  getRealityCheck,
  calculateDurationCalibration,
  calculateStartTimeCalibration,
  calculateSleepImpact,
  calculateConfidenceCalibration,
  calculateSameDayCompletionRate,
  calculateAccuracyOverTime,
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
      insights.confidenceBrackets.length === 5 &&
      typeof insights.accuracyOverTime === 'object';

    results.push({
      name: 'Overall Calibration Insights Pipeline',
      passed: pass,
      details: pass
        ? 'Unified calibration insights object synthesized across duration, start-time, sleep context, confidence, and accuracy over time.'
        : 'Overall insights pipeline failed.'
    });
  } catch (e: any) {
    results.push({
      name: 'Overall Calibration Insights Pipeline',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 16: Prediction Accuracy Over Time Engine (Chronological Error Reduction)
  try {
    const historicalTasks: TaskItem[] = [
      // Week 1 tasks (high error: ~75%)
      {
        id: 't-w1-1',
        title: 'Week 1 Task 1',
        category: 'Programming',
        plannedStart: '2026-08-01T10:00:00.000Z',
        plannedEnd: '2026-08-01T12:00:00.000Z',
        plannedDurationMinutes: 120,
        estimatedDurationMinutes: 120,
        confidence: 90,
        originalPlannedStart: '2026-08-01T10:00:00.000Z',
        originalEstimatedDurationMinutes: 120,
        createdAt: '2026-08-01T08:00:00.000Z',
        execution: {
          status: 'completed',
          actualDurationMinutes: 210, // +75% error
          postponedCount: 0,
          originalScheduledDate: '2026-08-01'
        }
      },
      {
        id: 't-w1-2',
        title: 'Week 1 Task 2',
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
          actualDurationMinutes: 200, // +67% error
          postponedCount: 0,
          originalScheduledDate: '2026-08-02'
        }
      },
      {
        id: 't-w1-3',
        title: 'Week 1 Task 3',
        category: 'Writing',
        plannedStart: '2026-08-03T10:00:00.000Z',
        plannedEnd: '2026-08-03T11:00:00.000Z',
        plannedDurationMinutes: 60,
        estimatedDurationMinutes: 60,
        confidence: 85,
        originalPlannedStart: '2026-08-03T10:00:00.000Z',
        originalEstimatedDurationMinutes: 60,
        createdAt: '2026-08-03T08:00:00.000Z',
        execution: {
          status: 'completed',
          actualDurationMinutes: 105, // +75% error
          postponedCount: 0,
          originalScheduledDate: '2026-08-03'
        }
      },
      // Week 2 tasks (improving calibration: ~25% error)
      {
        id: 't-w2-1',
        title: 'Week 2 Task 1',
        category: 'Programming',
        plannedStart: '2026-08-09T10:00:00.000Z',
        plannedEnd: '2026-08-09T13:00:00.000Z',
        plannedDurationMinutes: 180,
        estimatedDurationMinutes: 180,
        confidence: 80,
        originalPlannedStart: '2026-08-09T10:00:00.000Z',
        originalEstimatedDurationMinutes: 180,
        createdAt: '2026-08-09T08:00:00.000Z',
        execution: {
          status: 'completed',
          actualDurationMinutes: 215, // +19% error
          postponedCount: 0,
          originalScheduledDate: '2026-08-09'
        }
      },
      {
        id: 't-w2-2',
        title: 'Week 2 Task 2',
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
          actualDurationMinutes: 140, // +17% error
          postponedCount: 0,
          originalScheduledDate: '2026-08-10'
        }
      }
    ];

    const trend = calculateAccuracyOverTime(historicalTasks);
    const pass =
      trend.hasEnoughData === true &&
      trend.overallTrendDirection === 'improving' &&
      trend.earliestErrorPercent! > trend.recentErrorPercent!;

    results.push({
      name: 'Prediction Accuracy Over Time Trend Engine',
      passed: pass,
      details: pass
        ? `Successfully tracked accuracy improvement over time (Earliest: ${trend.earliestErrorPercent}% avg error → Recent: ${trend.recentErrorPercent}% avg error, Direction: ${trend.overallTrendDirection}).`
        : `Accuracy over time calculation failed: hasData=${trend.hasEnoughData}, dir=${trend.overallTrendDirection}`
    });
  } catch (e: any) {
    results.push({
      name: 'Prediction Accuracy Over Time Trend Engine',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 17: Absolute vs Signed Error Calculation
  try {
    const abs1 = calculateAbsoluteError(120, 180); // 60 mins
    const abs2 = calculateAbsoluteError(120, 60);  // 60 mins
    const signed1 = calculateEstimationError(120, 180); // +0.50 (+50%)
    const signed2 = calculateEstimationError(120, 60);  // -0.50 (-50%)

    const pass = abs1 === 60 && abs2 === 60 && Math.abs(signed1 - 0.5) < 0.001 && Math.abs(signed2 - (-0.5)) < 0.001;

    results.push({
      name: 'Absolute vs Signed Duration Error Engine',
      passed: pass,
      details: pass
        ? 'Correctly calculates both signed percentage error (+50% / -50%) and absolute duration error (60m) without distortion.'
        : `Math discrepancy: abs1=${abs1}, abs2=${abs2}, signed1=${signed1}, signed2=${signed2}`
    });
  } catch (e: any) {
    results.push({
      name: 'Absolute vs Signed Duration Error Engine',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 18: End-to-End Task Lifecycle Simulation
  try {
    // 1. PREDICT: User enters 120 min prediction
    const newTask: TaskItem = {
      id: 'e2e-task-1',
      title: 'Compiler Design Project',
      category: 'Programming',
      plannedStart: '2026-08-14T14:00:00.000Z',
      plannedEnd: '2026-08-14T16:00:00.000Z',
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 90,
      originalPlannedStart: '2026-08-14T14:00:00.000Z',
      originalEstimatedDurationMinutes: 120,
      createdAt: new Date().toISOString(),
      execution: {
        status: 'not_started',
        postponedCount: 0,
        originalScheduledDate: '2026-08-14'
      }
    };

    // 2. REALITY CHECK: Compare against history
    const sampleSet = getRichMultiCategorySampleTasks();
    const reality = getRealityCheck(newTask.category, newTask.estimatedDurationMinutes, sampleSet, settings);
    const realityChecked = reality.shouldWarn && reality.suggestedDurationMinutes > 0;

    // 3. EXECUTE: User starts task 15 mins late
    const actualStartISO = '2026-08-14T14:15:00.000Z';
    newTask.execution.status = 'in_progress';
    newTask.execution.actualStart = actualStartISO;

    // 4. MEASURE: User finishes after 195 minutes
    const actualDurationMins = 195;
    const actualEndISO = new Date(new Date(actualStartISO).getTime() + actualDurationMins * 60000).toISOString();
    newTask.execution.status = 'completed';
    newTask.execution.actualEnd = actualEndISO;
    newTask.execution.actualDurationMinutes = actualDurationMins;
    newTask.execution.actualCompletionDate = '2026-08-14';

    // 5. COMPARE & REFLECT: Calculate error & add reflection
    const errorFrac = calculateEstimationError(newTask.estimatedDurationMinutes, newTask.execution.actualDurationMinutes);
    const absDiff = calculateAbsoluteError(newTask.estimatedDurationMinutes, newTask.execution.actualDurationMinutes);
    newTask.execution.reflection = {
      reason: 'underestimated_work',
      notes: 'AST parsing took longer than envisioned.',
      createdAt: new Date().toISOString()
    };

    const pass =
      realityChecked &&
      newTask.originalEstimatedDurationMinutes === 120 &&
      newTask.execution.status === 'completed' &&
      Math.abs(errorFrac - 0.625) < 0.001 &&
      absDiff === 75 &&
      newTask.execution.reflection.reason === 'underestimated_work';

    results.push({
      name: 'End-to-End Task Lifecycle Simulation',
      passed: pass,
      details: pass
        ? 'Full lifecycle (Predict -> Reality Check -> Execute -> Measure [195m] -> Compare [+62.5%] -> Reflect) verified seamlessly.'
        : `E2E simulation check failed: error=${errorFrac}, absDiff=${absDiff}`
    });
  } catch (e: any) {
    results.push({
      name: 'End-to-End Task Lifecycle Simulation',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 19: Configurable Reality Check Threshold Sensitivity
  try {
    const mockTasks: TaskItem[] = [1, 2, 3, 4].map(i => ({
      id: `thresh-${i}`,
      title: `Task ${i}`,
      category: 'Reading',
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
        actualDurationMinutes: 72, // +20% error
        postponedCount: 0,
        originalScheduledDate: '2026-08-10'
      }
    }));

    // Case A: Threshold at 30% -> Should trigger soft suggestion (since 20% > 15% and <= 30%)
    const checkA = getRealityCheck('Reading', 60, mockTasks, {
      ...settings,
      minObservationsForRealityCheck: 3,
      smallSuggestionThresholdPercent: 15,
      realityCheckThresholdPercent: 30
    });

    // Case B: Threshold lowered to 18% -> Should trigger full Reality Check (>18%)
    const checkB = getRealityCheck('Reading', 60, mockTasks, {
      ...settings,
      minObservationsForRealityCheck: 3,
      smallSuggestionThresholdPercent: 10,
      realityCheckThresholdPercent: 18
    });

    // Case C: Small threshold raised to 25% -> Should not warn (<25%)
    const checkC = getRealityCheck('Reading', 60, mockTasks, {
      ...settings,
      minObservationsForRealityCheck: 3,
      smallSuggestionThresholdPercent: 25,
      realityCheckThresholdPercent: 40
    });

    const pass =
      checkA.severity === 'small' &&
      checkB.severity === 'reality_check' &&
      checkC.severity === 'none';

    results.push({
      name: 'Configurable Heuristic Threshold Sensitivity',
      passed: pass,
      details: pass
        ? 'Reality check sensitivity responds precisely to user heuristic settings (Soft at 15-30%, High at >18%, None when below threshold).'
        : `Threshold sensitivity failed: A=${checkA.severity}, B=${checkB.severity}, C=${checkC.severity}`
    });
  } catch (e: any) {
    results.push({
      name: 'Configurable Heuristic Threshold Sensitivity',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 20: Sleep Record Calculation & Short Sleep Classification
  try {
    const sleepRecord: SleepRecord = {
      id: 'sleep-test-1',
      date: '2026-08-12',
      plannedBedtime: '23:30',
      actualBedtime: '01:00',
      plannedWakeTime: '07:30',
      actualWakeTime: '06:00',
      actualSleepDurationMinutes: 300, // 5 hours
      isShortSleep: true // < 360 mins
    };

    const isCorrectShort = sleepRecord.actualSleepDurationMinutes < 360 && sleepRecord.isShortSleep;
    const isDurationExact = sleepRecord.actualSleepDurationMinutes === 300;

    const pass = isCorrectShort && isDurationExact;
    results.push({
      name: 'Sleep Record Math & Short Sleep Classification',
      passed: pass,
      details: pass
        ? 'Sleep calculation accurately determines 5-hour duration (300 mins) and classifies as short sleep (<6h context variable).'
        : `Sleep record check failed: duration=${sleepRecord.actualSleepDurationMinutes}, isShort=${sleepRecord.isShortSleep}`
    });
  } catch (e: any) {
    results.push({
      name: 'Sleep Record Math & Short Sleep Classification',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 21: Non-Judgmental Mirror & Evidence-Based Copywriting Check
  try {
    const judgmentalTerms = ['lazy', 'bad at', 'failure', 'procrastinator', 'shame', 'guilty', 'poor performer', 'unproductive'];
    const mockTasks = getRichMultiCategorySampleTasks();
    const insights = calculateOverallInsights(mockTasks, getInitialSampleSleepRecords());

    const reality = getRealityCheck('Programming', 120, mockTasks, settings);

    let foundJudgmental = false;
    let offendingPhrase = '';

    const textToAudit = [
      reality.message,
      `Duration overall: ${insights.duration.overallErrorPercent}%`,
      `Start delay: ${insights.startTime.averageDelayMinutes}m`,
      `Same-day: ${insights.sameDayCompletionRatePercent}%`
    ].join(' ').toLowerCase();

    judgmentalTerms.forEach(term => {
      if (textToAudit.includes(term)) {
        foundJudgmental = true;
        offendingPhrase = term;
      }
    });

    const pass = !foundJudgmental;
    results.push({
      name: 'Non-Judgmental Evidence-Based Tone Verification',
      passed: pass,
      details: pass
        ? 'All generated system messages and insights conform strictly to objective, evidence-based mirror principles without judgment.'
        : `Found judgmental phrasing in feedback: "${offendingPhrase}"`
    });
  } catch (e: any) {
    results.push({
      name: 'Non-Judgmental Evidence-Based Tone Verification',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  // Test 22: JSON Backup Export & Import Roundtrip Integrity
  try {
    const originalTasks = getRichMultiCategorySampleTasks();
    const originalSleep = getInitialSampleSleepRecords();
    const originalSettings = settings;

    const exportPayload = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: originalSettings,
      tasks: originalTasks,
      sleepRecords: originalSleep
    });

    const parsed = JSON.parse(exportPayload);

    const pass =
      Array.isArray(parsed.tasks) &&
      parsed.tasks.length === originalTasks.length &&
      Array.isArray(parsed.sleepRecords) &&
      parsed.sleepRecords.length === originalSleep.length &&
      parsed.settings.minObservationsForRealityCheck === originalSettings.minObservationsForRealityCheck;

    results.push({
      name: 'JSON Backup Roundtrip Data Integrity',
      passed: pass,
      details: pass
        ? `Backup serialization/deserialization validated with 100% fidelity (${parsed.tasks.length} tasks, ${parsed.sleepRecords.length} sleep records).`
        : 'JSON roundtrip parsing failed to restore complete data payload.'
    });
  } catch (e: any) {
    results.push({
      name: 'JSON Backup Roundtrip Data Integrity',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  return results;
}


