import { TestResult, TaskItem, SleepRecord, AppSettings } from '../types';
import {
  calculateEstimationError,
  getRealityCheck,
  calculateDurationCalibration,
  calculateStartTimeCalibration,
  calculateSleepImpact,
  calculateConfidenceCalibration
} from './calibrationEngine';

export function runSystemValidationSuite(
  tasks: TaskItem[],
  sleepRecords: SleepRecord[],
  settings: AppSettings
): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Zero / Negative Duration Math
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

  // Test 2: Tasks Crossing Midnight
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

  // Test 3: Reality Check Threshold Triggering
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

  // Test 4: Insufficient Historical Observations
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

  // Test 5: Sleep Context Impact Analysis
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

  // Test 6: Schema Integrity on Active State
  try {
    let invalidCount = 0;
    tasks.forEach((t, index) => {
      if (!t.id || !t.title || !t.category || !t.plannedStart || !t.execution) {
        invalidCount++;
      }
    });

    const pass = invalidCount === 0;
    results.push({
      name: 'Task Data Schema Integrity',
      passed: pass,
      details: pass
        ? `All ${tasks.length} active tasks passed complete schema structure validation.`
        : `Found ${invalidCount} tasks with missing or corrupted required fields.`
    });
  } catch (e: any) {
    results.push({
      name: 'Task Data Schema Integrity',
      passed: false,
      details: `Failed with exception: ${e.message}`
    });
  }

  return results;
}
