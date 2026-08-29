import React, { useState } from 'react';
import { TaskItem, TaskCategory } from '../types';
import { CATEGORIES, formatMinutesToHours, calculateEstimationError, getHistoricalCalibrationBaseline, isDurationCalibrationEligible } from '../utils/calibrationEngine';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  SkipForward,
  Trash2,
  Calendar,
  PenLine,
  X,
  Plus,
  Sparkles
} from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

const REFLECTION_LABELS: Record<string, { label: string; tone: 'faster' | 'slower' | 'neutral' }> = {
  easier_than_expected: { label: 'Simpler than anticipated', tone: 'faster' },
  overestimated_work: { label: 'Overestimated scope or effort', tone: 'faster' },
  high_focus_flow: { label: 'High focus / Flow state', tone: 'faster' },
  reused_existing_work: { label: 'Reused prior work / templates', tone: 'faster' },
  fewer_interruptions: { label: 'Fewer interruptions', tone: 'faster' },
  better_tools_automation: { label: 'Better tools / AI assistance', tone: 'faster' },
  reduced_scope: { label: 'Streamlined / Reduced scope', tone: 'faster' },
  received_help: { label: 'Received guidance or assistance', tone: 'faster' },
  underestimated_work: { label: 'Underestimated scope or volume', tone: 'slower' },
  harder_than_expected: { label: 'Unanticipated complexity / bugs', tone: 'slower' },
  got_distracted: { label: 'Attention divided or interrupted', tone: 'slower' },
  started_late: { label: 'Delayed execution start', tone: 'slower' },
  was_tired: { label: 'Fatigue or low energy', tone: 'slower' },
  unexpected_problem: { label: 'Tool failure or external blocker', tone: 'slower' },
  expanded_scope: { label: 'Scope creep / Added requirements', tone: 'slower' },
  on_target: { label: 'On target execution', tone: 'neutral' },
  other: { label: 'Other factor', tone: 'neutral' }
};

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

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (t.predictionStatus === 'not_recorded') return false;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || t.execution.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort by date descending
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const diff = new Date(b.plannedStart).getTime() - new Date(a.plannedStart).getTime();
    return sortOrder === 'newest' ? diff : -diff;
  });

  return (
    <div className="mx-auto max-w-content space-y-6 pb-16 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
             <div className="flex items-center gap-2">
             <History className="h-5 w-5 text-blue-600" />
             <h1 className="text-3xl font-bold tracking-tight text-slate-900">Prediction history</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Compare "What I expected" vs "What actually happened"
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
           <input
             aria-label="Search prediction history"
            type="text"
            placeholder="Search past predictions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 placeholder-slate-400 shadow-2xs"
          />
        </div>
      </div>

       {/* Filters */}
       <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
         <div className="flex flex-col gap-1.5">
           <label className="flex items-center gap-1 text-sm font-semibold text-slate-700">
             <Filter className="h-3.5 w-3.5" /> Category
           </label>
           <select aria-label="Filter by category" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600">
             <option value="All">All categories</option>
             {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
           </select>
         </div>
         <div className="flex flex-col gap-1.5">
           <label className="text-sm font-semibold text-slate-700">Status</label>
           <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600">
             <option value="All">All statuses</option>
             <option value="completed">Completed</option>
             <option value="not_started">Not started</option>
             <option value="in_progress">In progress</option>
             <option value="postponed">Postponed</option>
             <option value="skipped">Skipped</option>
           </select>
         </div>
         <div className="flex flex-col gap-1.5">
           <label className="text-sm font-semibold text-slate-700">Sort</label>
           <select aria-label="Sort order" value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600">
             <option value="newest">Newest first</option>
             <option value="oldest">Oldest first</option>
           </select>
         </div>
        </div>

       {/* Active filter chips + count */}
       {(selectedCategory !== 'All' || statusFilter !== 'All') && (
         <div className="flex flex-wrap items-center gap-2">
           {selectedCategory !== 'All' && (
             <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
               Category: {selectedCategory}
               <button
                 type="button"
                 onClick={() => setSelectedCategory('All')}
                 aria-label="Clear category filter"
                 className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
               >
                 <X className="h-3.5 w-3.5" />
               </button>
             </span>
           )}
           {statusFilter !== 'All' && (
             <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
               Status: {statusFilter}
               <button
                 type="button"
                 onClick={() => setStatusFilter('All')}
                 aria-label="Clear status filter"
                 className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
               >
                 <X className="h-3.5 w-3.5" />
               </button>
             </span>
           )}
            <Button type="button" variant="tertiary" size="sm" className="text-blue-700 hover:bg-blue-50" onClick={clearFilters}>
              Clear filters
            </Button>
           <span className="ml-auto text-xs font-medium text-slate-500">
             {sortedTasks.length} {sortedTasks.length === 1 ? 'prediction' : 'predictions'}
           </span>
         </div>
       )}

      {/* Task Comparison Cards */}
      {sortedTasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm
              ? `No predictions match "${searchTerm}"`
              : selectedCategory !== 'All' || statusFilter !== 'All'
              ? 'No predictions match the current filters'
              : 'No prediction history yet'}
          </h3>
          <p className="text-sm text-slate-500">
            {searchTerm || selectedCategory !== 'All' || statusFilter !== 'All'
              ? 'Try a different search or clear your filters.'
              : 'Complete, postpone, or skip a prediction to compare your forecast with reality.'}
          </p>
          {!searchTerm && selectedCategory === 'All' && statusFilter === 'All' && onOpenNewTask && (
            <Button type="button" variant="primary" size="sm" onClick={onOpenNewTask}>
              <Plus className="w-3.5 h-3.5" />
              Record your first prediction
            </Button>
          )}
          {searchTerm && (
            <Button type="button" variant="tertiary" size="sm" className="text-blue-700 hover:bg-blue-50" onClick={() => setSearchTerm('')}>
              Clear search
            </Button>
          )}
          {(selectedCategory !== 'All' || statusFilter !== 'All') && (
            <Button type="button" variant="tertiary" size="sm" className="text-blue-700 hover:bg-blue-50" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => {
             const est = getHistoricalCalibrationBaseline(task);
             const act = task.execution.actualDurationMinutes || 0;
             const hasActual = isDurationCalibrationEligible(task);

            const errorFraction = hasActual ? calculateEstimationError(est, act) : 0;
            const errorPercent = Math.round(errorFraction * 100);

            const isDone = task.execution.status === 'completed';
            const isPostponed = task.execution.status === 'postponed';
            const isSkipped = task.execution.status === 'skipped';

            const scheduledDateFormatted = new Date(task.plannedStart).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            const scheduledTimeFormatted = new Date(task.plannedStart).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {scheduledDateFormatted} @ {scheduledTimeFormatted}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{task.title}</h3>
                    <Badge tone="neutral" className="rounded-full px-2.5 py-0.5">
                      {task.category}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    {isDone && (
                      <Badge tone="success" className="rounded-full px-2.5 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </Badge>
                    )}

                    {isPostponed && (
                      <Badge tone="warning" className="rounded-full px-2.5 py-0.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Postponed</span>
                      </Badge>
                    )}

                     {isSkipped && (
                       <Badge tone="neutral" className="rounded-full px-2.5 py-0.5">
                         <SkipForward className="w-3.5 h-3.5" />
                         <span>Skipped{task.execution.skipReason ? `: ${task.execution.skipReason.replace(/_/g, ' ')}` : ''}</span>
                       </Badge>
                     )}

                    <button
                       onClick={() => setDeleteTarget({ id: task.id, title: task.title })}
                       aria-label="Delete prediction from history"
                       title="Delete prediction from history"
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {isDone && (
                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => onCorrectTask(task)}
                        title="Correct this completed observation"
                        className="h-10 px-3 text-amber-700 hover:bg-amber-50"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        Correct
                      </Button>
                    )}
                  </div>
                </div>

                  {/* Side-by-side Expectation vs Reality */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* What I Expected */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        What I Expected
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium block">Original Forecast</span>
                          <span className="font-bold text-slate-900 text-sm">{formatMinutesToHours(est)}</span>
                        </div>
                        {task.realityCheck?.shown && task.realityCheck.suggestedDurationMinutes ? (
                          <div>
                            <span className="text-slate-500 font-medium block">Suggested</span>
                            <span className="font-bold text-blue-700 text-sm">{formatMinutesToHours(task.realityCheck.suggestedDurationMinutes)}</span>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-slate-500 font-medium block">Final Plan</span>
                          <span className="font-bold text-slate-900 text-sm">{formatMinutesToHours(task.estimatedDurationMinutes)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium block">Confidence</span>
                          <span className="font-bold text-blue-700 text-sm">{task.confidence}%</span>
                        </div>
                      </div>

                      {task.realityCheck?.shown && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Decision</span>
                          <span className="text-xs font-semibold text-slate-800">
                            {task.realityCheck.userDecision === 'accepted_suggestion'
                              ? 'Used historical suggestion'
                              : task.realityCheck.userDecision === 'kept_original'
                              ? 'Kept original forecast'
                              : task.realityCheck.userDecision === 'custom_adjusted'
                              ? 'Custom adjusted'
                              : 'Prediction recorded'}
                          </span>
                        </div>
                      )}

                      {/* Original vs final forecast error */}
                      {hasActual && task.estimatedDurationMinutes !== est && (
                        <div className="flex items-center space-x-3 text-xs text-slate-600 pt-1">
                          <span>
                            Original error: <strong className={Math.round(calculateEstimationError(est, act) * 100) > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                              {Math.round(calculateEstimationError(est, act) * 100)}%
                            </strong>
                          </span>
                          <span className="text-slate-300">→</span>
                          <span>
                            Final error: <strong className={Math.round(calculateEstimationError(task.estimatedDurationMinutes, act) * 100) > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                              {Math.round(calculateEstimationError(task.estimatedDurationMinutes, act) * 100)}%
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                  {/* What Actually Happened */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        What Actually Happened
                      </span>
                      {hasActual ? (
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md border ${
                          errorPercent > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : errorPercent < 0
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {errorPercent > 0
                            ? `+${errorPercent}% Underestimate`
                            : errorPercent < 0
                            ? `${errorPercent}% Overestimate`
                            : '0% On Target'}
                        </span>
                      ) : isSkipped ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          Skipped
                        </span>
                      ) : isPostponed ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Postponed
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {task.execution.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium block">Actual Duration</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {hasActual
                            ? formatMinutesToHours(act)
                            : isDone
                            ? 'Not measured'
                            : 'Pending work'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Actual Start</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {task.execution.actualStart
                            ? new Date(task.execution.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Not started'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reflection Notes if present */}
                {task.execution.reflection && (() => {
                  const info = REFLECTION_LABELS[task.execution.reflection.reason] || {
                    label: task.execution.reflection.reason.replace(/_/g, ' '),
                    tone: 'neutral' as const
                  };
                  const isFasterTone = info.tone === 'faster';
                  return (
                    <div className={`p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
                      isFasterTone
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      {isFasterTone ? (
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={`font-bold block uppercase tracking-wider text-xs ${
                          isFasterTone ? 'text-emerald-800' : 'text-amber-800'
                        }`}>
                          {isFasterTone ? 'Factor: ' : 'Why: '}
                          {info.label}
                        </span>
                        {task.execution.reflection.notes && (
                          <span className={`mt-0.5 block italic ${
                            isFasterTone ? 'text-emerald-800' : 'text-amber-800'
                          }`}>
                            "{task.execution.reflection.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Correction audit note */}
                {task.execution.correction && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-800">
                    <PenLine className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase tracking-wider text-xs">
                        Observation corrected
                      </span>
                      <span className="mt-0.5 block">
                        Previous: {task.execution.correction.previous.actualDurationMinutes !== undefined
                          ? formatMinutesToHours(task.execution.correction.previous.actualDurationMinutes)
                          : 'not measured'}
                        {task.execution.correction.reason ? ` · ${task.execution.correction.reason}` : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
