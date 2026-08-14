import React, { useState } from 'react';
import { TaskItem } from '../types';
import { getHistoricalCalibrationBaseline, formatMinutesToHours } from '../utils/calibrationEngine';
import { PenLine, X } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-labelledby="correction-modal-title" className="my-8 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <PenLine className="h-5 w-5 text-amber-600" />
            <div>
              <h3 id="correction-modal-title" className="text-lg font-bold text-slate-900">Correct completed observation</h3>
              <p className="text-sm text-slate-500">Recording the true outcome keeps your calibration honest.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close correction dialog"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Task Title</span>
              <span className="font-bold text-sm text-slate-900">{task.title}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Original forecast</span>
              <span className="text-sm font-bold text-blue-600">{formatMinutesToHours(est)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="correction-duration">
                Actual Duration (minutes)
              </label>
              <input
                id="correction-duration"
                type="number"
                min={0}
                step={5}
                value={durationMins}
                onChange={e => setDurationMins(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="correction-date">
                Actual Completion Date
              </label>
              <input
                id="correction-date"
                type="date"
                value={completionDate}
                onChange={e => setCompletionDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="correction-reason">
              Why is this being corrected? <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="correction-reason"
              rows={2}
              placeholder="e.g. Timer was left running; actual time was 95 minutes."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-amber-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              <PenLine className="w-4 h-4" />
              <span>Save correction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
