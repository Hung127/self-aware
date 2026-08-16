import React, { useState } from 'react';
import { TaskItem, ReflectionCategory } from '../types';
import { formatMinutesToHours, getHistoricalCalibrationBaseline } from '../utils/calibrationEngine';
import { HelpCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';

interface TaskReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onSaveReflection: (taskId: string, reason: ReflectionCategory, notes?: string) => void;
}

const REFLECTION_OPTIONS: { value: ReflectionCategory; label: string; description: string }[] = [
  { value: 'underestimated_work', label: 'Underestimated scope or volume', description: 'There was more work to complete than originally envisioned' },
  { value: 'harder_than_expected', label: 'Unanticipated complexity', description: 'Encountered difficult problems or blockers' },
  { value: 'started_late', label: 'Delayed execution start', description: 'Began significantly later than the planned window' },
  { value: 'got_distracted', label: 'Attention divided or interrupted', description: 'Context switching or external distractions occurred' },
  { value: 'was_tired', label: 'Fatigue or low energy', description: 'Pace was slower due to tiredness' },
  { value: 'unexpected_problem', label: 'External roadblock', description: 'Tool failure, dependency blocker, or technical issue' },
  { value: 'other', label: 'Other circumstance', description: 'Another specific factor influenced the outcome' },
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
      title="Execution Reflection"
      description="Reflect on what shifted the outcome. This context helps interpret future calibration patterns."
      icon={<HelpCircle className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Skip Reflection
          </Button>
          <Button type="submit" form="reflection-modal-form">
            <CheckCircle className="w-4 h-4" />
            Save Reflection
          </Button>
        </div>
      }
    >
      <form id="reflection-modal-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* Comparison summary card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Task</span>
            <span className="font-bold text-sm text-slate-900">{task.title}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Forecast → Actual</span>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-sm font-semibold text-slate-700">{formatMinutesToHours(est)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-bold text-blue-700">
                {act === undefined ? 'Unmeasured' : `${formatMinutesToHours(act)} (${diffPercent! >= 0 ? `+${diffPercent}%` : `${diffPercent}%`})`}
              </span>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Primary contributing factor
          </label>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {REFLECTION_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3 transition-all ${
                  selectedReason === opt.value
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reflectionReason"
                  value={opt.value}
                  checked={selectedReason === opt.value}
                  onChange={() => setSelectedReason(opt.value)}
                  className="accent-blue-600 mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                  <span className="block text-xs text-slate-500">{opt.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Optional notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reflection-notes">
            What will you consider next time? <span className="text-slate-400 font-normal lowercase">(optional note)</span>
          </label>
          <textarea
            id="reflection-notes"
            rows={2}
            placeholder="e.g., Leave a 30m buffer for edge cases; break task into smaller milestones."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </form>
    </ModalShell>
  );
};

