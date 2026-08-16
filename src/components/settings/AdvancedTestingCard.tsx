import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Database,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SeedPresetButton } from './SeedPresetButton';

type SeedPreset = 'standard' | 'rich' | 'edge' | 'empty' | 'generated';

const SEED_LABELS: Record<SeedPreset, string> = {
  generated: 'Generated',
  standard: 'Standard',
  rich: 'Rich Multi-Category',
  edge: 'Edge & Boundary',
  empty: 'Empty Canvas'
};

interface AdvancedTestingCardProps {
  onRunValidationSuite: () => void;
  onSeedSampleData: (preset?: 'standard' | 'rich' | 'edge' | 'empty' | 'generated') => void;
}

export const AdvancedTestingCard: React.FC<AdvancedTestingCardProps> = ({ onRunValidationSuite, onSeedSampleData }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [seedTarget, setSeedTarget] = useState<{ preset: SeedPreset; label: string } | null>(null);

  const iconBoxClass = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-primary-soft text-primary';

  return (
    <section className="rounded-2xl border border-border bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setShowAdvanced(prev => !prev)}
        aria-expanded={showAdvanced}
        className="flex w-full items-center justify-between gap-3 p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={iconBoxClass}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Advanced &amp; testing</h2>
            <p className="text-xs text-text-muted">Developer tools and data seeding presets</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-text-disabled transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="space-y-5 border-t border-border px-6 pb-6 pt-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <div className={iconBoxClass}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Developer tools</h3>
                <p className="text-xs text-text-muted">Run automated verification suite for zero durations, midnight boundaries, and edge cases</p>
              </div>
            </div>

            <Button onClick={onRunValidationSuite} variant="success" size="sm" className="rounded-xl">
              <CheckCircle2 className="h-4 w-4" />
              <span>Run Test Suite</span>
            </Button>
          </div>
          <p className="text-xs text-text-muted">
            Verifies division by zero protection, overnight task durations, sleep context correlation logic, and data schema consistency.
          </p>

          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2.5 pb-4">
              <div className={iconBoxClass}>
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Testing &amp; Data Seeding Presets</h3>
                <p className="text-xs text-text-muted">Seed or generate calibrated test data to verify insights, reality checks, and history</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SeedPresetButton
                featured
                label="Generate Data"
                description="Dynamically generates ~16 fresh calibrated tasks & 8 sleep logs across past 7 days."
                icon={<Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />}
                onClick={() => setSeedTarget({ preset: 'generated', label: SEED_LABELS.generated })}
              />
              <SeedPresetButton
                label="Standard Seed"
                description="10 tasks showing ~43% programming underestimate & ~27m evening start delay."
                icon={<RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-[-45deg]" />}
                onClick={() => setSeedTarget({ preset: 'standard', label: SEED_LABELS.standard })}
              />
              <SeedPresetButton
                label="Rich Multi-Category"
                description="16 items across all 6 categories (Programming, Writing, Reading, Personal, Studying)."
                icon={<Database className="h-4 w-4 transition-transform group-hover:scale-110" />}
                onClick={() => setSeedTarget({ preset: 'rich', label: SEED_LABELS.rich })}
              />
              <SeedPresetButton
                label="Edge & Boundary"
                description="Midnight boundary tasks, 0% exact duration error, and 3x postponed items."
                icon={<ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />}
                onClick={() => setSeedTarget({ preset: 'edge', label: SEED_LABELS.edge })}
              />
              <SeedPresetButton
                label="Empty Canvas"
                description='Reset to 0 records to verify "Not enough data yet" initial state guidance.'
                icon={<Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />}
                onClick={() => setSeedTarget({ preset: 'empty', label: SEED_LABELS.empty })}
              />
            </div>
          </div>
        </div>
      )}

      {seedTarget && (
        <ConfirmDialog
          title="Replace current data?"
          message={`Replace current data with the "${seedTarget.label}" dataset? Your current data will be overwritten.`}
          confirmLabel="Replace data"
          cancelLabel="Cancel"
          onConfirm={() => onSeedSampleData(seedTarget.preset)}
          onClose={() => setSeedTarget(null)}
        />
      )}
    </section>
  );
};
