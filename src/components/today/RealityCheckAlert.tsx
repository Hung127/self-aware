import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface RealityCheckAlertProps {
  message: string;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}

export const RealityCheckAlert: React.FC<RealityCheckAlertProps> = ({ message, aside, children }) => (
  <div className="space-y-2 rounded-xl border border-warning-border bg-warning-soft p-3.5 text-xs text-warning-ink">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start space-x-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <span className="font-semibold leading-relaxed">{message}</span>
      </div>
      {aside && <span className="shrink-0">{aside}</span>}
    </div>
    {children && <div className="border-t border-warning-border/60 pt-2">{children}</div>}
  </div>
);
