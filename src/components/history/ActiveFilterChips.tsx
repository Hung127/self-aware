import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ActiveFilterChipsProps {
  selectedCategory: string;
  statusFilter: string;
  resultCount: number;
  onClearCategory: () => void;
  onClearStatus: () => void;
  onClearFilters: () => void;
}

const chipClass = 'inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-primary';
const chipClearClass = 'rounded-full p-0.5 text-text-disabled transition-colors hover:bg-surface-secondary hover:text-text-primary';

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  selectedCategory,
  statusFilter,
  resultCount,
  onClearCategory,
  onClearStatus,
  onClearFilters
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {selectedCategory !== 'All' && (
      <span className={chipClass}>
        Category: {selectedCategory}
        <button type="button" onClick={onClearCategory} aria-label="Clear category filter" className={chipClearClass}>
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )}

    {statusFilter !== 'All' && (
      <span className={chipClass}>
        Status: {statusFilter}
        <button type="button" onClick={onClearStatus} aria-label="Clear status filter" className={chipClearClass}>
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    )}

    <Button type="button" variant="tertiary" size="sm" className="text-primary-ink hover:bg-primary-soft" onClick={onClearFilters}>
      Clear filters
    </Button>

    <span className="ml-auto text-xs font-medium text-text-muted">
      {resultCount} {resultCount === 1 ? 'prediction' : 'predictions'}
    </span>
  </div>
);
