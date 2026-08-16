import React from 'react';
import { Moon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { SleepRecord } from '../../types';
import { formatMinutesToHours } from '../../utils/calibrationEngine';

interface SleepContextStripProps {
  todaySleep?: SleepRecord;
  onOpenSleepLog: () => void;
}

export const SleepContextStrip: React.FC<SleepContextStripProps> = ({ todaySleep, onOpenSleepLog }) => (
  <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-text-primary shadow-card sm:flex-row sm:items-center">
    <div className="flex items-center space-x-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-secondary">
        <Moon className="h-4 w-4" />
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold leading-none text-text-primary">Sleep context</span>
          {todaySleep?.isShortSleep && (
            <Badge tone="warning" className="text-xs font-bold leading-none py-0.5">
              &lt; 6h Short sleep
            </Badge>
          )}
        </div>
        {todaySleep ? (
          <p className="mt-1 text-xs leading-normal text-text-secondary">
            <strong className="font-semibold text-text-primary">{formatMinutesToHours(todaySleep.actualSleepDurationMinutes)}</strong> recorded last night. Stored as an objective context variable.
          </p>
        ) : (
          <p className="mt-1 text-xs leading-normal text-text-muted">
            No sleep recorded for last night.
          </p>
        )}
      </div>
    </div>

    <Button size="sm" variant="secondary" onClick={onOpenSleepLog} className="shrink-0">
      {todaySleep ? 'Update sleep' : 'Log sleep'}
    </Button>
  </div>
);
