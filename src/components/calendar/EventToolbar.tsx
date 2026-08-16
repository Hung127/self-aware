import React from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';

export type CalendarScope = 'day' | 'week' | 'all';

interface EventToolbarProps {
  scope: CalendarScope;
  onScopeChange: (scope: CalendarScope) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  dateHeader: string;
  totalEvents: number;
}

export const EventToolbar: React.FC<EventToolbarProps> = ({
  scope,
  onScopeChange,
  onPrev,
  onNext,
  onToday,
  dateHeader,
  totalEvents
}) => (
  <div className="flex flex-col justify-between gap-4 border-b border-border bg-surface-secondary/50 px-6 py-4 sm:flex-row sm:items-center">
    <div className="flex items-center gap-3">
      {scope !== 'all' && (
        <>
          <IconButton label="Previous date or week" onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <Button onClick={onToday} variant="secondary" size="sm" className="rounded-xl">
            Today
          </Button>
          <IconButton label="Next date or week" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </>
      )}

      <h2 className="ml-1 text-sm font-bold text-text-primary">{dateHeader}</h2>
    </div>

    <div className="flex items-center gap-2">
      <SegmentedControl
        ariaLabel="Calendar scope"
        value={scope}
        onChange={onScopeChange}
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'all', label: `All Events (${totalEvents})` }
        ]}
      />

      <a
        href="https://calendar.google.com"
        target="_blank"
        rel="noreferrer"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary"
        title="Open Google Calendar in New Tab"
        aria-label="Open Google Calendar in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  </div>
);
