import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory, AppSettings, TaskPredictionDecision, BehavioralTaskType } from '../types';
import { CATEGORIES, getRealityCheck, PROGRAMMING_TASK_TYPES, formatMinutesToHours } from '../utils/calibrationEngine';
import { Target, AlertTriangle, Info, Clock, X, Check, Shield } from 'lucide-react';

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
    if (!title.trim()) return;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="prediction-modal-title" className="my-8 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <Target className="h-5 w-5 text-blue-600" />
            <div>
              <h3 id="prediction-modal-title" className="text-lg font-bold text-slate-900">
                {existingTask ? 'Edit prediction' : 'Record a prediction'}
              </h3>
              <p className="text-sm text-slate-500">Capture what is scheduled and what you believe will happen.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close prediction dialog"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="border-b border-slate-100 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">1. Plan</p>
            <p className="mt-1 text-sm text-slate-600">What is scheduled?</p>
          </div>
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Task name
            </label>
            <input
              type="text"
              placeholder="e.g., Study Machine Learning, Refactor React state"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
            />
          </div>

          {/* Category & Tag & Date */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tag <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Assignment"
                value={tag}
                onChange={e => setTag(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {category === 'Programming' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Task type <span className="text-xs font-normal text-slate-400">(optional, for reference class)</span>
              </label>
              <select
                value={behavioralTaskType}
                onChange={e => setBehavioralTaskType(e.target.value as BehavioralTaskType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                {PROGRAMMING_TASK_TYPES.map(bt => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
                <option value="other">other</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Narrower reference class: implementation, debugging, testing, documentation.
              </p>
            </div>
          )}

          {/* Start Time, Planned Schedule Duration & Estimated Prediction Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Schedule block <span className="text-xs font-normal text-slate-400">(plan)</span>
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  value={plannedMinutes}
                  onChange={e => setPlannedMinutes(Math.max(5, parseInt(e.target.value) || 0))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  ({formatMinutesToHours(plannedMinutes)})
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-blue-700">
                Forecast duration
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  value={estimatedMinutes}
                  onChange={e => handleEstimateChange(parseInt(e.target.value) || 0)}
                  required
                  className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2.5 text-blue-600 font-bold text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  ({formatMinutesToHours(estimatedMinutes)})
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">2. Prediction</p>
            <p className="mt-1 text-sm text-slate-600">How long do you think this will take?</p>
          </div>
          {/* Stated Confidence Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Confidence <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <span className="text-sm font-bold text-blue-600">{confidence}%</span>
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
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
              <span>50% (Uncertain)</span>
              <span>80% (Likely)</span>
              <span>95% (Certain)</span>
            </div>
          </div>

           {/* LIVE REALITY CHECK BANNER */}
           {realityCheck.shouldWarn && (
            <div className={`p-4 rounded-xl border space-y-3 transition-all ${
              realityCheck.severity === 'reality_check'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-blue-50/80 border-blue-100 text-slate-800'
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
                       {realityCheck.severity === 'reality_check' ? '3. Reality Check' : '3. Historical calibration'}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      {realityCheck.sampleCount} similar tasks observed {realityCheck.matchedBy === 'category_and_tag' ? `(${tag})` : ''}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {realityCheck.message}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                   <span className="text-xs text-slate-600">
                   Your forecast: <strong className="text-slate-800">{formatMinutesToHours(initialUserPrediction)}</strong> | Typical actual: <strong className="text-blue-600">{formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</strong>
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleKeepEstimate}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      userDecision === 'kept_original'
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Keep my {formatMinutesToHours(initialUserPrediction)}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplySuggested}
                    className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs ${
                      userDecision === 'accepted_suggestion'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {userDecision === 'accepted_suggestion' && <Check className="w-3.5 h-3.5" />}
                     <span>Use {formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

           {!realityCheck.shouldWarn && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-start space-x-2.5 text-xs">
              <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {realityCheck.state === 'no_data' && realityCheck.sampleCount === 0
                  ? 'No comparable completed history yet. This prediction becomes part of your calibration baseline.'
                  : realityCheck.state === 'insufficient_data'
                  ? `Early stage — ${realityCheck.message.toLowerCase()}`
                  : realityCheck.message}
              </span>
            </div>
          )}

           <div className="border-b border-slate-100 pb-1">
             <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">4. Decision</p>
             <p className="mt-1 text-sm text-slate-600">Your forecast stays separate from the schedule and remains in your history.</p>
           </div>
           {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
               className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
               className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
               {existingTask ? 'Save prediction' : 'Record prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
