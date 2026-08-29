import React from 'react';
import { Target, Play, CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import { TaskItem } from '../types';
import { Button } from './ui/Button';

interface FirstDayGuidanceProps {
  tasks: TaskItem[];
  onOpenNewTask: () => void;
  onOpenHowItWorks: () => void;
  onDismiss: () => void;
}

export const FirstDayGuidance: React.FC<FirstDayGuidanceProps> = ({
  tasks,
  onOpenNewTask,
  onOpenHowItWorks,
  onDismiss
}) => {
  const recordedTasks = tasks.filter(t => t.predictionStatus === 'recorded');
  const totalTasks = recordedTasks.length;
  const runningTask = recordedTasks.find(t => t.execution.status === 'in_progress');
  const notStartedTask = recordedTasks.find(t => t.execution.status === 'not_started' || t.execution.status === 'postponed');
  const completedCount = recordedTasks.filter(t => t.execution.status === 'completed' && t.execution.durationMeasurementStatus === 'measured').length;

  // Determine current step in 1-2-3 loop
  let currentStep = 1;
  let title = 'Step 1 of 3: Make your first prediction';
  let description = 'Estimate how long your next task will actually take. We recommend starting with a 30m–90m task.';
  let ctaLabel = 'Make a Prediction';
  let ctaAction = onOpenNewTask;
  let isDone = false;

  if (totalTasks === 0) {
    currentStep = 1;
    title = 'Step 1 of 3: Make your first prediction';
    description = 'Estimate how long your next task will actually take. We recommend starting with a 30m–90m task.';
    ctaLabel = 'Make a Prediction';
    ctaAction = onOpenNewTask;
  } else if (runningTask) {
    currentStep = 3;
    title = 'Step 3 of 3: Finish and record reality';
    description = `You are currently working on "${runningTask.title}". When you finish, click [Finish & Record] to log your actual work time.`;
    ctaLabel = '';
  } else if (notStartedTask && completedCount === 0) {
    currentStep = 2;
    title = 'Step 2 of 3: Start when you begin working';
    description = `Click [Start] on "${notStartedTask.title}" when you begin. The app will track whether you encounter start delays.`;
    ctaLabel = '';
  } else if (completedCount > 0) {
    isDone = true;
    title = 'First Calibrated Task Completed!';
    description = `You predicted and recorded reality for ${completedCount} task${completedCount === 1 ? '' : 's'}. Complete ${Math.max(0, 5 - completedCount)} more to unlock your full Calibration Mirror and Reality Check.`;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/60 p-4 sm:p-5 shadow-xs text-slate-900">
      <button
        type="button"
        onClick={onDismiss}
        title="Dismiss guide"
        aria-label="Dismiss guide"
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-2xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isDone
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {isDone ? <Sparkles className="w-3 h-3 text-emerald-700" /> : <Target className="w-3 h-3 text-blue-700" />}
              {isDone ? 'Milestone' : `Onboarding Guide`}
            </span>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              {title}
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            {description}
          </p>

          {/* 3-Step visual progress bar */}
          <div className="flex items-center gap-2 pt-2 text-2xs font-semibold text-slate-500">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
              currentStep >= 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <span>1. Predict</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
              currentStep >= 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <span>2. Start</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-300" />
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
              isDone ? 'bg-emerald-600 text-white border-emerald-600' : currentStep === 3 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <span>3. Finish</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 px-2 py-1"
          >
            How it works
          </button>

          {ctaLabel && (
            <Button size="sm" onClick={ctaAction}>
              <Target className="w-3.5 h-3.5" />
              <span>{ctaLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
