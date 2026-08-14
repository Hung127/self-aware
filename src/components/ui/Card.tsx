import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div {...props} className={`rounded-xl border border-slate-200 bg-white shadow-card ${className}`} />
);
