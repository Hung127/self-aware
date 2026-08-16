import React from 'react';
import { Clock, Edit2, Target, Trash2 } from 'lucide-react';
import type { GCalEvent } from '../../utils/googleCalendar';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';

export interface EventLinkStatus {
  isRecorded: boolean;
  isPlanLinked: boolean;
}

interface EventCardProps {
  evt: GCalEvent;
  category: string;
  linkStatus: EventLinkStatus;
  onCalibrate: (evt: GCalEvent) => void;
  onViewDetails: (evt: GCalEvent) => void;
  onEdit: (evt: GCalEvent) => void;
  onDelete: (evt: GCalEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  evt,
  category,
  linkStatus,
  onCalibrate,
  onViewDetails,
  onEdit,
  onDelete
}) => {
  const startObj = new Date(evt.start.dateTime);
  const endObj = new Date(evt.end.dateTime);
  const dateHeader = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = `${startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const durationMins = Math.max(15, Math.round((endObj.getTime() - startObj.getTime()) / 60000));
  const { isRecorded, isPlanLinked } = linkStatus;

  return (
    <div className="group flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:border-primary-border hover:shadow-pop">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-snug text-text-primary transition-colors group-hover:text-primary">
            {evt.summary}
          </h3>
          <span className="shrink-0 rounded-full border border-primary-border bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-ink">
            {category}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isRecorded ? (
            <span className="inline-flex items-center rounded-full border border-success-border bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success-ink">
              <Target className="h-3 w-3" />
              <span>Prediction recorded</span>
            </span>
          ) : isPlanLinked ? (
            <span className="inline-flex items-center rounded-full border border-primary-border bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-ink">
              <Target className="h-3 w-3" />
              <span>Plan linked</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-text-muted">
              <span>Not linked</span>
            </span>
          )}
        </div>

        {evt.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">{evt.description}</p>
        )}

        <div className="flex items-center gap-3 pt-1 text-xs font-semibold text-text-muted">
          <span className="flex items-center gap-1 text-text-primary">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{dateHeader}, {timeStr}</span>
          </span>
          <span className="text-text-disabled">•</span>
          <span>{durationMins} mins</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <Button
          onClick={() => onCalibrate(evt)}
          disabled={isRecorded}
          variant="secondary"
          size="sm"
          className={`rounded-xl ${
            isRecorded
              ? 'cursor-default border-success-border bg-success-soft text-success-ink'
              : 'border-primary-border bg-primary-soft text-primary-ink hover:bg-primary-soft'
          }`}
        >
          <Target className="h-3.5 w-3.5" />
          <span>{isRecorded ? 'Prediction recorded' : 'Record a prediction'}</span>
        </Button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewDetails(evt)}
            className="rounded-lg bg-primary-soft px-2.5 py-1.5 text-xs font-bold text-primary-ink transition-colors hover:bg-primary-soft"
            title="Open event details"
          >
            View details
          </button>
          <IconButton label="Edit calendar event" onClick={() => onEdit(evt)}>
            <Edit2 className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Delete calendar event"
            onClick={() => onDelete(evt)}
            className="hover:bg-danger-soft hover:text-danger-ink"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
