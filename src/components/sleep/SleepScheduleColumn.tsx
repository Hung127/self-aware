import React from 'react';
import { inputCls } from '../ui/Field';

interface SleepScheduleColumnProps {
  variant: 'planned' | 'actual';
  bedtime: string;
  wakeTime: string;
  onBedtimeChange: (value: string) => void;
  onWakeTimeChange: (value: string) => void;
  durationLabel: string;
}

const ACTUAL_INPUT_CLS =
  'h-10 w-full rounded-lg border border-primary-border-strong bg-surface px-3.5 text-sm font-medium text-text-primary transition-colors placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50';

const CONFIG = {
  planned: {
    container: 'border-border bg-surface-secondary',
    eyebrow: 'text-text-secondary',
    divider: 'border-border/80',
    label: 'text-text-secondary',
    input: inputCls,
    footer: 'text-text-muted',
    strong: 'text-text-primary',
  },
  actual: {
    container: 'border-primary-border bg-primary-soft/50',
    eyebrow: 'text-primary-ink',
    divider: 'border-primary-border/80',
    label: 'text-text-primary',
    input: ACTUAL_INPUT_CLS,
    footer: 'text-text-secondary',
    strong: 'font-bold text-primary-ink',
  },
};

export const SleepScheduleColumn: React.FC<SleepScheduleColumnProps> = ({
  variant,
  bedtime,
  wakeTime,
  onBedtimeChange,
  onWakeTimeChange,
  durationLabel
}) => {
  const c = CONFIG[variant];
  const isActual = variant === 'actual';

  return (
    <div className={`space-y-4 rounded-xl border p-4 ${c.container}`}>
      <div className={`flex items-center justify-between border-b pb-2 ${c.divider}`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${c.eyebrow}`}>
          {isActual ? 'Actual Realization' : 'Intended Schedule'}
        </span>
        {isActual && <span className="text-xs font-semibold text-primary">Objective</span>}
      </div>

      <div>
        <label htmlFor={`${variant}-bedtime`} className={`mb-1 block text-xs font-semibold ${c.label}`}>
          {isActual ? 'Actual' : 'Planned'} Bedtime
        </label>
        <input
          id={`${variant}-bedtime`}
          type="time"
          value={bedtime}
          onChange={e => onBedtimeChange(e.target.value)}
          required
          className={c.input}
        />
      </div>

      <div>
        <label htmlFor={`${variant}-wake`} className={`mb-1 block text-xs font-semibold ${c.label}`}>
          {isActual ? 'Actual' : 'Planned'} Wake Time
        </label>
        <input
          id={`${variant}-wake`}
          type="time"
          value={wakeTime}
          onChange={e => onWakeTimeChange(e.target.value)}
          required
          className={c.input}
        />
      </div>

      <div className={`pt-1 text-xs font-medium ${c.footer}`}>
        {isActual ? 'Actual duration: ' : 'Target duration: '}
        <strong className={c.strong}>{durationLabel}</strong>
      </div>
    </div>
  );
};
