import React, { useState } from 'react';
import { TaskItem } from '../types';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Field, inputCls } from './ui/Field';
import { CalendarClock } from 'lucide-react';

interface PostponeModalProps {
  task: TaskItem;
  onClose: () => void;
  onConfirm: (taskId: string, toDate: string) => void;
}

export const PostponeModal: React.FC<PostponeModalProps> = ({ task, onClose, onConfirm }) => {
  const tomorrow = (() => {
    const d = new Date(task.plannedStart);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const [date, setDate] = useState(tomorrow);

  return (
    <ModalShell
      title="Postpone task"
      description={`"${task.title}" will move to the new date you choose.`}
      icon={<CalendarClock className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-3">
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
            Postpone to {date}
          </Button>
        </div>
      }
    >
      <div className="space-y-1.5">
        <Field label="New date" helper={`Currently scheduled for ${new Date(task.plannedStart).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}.`}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className={inputCls}
          />
        </Field>
      </div>
    </ModalShell>
  );
};
