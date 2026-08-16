import React, { useState } from 'react';
import type { TaskItem } from '../types';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { HistoryHeader } from './history/HistoryHeader';
import { HistoryFilters } from './history/HistoryFilters';
import { ActiveFilterChips } from './history/ActiveFilterChips';
import { HistoryEmptyState } from './history/HistoryEmptyState';
import { HistoryEntryCard } from './history/HistoryEntryCard';

interface HistoryViewProps {
  tasks: TaskItem[];
  onDeleteTask: (taskId: string, options?: { permanent?: boolean }) => void;
  onCorrectTask: (task: TaskItem) => void;
  onOpenNewTask?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  tasks,
  onDeleteTask,
  onCorrectTask,
  onOpenNewTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const clearFilters = () => {
    setSelectedCategory('All');
    setStatusFilter('All');
  };

  const filteredTasks = tasks.filter(t => {
    if (t.predictionStatus === 'not_recorded') return false;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || t.execution.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const diff = new Date(b.plannedStart).getTime() - new Date(a.plannedStart).getTime();
    return sortOrder === 'newest' ? diff : -diff;
  });

  const hasActiveFilters = selectedCategory !== 'All' || statusFilter !== 'All';

  return (
    <div className="mx-auto max-w-content space-y-6 pb-16">
      <HistoryHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <HistoryFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      {hasActiveFilters && (
        <ActiveFilterChips
          selectedCategory={selectedCategory}
          statusFilter={statusFilter}
          resultCount={sortedTasks.length}
          onClearCategory={() => setSelectedCategory('All')}
          onClearStatus={() => setStatusFilter('All')}
          onClearFilters={clearFilters}
        />
      )}

      {sortedTasks.length === 0 ? (
        <HistoryEmptyState
          searchTerm={searchTerm}
          hasActiveFilters={hasActiveFilters}
          onClearSearch={() => setSearchTerm('')}
          onClearFilters={clearFilters}
          onOpenNewTask={onOpenNewTask}
        />
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => (
            <HistoryEntryCard
              key={task.id}
              task={task}
              onDeleteRequest={t => setDeleteTarget({ id: t.id, title: t.title })}
              onCorrect={onCorrectTask}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove from history?"
          message={`"${deleteTarget.title}" will be permanently deleted from prediction history.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={() => onDeleteTask(deleteTarget.id, { permanent: true })}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
