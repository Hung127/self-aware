import React from 'react';
import { AlertTriangle, Info, Check, Shield } from 'lucide-react';
import { RealityCheckSuggestion } from '../../types';
import { formatMinutesToHours } from '../../utils/calibrationEngine';
import { Button } from '../ui/Button';
import { FormSectionHeading } from './FormSectionHeading';

interface RealityCheckSectionProps {
  realityCheck: RealityCheckSuggestion;
  tag: string;
  initialUserPrediction: number;
  userDecision: 'accepted_suggestion' | 'kept_original' | 'custom_adjusted' | null;
  onKeepEstimate: () => void;
  onApplySuggested: () => void;
}

export const RealityCheckSection: React.FC<RealityCheckSectionProps> = ({
  realityCheck,
  tag,
  initialUserPrediction,
  userDecision,
  onKeepEstimate,
  onApplySuggested
}) => (
  <div className="space-y-3 pt-2">
    <FormSectionHeading
      step="3"
      title="Calibration Mirror"
      description="Historical evidence check"
    />

    {realityCheck.shouldWarn && (
      <div
        className={`space-y-3 rounded-xl border p-4 transition-all ${
          realityCheck.severity === 'reality_check'
            ? 'bg-warning-soft border-warning-border text-warning-ink'
            : 'bg-primary-soft border-primary-border text-text-primary'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="mt-0.5 shrink-0">
            {realityCheck.severity === 'reality_check' ? (
              <AlertTriangle className="h-5 w-5 text-warning" />
            ) : (
              <Info className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-sm font-bold text-text-primary">
                {realityCheck.severity === 'reality_check' ? 'Reality Check' : 'Historical Evidence'}
              </span>
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-text-muted">
                {realityCheck.sampleCount} similar tasks observed {realityCheck.matchedBy === 'category_and_tag' ? `(${tag})` : ''}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              {realityCheck.message}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
          <span className="text-xs text-text-secondary">
            Your estimate: <strong className="text-text-primary">{formatMinutesToHours(initialUserPrediction)}</strong> · History avg: <strong className="text-primary-ink">{formatMinutesToHours(realityCheck.suggestedDurationMinutes)}</strong>
          </span>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onKeepEstimate}
              className={userDecision === 'kept_original' ? 'border-text-primary font-bold text-text-primary' : ''}
            >
              Keep {formatMinutesToHours(initialUserPrediction)}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onApplySuggested}
              className={userDecision === 'accepted_suggestion' ? 'bg-success text-white hover:bg-success-hover' : ''}
            >
              {userDecision === 'accepted_suggestion' && <Check className="h-3.5 w-3.5" />}
              Use {formatMinutesToHours(realityCheck.suggestedDurationMinutes)}
            </Button>
          </div>
        </div>
      </div>
    )}

    {!realityCheck.shouldWarn && (
      <div className="flex items-start space-x-2.5 rounded-xl border border-border bg-surface-secondary p-3.5 text-xs text-text-muted">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-text-disabled" />
        <span className="leading-relaxed">
          {realityCheck.state === 'no_data' && realityCheck.sampleCount === 0
            ? 'No comparable completed history yet. This prediction becomes part of your baseline.'
            : realityCheck.state === 'insufficient_data'
            ? `Early stage — ${realityCheck.message.toLowerCase()}`
            : realityCheck.message}
        </span>
      </div>
    )}
  </div>
);
