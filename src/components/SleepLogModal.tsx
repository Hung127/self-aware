import React, { useState } from 'react';
import { SleepRecord } from '../types';
import { Moon } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Field, inputCls } from './ui/Field';
import { SleepScheduleColumn } from './sleep/SleepScheduleColumn';
import { SleepPresets } from './sleep/SleepPresets';
import { SleepSummaryBanner } from './sleep/SleepSummaryBanner';

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
      <form id="sleep-modal-form" onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto p-6">
        <Field label="Observation Date">
          <input
            id="sleep-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SleepScheduleColumn
            variant="planned"
            bedtime={plannedBedtime}
            wakeTime={plannedWakeTime}
            onBedtimeChange={setPlannedBedtime}
            onWakeTimeChange={setPlannedWakeTime}
            durationLabel={`${plannedHours}h ${plannedRemainingMins > 0 ? `${plannedRemainingMins}m` : ''}`}
          />
          <SleepScheduleColumn
            variant="actual"
            bedtime={actualBedtime}
            wakeTime={actualWakeTime}
            onBedtimeChange={setActualBedtime}
            onWakeTimeChange={setActualWakeTime}
            durationLabel={`${actualHours}h ${actualMins}m`}
          />
        </div>

        <SleepPresets value={actualBedtime} onSelect={setActualBedtime} />

        <SleepSummaryBanner actualHours={actualHours} actualMins={actualMins} isShortSleep={isShortSleep} />
      </form>
    </ModalShell>
  );
};
