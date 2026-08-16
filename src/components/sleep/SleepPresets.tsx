import React from 'react';

const BEDTIME_PRESETS = ['22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00'];

interface SleepPresetsProps {
  value: string;
  onSelect: (value: string) => void;
}

export const SleepPresets: React.FC<SleepPresetsProps> = ({ value, onSelect }) => (
  <div className="space-y-2">
    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
      Quick actual bedtime presets
    </label>
    <div className="flex flex-wrap gap-1.5">
      {BEDTIME_PRESETS.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
            value === t
              ? 'border-primary bg-primary-soft text-primary-ink'
              : 'border-border bg-surface text-text-muted hover:bg-surface-secondary'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  </div>
);
