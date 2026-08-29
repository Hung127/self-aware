import React, { useState } from 'react';
import { TaskItem } from '../types';
import { getHistoricalCalibrationBaseline, formatMinutesToHours } from '../utils/calibrationEngine';
import { PenLine, ArrowRight, ShieldCheck, History } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onSaveCorrection: (
    taskId: string,
    correction: { actualDurationMinutes: number; actualCompletionDate: string; reason?: string }
  ) => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveCorrection
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMins = task.execution.actualDurationMinutes || 0;

  const [durationMins, setDurationMins] = useState<number>(currentMins);
  const [completionDate, setCompletionDate] = useState<string>(
    task.execution.actualCompletionDate || todayStr
  );
  const [reason, setReason] = useState('');

  const est = getHistoricalCalibrationBaseline(task);
  const diffPercent = est > 0 ? Math.round(((Math.max(0, durationMins) - est) / est) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMins = Math.max(0, durationMins);
    onSaveCorrection(task.id, {
      actualDurationMinutes: validMins,
      actualCompletionDate: completionDate,
      reason: reason.trim() || undefined
    });
    onClose();
  };

  const handleAdjustDuration = (delta: number) => {
    setDurationMins(prev => Math.max(0, prev + delta));
  };

  return (
    <ModalShell
      title="Correct recorded result"
      description="Completed tasks are locked for data integrity. Update the actual duration or date below — your previous value will be safely preserved in the audit trail."
      icon={<PenLine className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="correction-modal-form">
            <PenLine className="w-4 h-4" />
            Save Correction
          </Button>
        </div>
      }
    >
      <form id="correction-modal-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* Task Summary Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Task</span>
            <span className="font-bold text-sm text-slate-900">{task.title}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Recorded Forecast</span>
            <span className="text-sm font-bold text-blue-700">{formatMinutesToHours(est)}</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="correction-duration">
              Actual Duration (mins)
            </label>
            <input
              id="correction-duration"
              type="number"
              min={0}
              step={5}
              value={durationMins}
              onChange={e => setDurationMins(Math.max(0, Number(e.target.value) || 0))}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="correction-date">
              Actual Completion Date
            </label>
            <input
              id="correction-date"
              type="date"
              value={completionDate}
              onChange={e => setCompletionDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>

        {/* Quick adjustment chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">Adjust:</span>
          <button
            type="button"
            onClick={() => handleAdjustDuration(-30)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            -30m
          </button>
          <button
            type="button"
            onClick={() => handleAdjustDuration(-15)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            -15m
          </button>
          <button
            type="button"
            onClick={() => handleAdjustDuration(15)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            +15m
          </button>
          <button
            type="button"
            onClick={() => handleAdjustDuration(30)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            +30m
          </button>
          <button
            type="button"
            onClick={() => handleAdjustDuration(60)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            +1h
          </button>
        </div>

        {/* Dynamic Comparison Banner */}
        <div className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
          diffPercent === 0
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : diffPercent > 0
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">
              Forecast: <strong className="text-blue-700">{formatMinutesToHours(est)}</strong>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600">
              Corrected: <strong className="text-slate-900">{formatMinutesToHours(Math.max(0, durationMins))}</strong>
            </span>
          </div>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-md bg-white border ${
            diffPercent === 0
              ? 'border-slate-200 text-slate-600'
              : diffPercent > 0
              ? 'border-amber-200 text-amber-700'
              : 'border-emerald-200 text-emerald-700'
          }`}>
            {diffPercent === 0 ? 'Exact match' : diffPercent > 0 ? `+${diffPercent}% longer` : `${diffPercent}% shorter`}
          </span>
        </div>

        {/* Audit Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="correction-reason">
            Reason for correction <span className="text-slate-400 font-normal lowercase">(audit note)</span>
          </label>
          <textarea
            id="correction-reason"
            rows={2}
            placeholder="e.g., Timer was left running after lunch; actual focused time was 75 minutes."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </form>
    </ModalShell>
  );
};

