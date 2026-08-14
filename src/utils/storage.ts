import { TaskItem, SleepRecord, AppSettings, TaskCategory } from '../types';

const TASKS_KEY = 'personal_calibration_tasks_v1';
const SLEEP_KEY = 'personal_calibration_sleep_v1';
const SETTINGS_KEY = 'personal_calibration_settings_v1';
export const STORAGE_SCHEMA_VERSION = 'v1';

export const DEFAULT_SETTINGS: AppSettings = {
  googleCalendarConnected: false,
  autoImportGCal: true,
  minObservationsForRealityCheck: 5,
  smallSuggestionThresholdPercent: 15,
  realityCheckThresholdPercent: 30,
};

// Generate realistic sample dates relative to current date
function getPastDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getInitialSampleTasks(): TaskItem[] {
  const today = getTodayStr();
  const d1 = getPastDateStr(1);
  const d2 = getPastDateStr(2);
  const d3 = getPastDateStr(3);
  const d4 = getPastDateStr(4);
  const d5 = getPastDateStr(5);

  return [
    // --- TODAY TASKS ---
    {
      id: 'task-today-1',
      title: 'ML Assignment & Model Fine-Tuning',
      category: 'Programming',
      plannedStart: `${today}T14:00:00.000Z`,
      plannedEnd: `${today}T16:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 90,
      originalPlannedStart: `${today}T14:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${today}T08:00:00.000Z`,
      googleCalendarEventId: 'gcal-today-1',
      execution: {
        status: 'not_started',
        postponedCount: 0,
        originalScheduledDate: today,
      }
    },
    {
      id: 'task-today-2',
      title: 'Data Structures & Algorithms Practice',
      category: 'Studying',
      plannedStart: `${today}T19:00:00.000Z`,
      plannedEnd: `${today}T21:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 80,
      originalPlannedStart: `${today}T19:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${today}T08:30:00.000Z`,
      execution: {
        status: 'not_started',
        postponedCount: 0,
        originalScheduledDate: today,
      }
    },
    {
      id: 'task-today-3',
      title: 'Morning Code Review & Standup Prep',
      category: 'Programming',
      plannedStart: `${today}T09:00:00.000Z`,
      plannedEnd: `${today}T10:00:00.000Z`,
      plannedDurationMinutes: 60,
      estimatedDurationMinutes: 60,
      confidence: 95,
      originalPlannedStart: `${today}T09:00:00.000Z`,
      originalEstimatedDurationMinutes: 60,
      createdAt: `${today}T07:30:00.000Z`,
      googleCalendarEventId: 'gcal-today-0',
      execution: {
        status: 'completed',
        actualStart: `${today}T09:05:00.000Z`,
        actualEnd: `${today}T10:15:00.000Z`,
        actualDurationMinutes: 70,
        postponedCount: 0,
        originalScheduledDate: today,
        actualCompletionDate: today,
        reflection: {
          reason: 'underestimated_work',
          notes: 'Extra PR comments required additional context reading.',
          createdAt: `${today}T10:15:00.000Z`
        }
      }
    },

    // --- PAST HISTORICAL TASKS FOR CALIBRATION (PROGRAMMING: Underestimated ~43%) ---
    {
      id: 'task-hist-1',
      title: 'React Dashboard Refactoring',
      category: 'Programming',
      plannedStart: `${d1}T10:00:00.000Z`,
      plannedEnd: `${d1}T12:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 90,
      originalPlannedStart: `${d1}T10:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d1}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d1}T10:12:00.000Z`,
        actualEnd: `${d1}T13:32:00.000Z`,
        actualDurationMinutes: 200, // 3h 20m vs 2h (+66%)
        postponedCount: 0,
        originalScheduledDate: d1,
        actualCompletionDate: d1,
        reflection: {
          reason: 'harder_than_expected',
          notes: 'Component state splitting took longer than expected.',
          createdAt: `${d1}T13:32:00.000Z`
        }
      }
    },
    {
      id: 'task-hist-2',
      title: 'Backend API Endpoint Optimization',
      category: 'Programming',
      plannedStart: `${d2}T14:00:00.000Z`,
      plannedEnd: `${d2}T17:00:00.000Z`,
      plannedDurationMinutes: 180,
      estimatedDurationMinutes: 180,
      confidence: 90,
      originalPlannedStart: `${d2}T14:00:00.000Z`,
      originalEstimatedDurationMinutes: 180,
      createdAt: `${d2}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d2}T14:05:00.000Z`,
        actualEnd: `${d2}T18:10:00.000Z`,
        actualDurationMinutes: 245, // 4h 5m vs 3h (+36%)
        postponedCount: 0,
        originalScheduledDate: d2,
        actualCompletionDate: d2,
        reflection: {
          reason: 'unexpected_problem',
          notes: 'Database migration scripts had edge-case type errors.',
          createdAt: `${d2}T18:10:00.000Z`
        }
      }
    },
    {
      id: 'task-hist-3',
      title: 'PostgreSQL Database Indexing',
      category: 'Programming',
      plannedStart: `${d3}T11:00:00.000Z`,
      plannedEnd: `${d3}T13:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 80,
      originalPlannedStart: `${d3}T11:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d3}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d3}T11:20:00.000Z`,
        actualEnd: `${d3}T14:40:00.000Z`,
        actualDurationMinutes: 200, // 3h 20m vs 2h (+66%)
        postponedCount: 0,
        originalScheduledDate: d3,
        actualCompletionDate: d3,
      }
    },
    {
      id: 'task-hist-4',
      title: 'TypeScript Type Guard Setup',
      category: 'Programming',
      plannedStart: `${d4}T15:00:00.000Z`,
      plannedEnd: `${d4}T17:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 90,
      originalPlannedStart: `${d4}T15:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d4}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d4}T15:00:00.000Z`,
        actualEnd: `${d4}T17:40:00.000Z`,
        actualDurationMinutes: 160, // 2h 40m vs 2h (+33%)
        postponedCount: 0,
        originalScheduledDate: d4,
        actualCompletionDate: d4,
      }
    },

    // --- STUDYING & WRITING TASKS ---
    {
      id: 'task-hist-5',
      title: 'Operating Systems Chapter 4 Reading',
      category: 'Studying',
      plannedStart: `${d1}T19:00:00.000Z`,
      plannedEnd: `${d1}T21:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 80,
      originalPlannedStart: `${d1}T19:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d1}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d1}T19:38:00.000Z`, // Started 38 mins late (evening task delay pattern)
        actualEnd: `${d1}T22:18:00.000Z`,
        actualDurationMinutes: 160,
        postponedCount: 0,
        originalScheduledDate: d1,
        actualCompletionDate: d1,
        reflection: {
          reason: 'started_late',
          notes: 'Dinner ran longer than expected.',
          createdAt: `${d1}T22:18:00.000Z`
        }
      }
    },
    {
      id: 'task-hist-6',
      title: 'System Architecture Documentation',
      category: 'Writing',
      plannedStart: `${d2}T19:30:00.000Z`,
      plannedEnd: `${d2}T21:00:00.000Z`,
      plannedDurationMinutes: 90,
      estimatedDurationMinutes: 90,
      confidence: 70,
      originalPlannedStart: `${d2}T19:30:00.000Z`,
      originalEstimatedDurationMinutes: 90,
      createdAt: `${d2}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d2}T20:05:00.000Z`, // Evening delay 35 mins
        actualEnd: `${d2}T21:45:00.000Z`,
        actualDurationMinutes: 100,
        postponedCount: 0,
        originalScheduledDate: d2,
        actualCompletionDate: d2,
      }
    },
    {
      id: 'task-hist-7',
      title: 'Research Paper Literature Review',
      category: 'Reading',
      plannedStart: `${d5}T13:00:00.000Z`,
      plannedEnd: `${d5}T15:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 80,
      originalPlannedStart: `${d5}T13:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d5}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d5}T13:00:00.000Z`,
        actualEnd: `${d5}T15:15:00.000Z`,
        actualDurationMinutes: 135,
        postponedCount: 0,
        originalScheduledDate: d5,
        actualCompletionDate: d5,
      }
    },

    // --- SHORT SLEEP IMPACT EXAMPLE TASKS (d3 was short sleep < 6h) ---
    {
      id: 'task-hist-8',
      title: 'Linear Algebra Problem Set',
      category: 'Studying',
      plannedStart: `${d3}T16:00:00.000Z`,
      plannedEnd: `${d3}T18:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 90,
      originalPlannedStart: `${d3}T16:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d3}T08:00:00.000Z`,
      execution: {
        status: 'postponed',
        postponedCount: 2,
        originalScheduledDate: d3,
        reflection: {
          reason: 'was_tired',
          notes: 'Felt severely fatigued after only 5 hours sleep.',
          createdAt: `${d3}T18:00:00.000Z`
        }
      }
    },
    {
      id: 'task-hist-9',
      title: 'Weekly Gym Workout Session',
      category: 'Exercise',
      plannedStart: `${d3}T18:30:00.000Z`,
      plannedEnd: `${d3}T19:30:00.000Z`,
      plannedDurationMinutes: 60,
      estimatedDurationMinutes: 60,
      confidence: 80,
      originalPlannedStart: `${d3}T18:30:00.000Z`,
      originalEstimatedDurationMinutes: 60,
      createdAt: `${d3}T08:00:00.000Z`,
      execution: {
        status: 'skipped',
        postponedCount: 0,
        originalScheduledDate: d3,
        reflection: {
          reason: 'was_tired',
          notes: 'Low energy day.',
          createdAt: `${d3}T19:30:00.000Z`
        }
      }
    }
  ];
}

export function getInitialSampleSleepRecords(): SleepRecord[] {
  const today = getTodayStr();
  const d1 = getPastDateStr(1);
  const d2 = getPastDateStr(2);
  const d3 = getPastDateStr(3);
  const d4 = getPastDateStr(4);
  const d5 = getPastDateStr(5);

  return [
    {
      id: `sleep-${today}`,
      date: today,
      plannedBedtime: '23:00',
      actualBedtime: '01:10',
      plannedWakeTime: '07:00',
      actualWakeTime: '07:05',
      actualSleepDurationMinutes: 355, // 5h 55m (< 6h -> Short sleep)
      isShortSleep: true,
    },
    {
      id: `sleep-${d1}`,
      date: d1,
      plannedBedtime: '23:00',
      actualBedtime: '23:15',
      plannedWakeTime: '07:00',
      actualWakeTime: '07:15',
      actualSleepDurationMinutes: 480, // 8h 0m
      isShortSleep: false,
    },
    {
      id: `sleep-${d2}`,
      date: d2,
      plannedBedtime: '23:00',
      actualBedtime: '23:30',
      plannedWakeTime: '07:00',
      actualWakeTime: '07:20',
      actualSleepDurationMinutes: 470, // 7h 50m
      isShortSleep: false,
    },
    {
      id: `sleep-${d3}`,
      date: d3,
      plannedBedtime: '23:00',
      actualBedtime: '02:00',
      plannedWakeTime: '07:00',
      actualWakeTime: '07:00',
      actualSleepDurationMinutes: 300, // 5h 0m (< 6h -> Short sleep)
      isShortSleep: true,
    },
    {
      id: `sleep-${d4}`,
      date: d4,
      plannedBedtime: '23:00',
      actualBedtime: '23:10',
      plannedWakeTime: '07:00',
      actualWakeTime: '07:30',
      actualSleepDurationMinutes: 500, // 8h 20m
      isShortSleep: false,
    },
    {
      id: `sleep-${d5}`,
      date: d5,
      plannedBedtime: '23:00',
      actualBedtime: '23:45',
      plannedWakeTime: '07:00',
      actualWakeTime: '07:15',
      actualSleepDurationMinutes: 450, // 7h 30m
      isShortSleep: false,
    }
  ];
}

export function loadTasks(): TaskItem[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return getInitialSampleTasks();
    }
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      const sample = getInitialSampleTasks();
      saveTasks(sample);
      return sample;
    }
    // Parse without type assertion, then normalize
    const parsed: any[] = JSON.parse(raw);
    if (parsed.length === 0) {
      return getInitialSampleTasks();
    }
    // Detect schema version from first task
    const schemaVersion = (parsed[0] as any).schemaVersion || 'v0';
    return parsed.map((t: any) => {
      // Legacy tasks (v0) need migration
      if (schemaVersion === 'v0') {
        return migrateTaskV0ToV1(t);
      }
      // Current schema (v1) - preserve existing fields, fill missing new fields
      return {
        // Required TaskItem fields
        id: t.id || t.id,
        title: t.title || 'Untitled task',
        category: t.category || 'Other',
        tag: t.tag,
        // Planned times
        plannedStart: t.plannedStart,
        plannedEnd: t.plannedEnd,
        plannedDurationMinutes: t.plannedDurationMinutes,
        // Calibration prediction
        estimatedDurationMinutes: t.estimatedDurationMinutes,
        confidence: typeof t.confidence === 'number' ? t.confidence : 80,
        // New v1 fields
        behavioralTaskType: t.behavioralTaskType || 'other',
        originalEstimatedDurationMinutes: t.originalEstimatedDurationMinutes,
        originalPlannedStart: t.originalPlannedStart,
        predictionStatus: t.predictionStatus || 'recorded',
        planSource: t.planSource || (t.googleCalendarEventId ? 'google_calendar' : 'manual'),
        // Metadata
        googleCalendarEventId: t.googleCalendarEventId,
        // Preserve any existing fields
        ...(t.realityCheck ? { realityCheck: t.realityCheck } : {}),
        // Mark schema version
        schemaVersion: (t as any).schemaVersion || schemaVersion
      } as TaskItem;
    });
  } catch (err) {
    console.error('Error loading tasks from localStorage:', err);
    return getInitialSampleTasks();
  }
}

/**
 * Migrate a v0 task (no explicit prediction separation) to v1 schema.
 * - originalEstimatedDurationMinutes from best available field
 * - behavioralTaskType defaults to 'other'
 * - planSource inferred from googleCalendarEventId
 */
export function migrateTaskV0ToV1(t: any): TaskItem {
  const estFrom = t.originalEstimatedDurationMinutes
    || t.estimatedDurationMinutes
    || t.plannedDurationMinutes
    || 0;

  return {
    // Required TaskItem fields
    id: t.id,
    title: t.title,
    category: t.category,
    tag: t.tag,
    // Planned times
    plannedStart: t.plannedStart,
    plannedEnd: t.plannedEnd,
    plannedDurationMinutes: t.plannedDurationMinutes,
    // Calibration prediction
    estimatedDurationMinutes: t.estimatedDurationMinutes,
    confidence: typeof t.confidence === 'number' ? t.confidence : 80,
    // New v1 fields
    behavioralTaskType: t.behavioralTaskType || 'other',
    originalEstimatedDurationMinutes: estFrom,
    originalPlannedStart: t.originalPlannedStart,
    predictionStatus: t.predictionStatus || 'recorded',
    planSource: t.planSource || (t.googleCalendarEventId ? 'google_calendar' : 'manual'),
    // Metadata
    googleCalendarEventId: t.googleCalendarEventId,
    execution: {
      status: t.execution?.status || 'not_started',
      postponedCount: t.execution?.postponedCount || 0,
      actualStart: t.execution?.actualStart,
      actualEnd: t.execution?.actualEnd,
      actualDurationMinutes: t.execution?.actualDurationMinutes,
      durationMeasurementStatus: t.execution?.durationMeasurementStatus,
      originalScheduledDate: t.execution?.originalScheduledDate,
      actualCompletionDate: t.execution?.actualCompletionDate,
      reflection: t.execution?.reflection
    },
    createdAt: t.createdAt,
    // Preserve any existing v0-specific fields
    ...(t.realityCheck ? { realityCheck: t.realityCheck } : {}),
    // Mark as migrated from legacy
    schemaVersion: 'v1'
  };
}

/**
 * Normalize imported task records from a JSON backup.
 * - v0 records are migrated to v1 schema.
 * - v1 records are re-normalized to fill missing optional fields.
 * - Invalid records (missing required fields) are rejected with a reason.
 *
 * @param raw Raw imported task records
 * @returns Normalized tasks plus a list of rejected records
 */
export function normalizeImportedTasks(raw: any[]): { tasks: TaskItem[]; rejected: string[] } {
  if (!Array.isArray(raw)) {
    return { tasks: [], rejected: ['tasks is not an array'] };
  }

  const tasks: TaskItem[] = [];
  const rejected: string[] = [];

  raw.forEach((t: any, idx: number) => {
    try {
      if (!t || typeof t !== 'object') {
        rejected.push(`Record ${idx}: not an object`);
        return;
      }
      const required = ['id', 'title', 'category', 'estimatedDurationMinutes'] as const;
      const missing = required.filter(f => t[f] === undefined || t[f] === null);
      if (missing.length > 0) {
        rejected.push(`Record ${idx} (${t.title || t.id || 'unknown'}): missing ${missing.join(', ')}`);
        return;
      }

      const recordVersion = t.schemaVersion || 'v0';
      const normalized = recordVersion === 'v0'
        ? migrateTaskV0ToV1(t)
        : {
            ...t,
            behavioralTaskType: t.behavioralTaskType || 'other',
            confidence: typeof t.confidence === 'number' ? t.confidence : 80,
            predictionStatus: t.predictionStatus || 'recorded',
            planSource: t.planSource || (t.googleCalendarEventId ? 'google_calendar' : 'manual'),
            schemaVersion: STORAGE_SCHEMA_VERSION
          } as TaskItem;

      const finalized = finalizeImportedTask(normalized, idx);
      if (finalized.ok === false) {
        rejected.push(finalized.reason);
        return;
      }
      tasks.push(finalized.task);
    } catch (e: any) {
      rejected.push(`Record ${idx} (${t?.title || t?.id || 'unknown'}): ${e?.message || 'failed to normalize'}`);
    }
  });

  return { tasks, rejected };
}

/**
 * Applies structural normalization to an imported task and validates that the
 * result is usable by the calibration engine. Non-fixable records are rejected.
 */
function finalizeImportedTask(t: TaskItem, idx: number): { ok: true; task: TaskItem } | { ok: false; reason: string } {
  const label = `Record ${idx} (${t.title || t.id || 'unknown'})`;

  if (!VALID_CATEGORIES.includes(t.category)) {
    return { ok: false, reason: `${label}: unknown category "${t.category}"` };
  }

  const confidence = typeof t.confidence === 'number' ? Math.min(100, Math.max(0, t.confidence)) : 80;
  const plannedStart = typeof t.plannedStart === 'string' ? t.plannedStart : '';
  const plannedEnd = typeof t.plannedEnd === 'string' ? t.plannedEnd : '';

  const originalScheduledDate = t.execution?.originalScheduledDate
    || plannedStart.split('T')[0]
    || new Date().toISOString().split('T')[0];

  const execution = {
    status: t.execution?.status || 'not_started',
    postponedCount: typeof t.execution?.postponedCount === 'number' ? t.execution.postponedCount : 0,
    actualStart: typeof t.execution?.actualStart === 'string' ? t.execution.actualStart : undefined,
    actualEnd: typeof t.execution?.actualEnd === 'string' ? t.execution.actualEnd : undefined,
    actualDurationMinutes: typeof t.execution?.actualDurationMinutes === 'number'
      ? Math.max(0, t.execution.actualDurationMinutes)
      : undefined,
    durationMeasurementStatus: t.execution?.durationMeasurementStatus,
    skipReason: t.execution?.skipReason,
    postponedEvents: Array.isArray(t.execution?.postponedEvents) ? t.execution.postponedEvents : undefined,
    originalScheduledDate,
    actualCompletionDate: typeof t.execution?.actualCompletionDate === 'string'
      ? t.execution.actualCompletionDate
      : undefined,
    reflection: t.execution?.reflection,
    correction: t.execution?.correction
  } as TaskItem['execution'];

  return {
    ok: true,
    task: {
      ...t,
      confidence,
      plannedStart,
      plannedEnd,
      execution,
      schemaVersion: STORAGE_SCHEMA_VERSION
    }
  };
}

const VALID_CATEGORIES: string[] = [
  'Programming', 'Studying', 'Reading', 'Writing', 'Exercise', 'Personal', 'Other'
];

export function saveTasks(tasks: TaskItem[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
  }
}

export function loadSleepRecords(): SleepRecord[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return getInitialSampleSleepRecords();
    }
    const raw = localStorage.getItem(SLEEP_KEY);
    if (!raw) {
      const sample = getInitialSampleSleepRecords();
      saveSleepRecords(sample);
      return sample;
    }
    return normalizeSleepRecords(JSON.parse(raw)).records;
  } catch (err) {
    console.error('Error loading sleep records from localStorage:', err);
    return getInitialSampleSleepRecords();
  }
}

export function saveSleepRecords(records: SleepRecord[]): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(SLEEP_KEY, JSON.stringify(records));
    }
  } catch (err) {
    console.error('Error saving sleep records to localStorage:', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return DEFAULT_SETTINGS;
    }
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return sanitizeSettings(JSON.parse(raw));
  } catch (err) {
    console.error('Error loading settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Sanitizes raw settings so stored or imported values can never violate the
 * calibration guarantees (e.g. minObservationsForRealityCheck >= 3).
 */
export function sanitizeSettings(raw: any): AppSettings {
  const base = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
  return {
    ...base,
    minObservationsForRealityCheck:
      typeof base.minObservationsForRealityCheck === 'number' && base.minObservationsForRealityCheck >= 3
        ? Math.round(base.minObservationsForRealityCheck)
        : DEFAULT_SETTINGS.minObservationsForRealityCheck,
    smallSuggestionThresholdPercent:
      typeof base.smallSuggestionThresholdPercent === 'number' && base.smallSuggestionThresholdPercent > 0
        ? Math.round(base.smallSuggestionThresholdPercent)
        : DEFAULT_SETTINGS.smallSuggestionThresholdPercent,
    realityCheckThresholdPercent:
      typeof base.realityCheckThresholdPercent === 'number' && base.realityCheckThresholdPercent > base.smallSuggestionThresholdPercent
        ? Math.round(base.realityCheckThresholdPercent)
        : DEFAULT_SETTINGS.realityCheckThresholdPercent
  };
}

/**
 * Normalizes sleep records, deriving `isShortSleep` from the recorded duration
 * so the flag can never drift out of sync with `actualSleepDurationMinutes`.
 */
export function normalizeSleepRecords(raw: any[]): { records: SleepRecord[]; rejected: string[] } {
  if (!Array.isArray(raw)) {
    return { records: [], rejected: ['sleepRecords is not an array'] };
  }
  const records: SleepRecord[] = [];
  const rejected: string[] = [];
  raw.forEach((s: any, idx: number) => {
    if (!s || typeof s !== 'object' || !s.id || !s.date) {
      rejected.push(`Sleep record ${idx}: missing id or date`);
      return;
    }
    const duration = typeof s.actualSleepDurationMinutes === 'number'
      ? Math.max(0, s.actualSleepDurationMinutes)
      : 0;
    records.push({
      id: String(s.id),
      date: String(s.date),
      plannedBedtime: typeof s.plannedBedtime === 'string' ? s.plannedBedtime : '23:00',
      actualBedtime: typeof s.actualBedtime === 'string' ? s.actualBedtime : '00:30',
      plannedWakeTime: typeof s.plannedWakeTime === 'string' ? s.plannedWakeTime : '07:00',
      actualWakeTime: typeof s.actualWakeTime === 'string' ? s.actualWakeTime : '07:00',
      actualSleepDurationMinutes: duration,
      isShortSleep: duration < 360
    });
  });
  return { records, rejected };
}

export function saveSettings(settings: AppSettings): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}

export function getRichMultiCategorySampleTasks(): TaskItem[] {
  const today = getTodayStr();
  const d1 = getPastDateStr(1);
  const d2 = getPastDateStr(2);
  const d3 = getPastDateStr(3);
  const d4 = getPastDateStr(4);
  const d5 = getPastDateStr(5);
  const d6 = getPastDateStr(6);
  const d7 = getPastDateStr(7);

  const baseTasks = getInitialSampleTasks();

  const additionalTasks: TaskItem[] = [
    // --- WRITING CATEGORY (Overestimate / Underestimate mix) ---
    {
      id: 'task-rich-1',
      title: 'Quarterly Project Reflection Essay',
      category: 'Writing',
      plannedStart: `${d4}T10:00:00.000Z`,
      plannedEnd: `${d4}T11:30:00.000Z`,
      plannedDurationMinutes: 90,
      estimatedDurationMinutes: 90,
      confidence: 90,
      originalPlannedStart: `${d4}T10:00:00.000Z`,
      originalEstimatedDurationMinutes: 90,
      createdAt: `${d4}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d4}T10:00:00.000Z`,
        actualEnd: `${d4}T12:00:00.000Z`,
        actualDurationMinutes: 120, // +33% underestimate
        postponedCount: 0,
        originalScheduledDate: d4,
        actualCompletionDate: d4,
      }
    },
    {
      id: 'task-rich-2',
      title: 'Blog Post Draft on Calibration Loops',
      category: 'Writing',
      plannedStart: `${d6}T14:00:00.000Z`,
      plannedEnd: `${d6}T16:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 80,
      originalPlannedStart: `${d6}T14:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d6}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d6}T14:00:00.000Z`,
        actualEnd: `${d6}T16:45:00.000Z`,
        actualDurationMinutes: 165, // +37.5% underestimate
        postponedCount: 0,
        originalScheduledDate: d6,
        actualCompletionDate: d6,
      }
    },

    // --- READING CATEGORY (Accurate / Slightly Faster -15%) ---
    {
      id: 'task-rich-3',
      title: 'Designing Data-Intensive Applications Ch. 3',
      category: 'Reading',
      plannedStart: `${d2}T09:00:00.000Z`,
      plannedEnd: `${d2}T10:30:00.000Z`,
      plannedDurationMinutes: 90,
      estimatedDurationMinutes: 90,
      confidence: 90,
      originalPlannedStart: `${d2}T09:00:00.000Z`,
      originalEstimatedDurationMinutes: 90,
      createdAt: `${d2}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d2}T09:00:00.000Z`,
        actualEnd: `${d2}T10:15:00.000Z`,
        actualDurationMinutes: 75, // -16% faster
        postponedCount: 0,
        originalScheduledDate: d2,
        actualCompletionDate: d2,
      }
    },
    {
      id: 'task-rich-4',
      title: 'Machine Learning Survey Paper',
      category: 'Reading',
      plannedStart: `${d7}T11:00:00.000Z`,
      plannedEnd: `${d7}T12:00:00.000Z`,
      plannedDurationMinutes: 60,
      estimatedDurationMinutes: 60,
      confidence: 95,
      originalPlannedStart: `${d7}T11:00:00.000Z`,
      originalEstimatedDurationMinutes: 60,
      createdAt: `${d7}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d7}T11:00:00.000Z`,
        actualEnd: `${d7}T11:50:00.000Z`,
        actualDurationMinutes: 50, // -16% faster
        postponedCount: 0,
        originalScheduledDate: d7,
        actualCompletionDate: d7,
      }
    },

    // --- PERSONAL & OTHER CATEGORY (Start delay ~40 mins) ---
    {
      id: 'task-rich-5',
      title: 'Tax Document Assembly & Filing',
      category: 'Personal',
      plannedStart: `${d3}T20:00:00.000Z`,
      plannedEnd: `${d3}T21:00:00.000Z`,
      plannedDurationMinutes: 60,
      estimatedDurationMinutes: 60,
      confidence: 50,
      originalPlannedStart: `${d3}T20:00:00.000Z`,
      originalEstimatedDurationMinutes: 60,
      createdAt: `${d3}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d3}T20:42:00.000Z`, // 42 min delay
        actualEnd: `${d3}T22:12:00.000Z`,
        actualDurationMinutes: 90,
        postponedCount: 1,
        originalScheduledDate: d3,
        actualCompletionDate: d3,
      }
    },
    {
      id: 'task-rich-6',
      title: 'Weekly Apartment Deep Clean',
      category: 'Personal',
      plannedStart: `${d6}T10:00:00.000Z`,
      plannedEnd: `${d6}T11:30:00.000Z`,
      plannedDurationMinutes: 90,
      estimatedDurationMinutes: 90,
      confidence: 80,
      originalPlannedStart: `${d6}T10:00:00.000Z`,
      originalEstimatedDurationMinutes: 90,
      createdAt: `${d6}T08:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d6}T10:15:00.000Z`,
        actualEnd: `${d6}T11:45:00.000Z`,
        actualDurationMinutes: 90,
        postponedCount: 0,
        originalScheduledDate: d6,
        actualCompletionDate: d6,
      }
    }
  ];

  return [...baseTasks, ...additionalTasks];
}

export function getEdgeCaseSampleTasks(): TaskItem[] {
  const today = getTodayStr();
  const d1 = getPastDateStr(1);
  const d2 = getPastDateStr(2);

  return [
    // 0 min duration / exact match task
    {
      id: 'edge-1',
      title: 'Exact 100% On-Time Task',
      category: 'Other',
      plannedStart: `${d1}T08:00:00.000Z`,
      plannedEnd: `${d1}T09:00:00.000Z`,
      plannedDurationMinutes: 60,
      estimatedDurationMinutes: 60,
      confidence: 90,
      originalPlannedStart: `${d1}T08:00:00.000Z`,
      originalEstimatedDurationMinutes: 60,
      createdAt: `${d1}T07:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d1}T08:00:00.000Z`,
        actualEnd: `${d1}T09:00:00.000Z`,
        actualDurationMinutes: 60, // Exact 0% error
        postponedCount: 0,
        originalScheduledDate: d1,
        actualCompletionDate: d1,
      }
    },
    // Overnight midnight boundary task
    {
      id: 'edge-2',
      title: 'Midnight Boundary Hackathon Sprint',
      category: 'Programming',
      plannedStart: `${d2}T23:00:00.000Z`,
      plannedEnd: `${d1}T01:00:00.000Z`,
      plannedDurationMinutes: 120,
      estimatedDurationMinutes: 120,
      confidence: 80,
      originalPlannedStart: `${d2}T23:00:00.000Z`,
      originalEstimatedDurationMinutes: 120,
      createdAt: `${d2}T20:00:00.000Z`,
      execution: {
        status: 'completed',
        actualStart: `${d2}T23:10:00.000Z`,
        actualEnd: `${d1}T01:40:00.000Z`,
        actualDurationMinutes: 150, // +25%
        postponedCount: 0,
        originalScheduledDate: d2,
        actualCompletionDate: d1,
      }
    },
    // Extremely postponed task (3x)
    {
      id: 'edge-3',
      title: 'Highly Postponed Administrative Task',
      category: 'Personal',
      plannedStart: `${today}T15:00:00.000Z`,
      plannedEnd: `${today}T16:00:00.000Z`,
      plannedDurationMinutes: 60,
      estimatedDurationMinutes: 60,
      confidence: 50,
      originalPlannedStart: `${getPastDateStr(4)}T15:00:00.000Z`,
      originalEstimatedDurationMinutes: 60,
      createdAt: `${getPastDateStr(4)}T08:00:00.000Z`,
      execution: {
        status: 'postponed',
        postponedCount: 3,
        originalScheduledDate: getPastDateStr(4),
        reflection: {
          reason: 'other',
          notes: 'Postponed 3 times due to shifting priorities.',
          createdAt: `${today}T15:00:00.000Z`
        }
      }
    }
  ];
}

export function generateRandomCalibratedData(): { tasks: TaskItem[]; sleep: SleepRecord[]; settings: AppSettings } {
  const categories: TaskCategory[] = ['Programming', 'Studying', 'Reading', 'Writing', 'Exercise', 'Personal', 'Other'];
  
  const titleTemplates: Record<TaskCategory, string[]> = {
    Programming: [
      'Refactor Backend Auth Middleware',
      'Optimize Database Query Indexes',
      'Fix Async Race Condition in State',
      'Build API Endpoint for Analytics',
      'Unit Tests for Calibration Engine'
    ],
    Studying: [
      'DSA Graph Algorithms Review',
      'Operating Systems Concurrency Homework',
      'Machine Learning Model Evaluation',
      'Linear Algebra Problem Set 4'
    ],
    Reading: [
      'Designing Data-Intensive Applications Ch. 5',
      'Read Refactoring UI Book Section',
      'System Architecture Research Paper'
    ],
    Writing: [
      'Draft Technical Specification Document',
      'Write Sprint Post-Mortem Report',
      'Weekly Calibration Log Summary'
    ],
    Exercise: [
      'Morning 5k Tempo Run',
      'Full Body Strength Workout',
      'High-Intensity Interval Training'
    ],
    Personal: [
      'Tax & Financial Record Organizing',
      'Weekly Grocery & Meal Planning',
      'Apartment Cleaning & Maintenance'
    ],
    Other: [
      'Team Synchronization & Roadmap Sync',
      'Code Review & Pull Request Feedback'
    ]
  };

  const generatedTasks: TaskItem[] = [];
  const generatedSleep: SleepRecord[] = [];

  // Generate sleep records for past 7 days
  for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
    const dateStr = getPastDateStr(dayOffset);
    // Alternate sleep durations: some days <6h (5.5h), some days 7.5h
    const isShortSleep = dayOffset % 3 === 0;
    const plannedBed = '23:00';
    const actualBed = isShortSleep ? '01:30' : '23:15';
    const plannedWake = '07:00';
    const actualWake = '07:00';
    const actualSleepDurationMinutes = isShortSleep ? 330 : 465;

    generatedSleep.push({
      id: `sleep-gen-${dayOffset}`,
      date: dateStr,
      plannedBedtime: plannedBed,
      actualBedtime: actualBed,
      plannedWakeTime: plannedWake,
      actualWakeTime: actualWake,
      actualSleepDurationMinutes,
      isShortSleep
    });

    // Generate 2 tasks per day
    categories.forEach((cat, idx) => {
      if ((dayOffset + idx) % 2 === 0) {
        const titles = titleTemplates[cat];
        const title = titles[(dayOffset + idx) % titles.length];
        const plannedDuration = [45, 60, 90, 120, 180][(dayOffset + idx) % 5];
        
        // Multiplier: Programming tasks underestimated by ~40-50%, Reading accurate (-10%), Writing (+25%)
        let multiplier = 1.0;
        if (cat === 'Programming') multiplier = 1.45;
        else if (cat === 'Studying') multiplier = 1.30;
        else if (cat === 'Writing') multiplier = 1.25;
        else if (cat === 'Reading') multiplier = 0.90;
        else if (cat === 'Personal') multiplier = 1.35;

        const actualDuration = Math.round(plannedDuration * multiplier);
        const startDelayMinutes = cat === 'Programming' || cat === 'Personal' ? 25 : 5;
        
        const hour = 9 + (idx * 2) % 10;
        const plannedStartHourStr = hour < 10 ? `0${hour}` : `${hour}`;
        const plannedStart = `${dateStr}T${plannedStartHourStr}:00:00.000Z`;
        const plannedEnd = `${dateStr}T${hour + Math.floor(plannedDuration / 60)}:${plannedDuration % 60 === 0 ? '00' : plannedDuration % 60}:00.000Z`;

        const actualStartMin = startDelayMinutes;
        const actualStartStr = `${dateStr}T${plannedStartHourStr}:${actualStartMin < 10 ? '0' + actualStartMin : actualStartMin}:00.000Z`;
        
        const confidence = [70, 80, 90, 95][(dayOffset + idx) % 4];

        generatedTasks.push({
          id: `task-gen-${dayOffset}-${idx}`,
          title,
          category: cat,
          plannedStart,
          plannedEnd,
          plannedDurationMinutes: plannedDuration,
          estimatedDurationMinutes: plannedDuration,
          confidence,
          originalPlannedStart: plannedStart,
          originalEstimatedDurationMinutes: plannedDuration,
          createdAt: `${dateStr}T08:00:00.000Z`,
          execution: {
            status: 'completed',
            actualStart: actualStartStr,
            actualEnd: `${dateStr}T${hour + Math.floor((plannedDuration + actualDuration) / 60)}:00:00.000Z`,
            actualDurationMinutes: actualDuration,
            postponedCount: cat === 'Personal' ? 1 : 0,
            originalScheduledDate: dateStr,
            actualCompletionDate: dateStr
          }
        });
      }
    });
  }

  const settings = DEFAULT_SETTINGS;
  saveTasks(generatedTasks);
  saveSleepRecords(generatedSleep);
  saveSettings(settings);

  return { tasks: generatedTasks, sleep: generatedSleep, settings };
}

export function resetAllDataToSample(): { tasks: TaskItem[]; sleep: SleepRecord[]; settings: AppSettings } {
  return seedPresetData('standard');
}

export function seedPresetData(
  preset: 'standard' | 'rich' | 'edge' | 'empty' | 'generated'
): { tasks: TaskItem[]; sleep: SleepRecord[]; settings: AppSettings } {
  if (preset === 'generated') {
    return generateRandomCalibratedData();
  }

  let tasks: TaskItem[] = [];
  let sleep: SleepRecord[] = [];

  if (preset === 'standard') {
    tasks = getInitialSampleTasks();
    sleep = getInitialSampleSleepRecords();
  } else if (preset === 'rich') {
    tasks = getRichMultiCategorySampleTasks();
    sleep = getInitialSampleSleepRecords();
  } else if (preset === 'edge') {
    tasks = getEdgeCaseSampleTasks();
    sleep = getInitialSampleSleepRecords().slice(0, 3);
  } else if (preset === 'empty') {
    tasks = [];
    sleep = [];
  }

  const settings = DEFAULT_SETTINGS;

  saveTasks(tasks);
  saveSleepRecords(sleep);
  saveSettings(settings);

  return { tasks, sleep, settings };
}

export function clearAllData(): { tasks: TaskItem[]; sleep: SleepRecord[]; settings: AppSettings } {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(TASKS_KEY);
      localStorage.removeItem(SLEEP_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem('gcal_events_storage_v1');
      localStorage.removeItem('personal_calibration_gcal_events');
      localStorage.removeItem('personal_cal_gcal_token');
    }
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('personal_cal_gcal_token');
    }
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
  return seedPresetData('empty');
}
