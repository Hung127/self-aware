export type TaskCategory = 
  | 'Programming'
  | 'Studying'
  | 'Reading'
  | 'Writing'
  | 'Exercise'
  | 'Personal'
  | 'Other';

export type TaskStatus = 
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'skipped';

export type ReflectionCategory =
  | 'harder_than_expected'
  | 'started_late'
  | 'got_distracted'
  | 'was_tired'
  | 'unexpected_problem'
  | 'underestimated_work'
  | 'other';

export interface PostExecutionReflection {
  reason: ReflectionCategory;
  notes?: string;
  createdAt: string; // ISO string
}

export interface TaskPrediction {
  id: string;
  title: string;
  category: TaskCategory;
  
  // Planned times (e.g. Google Calendar schedule)
  plannedStart: string; // ISO string
  plannedEnd: string;   // ISO string
  plannedDurationMinutes: number;
  
  // Calibration prediction
  estimatedDurationMinutes: number;
  confidence: number; // Percentage 10-100%
  
  // Metadata & Calendar link
  googleCalendarEventId?: string;
  originalPlannedStart: string; // Preserved even if GCal shifts
  originalEstimatedDurationMinutes: number; // Preserved
  createdAt: string;
}

export interface TaskExecution {
  status: TaskStatus;
  actualStart?: string; // ISO string
  actualEnd?: string;   // ISO string
  actualDurationMinutes?: number;
  postponedCount: number;
  originalScheduledDate: string; // YYYY-MM-DD
  actualCompletionDate?: string; // YYYY-MM-DD
  reflection?: PostExecutionReflection;
}

export interface TaskItem extends TaskPrediction {
  execution: TaskExecution;
}

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  plannedBedtime: string; // HH:mm format, e.g., "23:00"
  actualBedtime: string;  // HH:mm format, e.g., "01:10"
  plannedWakeTime: string;// HH:mm format, e.g., "07:00"
  actualWakeTime: string; // HH:mm format, e.g., "07:05"
  actualSleepDurationMinutes: number;
  isShortSleep: boolean; // < 360 mins (6h)
}

export interface RealityCheckSuggestion {
  shouldWarn: boolean;
  severity: 'none' | 'small' | 'reality_check';
  historicalAverageMinutes: number;
  sampleCount: number;
  averageErrorPercent: number; // e.g. +43%
  message: string;
  suggestedDurationMinutes: number;
}

export interface DurationCalibration {
  overallErrorPercent: number; // e.g. +35%
  totalTasksCount: number;
  categoryBreakdown: Record<TaskCategory, {
    averageErrorPercent: number;
    multiplier: number; // e.g. 1.43
    taskCount: number;
    sampleSufficient: boolean;
  }>;
}

export interface StartTimeCalibration {
  averageDelayMinutes: number;
  onTimeStartRatePercent: number; // e.g. 40% (8 of 20)
  totalSessionsCount: number;
  eveningDelayMinutes: number; // Start after 18:00
}

export interface SleepImpactCalibration {
  normalSleepCompletionRate: number; // % completed when sleep >= 6h
  shortSleepCompletionRate: number;  // % completed when sleep < 6h
  completionDropPercent: number;     // e.g. 35% fewer completed
  normalSleepDaysCount: number;
  shortSleepDaysCount: number;
  hasEnoughData: boolean;
}

export interface ConfidenceCalibration {
  bracket: number; // e.g., 90%
  predictedCount: number;
  successfulCount: number;
  actualSuccessRatePercent: number; // e.g., 58%
}

export interface OverallCalibrationInsights {
  duration: DurationCalibration;
  startTime: StartTimeCalibration;
  sleepImpact: SleepImpactCalibration;
  confidenceBrackets: ConfidenceCalibration[];
  sameDayCompletionRatePercent: number;
}

export interface AppSettings {
  googleCalendarConnected: boolean;
  autoImportGCal: boolean;
  minObservationsForRealityCheck: number; // Default 5
  smallSuggestionThresholdPercent: number; // Default 15
  realityCheckThresholdPercent: number; // Default 30
}

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}
