import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ label, className = '', children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    {...props}
    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary ${className}`}
  >
    {children}
  </button>
);
