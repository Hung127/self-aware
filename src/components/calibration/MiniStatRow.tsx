import React from 'react';

interface MiniStatRowProps {
  label: string;
  subLabel?: string;
  value: React.ReactNode;
  valueClassName?: string;
  centered?: boolean;
  className?: string;
}

export const MiniStatRow: React.FC<MiniStatRowProps> = ({ label, subLabel, value, valueClassName = 'text-text-primary', centered = false, className = '' }) => (
  <div
    className={`rounded-xl border border-border bg-surface-secondary p-3.5 text-xs ${centered ? 'space-y-1 text-center' : 'flex items-center justify-between'} ${className}`}
  >
    {centered ? (
      <>
        <span className="block font-semibold text-text-muted">{label}</span>
        <span className={`block text-2xl font-extrabold ${valueClassName}`}>{value}</span>
        {subLabel && <span className="block font-medium text-text-muted">{subLabel}</span>}
      </>
    ) : (
      <>
        <div>
          <span className="block font-bold text-text-primary">{label}</span>
          {subLabel && <span className="text-text-muted">{subLabel}</span>}
        </div>
        <span className={`font-bold ${valueClassName}`}>{value}</span>
      </>
    )}
  </div>
);
