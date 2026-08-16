import React from 'react';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }> = ({ tone = 'neutral', className = '', ...props }) => {
  const tones: Record<BadgeTone, string> = {
    neutral: 'border-border bg-surface-secondary text-text-secondary',
    info: 'border-primary-border bg-primary-soft text-primary-ink',
    success: 'border-success-border bg-success-soft text-success-ink',
    warning: 'border-warning-border bg-warning-soft text-warning-ink',
    danger: 'border-danger-border bg-danger-soft text-danger-ink'
  };
  return <span {...props} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${tones[tone]} ${className}`} />;
};
