import React, { useState } from 'react';
import { TaskItem } from '../types';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { CalendarClock, Calendar, Clock } from 'lucide-react';
import { formatMinutesToHours } from '../utils/calibrationEngine';

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
      <div className="p-6 space-y-5">
        {/* Task Summary Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">{task.title}</span>
            <span className="font-medium text-slate-500">{task.category}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span>Scheduled: <strong className="text-slate-800">{currentDateDisplay}</strong></span>
            <span>·</span>
            <span>Forecast: <strong className="text-slate-800">{formatMinutesToHours(task.estimatedDurationMinutes)}</strong></span>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Quick selection
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDate(tomorrow)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                date === tomorrow
                  ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Tomorrow (+1d)
            </button>
            <button
              type="button"
              onClick={() => setDate(inTwoDays)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                date === inTwoDays
                  ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              In 2 days (+2d)
            </button>
            <button
              type="button"
              onClick={() => setDate(inAWeek)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                date === inAWeek
                  ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Next week (+7d)
            </button>
          </div>
        </div>

        {/* Custom Date Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="postpone-date">
            Choose Target Date
          </label>
          <div className="relative">
            <input
              id="postpone-date"
              type="date"
              value={date}
              min={tomorrow}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>

        {/* Selected target preview */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Moving to <strong className="text-slate-900">{targetDateDisplay}</strong></span>
          </div>
          <span className="text-2xs font-bold uppercase px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-700">
            +{daysDifference} {daysDifference === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
    </ModalShell>
  );
};

