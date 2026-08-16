import React from 'react';
import { CalendarDays, Clock, RefreshCw } from 'lucide-react';
import type { GCalEvent } from '../../utils/googleCalendar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { EventLinkStatus } from './EventCard';

interface LinkedPredictionsPanelProps {
  events: GCalEvent[];
  getLinkStatus: (evt: GCalEvent) => EventLinkStatus;
  isSyncing: boolean;
  onSync: () => void;
  onInspect: (evt: GCalEvent) => void;
}

export const LinkedPredictionsPanel: React.FC<LinkedPredictionsPanelProps> = ({
  events,
  getLinkStatus,
  isSyncing,
  onSync,
  onInspect
}) => (
  <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
    <div className="flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg border border-primary-border bg-primary-soft p-2 text-primary">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text-primary">Linked predictions</h3>
          <p className="text-xs text-text-muted">
            Events that have a prediction recorded in your calibration history.
          </p>
        </div>
      </div>
      <Button onClick={onSync} loading={isSyncing} variant="secondary" size="sm" className="rounded-xl">
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Refresh Sync</span>
      </Button>
    </div>

    {events.length === 0 ? (
      <div className="space-y-3 py-8 text-center">
        <p className="text-sm text-text-muted">
          No events synced yet. Sync your calendar to see linked predictions here.
        </p>
        <Button onClick={onSync} loading={isSyncing} size="sm">
          <RefreshCw className="h-3.5 w-3.5" />
          Sync calendar
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {events.map(evt => {
          const { isRecorded, isPlanLinked } = getLinkStatus(evt);
          const startObj = new Date(evt.start.dateTime);
          const dateStr = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={evt.id}
              className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-surface-secondary p-4 transition-all hover:border-primary-border hover:bg-surface"
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="line-clamp-1 text-xs font-bold text-text-primary">{evt.summary}</h4>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                  <Clock className="h-3 w-3 text-text-disabled" />
                  <span>{dateStr} at {timeStr}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                <Badge tone={isRecorded ? 'success' : isPlanLinked ? 'info' : 'neutral'}>
                  {isRecorded ? 'Prediction recorded' : isPlanLinked ? 'Plan linked' : 'Not linked'}
                </Badge>

                <button
                  onClick={() => onInspect(evt)}
                  className="text-xs font-bold text-primary-ink hover:text-primary hover:underline"
                >
                  Inspect / Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
