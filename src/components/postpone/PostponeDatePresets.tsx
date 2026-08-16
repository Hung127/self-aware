import React from 'react';

interface PostponeDatePresetsProps {
  tomorrow: string;
  inTwoDays: string;
  inAWeek: string;
  selected: string;
  onSelect: (value: string) => void;
}

const PRESETS: { key: keyof Omit<PostponeDatePresetsProps, 'selected' | 'onSelect'>; label: string }[] = [
  { key: 'tomorrow', label: 'Tomorrow (+1d)' },
  { key: 'inTwoDays', label: 'In 2 days (+2d)' },
  { key: 'inAWeek', label: 'Next week (+7d)' },
];

export const PostponeDatePresets: React.FC<PostponeDatePresetsProps> = ({ tomorrow, inTwoDays, inAWeek, selected, onSelect }) => {
  const values = { tomorrow, inTwoDays, inAWeek };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
        Quick selection
      </label>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(p => {
          const value = values[p.key];
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect(value)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                selected === value
                  ? 'border-primary bg-primary-soft text-primary-ink ring-2 ring-primary/20'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
