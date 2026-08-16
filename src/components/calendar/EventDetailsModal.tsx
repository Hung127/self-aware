import React from 'react';
import { Calendar as CalendarIcon, Clock, Edit2, ExternalLink, Target, Trash2 } from 'lucide-react';
import type { GCalEvent } from '../../utils/googleCalendar';
import { ModalShell } from '../ui/ModalShell';
import { Button } from '../ui/Button';

interface EventDetailsModalProps {
  evt: GCalEvent;
  category: string;
  showPreview: boolean;
  embedSrc: string;
  hasRecordedPrediction: boolean;
  onTogglePreview: () => void;
  onClose: () => void;
  onDelete: (evt: GCalEvent) => void;
  onEdit: (evt: GCalEvent) => void;
  onCalibrate: (evt: GCalEvent) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  evt,
  category,
  showPreview,
  embedSrc,
  hasRecordedPrediction,
  onTogglePreview,
  onClose,
  onDelete,
  onEdit,
  onCalibrate
}) => (
  <ModalShell
    title={evt.summary}
    description="Calendar event"
    icon={<CalendarIcon className="h-6 w-6" />}
    onClose={onClose}
    maxWidth="max-w-xl"
    footer={
      <div className="flex items-center justify-between">
        <Button onClick={() => onDelete(evt)} variant="danger" size="sm" className="rounded-lg">
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete event</span>
        </Button>

        <Button onClick={onClose} size="sm" variant="secondary" className="rounded-xl">
          Done
        </Button>
      </div>
    }
  >
    <div className="space-y-5 p-6">
      <div className="space-y-3 rounded-xl border border-border bg-surface-secondary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {new Date(evt.start.dateTime).toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              {' - '}
              {new Date(evt.end.dateTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-ink">
            {category}
          </span>
        </div>

        {evt.description && (
          <p className="border-t border-border pt-2 text-xs leading-relaxed text-text-secondary">
            {evt.description}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Event actions</h4>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => onEdit(evt)}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3.5 text-xs font-bold text-text-primary shadow-card transition-all hover:bg-surface-secondary"
          >
            <Edit2 className="h-4 w-4 shrink-0 text-primary" />
            <div className="text-left">
              <div>Edit title & schedule</div>
              <div className="text-xs font-normal text-text-muted">Edit directly in app</div>
            </div>
          </button>

          {evt.htmlLink ? (
            <a
              href={evt.htmlLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-primary-border bg-primary-soft p-3.5 text-xs font-bold text-primary-ink shadow-card transition-all hover:bg-primary-soft/80"
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
              <div className="text-left">
                <div>Open in Google Calendar</div>
                <div className="text-xs font-normal text-primary-ink">Edit in Google Calendar</div>
              </div>
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-primary-border bg-primary-soft/70 p-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-ink">
            <Target className="h-4 w-4 text-primary" />
            <span>Calibration prediction</span>
          </div>
          <p className="text-xs text-primary-ink">Record what you think it'll take before starting.</p>
        </div>

        <button
          onClick={() => onCalibrate(evt)}
          disabled={hasRecordedPrediction}
          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
            hasRecordedPrediction
              ? 'cursor-default bg-success-soft text-success-ink'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
        >
          {hasRecordedPrediction ? 'Prediction recorded' : 'Record a prediction'}
        </button>
      </div>

      <div className="space-y-2 border-t border-border pt-2">
        <button
          onClick={onTogglePreview}
          aria-expanded={showPreview}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-bold text-text-primary transition-colors hover:bg-surface-secondary"
        >
          <span>Calendar preview</span>
          <span className="text-primary-ink">{showPreview ? 'Hide' : 'Show'}</span>
        </button>

        {showPreview && (
          <div className="h-56 overflow-hidden rounded-xl border border-border bg-surface-secondary">
            <iframe
              src={embedSrc}
              title="Google Calendar Preview"
              className="h-full w-full border-none"
            />
          </div>
        )}
      </div>
    </div>
  </ModalShell>
);
