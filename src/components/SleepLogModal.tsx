import React, { useState } from 'react';
import { SleepRecord } from '../types';
import { Moon, Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface SleepLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSleepRecord?: SleepRecord;
  onSaveSleep: (record: SleepRecord) => void;
}

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

  // Calculate actual sleep duration in minutes
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

  const actualDurationMins = calculateSleepMins(actualBedtime, actualWakeTime);
  const hours = Math.floor(actualDurationMins / 60);
  const mins = actualDurationMins % 60;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl text-slate-900 my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Log Sleep Context</h3>
              <p className="text-xs text-slate-500">Sleep context helps explain prediction execution differences</p>
            </div>
          </div>
          <button
             onClick={onClose}
             aria-label="Close sleep dialog"
             className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Target Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Planned Bedtime
              </label>
              <input
                type="time"
                value={plannedBedtime}
                onChange={e => setPlannedBedtime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-600 mb-1">
                Actual Bedtime
              </label>
              <input
                type="time"
                value={actualBedtime}
                onChange={e => setActualBedtime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Planned Wake Time
              </label>
              <input
                type="time"
                value={plannedWakeTime}
                onChange={e => setPlannedWakeTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-600 mb-1">
                Actual Wake Time
              </label>
              <input
                type="time"
                value={actualWakeTime}
                onChange={e => setActualWakeTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Computed Sleep Display Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isShortSleep
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-current opacity-80" />
              <div>
                <span className="block text-sm font-semibold opacity-75">
                  Recorded duration
                </span>
                <span className="text-lg font-bold">
                  {hours}h {mins}m
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs">
              {isShortSleep ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-800">Short-sleep context</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700">Recorded</span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
            >
              Save Sleep Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
