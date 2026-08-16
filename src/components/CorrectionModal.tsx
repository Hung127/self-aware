import React, { useState } from 'react';
import { TaskItem } from '../types';
import { getHistoricalCalibrationBaseline, formatMinutesToHours } from '../utils/calibrationEngine';
import { PenLine } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Field, inputCls } from './ui/Field';
import { AdjustDurationChips } from './correction/AdjustDurationChips';
import { CorrectionComparisonBanner } from './correction/CorrectionComparisonBanner';

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

  const handleAdjustDuration = (delta: number) => {
    setDurationMins(prev => Math.max(0, prev + delta));
  };

  return (
    <ModalShell
      title="Correct Observation Record"
      description="Updating true duration keeps your historical calibration truthful without overwriting the original forecast."
      icon={<PenLine className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="correction-modal-form">
            <PenLine className="h-4 w-4" />
            Save Correction
          </Button>
        </div>
      }
    >
      <form id="correction-modal-form" onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
        {/* Task Summary Banner */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-4">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Task</span>
            <span className="text-sm font-bold text-text-primary">{task.title}</span>
          </div>
          <div className="text-right">
            <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Recorded Forecast</span>
            <span className="text-sm font-bold text-primary-ink">{formatMinutesToHours(est)}</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Actual Duration (mins)">
            <input
              id="correction-duration"
              type="number"
              min={0}
              step={5}
              value={durationMins}
              onChange={e => setDurationMins(Math.max(0, Number(e.target.value) || 0))}
              required
              className={`${inputCls} font-bold`}
            />
          </Field>
          <Field label="Actual Completion Date">
            <input
              id="correction-date"
              type="date"
              value={completionDate}
              onChange={e => setCompletionDate(e.target.value)}
              required
              className={inputCls}
            />
          </Field>
        </div>

        {/* Quick adjustment chips */}
        <AdjustDurationChips onAdjust={handleAdjustDuration} />

        {/* Dynamic Comparison Banner */}
        <CorrectionComparisonBanner forecastMinutes={est} correctedMinutes={durationMins} />

        {/* Audit Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary" htmlFor="correction-reason">
            Reason for correction <span className="font-normal lowercase text-text-disabled">(audit note)</span>
          </label>
          <textarea
            id="correction-reason"
            rows={2}
            placeholder="e.g., Timer was left running after lunch; actual focused time was 75 minutes."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-sm text-text-primary transition-colors placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </form>
    </ModalShell>
  );
};
