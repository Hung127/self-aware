import React from 'react';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export const SegmentedControl = <T extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<T>) => (
  <div role="group" aria-label={ariaLabel} className="inline-flex rounded-xl border border-border bg-surface-secondary p-1">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        aria-pressed={value === opt.value}
        className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
          value === opt.value
            ? 'bg-surface text-text-primary shadow-sm'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
