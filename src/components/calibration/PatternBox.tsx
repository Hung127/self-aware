import React from 'react';

interface PatternBoxProps {
  eyebrow: string;
  className?: string;
  children: React.ReactNode;
}

export const PatternBox: React.FC<PatternBoxProps> = ({ eyebrow, className = '', children }) => (
  <div className={`space-y-1.5 rounded-xl border border-border bg-surface-secondary p-4 ${className}`}>
    <span className="block text-xs font-bold uppercase tracking-wider text-text-muted">{eyebrow}</span>
    {children}
  </div>
);
