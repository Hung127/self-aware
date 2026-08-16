import React from 'react';

interface CardSectionProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const CardSection: React.FC<CardSectionProps> = ({ icon, title, subtitle, right, footer, className = '', children }) => (
  <section className={`rounded-2xl border border-border bg-surface p-6 shadow-card ${className}`}>
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-primary-soft text-primary">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-base font-bold text-text-primary">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
    <div className="mt-5">{children}</div>
    {footer && <footer className="mt-5 border-t border-border pt-3 text-xs text-text-muted">{footer}</footer>}
  </section>
);
