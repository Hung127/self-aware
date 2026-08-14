import React, { useState } from 'react';
import { TaskItem } from '../types';
import { ModalShell } from './ui/ModalShell';
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(task.id, date);
              onClose();
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Postpone to {date}
          </button>
        </div>
      }
    >
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          New date
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-slate-500">Currently scheduled for {new Date(task.plannedStart).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}.</p>
      </div>
    </ModalShell>
  );
};
