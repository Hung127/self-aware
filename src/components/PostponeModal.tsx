import React, { useState } from 'react';
import { TaskItem } from '../types';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { CalendarClock } from 'lucide-react';
import { formatMinutesToHours } from '../utils/calibrationEngine';
import { PostponeDatePresets } from './postpone/PostponeDatePresets';
import { PostponeTargetPreview } from './postpone/PostponeTargetPreview';

interface PostponeModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirm: (taskId: string, toDate: string) => void;
}

export const PostponeModal: React.FC<PostponeModalProps> = ({ task, onClose, onConfirm }) => {
  const baseDate = new Date(task.plannedStart);

  const getShiftedDate = (days: number): string => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const tomorrow = getShiftedDate(1);
  const inTwoDays = getShiftedDate(2);
  const inThreeDays = getShiftedDate(3);
  const inAWeek = getShiftedDate(7);

  const [date, setDate] = useState(tomorrow);

  const currentDateDisplay = new Date(task.plannedStart).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const targetDateDisplay = new Date(`${date}T12:00:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const daysDifference = Math.max(
    1,
    Math.round(
      (new Date(`${date}T12:00:00`).getTime() - new Date(`${task.plannedStart.split('T')[0]}T12:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <ModalShell
      title="Postpone Task"
      description={`Move "${task.title}" to a future date while preserving the original prediction record.`}
      icon={<CalendarClock className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(task.id, date);
              onClose();
            }}
          >
            Postpone Task
          </Button>
        </div>
      }
    >
      <div className="space-y-5 p-6">
        {/* Task Summary Banner */}
        <div className="space-y-1.5 rounded-xl border border-border bg-surface-secondary p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">{task.title}</span>
            <span className="font-medium text-text-muted">{task.category}</span>
          </div>
          <div className="flex items-center gap-3 text-text-muted">
            <span>
              Scheduled: <strong className="text-text-primary">{currentDateDisplay}</strong>
            </span>
            <span>·</span>
            <span>
              Forecast: <strong className="text-text-primary">{formatMinutesToHours(task.estimatedDurationMinutes)}</strong>
            </span>
          </div>
        </div>

        <PostponeDatePresets
          tomorrow={tomorrow}
          inTwoDays={inTwoDays}
          inAWeek={inAWeek}
          selected={date}
          onSelect={setDate}
        />

        {/* Custom Date Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary" htmlFor="postpone-date">
            Choose Target Date
          </label>
          <input
            id="postpone-date"
            type="date"
            value={date}
            min={tomorrow}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <PostponeTargetPreview targetDateDisplay={targetDateDisplay} daysDifference={daysDifference} />
      </div>
    </ModalShell>
  );
};
