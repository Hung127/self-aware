import React, { useState } from 'react';
import { TaskItem, SkipReason } from '../types';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { SkipForward, Clock, AlertCircle } from 'lucide-react';
import { formatMinutesToHours } from '../utils/calibrationEngine';

interface SkipReasonModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirm: (taskId: string, reason?: SkipReason) => void;
}

const SKIP_REASONS: { value: SkipReason; label: string; description: string }[] = [
  { value: 'too_tired', label: 'Energy or fatigue', description: 'Was too exhausted or tired to start' },
  { value: 'something_more_important', label: 'Priority shift', description: 'Something more urgent or critical came up' },
  { value: 'harder_than_expected', label: 'Complexity blocker', description: 'Discovered scope was harder than anticipated' },
  { value: 'unexpected_event', label: 'Unforeseen interruption', description: 'External event disrupted scheduled time' },
  { value: 'forgot', label: 'Overlooked schedule', description: 'Forgot the planned start window' },
  { value: 'did_not_feel_like_it', label: 'Motivation dip', description: 'Did not feel inclined to begin' },
  { value: 'other', label: 'Other circumstance', description: 'Other unlisted context' }
];

export const SkipReasonModal: React.FC<SkipReasonModalProps> = ({ task, onClose, onConfirm }) => {
  const [selected, setSelected] = useState<SkipReason>('too_tired');

  return (
    <ModalShell
      title="Skip Task"
      description={`Record context for skipping "${task.title}". This helps calibrate completion rates objectively.`}
      icon={<SkipForward className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => {
              onConfirm(task.id, undefined);
              onClose();
            }}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            Skip without recording reason
          </Button>
          <div className="flex items-center gap-2.5">
            <Button type="button" variant="tertiary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onConfirm(task.id, selected);
                onClose();
              }}
            >
              Record & Skip
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        {/* Task summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs flex items-center justify-between">
          <span className="font-bold text-slate-900">{task.title}</span>
          <span className="text-slate-500 font-medium">{task.category} · Forecast: {formatMinutesToHours(task.estimatedDurationMinutes)}</span>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Select primary factor
        </label>

        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {SKIP_REASONS.map(opt => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3.5 transition-all ${
                selected === opt.value
                  ? 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="skipReason"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
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
    </ModalShell>
  );
};

