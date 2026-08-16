import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

interface HistoryEmptyStateProps {
  searchTerm: string;
  hasActiveFilters: boolean;
  onClearSearch: () => void;
  onClearFilters: () => void;
  onOpenNewTask?: () => void;
}

export const HistoryEmptyState: React.FC<HistoryEmptyStateProps> = ({
  searchTerm,
  hasActiveFilters,
  onClearSearch,
  onClearFilters,
  onOpenNewTask
}) => {
  const title = searchTerm
    ? `No predictions match "${searchTerm}"`
    : hasActiveFilters
      ? 'No predictions match the current filters'
      : 'No prediction history yet';

  const description =
    searchTerm || hasActiveFilters
      ? 'Try a different search or clear your filters.'
      : 'Complete, postpone, or skip a prediction to compare your forecast with reality.';

  return (
    <EmptyState
      icon={<Calendar className="h-8 w-8" />}
      title={title}
      description={description}
      actions={
        <>
          {!searchTerm && !hasActiveFilters && onOpenNewTask && (
            <Button type="button" variant="primary" size="sm" onClick={onOpenNewTask}>
              <Plus className="h-3.5 w-3.5" />
              Record your first prediction
            </Button>
          )}
          {searchTerm && (
            <Button type="button" variant="tertiary" size="sm" className="text-primary-ink hover:bg-primary-soft" onClick={onClearSearch}>
              Clear search
            </Button>
          )}
          {hasActiveFilters && (
            <Button type="button" variant="tertiary" size="sm" className="text-primary-ink hover:bg-primary-soft" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
        </>
      }
    />
  );
};
