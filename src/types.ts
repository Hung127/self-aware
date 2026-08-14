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

export type PlanSource = 'manual' | 'google_calendar';
export type PredictionStatus = 'recorded' | 'not_recorded';
export type DurationMeasurementStatus = 'measured' | 'unknown';
export type SkipReason =
  | 'too_tired'
  | 'forgot'
  | 'harder_than_expected'
  | 'something_more_important'
  | 'unexpected_event'
  | 'did_not_feel_like_it'
  | 'other';

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

export interface PostponementEvent {
  postponedAt: string; // ISO string
  fromDate: string;    // YYYY-MM-DD
  toDate?: string;     // YYYY-MM-DD
}

export interface TaskPredictionDecision {
  shown: boolean;
  suggestedDurationMinutes?: number;
  acceptedSuggestion?: boolean;
  finalPredictionMinutes?: number;
  originalPredictionMinutes?: number;
  userDecision?: 'accepted_suggestion' | 'kept_original' | 'custom_adjusted';
  chosenDurationMinutes?: number;
  createdAt?: string;
}

export interface TaskPrediction {
  id: string;
  title: string;
  category: TaskCategory;
  tag?: string; // Optional reference class sub-tag, e.g. "Assignment", "BugFix"
  
  // Planned times (e.g. Google Calendar schedule)
  plannedStart: string; // ISO string
  plannedEnd: string;   // ISO string
  plannedDurationMinutes: number;
  planSource?: PlanSource;
  predictionStatus?: PredictionStatus;
  
  // Calibration prediction
  estimatedDurationMinutes: number;
  confidence: number; // Percentage 10-100%
  
  // Metadata & Calendar link
  googleCalendarEventId?: string;
  originalPlannedStart: string; // Preserved even if GCal shifts
  originalEstimatedDurationMinutes: number; // Immutable historical baseline
  realityCheck?: TaskPredictionDecision; // Recorded decision when user created/edited prediction
  createdAt: string;
}

export interface TaskExecution {
  status: TaskStatus;
  actualStart?: string; // ISO string
  actualEnd?: string;   // ISO string
  actualDurationMinutes?: number;
  durationMeasurementStatus?: DurationMeasurementStatus;
  skipReason?: SkipReason;
  postponedCount: number;
  postponedEvents?: PostponementEvent[];
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

export interface ReferenceClassStatistics {
  sampleCount: number;
  meanActualDuration: number;
  medianActualDuration: number;
  minActualDuration: number;
  maxActualDuration: number;
  meanSignedError: number;
  medianSignedError: number;
  meanAbsoluteError: number;
  medianAbsoluteError: number;
  matchedBy: 'category_and_tag' | 'category' | 'none';
  tasks: TaskItem[];
}

export interface RealityCheckSuggestion {
  shouldWarn: boolean;
  severity: 'none' | 'small' | 'reality_check';
  historicalAverageMinutes: number; // user-facing typical duration (median)
  medianActualDurationMinutes: number;
  meanActualDurationMinutes: number;
  sampleCount: number;
  averageErrorPercent: number; // relative discrepancy: (medianActual - predicted) / predicted
  message: string;
  suggestedDurationMinutes: number;
  matchedBy?: 'category_and_tag' | 'category' | 'none';
}

export interface SleepGroupMetrics {
  eligibleTaskCount: number;
  completedTaskCount: number;
  completionRatePercent: number;
  meanSignedErrorPercent: number;
  medianSignedErrorPercent: number;
  meanAbsoluteErrorMinutes: number;
  medianAbsoluteErrorMinutes: number;
}

export interface SleepImpactCalibration {
  normalSleepCompletionRate: number; // % completed when sleep >= 6h
  shortSleepCompletionRate: number;  // % completed when sleep < 6h
  completionDropPercent: number;     // e.g. 35% fewer completed
  normalSleepDaysCount: number;
  shortSleepDaysCount: number;
  normalSleepMetrics?: SleepGroupMetrics;
  shortSleepMetrics?: SleepGroupMetrics;
  hasEnoughData: boolean;
}

export interface DurationCalibration {
  overallErrorPercent: number; // Mean ratio error percentage e.g. +35%
  meanSignedErrorPercent: number;
  medianSignedErrorPercent: number;
  meanAbsoluteErrorMinutes: number;
  medianAbsoluteErrorMinutes: number;
  meanActualDurationMinutes: number;
  medianActualDurationMinutes: number;
  totalTasksCount: number;
  categoryBreakdown: Record<TaskCategory, {
    averageErrorPercent: number;
    meanSignedErrorPercent: number;
    medianSignedErrorPercent: number;
    meanAbsoluteErrorMinutes: number;
    medianAbsoluteErrorMinutes: number;
    meanActualDurationMinutes: number;
    medianActualDurationMinutes: number;
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

export interface ConfidenceCalibration {
  bracket: number; // e.g., 90%
  rangeLabel: string; // e.g., "90–100%", "70–89%"
  predictedCount: number;
  successfulCount: number;
  actualSuccessRatePercent: number; // e.g., 58%
  sampleSufficient: boolean; // >= 5 observations in bracket
}

export interface WeeklyAccuracyTrend {
  periodLabel: string; // e.g. "Week 1", "Week 2", "Past 7 Days"
  completedTaskCount: number;
  averageEstimationErrorPercent: number; // e.g. 72% -> 38%
  averageAbsoluteErrorMinutes: number;
}

export interface AccuracyOverTimeCalibration {
  hasEnoughData: boolean;
  weeklyTrends: WeeklyAccuracyTrend[];
  overallTrendDirection: 'improving' | 'stable' | 'needs_more_data';
  earliestErrorPercent?: number;
  recentErrorPercent?: number;
}

export interface CompletionCalibration {
  totalEligibleCount: number;
  completedCount: number;
  postponedCount: number;
  skippedCount: number;
  sameDayCompletionRatePercent: number;
  averageCompletionDelayDays: number;
  categoryCompletionRates: Record<TaskCategory, {
    total: number;
    completed: number;
    completionRatePercent: number;
  }>;
}

export interface OverallCalibrationInsights {
  duration: DurationCalibration;
  startTime: StartTimeCalibration;
  sleepImpact: SleepImpactCalibration;
  confidenceBrackets: ConfidenceCalibration[];
  sameDayCompletionRatePercent: number;
  completion: CompletionCalibration;
  accuracyOverTime: AccuracyOverTimeCalibration;
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
