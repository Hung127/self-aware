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
  <div role="group" aria-label={ariaLabel} className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        aria-pressed={value === opt.value}
        className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
          value === opt.value
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
