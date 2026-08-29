import React from 'react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';
import { Target, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface FirstRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPrediction: () => void;
}

export const FirstRunModal: React.FC<FirstRunModalProps> = ({
  isOpen,
  onClose,
  onStartPrediction
}) => {
  if (!isOpen) return null;

  const handleStart = () => {
    onClose();
    onStartPrediction();
  };

  return (
    <ModalShell
      title="Welcome to Personal Calibration"
      description="A personal mirror to help you master time estimation through evidence, not guesswork."
      icon={<Sparkles className="h-5 w-5 text-blue-600" />}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button type="button" variant="tertiary" onClick={onClose}>
            Explore on my own
          </Button>
          <Button type="button" onClick={handleStart}>
            Create your first prediction
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-5">
        {/* Core Loop Explanation */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-slate-700 space-y-2">
          <span className="font-extrabold text-blue-800 uppercase tracking-wider block">
            How It Works
          </span>
          <p className="text-sm font-bold text-slate-900 leading-snug">
            Personal Calibration helps you become better at estimating your own time.
          </p>
          <p className="leading-relaxed">
            Before doing a task, tell the app how long you think it will take. Afterward, record what actually happened. Over time, the app finds patterns in your predictions.
          </p>
        </div>

        {/* 3 Core Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Plan</span>
            </div>
            <span className="font-semibold text-slate-900 block">Scheduled time</span>
            <p className="text-slate-500 text-2xs leading-normal">
              When you put it on your calendar or day plan.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold">
              <Target className="h-3.5 w-3.5 text-blue-600" />
              <span>Prediction</span>
            </div>
            <span className="font-semibold text-slate-900 block">Estimated duration</span>
            <p className="text-slate-600 text-2xs leading-normal">
              How long you think the focused work will take.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Actual</span>
            </div>
            <span className="font-semibold text-slate-900 block">What happened</span>
            <p className="text-slate-600 text-2xs leading-normal">
              The real time it took when you finished.
            </p>
          </div>
        </div>

        {/* Concrete Example */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
          <span className="text-slate-500 font-bold uppercase tracking-wider block text-2xs">
            Quick Example
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700">You predict: <strong className="text-slate-900">60 min</strong></span>
            <span className="text-slate-400">&rarr;</span>
            <span className="text-slate-700">Actual: <strong className="text-slate-900">90 min</strong></span>
            <span className="text-slate-400">&rarr;</span>
            <span className="font-bold text-blue-700">Took +50% longer</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
