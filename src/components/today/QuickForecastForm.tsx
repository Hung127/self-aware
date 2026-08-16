import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { RealityCheckAlert } from './RealityCheckAlert';
import type { TaskItem, AppSettings, TaskCategory } from '../../types';
import type { TaskFormDefaults } from '../TaskModal';
import { CATEGORIES, getRealityCheck, formatMinutesToHours } from '../../utils/calibrationEngine';

const QUICK_PRESETS = [30, 60, 90, 120, 180, 240];

interface QuickForecastFormProps {
  tasks: TaskItem[];
  settings: AppSettings;
  onSubmit: (defaults: TaskFormDefaults) => void;
}

export const QuickForecastForm: React.FC<QuickForecastFormProps> = ({ tasks, settings, onSubmit }) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('Programming');
  const [quickEstMins, setQuickEstMins] = useState<number>(120);

  const quickReality = getRealityCheck(quickCategory, quickEstMins, tasks, settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onSubmit({
      title: quickTitle.trim(),
      category: quickCategory,
      plannedMinutes: quickEstMins,
      estimatedMinutes: quickEstMins
    });
    setQuickTitle('');
  };

  const inputCls =
    'w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5 text-text-primary shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-text-primary">Quick Forecast &amp; Predict</h2>
        </div>
        <span className="hidden text-xs text-text-muted sm:inline">Set expectation before starting work</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <input
              type="text"
              aria-label="Task name"
              placeholder="What are you about to work on?"
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value as TaskCategory)}
              aria-label="Category"
              className={inputCls}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 md:col-span-3">
            <select
              value={quickEstMins}
              onChange={e => setQuickEstMins(parseInt(e.target.value))}
              aria-label="Forecast duration"
              className={`${inputCls} font-semibold`}
            >
              {QUICK_PRESETS.map(mins => (
                <option key={mins} value={mins}>
                  {formatMinutesToHours(mins)}
                </option>
              ))}
            </select>

            <Button type="submit" className="h-10 min-h-10 shrink-0 px-4 text-sm">
              <Plus className="h-4 w-4" />
              <span>Record</span>
            </Button>
          </div>
        </div>

        {/* Quick preset chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="mr-1 text-xs font-medium text-text-muted">Quick Duration:</span>
          {QUICK_PRESETS.map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => setQuickEstMins(mins)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                quickEstMins === mins
                  ? 'bg-primary font-semibold text-white shadow-card'
                  : 'border border-border bg-surface-secondary text-text-secondary hover:bg-surface-secondary hover:border-border-strong'
              }`}
            >
              {formatMinutesToHours(mins)}
            </button>
          ))}
        </div>
      </form>

      {/* Live Reality Check hint */}
      {quickReality.shouldWarn && (
        <RealityCheckAlert
          message={quickReality.message}
          aside={
            <span className="rounded-md border border-warning-border bg-surface px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-warning-ink">
              Reality Check
            </span>
          }
        >
          {quickReality.suggestedDurationMinutes && quickReality.suggestedDurationMinutes !== quickEstMins && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-warning-ink">Calibrated average:</span>
              <Button
                size="sm"
                variant="primary"
                type="button"
                onClick={() => setQuickEstMins(quickReality.suggestedDurationMinutes!)}
              >
                Adjust to {formatMinutesToHours(quickReality.suggestedDurationMinutes)}
              </Button>
            </div>
          )}
        </RealityCheckAlert>
      )}
    </div>
  );
};
