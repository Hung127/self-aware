import React from 'react';

type EmptyStateLayout = 'center' | 'row';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  layout?: EmptyStateLayout;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actions, layout = 'center', className = '' }) => {
  if (layout === 'row') {
    return (
      <div className={`flex items-start justify-between gap-3 rounded-xl border border-dashed border-border-strong bg-surface-secondary/50 p-4 ${className}`}>
        <div className="flex items-start gap-2.5">
          {icon && <div className="mt-0.5 shrink-0 text-text-disabled">{icon}</div>}
          <div>
            <p className="text-sm font-semibold text-text-secondary">{title}</p>
            {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-surface-secondary/40 px-6 py-10 text-center ${className}`}>
      {icon && <div className="mb-1 text-text-disabled">{icon}</div>}
      <p className="text-sm font-semibold text-text-secondary">{title}</p>
      {description && <p className="text-xs text-text-muted">{description}</p>}
      {actions && <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
};
