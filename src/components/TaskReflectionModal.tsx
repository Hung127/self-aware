import React, { useState } from 'react';
import { TaskItem, ReflectionCategory } from '../types';
import { formatMinutesToHours } from '../utils/calibrationEngine';
import { HelpCircle, CheckCircle, X } from 'lucide-react';

interface TaskReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onSaveReflection: (taskId: string, reason: ReflectionCategory, notes?: string) => void;
}

const REFLECTION_OPTIONS: { value: ReflectionCategory; label: string }[] = [
  { value: 'harder_than_expected', label: '○ Task was harder than expected' },
  { value: 'started_late', label: '○ I started late' },
  { value: 'got_distracted', label: '○ I got distracted' },
  { value: 'was_tired', label: '○ I was tired' },
  { value: 'unexpected_problem', label: '○ Unexpected problem' },
  { value: 'underestimated_work', label: '○ I underestimated the work' },
  { value: 'other', label: '○ Other reason' },
];

export const TaskReflectionModal: React.FC<TaskReflectionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveReflection
}) => {
  if (!isOpen) return null;

  const [selectedReason, setSelectedReason] = useState<ReflectionCategory>('underestimated_work');
  const [notes, setNotes] = useState('');

  const est = task.estimatedDurationMinutes;
  const act = task.execution.actualDurationMinutes || est;
  const diffPercent = Math.round(((act - est) / est) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(task.id, selectedReason, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-labelledby="reflection-modal-title" className="my-8 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
             <HelpCircle className="h-5 w-5 text-blue-600" />
            <div>
               <h3 id="reflection-modal-title" className="text-lg font-bold text-slate-900">What changed the outcome?</h3>
               <p className="text-sm text-slate-500">Your reason explains the result but does not change the calculated error.</p>
            </div>
          </div>
          <button
            onClick={onClose}
             aria-label="Close reflection dialog"
             className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Comparison summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Task Title</span>
              <span className="font-bold text-sm text-slate-900">{task.title}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Predicted vs Actual</span>
              <span className="text-sm font-bold text-blue-600">
                {formatMinutesToHours(est)} → {formatMinutesToHours(act)} ({diffPercent > 0 ? `+${diffPercent}%` : `${diffPercent}%`})
              </span>
            </div>
          </div>

          {/* Options */}
          <div>
             <label className="mb-2.5 block text-sm font-semibold text-slate-700">
               Choose one reason
            </label>
            <div className="space-y-2">
              {REFLECTION_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  onClick={() => setSelectedReason(opt.value)}
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === opt.value
                       ? 'bg-blue-50 border-blue-600 text-slate-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reflectionReason"
                    value={opt.value}
                    checked={selectedReason === opt.value}
                    onChange={() => setSelectedReason(opt.value)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm">{opt.label.replace('○ ', '')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional notes */}
          <div>
             <label className="mb-1.5 block text-sm font-semibold text-slate-700">
               Optional note
            </label>
            <textarea
              rows={2}
               placeholder="What would you remember next time?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
               className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
               Skip for now
            </button>
            <button
              type="submit"
               className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4" />
               <span>Save reflection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
