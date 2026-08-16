import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import type { AppSettings } from '../../types';
import { DEFAULT_SETTINGS } from '../../utils/storage';
import { CardSection } from '../ui/CardSection';
import { Button } from '../ui/Button';
import { StatusBanner } from './StatusBanner';

interface CalibrationBehaviorCardProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
}

const numberInputClass =
  'w-full rounded-lg border bg-surface px-3.5 py-2 text-sm font-bold text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export const CalibrationBehaviorCard: React.FC<CalibrationBehaviorCardProps> = ({ settings, onUpdateSettings }) => {
  const [minObs, setMinObs] = useState(settings.minObservationsForRealityCheck);
  const [smallThresh, setSmallThresh] = useState(settings.smallSuggestionThresholdPercent);
  const [realityThresh, setRealityThresh] = useState(settings.realityCheckThresholdPercent);
  const [autoSync, setAutoSync] = useState(settings.autoImportGCal);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      minObservationsForRealityCheck: minObs,
      smallSuggestionThresholdPercent: smallThresh,
      realityCheckThresholdPercent: realityThresh,
      autoImportGCal: autoSync
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const resetDefaults = () => {
    setMinObs(DEFAULT_SETTINGS.minObservationsForRealityCheck);
    setSmallThresh(DEFAULT_SETTINGS.smallSuggestionThresholdPercent);
    setRealityThresh(DEFAULT_SETTINGS.realityCheckThresholdPercent);
    setAutoSync(DEFAULT_SETTINGS.autoImportGCal);
  };

  const presetClass = (active: boolean) =>
    `rounded-lg border px-2.5 py-1 text-xs transition-colors ${
      active
        ? 'border-primary-border bg-primary-soft font-bold text-primary-ink hover:bg-primary-soft'
        : 'border-border bg-surface-secondary font-medium text-text-secondary hover:bg-surface'
    }`;

  return (
    <CardSection
      icon={<Sliders className="h-5 w-5" />}
      title="Calibration behavior"
      subtitle="Control when reality check warnings and suggestions trigger"
    >
      <form onSubmit={handleSaveThresholds} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <span className="mr-1 text-xs font-semibold text-text-secondary">Threshold Presets:</span>
          <button
            type="button"
            onClick={() => {
              setMinObs(3);
              setSmallThresh(10);
              setRealityThresh(20);
            }}
            className={presetClass(false)}
          >
            Sensitive (10% / 20%)
          </button>
          <button
            type="button"
            onClick={() => {
              setMinObs(5);
              setSmallThresh(15);
              setRealityThresh(30);
            }}
            className={presetClass(true)}
          >
            Balanced (Default 15% / 30%)
          </button>
          <button
            type="button"
            onClick={() => {
              setMinObs(8);
              setSmallThresh(25);
              setRealityThresh(50);
            }}
            className={presetClass(false)}
          >
            Relaxed (25% / 50%)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
              Minimum Observations
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={minObs}
              onChange={e => setMinObs(parseInt(e.target.value) || 1)}
              className={numberInputClass}
            />
            <span className="block text-xs text-text-muted">Completed tasks required before triggers</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
              Soft Suggestion Threshold
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="50"
                value={smallThresh}
                onChange={e => setSmallThresh(parseInt(e.target.value) || 5)}
                className={`${numberInputClass} pr-8`}
              />
              <span className="pointer-events-none absolute right-3 top-2 text-xs font-bold text-text-disabled">%</span>
            </div>
            <span className="block text-xs text-text-muted">Historical error % for soft tips</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-warning-ink">
              Reality Check Threshold
            </label>
            <div className="relative">
              <input
                type="number"
                min="15"
                max="100"
                value={realityThresh}
                onChange={e => setRealityThresh(parseInt(e.target.value) || 15)}
                className="w-full rounded-lg border border-warning-border bg-surface px-3.5 py-2 pr-8 text-sm font-bold text-warning-ink focus:border-warning focus:outline-none focus:ring-2 focus:ring-warning/20"
              />
              <span className="pointer-events-none absolute right-3 top-2 text-xs font-bold text-warning">%</span>
            </div>
            <span className="block text-xs text-text-muted">Historical error % for Reality Check cards</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border pt-2 sm:flex-row sm:items-center">
          <p className="text-xs text-text-muted">
            Reality Check appears when a task forecast deviates &gt;{realityThresh}% from past evidence.
          </p>
          <div className="flex items-center gap-2.5">
            <Button type="button" variant="tertiary" size="sm" onClick={resetDefaults}>
              Reset Defaults
            </Button>
            <Button type="submit" size="sm">
              Save Parameters
            </Button>
          </div>
        </div>

        {savedMsg && <StatusBanner type="success" text="Calibration parameters saved." />}
      </form>
    </CardSection>
  );
};
