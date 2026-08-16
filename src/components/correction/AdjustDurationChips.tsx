import React from 'react';

const ADJUSTMENTS: { delta: number; label: string }[] = [
  { delta: -30, label: '-30m' },
  { delta: -15, label: '-15m' },
  { delta: 15, label: '+15m' },
  { delta: 30, label: '+30m' },
  { delta: 60, label: '+1h' },
];

interface AdjustDurationChipsProps {
  onAdjust: (delta: number) => void;
}

export const AdjustDurationChips: React.FC<AdjustDurationChipsProps> = ({ onAdjust }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className="mr-1 text-xs font-medium text-text-muted">Adjust:</span>
    {ADJUSTMENTS.map(a => (
      <button
        key={a.label}
        type="button"
        onClick={() => onAdjust(a.delta)}
        className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
      >
        {a.label}
      </button>
    ))}
  </div>
);
