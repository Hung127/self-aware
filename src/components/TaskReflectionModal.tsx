import React, { useState } from 'react';
import { TaskItem, ReflectionCategory } from '../types';
import { formatMinutesToHours, getHistoricalCalibrationBaseline } from '../utils/calibrationEngine';
import { HelpCircle, CheckCircle } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';

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

  const est = getHistoricalCalibrationBaseline(task);
  const act = task.execution.actualDurationMinutes;
  const diffPercent = act === undefined ? null : Math.round(((act - est) / est) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(task.id, selectedReason, notes.trim() || undefined);
    onClose();
  };

  return (
    <ModalShell
      title="What changed the outcome?"
      description="Your reason explains the result but does not change the calculated error."
      icon={<HelpCircle className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Skip for now
          </button>
          <button
            type="submit"
            form="reflection-modal-form"
            className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save reflection</span>
          </button>
        </div>
      }
    >
        <form id="reflection-modal-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Comparison summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Task Title</span>
              <span className="font-bold text-sm text-slate-900">{task.title}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Predicted vs Actual</span>
              <span className="text-sm font-bold text-blue-600">
                 {act === undefined ? `${formatMinutesToHours(est)} → Duration not measured` : `${formatMinutesToHours(est)} → ${formatMinutesToHours(act)} (${diffPercent! > 0 ? `+${diffPercent}%` : `${diffPercent}%`})`}
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
        </form>
    </ModalShell>
  );
};
