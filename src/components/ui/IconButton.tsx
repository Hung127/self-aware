import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
}

export const IconButton: React.FC<IconButtonProps> = ({ label, size = 'md', className = '', children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    {...props}
    className={`inline-flex shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary ${
      size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
    } ${className}`}
  >
    {children}
  </button>
);
