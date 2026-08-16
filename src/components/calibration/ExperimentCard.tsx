import React, { useState } from 'react';
import { FlaskConical, Send } from 'lucide-react';
import { CardSection } from '../ui/CardSection';
import { StatTile } from '../ui/StatTile';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Button } from '../ui/Button';
import type { ExperimentComparison, AppSettings, ExperimentAnswer } from '../../types';

const EXPERIMENT_QUESTIONS = [
  'Did the historical comparison change your estimate?',
  'Did you understand why the suggestion appeared?',
  'Did you trust the evidence?',
  'Did the final estimate feel more realistic?',
  'Would you use this before planning a similar task again?'
];

const SURVEY_OPTIONS = ['Yes', 'Partly', 'No'] as const;

const SURVEY_NOTE_SEP = ' — ';

function parseSurveyAnswer(saved: string): { value: string; note: string } {
  for (const opt of SURVEY_OPTIONS) {
    if (saved === opt) return { value: opt, note: '' };
    if (saved.startsWith(`${opt}${SURVEY_NOTE_SEP}`)) {
      return { value: opt, note: saved.slice(opt.length + SURVEY_NOTE_SEP.length) };
    }
  }
  return { value: '', note: saved };
}

interface ExperimentCardProps {
  experiment: ExperimentComparison;
  minObservations: number;
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({ experiment, minObservations, settings, onUpdateSettings }) => {
  const [surveyAnswers, setSurveyAnswers] = useState<{ value: string; note: string; touched: boolean }[]>(() => {
    const saved = settings.experimentAnswers || [];
    return EXPERIMENT_QUESTIONS.map(q => {
      const parsed = parseSurveyAnswer(saved.find(a => a.question === q)?.answer || '');
      return { value: parsed.value, note: parsed.note, touched: parsed.value !== '' };
    });
  });
  const [surveySaved, setSurveySaved] = useState(false);

  const handleSaveSurvey = () => {
    const answers: ExperimentAnswer[] = EXPERIMENT_QUESTIONS.map((question, i) => ({
      question,
      answer: surveyAnswers[i].note
        ? `${surveyAnswers[i].value}${SURVEY_NOTE_SEP}${surveyAnswers[i].note}`
        : surveyAnswers[i].value,
      createdAt: new Date().toISOString()
    })).filter((_, i) => surveyAnswers[i].touched);
    onUpdateSettings({ ...settings, experimentAnswers: answers });
    setSurveySaved(true);
    setTimeout(() => setSurveySaved(false), 2500);
  };

  return (
    <CardSection
      icon={<FlaskConical className="h-5 w-5" />}
      title="Forecast Accuracy Experiment"
      subtitle="Before Reality Check vs after Reality Check, using the same error definition."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <StatTile
            label="Phase A · baseline (no Reality Check)"
            value={`${experiment.baseline.meanAbsoluteErrorPercent}%`}
            subLabel={`median ${experiment.baseline.medianAbsoluteErrorPercent}% · ${experiment.baseline.count} predictions`}
          />
          {!experiment.baselineSufficient && (
            <p className="text-xs font-medium text-warning-ink">
              Needs at least {minObservations} baseline predictions.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <StatTile
            label="Phase B · intervention (Reality Check shown)"
            value={`${experiment.intervention.meanAbsoluteErrorPercent}%`}
            subLabel={`median ${experiment.intervention.medianAbsoluteErrorPercent}% · ${experiment.intervention.count} predictions`}
            valueClassName="text-primary-ink"
            className="border-primary-border bg-primary-soft"
          />
          {!experiment.interventionSufficient && (
            <p className="text-xs font-medium text-warning-ink">
              Needs at least {minObservations} intervention predictions.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 text-sm">
        {experiment.improved === null ? (
          <span className="text-text-muted">
            Collect {minObservations} predictions in each phase to compare forecast accuracy.
          </span>
        ) : experiment.improved ? (
          <span className="font-semibold text-success-ink">
            Post-Reality-Check absolute error is lower than baseline — the intervention is associated with more accurate forecasts.
          </span>
        ) : (
          <span className="font-semibold text-danger-ink">
            Post-Reality-Check absolute error is not lower than baseline in this sample.
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="mb-1 text-sm font-bold text-text-primary">Qualitative questions</h3>
        <p className="mb-3 text-xs text-text-muted">Optional answers help evaluate trust and understanding, separate from accuracy.</p>
        <div className="space-y-3">
          {EXPERIMENT_QUESTIONS.map((q, i) => (
            <div key={q} className="space-y-2 rounded-xl border border-border bg-surface-secondary/60 p-3">
              <label className="block text-sm font-semibold text-text-primary">{i + 1}. {q}</label>
              <SegmentedControl
                ariaLabel={`Question ${i + 1}: ${q}`}
                value={(surveyAnswers[i].value as 'Yes' | 'Partly' | 'No') || 'Yes'}
                onChange={val => {
                  const next = [...surveyAnswers];
                  next[i] = { ...next[i], value: val, touched: true };
                  setSurveyAnswers(next);
                }}
                options={SURVEY_OPTIONS.map(opt => ({ value: opt, label: opt }))}
              />
              <input
                type="text"
                placeholder="Optional short note..."
                value={surveyAnswers[i].note}
                onChange={e => {
                  const next = [...surveyAnswers];
                  next[i] = { ...next[i], note: e.target.value };
                  setSurveyAnswers(next);
                }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none"
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSaveSurvey} className="mt-4">
          <Send className="h-3.5 w-3.5" />
          {surveySaved ? 'Saved' : 'Save answers'}
        </Button>
      </div>
    </CardSection>
  );
};
