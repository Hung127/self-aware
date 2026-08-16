import React from 'react';
import { BarChart2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

interface NotEnoughDataProps {
  message: string;
  threshold?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const NotEnoughData: React.FC<NotEnoughDataProps> = ({ message, threshold, actionLabel, onAction }) => (
  <EmptyState
    layout="row"
    icon={<BarChart2 className="h-4 w-4" />}
    title="Not enough data yet"
    description={
      <>
        {message}
        {threshold && (
          <>
            <br />
            <span className="font-semibold text-text-secondary">Threshold: {threshold}</span>
          </>
        )}
      </>
    }
    actions={
      actionLabel && onAction ? (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : undefined
    }
  />
);
