import React from 'react';

interface DetailCellProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export const DetailCell: React.FC<DetailCellProps> = ({ label, value, valueClassName = 'text-text-primary' }) => (
  <div>
    <span className="block text-xs font-medium text-text-muted">{label}</span>
    <span className={`block text-sm font-bold ${valueClassName}`}>{value}</span>
  </div>
);
