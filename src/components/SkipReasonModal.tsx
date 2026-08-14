import React, { useState } from 'react';
import { TaskItem, SkipReason } from '../types';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { SkipForward } from 'lucide-react';

interface SkipReasonModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirm: (taskId: string, reason?: SkipReason) => void;
}

const SKIP_REASONS: { value: SkipReason; label: string }[] = [
  { value: 'too_tired', label: 'I was too tired' },
  { value: 'forgot', label: 'I forgot' },
  { value: 'harder_than_expected', label: 'Harder than expected' },
  { value: 'something_more_important', label: 'Something more important came up' },
  { value: 'unexpected_event', label: 'Unexpected event' },
  { value: 'did_not_feel_like_it', label: "I didn't feel like it" },
  { value: 'other', label: 'Other' }
];

export const SkipReasonModal: React.FC<SkipReasonModalProps> = ({ task, onClose, onConfirm }) => {
  const [selected, setSelected] = useState<SkipReason>('too_tired');

  return (
    <ModalShell
      title="Skip task"
      description={`Why are you skipping "${task.title}"? This is recorded in your history.`}
      icon={<SkipForward className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-md"
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
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Skip without a reason
          </Button>
          <div className="flex items-center gap-3">
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
              Skip task
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2">
        {SKIP_REASONS.map(opt => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center space-x-3 rounded-xl border p-3 transition-all ${
              selected === opt.value
                ? 'border-blue-600 bg-blue-50 font-semibold text-slate-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="skipReason"
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => setSelected(opt.value)}
              className="accent-blue-600"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </ModalShell>
  );
};
