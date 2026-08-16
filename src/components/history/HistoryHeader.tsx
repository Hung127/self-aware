import React from 'react';
import { History, Search } from 'lucide-react';

interface HistoryHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const HistoryHeader: React.FC<HistoryHeaderProps> = ({ searchTerm, onSearchChange }) => (
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div>
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Prediction history</h1>
      </div>
      <p className="mt-1 text-sm text-text-secondary">Compare "What I expected" vs "What actually happened"</p>
    </div>

    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
      <input
        aria-label="Search prediction history"
        type="text"
        placeholder="Search past predictions..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-3.5 text-xs text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none"
      />
    </div>
  </div>
);
