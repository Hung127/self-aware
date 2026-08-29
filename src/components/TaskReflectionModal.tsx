import React, { useState } from 'react';
import { TaskItem, ReflectionCategory } from '../types';
import { formatMinutesToHours, getHistoricalCalibrationBaseline } from '../utils/calibrationEngine';
import { HelpCircle, CheckCircle, ArrowRight, Zap, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';

interface TaskReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onSaveReflection: (taskId: string, reason: ReflectionCategory, notes?: string) => void;
}

interface ReflectionOption {
  value: ReflectionCategory;
  label: string;
  description: string;
  type: 'faster' | 'slower' | 'general';
}

const FASTER_OPTIONS: ReflectionOption[] = [
  {
    value: 'easier_than_expected',
    label: 'Simpler than anticipated',
    description: 'The task had fewer edge cases, cleaner requirements, or easier solutions than thought.',
    type: 'faster'
  },
  {
    value: 'overestimated_work',
    label: 'Overestimated scope or effort',
    description: 'Anticipated more steps or work volume than was actually required.',
    type: 'faster'
  },
  {
    value: 'high_focus_flow',
    label: 'High focus / Flow state',
    description: 'Deep, uninterrupted concentration enabled unusually rapid progress.',
    type: 'faster'
  },
  {
    value: 'reused_existing_work',
    label: 'Reused prior work or templates',
    description: 'Leveraged existing code, templates, boilerplate, or previous research.',
    type: 'faster'
  },
  {
    value: 'fewer_interruptions',
    label: 'Fewer interruptions than usual',
    description: 'Quiet environment with zero distraction or context switching.',
    type: 'faster'
  },
  {
    value: 'better_tools_automation',
    label: 'Better tools, scripts, or AI',
    description: 'Used automation, scripts, shortcuts, or AI tools that sped up delivery.',
    type: 'faster'
  },
  {
    value: 'reduced_scope',
    label: 'Streamlined / Reduced scope',
    description: 'Pragmatically cut non-essential sub-tasks or trimmed requirements.',
    type: 'faster'
  },
  {
    value: 'received_help',
    label: 'Received guidance or assistance',
    description: 'Quick advice, pair review, or assistance unblocked progress swiftly.',
    type: 'faster'
  }
];

const SLOWER_OPTIONS: ReflectionOption[] = [
  {
    value: 'underestimated_work',
    label: 'Underestimated scope or volume',
    description: 'There was more work to complete than originally envisioned.',
    type: 'slower'
  },
  {
    value: 'harder_than_expected',
    label: 'Unanticipated complexity or bugs',
    description: 'Encountered difficult problems, bugs, or unexpected roadblocks.',
    type: 'slower'
  },
  {
    value: 'got_distracted',
    label: 'Attention divided or interrupted',
    description: 'Context switching, messages, or external interruptions occurred.',
    type: 'slower'
  },
  {
    value: 'started_late',
    label: 'Delayed execution start',
    description: 'Began significantly later than the planned calendar window.',
    type: 'slower'
  },
  {
    value: 'was_tired',
    label: 'Fatigue or low energy',
    description: 'Pace was slower due to tiredness or reduced alertness.',
    type: 'slower'
  },
  {
    value: 'unexpected_problem',
    label: 'Tool failure or external blocker',
    description: 'System outage, dependency blocker, or technical issue.',
    type: 'slower'
  },
  {
    value: 'expanded_scope',
    label: 'Scope creep / Added requirements',
    description: 'Discovered extra necessary sub-tasks while in the middle of work.',
    type: 'slower'
  }
];

const OTHER_OPTION: ReflectionOption = {
  value: 'other',
  label: 'Other circumstance',
  description: 'Another specific factor influenced the outcome.',
  type: 'general'
};

export const TaskReflectionModal: React.FC<TaskReflectionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveReflection
}) => {
  if (!isOpen) return null;

  const est = getHistoricalCalibrationBaseline(task);
  const act = task.execution.actualDurationMinutes;
  const isFaster = act !== undefined && act < est;
  const isSlower = act !== undefined && act > est;
  const diffPercent = act === undefined ? null : Math.round(((act - est) / est) * 100);
  const diffMins = act === undefined ? 0 : Math.abs(act - est);

  const initialReason: ReflectionCategory = task.execution.reflection?.reason
    ? task.execution.reflection.reason
    : isFaster
    ? 'easier_than_expected'
    : 'underestimated_work';

  const [activeTab, setActiveTab] = useState<'recommended' | 'faster' | 'slower' | 'all'>('recommended');
  const [selectedReason, setSelectedReason] = useState<ReflectionCategory>(initialReason);
  const [notes, setNotes] = useState(task.execution.reflection?.notes || '');

  const displayedOptions: ReflectionOption[] = (() => {
    if (activeTab === 'faster') return [...FASTER_OPTIONS, OTHER_OPTION];
    if (activeTab === 'slower') return [...SLOWER_OPTIONS, OTHER_OPTION];
    if (activeTab === 'all') return [...FASTER_OPTIONS, ...SLOWER_OPTIONS, OTHER_OPTION];
    // Recommended
    if (isFaster) return [...FASTER_OPTIONS, OTHER_OPTION];
    if (isSlower) return [...SLOWER_OPTIONS, OTHER_OPTION];
    return [...FASTER_OPTIONS, ...SLOWER_OPTIONS, OTHER_OPTION];
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReflection(task.id, selectedReason, notes.trim() || undefined);
    onClose();
  };

  return (
    <ModalShell
      title={isFaster ? 'Finished Sooner — Reflection' : isSlower ? 'Took Longer — Reflection' : 'Execution Reflection'}
      description="Reflect on why reality differed from your prediction. This context helps understand your personal estimation patterns."
      icon={isFaster ? <Sparkles className="h-5 w-5 text-emerald-600" /> : <HelpCircle className="h-5 w-5 text-blue-600" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Skip Reflection
          </Button>
          <Button type="submit" form="reflection-modal-form">
            <CheckCircle className="w-4 h-4" />
            Save Reflection
          </Button>
        </div>
      }
    >
      <form id="reflection-modal-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* Comparison summary card */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isFaster
            ? 'bg-emerald-50/70 border-emerald-200'
            : isSlower
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Task</span>
            <span className="font-bold text-sm text-slate-900">{task.title}</span>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Forecast → Actual
            </span>
            <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
              <span className="text-sm font-semibold text-slate-700">{formatMinutesToHours(est)}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={`text-sm font-extrabold ${
                isFaster ? 'text-emerald-700' : isSlower ? 'text-amber-800' : 'text-slate-800'
              }`}>
                {act === undefined ? 'Unmeasured' : formatMinutesToHours(act)}
              </span>
              {diffPercent !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ml-1 ${
                  isFaster
                    ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                    : isSlower
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {isFaster ? `Finished ${diffMins}m faster (${diffPercent}%)` : isSlower ? `Took ${diffMins}m longer (+${diffPercent}%)` : 'On target'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab filters for reasons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('recommended')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'recommended'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isFaster ? '⚡ Why it was faster' : isSlower ? '⏱ Why it took longer' : 'Recommended'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faster')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'faster'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Finished Sooner ({FASTER_OPTIONS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slower')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
              activeTab === 'slower'
                ? 'bg-white text-amber-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Took Longer ({SLOWER_OPTIONS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
        </div>

        {/* Options list */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Primary contributing factor
          </label>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {displayedOptions.map(opt => {
              const isSelected = selectedReason === opt.value;
              const isOptFaster = opt.type === 'faster';
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start space-x-3 rounded-xl border p-3 transition-all ${
                    isSelected
                      ? isOptFaster
                        ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-600/20'
                        : 'border-blue-600 bg-blue-50/70 text-slate-900 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reflectionReason"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setSelectedReason(opt.value)}
                    className={`mt-0.5 ${isOptFaster ? 'accent-emerald-600' : 'accent-blue-600'}`}
                  />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                      {isOptFaster && (
                        <span className="text-2xs font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Speed factor
                        </span>
                      )}
                    </div>
                    <span className="block text-xs text-slate-500">{opt.description}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Optional notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reflection-notes">
            {isFaster
              ? 'What worked well? (optional notes)'
              : 'What will you consider next time? (optional notes)'}
          </label>
          <textarea
            id="reflection-notes"
            rows={2}
            placeholder={
              isFaster
                ? 'e.g., Reusing the template saved 20 minutes; mornings are great for coding.'
                : 'e.g., Leave a 30m buffer for edge cases; break task into smaller milestones.'
            }
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </form>
    </ModalShell>
  );
};
