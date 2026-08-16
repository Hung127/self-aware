import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'dangerSolid' | 'success';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', loading = false, children, className = '', disabled, ...props }) => {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active',
    secondary: 'bg-surface text-text-primary border border-border-strong hover:bg-surface-secondary active:bg-surface-secondary',
    tertiary: 'bg-transparent text-text-muted hover:bg-surface-secondary hover:text-text-primary',
    danger: 'bg-surface text-danger-ink border border-danger-border hover:bg-danger-soft',
    dangerSolid: 'bg-danger text-white hover:bg-danger-hover active:bg-danger-hover',
    success: 'bg-success text-white hover:bg-success-hover active:bg-success-hover'
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'min-h-8 px-2.5 py-1.5 text-xs gap-1.5',
    md: 'min-h-10 px-4 py-2 text-sm gap-2'
  };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </button>
  );
};
