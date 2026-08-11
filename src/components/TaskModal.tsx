import React, { useState, useEffect } from 'react';
import { TaskItem, TaskCategory, AppSettings } from '../types';
import { CATEGORIES, getRealityCheck, formatMinutesToHours } from '../utils/calibrationEngine';
import { Target, AlertTriangle, Info, Clock, X, ArrowRight } from 'lucide-react';

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

  // Reality Check evaluation
  const realityCheck = getRealityCheck(category, estimatedMinutes, allTasks, settings);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setCategory(existingTask.category);
      setScheduledDate(existingTask.plannedStart.split('T')[0]);
      setStartTime(new Date(existingTask.plannedStart).toTimeString().substring(0, 5));
      setEstimatedMinutes(existingTask.estimatedDurationMinutes);
      setConfidence(existingTask.confidence);
    }
  }, [existingTask]);

  const handleApplySuggested = () => {
    if (realityCheck.suggestedDurationMinutes) {
      setEstimatedMinutes(realityCheck.suggestedDurationMinutes);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startDateTime = new Date(`${scheduledDate}T${startTime}:00.000Z`).toISOString();
    const endDateTime = new Date(
      new Date(`${scheduledDate}T${startTime}:00.000Z`).getTime() + estimatedMinutes * 60000
    ).toISOString();

    const task: TaskItem = {
      id: existingTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      category,
      plannedStart: startDateTime,
      plannedEnd: endDateTime,
      plannedDurationMinutes: estimatedMinutes,
      estimatedDurationMinutes: estimatedMinutes,
      confidence,
      originalPlannedStart: existingTask?.originalPlannedStart || startDateTime,
      originalEstimatedDurationMinutes: existingTask?.originalEstimatedDurationMinutes || estimatedMinutes,
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
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[#4361ee]">
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-[#4361ee] focus:bg-white placeholder-slate-400"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-[#4361ee] focus:bg-white"
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
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-[#4361ee] focus:bg-white"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-[#4361ee] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4361ee] uppercase tracking-wider mb-1.5">
                Estimated Duration
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  max="1440"
                  step="5"
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(Math.max(5, parseInt(e.target.value) || 0))}
                  required
                  className="w-full bg-slate-50 border border-indigo-200 rounded-xl px-3.5 py-2.5 text-[#4361ee] font-bold text-sm focus:outline-none focus:border-[#4361ee] focus:bg-white"
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
              <span className="text-sm font-bold text-[#4361ee]">{confidence}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={confidence}
              onChange={e => setConfidence(parseInt(e.target.value))}
              className="w-full accent-[#4361ee] bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
              <span>50% (Uncertain)</span>
              <span>80% (Likely)</span>
              <span>95% (Certain)</span>
            </div>
          </div>

          {/* LIVE REALITY CHECK BANNER */}
          {realityCheck.shouldWarn && (
            <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
              realityCheck.severity === 'reality_check'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-indigo-50 border-indigo-100 text-slate-800'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 shrink-0">
                  {realityCheck.severity === 'reality_check' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Info className="w-5 h-5 text-[#4361ee]" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">Reality Check</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      Based on {realityCheck.sampleCount} past {category.toLowerCase()} tasks
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90 text-slate-700">
                    {realityCheck.message}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Original: <strong className="text-slate-800">{formatMinutesToHours(estimatedMinutes)}</strong> → Calibrated: <strong className="text-[#4361ee]">{formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleApplySuggested}
                  className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#4361ee] text-white hover:bg-[#3852d0] transition-colors shadow-xs"
                >
                  <span>Adjust to {formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {!realityCheck.shouldWarn && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center space-x-2.5 text-xs">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
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
              className="px-5 py-2 rounded-xl text-sm font-bold bg-[#4361ee] hover:bg-[#3852d0] text-white shadow-xs transition-colors"
            >
              {existingTask ? 'Save Task' : 'Record Task Prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
