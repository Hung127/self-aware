import React from 'react';
import { formatMinutesToHours } from '../../utils/calibrationEngine';
import { FormSectionHeading } from './FormSectionHeading';

const QUICK_FORECAST_CHIPS = [30, 60, 90, 120, 180];

interface ForecastSectionProps {
  estimatedMinutes: number;
  onEstimateChange: (value: number) => void;
  confidence: number;
  onConfidenceChange: (value: number) => void;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  estimatedMinutes,
  onEstimateChange,
  confidence,
  onConfidenceChange
}) => (
  <div className="space-y-4 pt-2">
    <FormSectionHeading
      step="2"
      title="Duration Forecast"
      description="What do you believe will actually happen?"
    />

    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-text-primary">
          Forecast duration <span className="text-xs font-normal text-text-muted">(minutes)</span>
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="5"
            max="1440"
            step="5"
            value={estimatedMinutes}
            onChange={e => onEstimateChange(parseInt(e.target.value) || 0)}
            required
            className="w-full rounded-lg border border-primary-border-strong bg-surface px-3.5 py-2 text-sm font-bold text-primary-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="whitespace-nowrap text-sm font-bold text-primary-ink">
            = {formatMinutesToHours(estimatedMinutes)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-muted">Presets:</span>
        {QUICK_FORECAST_CHIPS.map(minutes => (
          <button
            key={minutes}
            type="button"
            onClick={() => onEstimateChange(minutes)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              estimatedMinutes === minutes
                ? 'bg-primary text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-border'
            }`}
          >
            {formatMinutesToHours(minutes)}
          </button>
        ))}
      </div>

      <div className="pt-2">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-semibold text-text-secondary">
            Confidence <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <span className="text-sm font-bold text-primary-ink">{confidence}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="95"
          step="5"
          value={confidence}
          onChange={e => onConfidenceChange(parseInt(e.target.value))}
          className="h-2 w-full cursor-pointer rounded-lg bg-border accent-primary"
        />
        <div className="mt-1 flex justify-between text-xs font-medium text-text-muted">
          <span>50% (Uncertain)</span>
          <span>80% (Likely)</span>
          <span>95% (Certain)</span>
        </div>
      </div>
    </div>
  </div>
);
