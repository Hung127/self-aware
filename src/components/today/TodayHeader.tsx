import React from 'react';
import { CalendarDays } from 'lucide-react';
import type { StrongestCalibrationInsight } from '../../types';

interface TodayHeaderProps {
  planOnlyCount: number;
  insight: StrongestCalibrationInsight | null;
  onOpenCalendarTab?: () => void;
}

export const TodayHeader: React.FC<TodayHeaderProps> = ({ planOnlyCount, insight, onOpenCalendarTab }) => (
  <>
    <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-ink">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Today</h1>
        <p className="mt-1 text-sm text-text-secondary">Track execution and observe predictions in real time.</p>
      </div>

      {planOnlyCount > 0 && (
        <button
          type="button"
          onClick={onOpenCalendarTab}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary-border-strong bg-primary-soft/70 px-3 py-1.5 text-xs font-semibold text-primary-ink transition-colors hover:bg-primary-soft"
        >
          <CalendarDays className="h-4 w-4" />
          <span>{planOnlyCount} calendar {planOnlyCount === 1 ? 'event' : 'events'} need prediction</span>
        </button>
      )}
    </div>

    {insight && (
      <div className="rounded-xl border border-primary-border bg-primary-soft/60 p-4 text-text-primary shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-ink">Recurring Pattern</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <span>Based on <strong className="text-text-primary">{insight.sampleCount}</strong> recorded sessions</span>
            <span className="rounded-full border border-primary-border bg-surface px-2 py-0.5 text-xs font-bold uppercase text-primary-ink">
              {insight.evidenceLevel.replace(/_/g, ' ')}
            </span>
          </span>
        </div>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-text-primary">{insight.message}</p>
      </div>
    )}
  </>
);
