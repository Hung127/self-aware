import { TaskItem, SleepRecord, AppSettings } from '../types';

const TASKS_KEY = 'personal_calibration_tasks_v1';
const SLEEP_KEY = 'personal_calibration_sleep_v1';
const SETTINGS_KEY = 'personal_calibration_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  googleCalendarConnected: false,
  autoImportGCal: true,
  minObservationsForRealityCheck: 3,
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
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      const sample = getInitialSampleTasks();
      saveTasks(sample);
      return sample;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading tasks from localStorage:', err);
    return getInitialSampleTasks();
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
  }
}

export function loadSleepRecords(): SleepRecord[] {
  try {
    const raw = localStorage.getItem(SLEEP_KEY);
    if (!raw) {
      const sample = getInitialSampleSleepRecords();
      saveSleepRecords(sample);
      return sample;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading sleep records from localStorage:', err);
    return getInitialSampleSleepRecords();
  }
}

export function saveSleepRecords(records: SleepRecord[]): void {
  try {
    localStorage.setItem(SLEEP_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving sleep records to localStorage:', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage:', err);
  }
}

export function resetAllDataToSample(): { tasks: TaskItem[]; sleep: SleepRecord[]; settings: AppSettings } {
  const tasks = getInitialSampleTasks();
  const sleep = getInitialSampleSleepRecords();
  const settings = DEFAULT_SETTINGS;

  saveTasks(tasks);
  saveSleepRecords(sleep);
  saveSettings(settings);

  return { tasks, sleep, settings };
}

export function clearAllData(): { tasks: TaskItem[]; sleep: SleepRecord[]; settings: AppSettings } {
  saveTasks([]);
  saveSleepRecords([]);
  saveSettings(DEFAULT_SETTINGS);
  return { tasks: [], sleep: [], settings: DEFAULT_SETTINGS };
}
