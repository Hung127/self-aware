import React, { useState } from 'react';
import { TaskItem, SkipReason } from '../types';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { SkipForward } from 'lucide-react';
import { formatMinutesToHours } from '../utils/calibrationEngine';
import { RadioCardList, RadioCardOption } from './ui/RadioCardList';

interface SkipReasonModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirm: (taskId: string, reason?: SkipReason) => void;
}

const SKIP_REASONS: RadioCardOption[] = [
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
            className="text-xs text-text-muted hover:text-text-primary"
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
      <div className="space-y-4 p-6">
        {/* Task summary */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-3.5 text-xs">
          <span className="font-bold text-text-primary">{task.title}</span>
          <span className="font-medium text-text-muted">
            {task.category} · Forecast: {formatMinutesToHours(task.estimatedDurationMinutes)}
          </span>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
          Select primary factor
        </label>

        <RadioCardList
          name="skipReason"
          options={SKIP_REASONS}
          selected={selected}
          onSelect={value => setSelected(value as SkipReason)}
          maxHeight="max-h-[320px]"
        />
      </div>
    </ModalShell>
  );
};
