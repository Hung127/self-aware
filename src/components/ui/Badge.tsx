import React from 'react';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }> = ({ tone = 'neutral', className = '', ...props }) => {
  const tones: Record<BadgeTone, string> = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-700'
  };
  return <span {...props} className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${tones[tone]} ${className}`} />;
};
