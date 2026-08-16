import React from 'react';
import { Calendar } from 'lucide-react';

interface PostponeTargetPreviewProps {
  targetDateDisplay: string;
  daysDifference: number;
}

export const PostponeTargetPreview: React.FC<PostponeTargetPreviewProps> = ({ targetDateDisplay, daysDifference }) => (
  <div className="flex items-center justify-between rounded-xl border border-primary-border bg-primary-soft/60 p-3.5 text-xs text-text-secondary">
    <div className="flex items-center space-x-2">
      <Calendar className="h-4 w-4 shrink-0 text-primary" />
      <span>
        Moving to <strong className="text-text-primary">{targetDateDisplay}</strong>
      </span>
    </div>
    <span className="rounded border border-primary-border bg-surface px-2 py-0.5 text-xs font-bold uppercase text-primary-ink">
      +{daysDifference} {daysDifference === 1 ? 'day' : 'days'}
    </span>
  </div>
);
