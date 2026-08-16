import React, { useState } from 'react';
import { TaskItem, ReflectionCategory } from '../types';
import { getHistoricalCalibrationBaseline } from '../utils/calibrationEngine';
import { HelpCircle, CheckCircle } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { RadioCardList, RadioCardOption } from './ui/RadioCardList';
import { ReflectionComparisonCard } from './reflection/ReflectionComparisonCard';

interface TaskReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onSaveReflection: (taskId: string, reason: ReflectionCategory, notes?: string) => void;
}

const REFLECTION_OPTIONS: RadioCardOption[] = [
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
            <CheckCircle className="h-4 w-4" />
            Save Reflection
          </Button>
        </div>
      }
    >
      <form id="reflection-modal-form" onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
        <ReflectionComparisonCard
          taskTitle={task.title}
          forecastMinutes={est}
          actualMinutes={task.execution.actualDurationMinutes}
        />

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
            Primary contributing factor
          </label>
          <RadioCardList
            name="reflectionReason"
            options={REFLECTION_OPTIONS}
            selected={selectedReason}
            onSelect={value => setSelectedReason(value as ReflectionCategory)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary" htmlFor="reflection-notes">
            What will you consider next time? <span className="font-normal lowercase text-text-disabled">(optional note)</span>
          </label>
          <textarea
            id="reflection-notes"
            rows={2}
            placeholder="e.g., Leave a 30m buffer for edge cases; break task into smaller milestones."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-sm text-text-primary transition-colors placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>
    </ModalShell>
  );
};
