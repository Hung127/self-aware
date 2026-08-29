import React, { useState } from 'react';
import { Target, PlayCircle, CheckCircle2, X, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';

interface FirstDayGuideProps {
  completedCount: number;
  activeCount: number;
  totalCount: number;
  onCreateTask: () => void;
  onOpenHowItWorks: () => void;
}

export const FirstDayGuide: React.FC<FirstDayGuideProps> = ({
  completedCount,
  activeCount,
  totalCount,
  onCreateTask,
  onOpenHowItWorks
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem('calib_first_day_guide_dismissed') === 'true';
  });

  if (dismissed || completedCount >= 3) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('calib_first_day_guide_dismissed', 'true');
  };

  // Determine active step
  let currentStep = 1;
  if (totalCount === 0) {
    currentStep = 1;
  } else if (activeCount > 0) {
    currentStep = 3;
  } else if (totalCount > 0 && completedCount === 0) {
    currentStep = 2;
  } else if (completedCount > 0) {
    currentStep = 3;
  }

  return (
    <div className="relative rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-4 sm:p-5 shadow-sm text-slate-900">
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss guide"
        className="absolute top-3.5 right-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" /> Quick Start
            </span>
            <span className="text-xs font-bold text-slate-500">
              {completedCount === 0 ? 'Your First Task Loop' : `${completedCount} of 3 completed tasks for your first baseline`}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            Learn the core loop: Predict &rarr; Start &rarr; Finish
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Personal Calibration learns how long your tasks actually take compared to your forecast.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>How it works</span>
          </button>
          {totalCount === 0 && (
            <Button size="sm" onClick={onCreateTask} className="shadow-2xs">
              <Target className="h-3.5 w-3.5" />
              <span>Make 1st Prediction</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3 Step Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3.5 border-t border-blue-100/80">
        <div
          className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${
            currentStep === 1
              ? 'bg-white border border-blue-300 ring-2 ring-blue-500/10 shadow-2xs'
              : 'bg-white/60 border border-slate-200/60 text-slate-600'
          }`}
        >
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 1
                ? 'bg-blue-600 text-white'
                : totalCount > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {totalCount > 0 ? '✓' : '1'}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">1. Predict</span>
            <span className="text-2xs text-slate-500 leading-tight block mt-0.5">
              Forecast focused work time
            </span>
          </div>
        </div>

        <div
          className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${
            currentStep === 2
              ? 'bg-white border border-blue-300 ring-2 ring-blue-500/10 shadow-2xs'
              : 'bg-white/60 border border-slate-200/60 text-slate-600'
          }`}
        >
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 2
                ? 'bg-blue-600 text-white'
                : activeCount > 0 || completedCount > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {completedCount > 0 || activeCount > 0 ? '✓' : '2'}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">2. Start</span>
            <span className="text-2xs text-slate-500 leading-tight block mt-0.5">
              Click Start when you begin
            </span>
          </div>
        </div>

        <div
          className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${
            currentStep === 3
              ? 'bg-white border border-blue-300 ring-2 ring-blue-500/10 shadow-2xs'
              : 'bg-white/60 border border-slate-200/60 text-slate-600'
          }`}
        >
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 3 && completedCount === 0
                ? 'bg-blue-600 text-white'
                : completedCount > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {completedCount > 0 ? '✓' : '3'}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">3. Finish &amp; Learn</span>
            <span className="text-2xs text-slate-500 leading-tight block mt-0.5">
              Record actual duration
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
