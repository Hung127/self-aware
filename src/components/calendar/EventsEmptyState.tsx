import React from 'react';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface EventsEmptyStateProps {
  scope: 'day' | 'week' | 'all';
  eventsCount: number;
  onSync: () => void;
  onViewAll: () => void;
}

export const EventsEmptyState: React.FC<EventsEmptyStateProps> = ({ scope, eventsCount, onSync, onViewAll }) => (
  <div className="rounded-2xl border-2 border-dashed border-border-strong bg-surface-secondary/50 py-12 text-center">
    <CalendarIcon className="mx-auto mb-3 h-10 w-10 text-text-disabled" />
    <h3 className="text-sm font-bold text-text-primary">
      No events found for {scope === 'day' ? 'this date' : 'this range'}
    </h3>
    <p className="mx-auto mt-1 max-w-md text-xs text-text-muted">
      Click <strong>"Sync calendar"</strong> to pull down events, or create a new event for this day.
    </p>
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button onClick={onSync} size="sm" className="rounded-xl">
        <RefreshCw className="h-3.5 w-3.5" />
        <span>Sync Google Calendar</span>
      </Button>
      <Button onClick={onViewAll} variant="secondary" size="sm" className="rounded-xl">
        View All {eventsCount} Events
      </Button>
    </div>
  </div>
);
