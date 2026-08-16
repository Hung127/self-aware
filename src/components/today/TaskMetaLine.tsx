import React from 'react';

export interface TaskMetaItem {
  label: string;
  value: string;
}

export const TaskMetaLine: React.FC<{ items: TaskMetaItem[] }> = ({ items }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
    {items.map(item => (
      <span key={item.label}>
        {item.label}: <strong className="font-semibold text-text-primary">{item.value}</strong>
      </span>
    ))}
  </div>
);
