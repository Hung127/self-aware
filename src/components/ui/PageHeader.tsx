import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, icon, right, className = '' }) => (
  <div className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-center ${className}`}>
    <div className="flex items-start gap-3">
      {icon && <div className="mt-1 shrink-0">{icon}</div>}
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-primary-ink">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
    </div>
    {right && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{right}</div>}
  </div>
);
