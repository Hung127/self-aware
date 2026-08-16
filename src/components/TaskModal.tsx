import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory, AppSettings, TaskPredictionDecision, BehavioralTaskType } from '../types';
import { CATEGORIES, getRealityCheck, PROGRAMMING_TASK_TYPES, formatMinutesToHours } from '../utils/calibrationEngine';
import { Target, AlertTriangle, Info, Clock, Check, Shield } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Field, inputCls, inputErrorCls } from './ui/Field';

const QUICK_FORECAST_CHIPS = [30, 60, 90, 120, 180];

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: TaskItem) => void;
  existingTask?: TaskItem | null;
  allTasks: TaskItem[];
  settings: AppSettings;
  initialValues?: TaskFormDefaults;
}

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
    const realityCheckDecision: TaskPredictionDecision | undefined = realityCheck.shouldWarn
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
        <form id="prediction-modal-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Plan */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">1. Scheduled Plan</p>
              <p className="mt-0.5 text-xs text-slate-500">What is scheduled on your calendar or agenda?</p>
            </div>

            {/* Title */}
            <Field
              label="Task name"
              error={titleError}
            >
              <input
                type="text"
                placeholder="e.g., Study Machine Learning, Refactor React state"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(undefined);
                }}
                className={`${inputCls} ${titleError ? inputErrorCls : ''}`}
              />
            </Field>

            {/* Category & Tag & Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as TaskCategory)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tag <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assignment"
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {category === 'Programming' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Task type <span className="text-xs font-normal text-slate-400">(optional reference class)</span>
                </label>
                <select
                  value={behavioralTaskType}
                  onChange={e => setBehavioralTaskType(e.target.value as BehavioralTaskType)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                >
                  {PROGRAMMING_TASK_TYPES.map(bt => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                  <option value="other">other</option>
                </select>
              </div>
            )}

            {/* Start Time & Schedule Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Planned start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Schedule block <span className="text-xs font-normal text-slate-400">(calendar slot)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    step="5"
                    value={plannedMinutes}
                    onChange={e => setPlannedMinutes(Math.max(5, parseInt(e.target.value) || 0))}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                    ({formatMinutesToHours(plannedMinutes)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Prediction */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">2. Duration Forecast</p>
              <p className="mt-0.5 text-xs text-slate-500">What do you believe will actually happen?</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                  Forecast duration <span className="text-xs font-normal text-slate-500">(minutes)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    step="5"
                    value={estimatedMinutes}
                    onChange={e => handleEstimateChange(parseInt(e.target.value) || 0)}
                    required
                    className="w-full bg-white border border-blue-300 rounded-lg px-3.5 py-2 text-blue-700 font-bold text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                  <span className="text-sm font-bold text-blue-700 whitespace-nowrap">
                    = {formatMinutesToHours(estimatedMinutes)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Presets:</span>
                {QUICK_FORECAST_CHIPS.map(minutes => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => handleEstimateChange(minutes)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      estimatedMinutes === minutes
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {formatMinutesToHours(minutes)}
                  </button>
                ))}
              </div>

              {/* Stated Confidence Slider */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    Confidence <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <span className="text-sm font-bold text-blue-700">{confidence}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={confidence}
                  onChange={e => setConfidence(parseInt(e.target.value))}
                  className="w-full accent-blue-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-2xs text-slate-500 font-medium mt-1">
                  <span>50% (Uncertain)</span>
                  <span>80% (Likely)</span>
                  <span>95% (Certain)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Reality Check & Historical Feedback */}
          <div className="space-y-3 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">3. Calibration Mirror</p>
              <p className="mt-0.5 text-xs text-slate-500">Historical evidence check</p>
            </div>

            {realityCheck.shouldWarn && (
              <div className={`p-4 rounded-xl border space-y-3 transition-all ${
                realityCheck.severity === 'reality_check'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-slate-900'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 shrink-0">
                    {realityCheck.severity === 'reality_check' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="font-bold text-sm text-slate-900">
                        {realityCheck.severity === 'reality_check' ? 'Reality Check' : 'Historical Evidence'}
                      </span>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {realityCheck.sampleCount} similar tasks observed {realityCheck.matchedBy === 'category_and_tag' ? `(${tag})` : ''}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700">
                      {realityCheck.message}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-700">
                    Your estimate: <strong className="text-slate-900">{formatMinutesToHours(initialUserPrediction)}</strong> · History avg: <strong className="text-blue-700">{formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</strong>
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleKeepEstimate}
                      className={userDecision === 'kept_original' ? 'border-slate-800 text-slate-900 font-bold' : ''}
                    >
                      Keep {formatMinutesToHours(initialUserPrediction)}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplySuggested}
                      className={userDecision === 'accepted_suggestion' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                    >
                      {userDecision === 'accepted_suggestion' && <Check className="w-3.5 h-3.5" />}
                      Use {formatMinutesToHours(realityCheck.suggestedDurationMinutes)}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!realityCheck.shouldWarn && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-start space-x-2.5 text-xs">
                <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {realityCheck.state === 'no_data' && realityCheck.sampleCount === 0
                    ? 'No comparable completed history yet. This prediction becomes part of your baseline.'
                    : realityCheck.state === 'insufficient_data'
                    ? `Early stage — ${realityCheck.message.toLowerCase()}`
                    : realityCheck.message}
                </span>
              </div>
            )}
          </div>
        </form>
    </ModalShell>
  );
};
