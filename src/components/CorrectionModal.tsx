import React, { useState } from 'react';
import { TaskItem } from '../types';
import { getHistoricalCalibrationBaseline, formatMinutesToHours } from '../utils/calibrationEngine';
import { PenLine, ArrowRight } from 'lucide-react';
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

  return (
    <ModalShell
      title="Correct completed observation"
      description="Recording the true outcome keeps your calibration honest."
      icon={<PenLine className="h-5 w-5" />}
      iconClassName="border-blue-100 bg-blue-50 text-blue-600"
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="correction-modal-form">
            <PenLine className="w-4 h-4" />
            Save correction
          </Button>
        </div>
      }
    >
        <form id="correction-modal-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
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

          <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
            diffPercent === 0
              ? 'bg-slate-50 border-slate-200'
              : diffPercent > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-xs font-semibold text-slate-600">
                <span className="text-blue-600 font-bold">{formatMinutesToHours(est)}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">
                New actual <span className="text-slate-900 font-bold">{formatMinutesToHours(Math.max(0, durationMins))}</span>
              </span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white border ${
              diffPercent === 0
                ? 'border-slate-200 text-slate-500'
                : diffPercent > 0
                ? 'border-amber-200 text-amber-700'
                : 'border-emerald-200 text-emerald-700'
            }`}>
              {diffPercent === 0 ? 'No change' : diffPercent > 0 ? `+${diffPercent}% longer` : `${diffPercent}% shorter`}
            </span>
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
        </form>
    </ModalShell>
  );
};
