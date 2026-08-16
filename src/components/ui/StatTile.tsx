import React from 'react';

interface StatTileProps {
  label: string;
  value: string | number;
  subLabel?: string;
  valueClassName?: string;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, subLabel, valueClassName = 'text-text-primary', className }) => (
  <div className={`rounded-xl border border-border bg-surface-secondary p-3 ${className || ''}`}>
    <span className="block text-xs text-text-muted">{label}</span>
    <strong className={`mt-0.5 block text-xl font-extrabold ${valueClassName}`}>{value}</strong>
    {subLabel && <span className="block text-xs text-text-muted">{subLabel}</span>}
  </div>
);
