import React from 'react';
import { CalendarClock } from 'lucide-react';
import type { GCalEvent } from '../../utils/googleCalendar';
import { ModalShell } from '../ui/ModalShell';
import { Button } from '../ui/Button';

interface EventFormModalProps {
  editingEvent: GCalEvent | null;
  summary: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  formError: string | null;
  onSummaryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-xl border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-primary focus:bg-surface focus:outline-none';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-secondary';

export const EventFormModal: React.FC<EventFormModalProps> = ({
  editingEvent,
  summary,
  description,
  startDate,
  endDate,
  startTime,
  endTime,
  formError,
  onSummaryChange,
  onDescriptionChange,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onSubmit,
  onClose
}) => (
  <ModalShell
    title={editingEvent ? 'Edit Google Calendar event' : 'New Google Calendar event'}
    description="Set the title, date, and time window for this plan."
    icon={<CalendarClock className="h-5 w-5" />}
    onClose={onClose}
    maxWidth="max-w-lg"
    initialFocus="none"
  >
    <form onSubmit={onSubmit} className="space-y-5 p-6">
      <div>
        <label className={labelClass}>Event title / summary</label>
        <input
          type="text"
          placeholder="e.g., Deep Learning Chapter Reading..."
          value={summary}
          onChange={e => onSummaryChange(e.target.value)}
          required
          autoFocus
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={e => onStartTimeChange(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End time</label>
          <input
            type="time"
            value={endTime}
            onChange={e => onEndTimeChange(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      {formError && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-soft px-3 py-2 text-xs font-medium text-danger-ink">
          {formError}
        </p>
      )}

      <div>
        <label className={labelClass}>Description / context (optional)</label>
        <textarea
          placeholder="Notes, materials, or target goals..."
          rows={3}
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border pt-3">
        <Button type="button" onClick={onClose} variant="tertiary">
          Cancel
        </Button>
        <Button type="submit">
          {editingEvent ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  </ModalShell>
);
