import React from 'react';
import { Filter } from 'lucide-react';
import { CATEGORIES } from '../../utils/calibrationEngine';

interface HistoryFiltersProps {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortChange: (value: 'newest' | 'oldest') => void;
}

const selectClass =
  'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none';
const labelClass = 'flex items-center gap-1 text-sm font-semibold text-text-secondary';

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  sortOrder,
  onSortChange
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>
        <Filter className="h-3.5 w-3.5" /> Category
      </label>
      <select
        aria-label="Filter by category"
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
        className={selectClass}
      >
        <option value="All">All categories</option>
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>

    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>Status</label>
      <select
        aria-label="Filter by status"
        value={statusFilter}
        onChange={e => onStatusChange(e.target.value)}
        className={selectClass}
      >
        <option value="All">All statuses</option>
        <option value="completed">Completed</option>
        <option value="not_started">Not started</option>
        <option value="in_progress">In progress</option>
        <option value="postponed">Postponed</option>
        <option value="skipped">Skipped</option>
      </select>
    </div>

    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>Sort</label>
      <select
        aria-label="Sort order"
        value={sortOrder}
        onChange={e => onSortChange(e.target.value as 'newest' | 'oldest')}
        className={selectClass}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>
  </div>
);
