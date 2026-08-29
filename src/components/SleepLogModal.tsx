import React, { useState } from 'react';
import { SleepRecord } from '../types';
import { Moon, Clock, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface SleepLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSleepRecord?: SleepRecord;
  onSaveSleep: (record: SleepRecord) => void;
}

const BEDTIME_PRESETS = ['22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00'];
const WAKE_PRESETS = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];

export const SleepLogModal: React.FC<SleepLogModalProps> = ({
  isOpen,
  onClose,
  currentSleepRecord,
  onSaveSleep
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(currentSleepRecord?.date || todayStr);
  const [plannedBedtime, setPlannedBedtime] = useState(currentSleepRecord?.plannedBedtime || '23:00');
  const [actualBedtime, setActualBedtime] = useState(currentSleepRecord?.actualBedtime || '00:30');
  const [plannedWakeTime, setPlannedWakeTime] = useState(currentSleepRecord?.plannedWakeTime || '07:00');
  const [actualWakeTime, setActualWakeTime] = useState(currentSleepRecord?.actualWakeTime || '07:00');

  // Calculate sleep duration in minutes
  const calculateSleepMins = (bed: string, wake: string): number => {
    try {
      const [bHours, bMins] = bed.split(':').map(Number);
      const [wHours, wMins] = wake.split(':').map(Number);

      let bMinutes = bHours * 60 + bMins;
      let wMinutes = wHours * 60 + wMins;

      // If bedtime is late night (e.g. 23:00 or 01:00) and wake is morning (07:00)
      if (wMinutes <= bMinutes) {
        wMinutes += 24 * 60; // Add 24 hours
      }

      return Math.max(0, wMinutes - bMinutes);
    } catch {
      return 420; // default 7h
    }
  };

  const plannedDurationMins = calculateSleepMins(plannedBedtime, plannedWakeTime);
  const actualDurationMins = calculateSleepMins(actualBedtime, actualWakeTime);
  
  const actualHours = Math.floor(actualDurationMins / 60);
  const actualMins = actualDurationMins % 60;
  
  const plannedHours = Math.floor(plannedDurationMins / 60);
  const plannedRemainingMins = plannedDurationMins % 60;

  const isShortSleep = actualDurationMins < 360; // < 6 hours

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: SleepRecord = {
      id: currentSleepRecord?.id || `sleep-${date}`,
      date,
      plannedBedtime,
      actualBedtime,
      plannedWakeTime,
      actualWakeTime,
      actualSleepDurationMinutes: actualDurationMins,
      isShortSleep
    };
    onSaveSleep(record);
    onClose();
  };

  return (
    <ModalShell
      title="Sleep Context"
      description="Record sleep to observe its relationship with execution accuracy and completion."
      icon={<Moon className="h-5 w-5" />}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="sleep-modal-form">
            Save Sleep Record
          </Button>
        </div>
      }
    >
      <form id="sleep-modal-form" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Date Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="sleep-date">
            Observation Date
          </label>
          <input
            id="sleep-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        {/* Two-Column Comparison: Planned vs Actual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Planned Column */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="border-b border-slate-200/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Intended Schedule</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="planned-bedtime">
                Planned Bedtime
              </label>
              <input
                id="planned-bedtime"
                type="time"
                value={plannedBedtime}
                onChange={e => setPlannedBedtime(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="planned-wake">
                Planned Wake Time
              </label>
              <input
                id="planned-wake"
                type="time"
                value={plannedWakeTime}
                onChange={e => setPlannedWakeTime(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="pt-1 text-2xs text-slate-500 font-medium">
              Target duration: <strong className="text-slate-700">{plannedHours}h {plannedRemainingMins > 0 ? `${plannedRemainingMins}m` : ''}</strong>
            </div>
          </div>

          {/* Actual Column */}
          <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
            <div className="border-b border-blue-200/80 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Actual Realization</span>
              <span className="text-2xs font-semibold text-blue-600">Objective</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1" htmlFor="actual-bedtime">
                Actual Bedtime
              </label>
              <input
                id="actual-bedtime"
                type="time"
                value={actualBedtime}
                onChange={e => setActualBedtime(e.target.value)}
                required
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1" htmlFor="actual-wake">
                Actual Wake Time
              </label>
              <input
                id="actual-wake"
                type="time"
                value={actualWakeTime}
                onChange={e => setActualWakeTime(e.target.value)}
                required
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 font-medium"
              />
            </div>

            <div className="pt-1 text-2xs text-slate-600 font-medium">
              Actual duration: <strong className="text-blue-700 font-bold">{actualHours}h {actualMins}m</strong>
            </div>
          </div>
        </div>

        {/* Quick presets row */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick actual bedtime presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BEDTIME_PRESETS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setActualBedtime(t)}
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  actualBedtime === t
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Computed Sleep Display Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          isShortSleep
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isShortSleep ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">
                Calculated Sleep
              </span>
              <span className="text-xl font-bold">
                {actualHours} hours {actualMins > 0 ? `${actualMins} minutes` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            {isShortSleep ? (
              <Badge tone="warning" className="text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>&lt; 6h Short sleep</span>
              </Badge>
            ) : (
              <Badge tone="success" className="text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Recorded (≥ 6h)</span>
              </Badge>
            )}
          </div>
        </div>
      </form>
    </ModalShell>
  );
};

