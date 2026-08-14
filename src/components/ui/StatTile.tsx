import React from 'react';

interface StatTileProps {
  label: string;
  value: string | number;
  subLabel?: string;
  valueClassName?: string;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, subLabel, valueClassName = 'text-slate-900', className }) => (
  <div className={`rounded-xl border border-slate-200 bg-slate-50 p-3 ${className || ''}`}>
    <span className="block text-xs text-slate-500">{label}</span>
    <strong className={`mt-0.5 block text-xl font-extrabold ${valueClassName}`}>{value}</strong>
    {subLabel && <span className="block text-xs text-slate-500">{subLabel}</span>}
  </div>
);
