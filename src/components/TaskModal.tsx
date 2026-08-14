import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory, AppSettings, TaskPredictionDecision } from '../types';
import { CATEGORIES, getRealityCheck, formatMinutesToHours } from '../utils/calibrationEngine';
import { Target, AlertTriangle, Info, Clock, X, Check, Shield } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: TaskItem) => void;
  existingTask?: TaskItem | null;
  allTasks: TaskItem[];
  settings: AppSettings;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  existingTask,
  allTasks,
  settings
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(existingTask?.title || '');
  const [category, setCategory] = useState<TaskCategory>(existingTask?.category || 'Programming');
  const [tag, setTag] = useState(existingTask?.tag || '');
  const [scheduledDate, setScheduledDate] = useState(
    existingTask?.plannedStart ? existingTask.plannedStart.split('T')[0] : todayStr
  );
  const [startTime, setStartTime] = useState(
    existingTask?.plannedStart
      ? new Date(existingTask.plannedStart).toTimeString().substring(0, 5)
      : '14:00'
  );
  
  // Estimated Duration in Minutes (default 120 / 2h)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(
    existingTask?.estimatedDurationMinutes || 120
  );
  const [confidence, setConfidence] = useState<number>(existingTask?.confidence || 80);
  const [acceptedSuggestion, setAcceptedSuggestion] = useState<boolean | null>(
    existingTask?.realityCheck?.acceptedSuggestion ?? null
  );

  // Reality Check evaluation
  const realityCheck = getRealityCheck(category, estimatedMinutes, allTasks, settings, tag, existingTask?.id);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setCategory(existingTask.category);
      setTag(existingTask.tag || '');
      setScheduledDate(existingTask.plannedStart.split('T')[0]);
      setStartTime(new Date(existingTask.plannedStart).toTimeString().substring(0, 5));
      setEstimatedMinutes(existingTask.estimatedDurationMinutes);
      setConfidence(existingTask.confidence);
      setAcceptedSuggestion(existingTask.realityCheck?.acceptedSuggestion ?? null);
    }
  }, [existingTask]);

  const handleApplySuggested = () => {
    if (realityCheck.suggestedDurationMinutes) {
      setEstimatedMinutes(realityCheck.suggestedDurationMinutes);
      setAcceptedSuggestion(true);
    }
  };

  const handleKeepEstimate = () => {
    setAcceptedSuggestion(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = new Date(`${scheduledDate}T${startTime}:00.000Z`).toISOString();
    const endDateTime = new Date(
      new Date(`${scheduledDate}T${startTime}:00.000Z`).getTime() + estimatedMinutes * 60000
    ).toISOString();

    const realityCheckDecision: TaskPredictionDecision | undefined = realityCheck.shouldWarn
      ? {
          shown: true,
          suggestedDurationMinutes: realityCheck.suggestedDurationMinutes,
          acceptedSuggestion: acceptedSuggestion === true,
          finalPredictionMinutes: estimatedMinutes,
          createdAt: new Date().toISOString()
        }
      : existingTask?.realityCheck;

    const task: TaskItem = {
      id: existingTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      category,
      tag: tag.trim() || undefined,
      plannedStart: startDateTime,
      plannedEnd: endDateTime,
      plannedDurationMinutes: estimatedMinutes,
      estimatedDurationMinutes: estimatedMinutes,
      confidence,
      originalPlannedStart: existingTask?.originalPlannedStart || startDateTime,
      originalEstimatedDurationMinutes: existingTask?.originalEstimatedDurationMinutes || estimatedMinutes,
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-xl text-slate-900 my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {existingTask ? 'Edit Task Prediction' : 'New Planned Task'}
              </h3>
              <p className="text-xs text-slate-500">Record your expectation before starting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Task Title
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
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
                Sub-tag <span className="text-[10px] text-slate-400 font-normal">(Opt)</span>
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
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
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

          {/* Start Time & Estimated Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Planned Start
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
              <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">
                Estimated Duration
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  value={estimatedMinutes}
                  onChange={e => {
                    setEstimatedMinutes(Math.max(5, parseInt(e.target.value) || 0));
                    setAcceptedSuggestion(null);
                  }}
                  required
                  className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-blue-600 font-bold text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  ({formatMinutesToHours(estimatedMinutes)})
                </span>
              </div>
            </div>
          </div>

          {/* Stated Confidence Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Stated Confidence
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
                      {realityCheck.severity === 'reality_check' ? 'Reality Check' : 'Historical Calibration Note'}
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
                  Your estimate: <strong className="text-slate-800">{formatMinutesToHours(estimatedMinutes)}</strong> | Typical: <strong className="text-blue-600">{formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</strong>
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleKeepEstimate}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                      acceptedSuggestion === false
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Keep my {formatMinutesToHours(estimatedMinutes)}
                  </button>

                  <button
                    type="button"
                    onClick={handleApplySuggested}
                    className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs ${
                      acceptedSuggestion === true
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {acceptedSuggestion === true && <Check className="w-3.5 h-3.5" />}
                    <span>Adjust to {formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {!realityCheck.shouldWarn && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center space-x-2.5 text-xs">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{realityCheck.message}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
            >
              {existingTask ? 'Save Task' : 'Record Task Prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

