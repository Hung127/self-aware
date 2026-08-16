import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

type StatusBannerType = 'success' | 'error' | 'info';

interface StatusBannerProps {
  type: StatusBannerType;
  text: string;
}

const CONFIG: Record<StatusBannerType, { box: string; icon: React.ReactNode }> = {
  success: {
    box: 'border-success-border bg-success-soft text-success-ink',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-success-ink" />
  },
  error: {
    box: 'border-danger-border bg-danger-soft text-danger-ink',
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-danger-ink" />
  },
  info: {
    box: 'border-primary-border bg-primary-soft text-primary-ink',
    icon: <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
  }
};

export const StatusBanner: React.FC<StatusBannerProps> = ({ type, text }) => {
  const { box, icon } = CONFIG[type];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${box}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="font-medium leading-relaxed">{text}</p>
    </div>
  );
};
