import React, { useState } from 'react';
import { TaskItem, TaskCategory } from '../types';
import { CATEGORIES, formatMinutesToHours, calculateEstimationError } from '../utils/calibrationEngine';
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
  Calendar
} from 'lucide-react';

interface HistoryViewProps {
  tasks: TaskItem[];
  onDeleteTask: (taskId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  tasks,
  onDeleteTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || t.execution.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort by date descending
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return new Date(b.plannedStart).getTime() - new Date(a.plannedStart).getTime();
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Prediction History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare "What I expected" vs "What actually happened"
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search past predictions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 placeholder-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2">
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mr-2 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="postponed">Postponed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Task Comparison Cards */}
      {sortedTasks.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No predictions found matching filters</h3>
          <p className="text-xs text-slate-500">Try clearing your search query or selecting a different category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => {
            const est = task.estimatedDurationMinutes;
            const act = task.execution.actualDurationMinutes || 0;
            const hasActual = task.execution.status === 'completed' && act > 0;

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
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {task.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    {isDone && (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </span>
                    )}

                    {isPostponed && (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Postponed</span>
                      </span>
                    )}

                    {isSkipped && (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skipped</span>
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Side-by-side Expectation vs Reality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What I Expected */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      What I Expected
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Estimated Duration</span>
                        <span className="font-bold text-slate-800">{formatMinutesToHours(est)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Stated Confidence</span>
                        <span className="font-bold text-blue-600">{task.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* What Actually Happened */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        What Actually Happened
                      </span>
                      {hasActual && (
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${
                          errorPercent > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : errorPercent < 0
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {errorPercent > 0
                            ? `+${errorPercent}% Underestimate`
                            : errorPercent < 0
                            ? `${errorPercent}% Overestimate`
                            : '0% On Target'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Actual Duration</span>
                        <span className="font-bold text-slate-800">
                          {hasActual ? formatMinutesToHours(act) : 'Not recorded'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Actual Start</span>
                        <span className="font-bold text-slate-800">
                          {task.execution.actualStart
                            ? new Date(task.execution.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reflection Notes if present */}
                {task.execution.reflection && (
                  <div className="p-3 rounded-xl bg-[#fff8e1] border border-[#ffe082] flex items-start space-x-2.5 text-xs text-[#92400e]">
                    <AlertCircle className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[#78350f] uppercase tracking-wider text-[10px]">
                        Why? {task.execution.reflection.reason.replace(/_/g, ' ')}
                      </span>
                      {task.execution.reflection.notes && (
                        <span className="text-[#92400e] mt-0.5 block italic">
                          "{task.execution.reflection.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
