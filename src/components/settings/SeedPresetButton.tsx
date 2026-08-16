import React from 'react';

interface SeedPresetButtonProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  featured?: boolean;
}

export const SeedPresetButton: React.FC<SeedPresetButtonProps> = ({ label, description, icon, onClick, featured = false }) => (
  <button
    onClick={onClick}
    className={`group flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
      featured
        ? 'border-primary-border bg-primary-soft hover:bg-primary-soft/80'
        : 'border-border bg-surface-secondary hover:bg-surface'
    }`}
  >
    <div className={`mb-1 flex items-center gap-1.5 text-xs font-bold ${featured ? 'text-primary-ink' : 'text-text-secondary'}`}>
      <span className={featured ? '' : 'text-text-muted'}>{icon}</span>
      <span>{label}</span>
    </div>
    <p className={`text-xs leading-relaxed ${featured ? 'text-text-secondary' : 'text-text-muted'}`}>{description}</p>
  </button>
);
