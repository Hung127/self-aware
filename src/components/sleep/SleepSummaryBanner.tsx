import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SleepSummaryBannerProps {
  actualHours: number;
  actualMins: number;
  isShortSleep: boolean;
}

export const SleepSummaryBanner: React.FC<SleepSummaryBannerProps> = ({ actualHours, actualMins, isShortSleep }) => (
  <div
    className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
      isShortSleep
        ? 'border-warning-border bg-warning-soft text-warning-ink'
        : 'border-success-border bg-success-soft text-success-ink'
    }`}
  >
    <div className="flex items-center space-x-3">
      <div className={`rounded-lg p-2 ${isShortSleep ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
        <Clock className="h-5 w-5" />
      </div>
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">
          Calculated Sleep
        </span>
        <span className="text-xl font-bold">
          {actualHours} hours {actualMins > 0 ? `${actualMins} minutes` : ''}
        </span>
      </div>
    </div>

    <div className="flex items-center">
      {isShortSleep ? (
        <Badge tone="warning" className="text-xs font-bold">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>&lt; 6h Short sleep</span>
        </Badge>
      ) : (
        <Badge tone="success" className="text-xs font-bold">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Recorded (≥ 6h)</span>
        </Badge>
      )}
    </div>
  </div>
);
