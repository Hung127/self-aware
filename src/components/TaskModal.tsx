import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory, AppSettings, BehavioralTaskType } from '../types';
import { getRealityCheck } from '../utils/calibrationEngine';
import { Target } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { PlanSection } from './task/PlanSection';
import { ForecastSection } from './task/ForecastSection';
import { RealityCheckSection } from './task/RealityCheckSection';

export interface TaskFormDefaults {
  title?: string;
  category?: TaskCategory;
  tag?: string;
  plannedMinutes?: number;
  estimatedMinutes?: number;
  plannedStart?: string;
  plannedEnd?: string;
  googleCalendarEventId?: string;
  planSource?: 'manual' | 'google_calendar';
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: TaskItem) => void;
  existingTask?: TaskItem | null;
  allTasks: TaskItem[];
  settings: AppSettings;
  initialValues?: TaskFormDefaults;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  existingTask,
  allTasks,
  settings,
  initialValues
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(existingTask?.title || initialValues?.title || '');
  const [titleError, setTitleError] = useState<string | undefined>();
  const [category, setCategory] = useState<TaskCategory>(existingTask?.category || initialValues?.category || 'Programming');
  const [tag, setTag] = useState(existingTask?.tag || initialValues?.tag || '');
  const [behavioralTaskType, setBehavioralTaskType] = useState<BehavioralTaskType>(
    existingTask?.behavioralTaskType || 'other'
  );
  const [scheduledDate, setScheduledDate] = useState(
    existingTask?.plannedStart ? existingTask.plannedStart.split('T')[0] : initialValues?.plannedStart?.split('T')[0] || todayStr
  );
  const [startTime, setStartTime] = useState(
    existingTask?.plannedStart
      ? new Date(existingTask.plannedStart).toTimeString().substring(0, 5)
      : initialValues?.plannedStart ? new Date(initialValues.plannedStart).toISOString().substring(11, 16) : '14:00'
  );

  // Scheduled Plan Duration in Minutes (e.g. Calendar block or planned time window)
  const [plannedMinutes, setPlannedMinutes] = useState<number>(
    existingTask?.plannedDurationMinutes || initialValues?.plannedMinutes || existingTask?.estimatedDurationMinutes || 120
  );

  // User Calibrated Estimated Duration in Minutes
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(
    existingTask?.estimatedDurationMinutes || initialValues?.estimatedMinutes || 120
  );
  // Track the user-entered estimate before Reality Check adjustment
  const [initialUserPrediction, setInitialUserPrediction] = useState<number>(
    existingTask?.originalEstimatedDurationMinutes || existingTask?.estimatedDurationMinutes || initialValues?.estimatedMinutes || 120
  );

  const [confidence, setConfidence] = useState<number>(existingTask?.confidence || 80);
  const [userDecision, setUserDecision] = useState<'accepted_suggestion' | 'kept_original' | 'custom_adjusted' | null>(
    existingTask?.realityCheck?.userDecision ?? null
  );

  // Reality Check evaluation based on current category, estimated duration, tag, task type
  const realityCheck = getRealityCheck(category, estimatedMinutes, allTasks, settings, tag, behavioralTaskType, existingTask?.id);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setCategory(existingTask.category);
      setTag(existingTask.tag || '');
      setBehavioralTaskType(existingTask.behavioralTaskType || 'other');
      setScheduledDate(existingTask.plannedStart.split('T')[0]);
      setStartTime(new Date(existingTask.plannedStart).toTimeString().substring(0, 5));
      setPlannedMinutes(existingTask.plannedDurationMinutes || existingTask.estimatedDurationMinutes);
      setEstimatedMinutes(existingTask.estimatedDurationMinutes);
      setInitialUserPrediction(existingTask.originalEstimatedDurationMinutes || existingTask.estimatedDurationMinutes);
      setConfidence(existingTask.confidence);
      setUserDecision(existingTask.realityCheck?.userDecision ?? null);
    } else if (initialValues) {
      setTitle(initialValues.title || '');
      setCategory(initialValues.category || 'Programming');
      setTag(initialValues.tag || '');
      setPlannedMinutes(initialValues.plannedMinutes || initialValues.estimatedMinutes || 120);
      const estimate = initialValues.estimatedMinutes || initialValues.plannedMinutes || 120;
      setEstimatedMinutes(estimate);
      setInitialUserPrediction(estimate);
      setConfidence(80);
      setUserDecision(null);
    } else {
      setTitle('');
      setCategory('Programming');
      setTag('');
      setPlannedMinutes(120);
      setEstimatedMinutes(120);
      setInitialUserPrediction(120);
      setConfidence(80);
      setUserDecision(null);
    }
  }, [existingTask, initialValues]);

  const handleApplySuggested = () => {
    if (realityCheck.suggestedDurationMinutes) {
      setEstimatedMinutes(realityCheck.suggestedDurationMinutes);
      setUserDecision('accepted_suggestion');
    }
  };

  const handleKeepEstimate = () => {
    setUserDecision('kept_original');
  };

  const handleEstimateChange = (val: number) => {
    const valid = Math.max(5, val);
    setEstimatedMinutes(valid);
    setUserDecision(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('Task name is required.');
      return;
    }
    setTitleError(undefined);

     const startDateTime = initialValues?.plannedStart && !existingTask
       ? initialValues.plannedStart
       : new Date(`${scheduledDate}T${startTime}:00.000Z`).toISOString();
    // Schedule end derived from plannedDurationMinutes (calendar plan)
     const endDateTime = initialValues?.plannedEnd && !existingTask
       ? initialValues.plannedEnd
       : new Date(
         new Date(`${scheduledDate}T${startTime}:00.000Z`).getTime() + plannedMinutes * 60000
       ).toISOString();

    // Determine final explicit decision state
    let finalDecision: 'accepted_suggestion' | 'kept_original' | 'custom_adjusted' | undefined = undefined;
    if (realityCheck.shouldWarn) {
      if (userDecision === 'accepted_suggestion') {
        finalDecision = 'accepted_suggestion';
      } else if (userDecision === 'kept_original') {
        finalDecision = 'kept_original';
      } else if (
        estimatedMinutes !== initialUserPrediction &&
        estimatedMinutes !== realityCheck.suggestedDurationMinutes
      ) {
        finalDecision = 'custom_adjusted';
      } else if (userDecision === 'custom_adjusted') {
        finalDecision = userDecision;
      }
    }

    const immutableOriginalEstimate = existingTask
      ? (existingTask.originalEstimatedDurationMinutes || initialUserPrediction || estimatedMinutes)
      : initialUserPrediction;

    // When no Reality Check is shown, drop any stale record from a previous
    // edit so metadata never describes a prediction that no longer exists.
    const realityCheckDecision: TaskItem['realityCheck'] = realityCheck.shouldWarn
      ? {
          shown: true,
          suggestedDurationMinutes: realityCheck.suggestedDurationMinutes,
          acceptedSuggestion: finalDecision === 'accepted_suggestion' ? true : finalDecision === 'kept_original' ? false : undefined,
          userDecision: finalDecision,
          originalPredictionMinutes: immutableOriginalEstimate,
          chosenDurationMinutes: estimatedMinutes,
          finalPredictionMinutes: estimatedMinutes,
          createdAt: new Date().toISOString()
        }
      : undefined;

    const task: TaskItem = {
      id: existingTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      category,
      tag: tag.trim() || undefined,
      behavioralTaskType,
      plannedStart: startDateTime,
      plannedEnd: endDateTime,
      plannedDurationMinutes: plannedMinutes,
      estimatedDurationMinutes: estimatedMinutes,
      confidence,
      googleCalendarEventId: existingTask?.googleCalendarEventId || initialValues?.googleCalendarEventId,
      planSource: existingTask?.planSource || initialValues?.planSource || 'manual',
      predictionStatus: 'recorded',
      originalPlannedStart: existingTask?.originalPlannedStart || startDateTime,
      originalEstimatedDurationMinutes: immutableOriginalEstimate,
      realityCheck: realityCheckDecision,
      createdAt: existingTask?.createdAt || new Date().toISOString(),
      execution: existingTask?.execution || {
        status: 'not_started',
        postponedCount: 0,
        originalScheduledDate: scheduledDate,
      }
    };

    onSaveTask(task);
    onClose();
  };

  return (
    <ModalShell
      title={existingTask ? 'Edit prediction' : 'Record a prediction'}
      description="Capture what is scheduled and what you believe will happen."
      icon={<Target className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="prediction-modal-form">
            {existingTask ? 'Save prediction' : 'Record prediction'}
          </Button>
        </div>
      }
    >
      <form id="prediction-modal-form" onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto p-6">
        <PlanSection
          title={title}
          titleError={titleError}
          onTitleChange={value => {
            setTitle(value);
            if (titleError) setTitleError(undefined);
          }}
          category={category}
          onCategoryChange={setCategory}
          tag={tag}
          onTagChange={setTag}
          scheduledDate={scheduledDate}
          onScheduledDateChange={setScheduledDate}
          behavioralTaskType={behavioralTaskType}
          onBehavioralTaskTypeChange={setBehavioralTaskType}
          startTime={startTime}
          onStartTimeChange={setStartTime}
          plannedMinutes={plannedMinutes}
          onPlannedMinutesChange={setPlannedMinutes}
        />

        <ForecastSection
          estimatedMinutes={estimatedMinutes}
          onEstimateChange={handleEstimateChange}
          confidence={confidence}
          onConfidenceChange={setConfidence}
        />

        <RealityCheckSection
          realityCheck={realityCheck}
          tag={tag}
          initialUserPrediction={initialUserPrediction}
          userDecision={userDecision}
          onKeepEstimate={handleKeepEstimate}
          onApplySuggested={handleApplySuggested}
        />
      </form>
    </ModalShell>
  );
};
