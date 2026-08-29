import React from 'react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Target, Clock, PlayCircle, CheckCircle2, MessageSquare, LineChart, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPrediction?: () => void;
  onOpenNewPrediction?: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartPrediction,
  onOpenNewPrediction
}) => {
  if (!isOpen) return null;

  const handleStart = onStartPrediction || onOpenNewPrediction;

  return (
    <ModalShell
      title="How Personal Calibration Works"
      description="A personal mirror to help you master time estimation through evidence, not guesswork."
      icon={<Sparkles className="h-5 w-5 text-blue-600" />}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 hidden sm:inline">
            You can re-open this guide anytime from the top navigation bar.
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <Button type="button" variant="tertiary" onClick={onClose}>
              Close
            </Button>
            {handleStart && (
              <Button
                type="button"
                onClick={() => {
                  onClose();
                  handleStart();
                }}
              >
                Create your first prediction
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
        {/* Core Loop Summary Banner */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-slate-50 p-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 block mb-1">
            The Core Learning Loop
          </span>
          <p className="text-base font-bold text-slate-900 leading-snug">
            Predict &rarr; Do &rarr; Record Reality &rarr; Learn
          </p>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Before doing a task, tell the app how long you think it will take. Afterward, record what actually happened. Over time, the app finds your personal estimation multiplier so you can plan your days with confidence.
          </p>
        </div>

        {/* 3 Numbers Explained */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            The Three Numbers That Matter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
                <Clock className="h-4 w-4" />
                <span>1. Scheduled Time</span>
              </div>
              <span className="text-xs font-semibold text-slate-800 block">When you plan to do it</span>
              <p className="text-xs text-slate-500 leading-normal">
                The time block on your calendar (e.g. 09:00 to 11:00).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                <Target className="h-4 w-4" />
                <span>2. Your Prediction</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 block">Estimated focused work</span>
              <p className="text-xs text-slate-600 leading-normal">
                How many minutes of actual work you forecast (e.g. 60 min).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>3. Actual Time</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 block">What really happened</span>
              <p className="text-xs text-slate-600 leading-normal">
                The real duration when you finish the task (e.g. 90 min).
              </p>
            </div>
          </div>
        </div>

        {/* Concrete Example */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            A Simple Example
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex-1">
              <span className="text-slate-500 block">You predict:</span>
              <span className="text-sm font-bold text-slate-900">60 minutes</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 self-center hidden sm:block" />
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex-1">
              <span className="text-slate-500 block">You actually take:</span>
              <span className="text-sm font-bold text-slate-900">90 minutes</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 self-center hidden sm:block" />
            <div className="p-2.5 rounded-lg bg-white border border-blue-200 flex-1">
              <span className="text-blue-600 font-bold block">The app learns:</span>
              <span className="text-sm font-extrabold text-blue-700">+50% (+30 min)</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-normal">
            After 5 or more similar tasks, the app can offer you a helpful <strong>Reality Check</strong> to remind you of your actual past pace.
          </p>
        </div>

        {/* Visual 5-Step Process */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            The 5 Steps in Practice
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                1
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Predict</span>
                <span className="text-slate-600">Tell the app how long you think the work will take before you begin.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                2
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Start</span>
                <span className="text-slate-600">Click &ldquo;Start&rdquo; when you actually begin working so the app can measure starting delays.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                3
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Finish</span>
                <span className="text-slate-600">Record how long it really took. If you don&apos;t know the exact minutes, you can leave it blank.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                4
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Reflect</span>
                <span className="text-slate-600">Optionally note why reality differed (e.g. unexpected bug, interruptions, clear focus).</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                5
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Learn</span>
                <span className="text-slate-600">Visit the Calibration page to discover your accuracy multipliers, on-time rates, and sleep context impact.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantees */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Integrity &amp; Respect Guarantees</span>
          </div>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            <li><strong>Your original predictions are never silently rewritten</strong> &mdash; historical truth is always preserved.</li>
            <li><strong>Reality Check is an assistant, not an authority</strong> &mdash; you always decide your own estimates.</li>
            <li><strong>Completed records are immutable</strong> &mdash; if you make an honest typo, use the audited Correction tool.</li>
            <li><strong>No fake insights</strong> &mdash; the app explicitly says &ldquo;Not enough data yet&rdquo; until you have enough real observations.</li>
          </ul>
        </div>
      </div>
    </ModalShell>
  );
};
