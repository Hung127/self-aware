import { TaskItem, TaskExecution } from '../types';

/**
 * Immutable historical prediction fields. Once a prediction is recorded, these
 * are the baseline against which calibration is measured and must never be
 * silently rewritten. Errors go through the explicit correction mechanism.
 */
export const IMMUTABLE_PREDICTION_FIELDS = [
  'originalEstimatedDurationMinutes',
  'originalPlannedStart',
  'predictionStatus'
] as const;

export type ImmutablePredictionField = typeof IMMUTABLE_PREDICTION_FIELDS[number];

export function isExecutionLocked(task: TaskItem): boolean {
  return task.execution.status === 'completed';
}

export type UpdateExecutionResult =
  | { ok: true; task: TaskItem }
  | { ok: false; error: string };

/**
 * Domain-level guard for execution transitions. Once a task is completed its
 * execution record is immutable; corrections go through
 * `correctCompletedObservation` instead.
 */
export function updateTaskExecution(
  task: TaskItem,
  updates: Partial<TaskExecution>
): UpdateExecutionResult {
  if (isExecutionLocked(task)) {
    return {
      ok: false,
      error: 'Completed execution is immutable. Use "Correct" to fix a mistaken observation.'
    };
  }
  return {
    ok: true,
    task: {
      ...task,
      execution: {
        ...task.execution,
        ...updates
      }
    }
  };
}

/**
 * Merges an edit of an existing task so that immutable historical prediction
 * fields and any locked execution record can never be rewritten by the form.
 * The one legitimate transition kept open is first-time recording: a
 * plan-only (not_recorded) candidate may gain its original forecast and flip
 * to `recorded`; it may never be downgraded back.
 */
export function mergeTaskEdit(existing: TaskItem, incoming: TaskItem): TaskItem {
  const merged: TaskItem = { ...incoming };

  merged.originalEstimatedDurationMinutes = existing.originalEstimatedDurationMinutes > 0
    ? existing.originalEstimatedDurationMinutes
    : incoming.originalEstimatedDurationMinutes;
  merged.originalPlannedStart = existing.originalPlannedStart || incoming.originalPlannedStart;
  merged.predictionStatus = existing.predictionStatus === 'recorded' ? 'recorded' : incoming.predictionStatus;

  merged.execution = isExecutionLocked(existing)
    ? existing.execution
    : {
        ...existing.execution,
        ...incoming.execution
      };

  return merged;
}

export interface CompletedObservationCorrection {
  actualDurationMinutes: number;
  actualCompletionDate: string;
  reason?: string;
}

/**
 * The single explicit path for correcting a completed observation. Writes the
 * corrected values and records an audit trail so history stays truthful.
 */
export function correctCompletedObservation(
  task: TaskItem,
  correction: CompletedObservationCorrection
): TaskItem {
  return {
    ...task,
    execution: {
      ...task.execution,
      status: 'completed',
      actualDurationMinutes: correction.actualDurationMinutes,
      actualCompletionDate: correction.actualCompletionDate,
      durationMeasurementStatus: correction.actualDurationMinutes > 0 ? 'measured' : 'unknown',
      correction: {
        createdAt: new Date().toISOString(),
        previous: {
          actualDurationMinutes: task.execution.actualDurationMinutes,
          actualCompletionDate: task.execution.actualCompletionDate
        },
        reason: correction.reason
      }
    }
  };
}
