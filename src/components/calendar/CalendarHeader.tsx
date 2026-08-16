import React from 'react';
import { Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface CalendarHeaderProps {
  connected: boolean;
  isSyncing: boolean;
  viewMode: 'list' | 'embed';
  onViewModeChange: (mode: 'list' | 'embed') => void;
  onSync: () => void;
  onCreate: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  connected,
  isSyncing,
  viewMode,
  onViewModeChange,
  onSync,
  onCreate
}) => (
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <div className="flex items-start gap-4">
      <CalendarIcon className="h-6 w-6 shrink-0 text-primary" />
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Calendar</h1>
          <Badge tone={connected ? 'success' : 'warning'}>
            {connected ? 'Connected' : 'Not connected'}
          </Badge>
        </div>
        <p className="mt-1 max-w-xl text-sm text-text-secondary">
          Your calendar is the plan. Record a prediction before you start to compare it with reality.
        </p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-2.5">
      <Button
        onClick={onSync}
        loading={isSyncing}
        variant={connected ? 'primary' : 'secondary'}
      >
        <RefreshCw className="h-4 w-4" />
        <span>{isSyncing ? 'Syncing...' : 'Sync calendar'}</span>
      </Button>

      <SegmentedControl
        ariaLabel="Calendar view mode"
        value={viewMode}
        onChange={onViewModeChange}
        options={[
          { value: 'list', label: 'List view' },
          { value: 'embed', label: 'Embed view' }
        ]}
      />

      <Button onClick={onCreate} variant="secondary">
        <Plus className="h-4 w-4" />
        <span>New event</span>
      </Button>
    </div>
  </div>
);
