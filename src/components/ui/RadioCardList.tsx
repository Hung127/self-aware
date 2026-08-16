import React from 'react';

export interface RadioCardOption {
  value: string;
  label: string;
  description: string;
}

interface RadioCardListProps {
  name: string;
  options: RadioCardOption[];
  selected: string;
  onSelect: (value: string) => void;
  maxHeight?: string;
}

export const RadioCardList: React.FC<RadioCardListProps> = ({
  name,
  options,
  selected,
  onSelect,
  maxHeight = 'max-h-[260px]'
}) => (
  <div className={`space-y-2 overflow-y-auto pr-1 ${maxHeight}`}>
    {options.map(opt => (
      <label
        key={opt.value}
        className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3 transition-all ${
          selected === opt.value
            ? 'border-primary bg-primary-soft text-text-primary ring-2 ring-primary/20'
            : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary'
        }`}
      >
        <input
          type="radio"
          name={name}
          value={opt.value}
          checked={selected === opt.value}
          onChange={() => onSelect(opt.value)}
          className="mt-0.5 accent-primary"
        />
        <div className="space-y-0.5">
          <span className="block text-sm font-semibold text-text-primary">{opt.label}</span>
          <span className="block text-xs text-text-muted">{opt.description}</span>
        </div>
      </label>
    ))}
  </div>
);
