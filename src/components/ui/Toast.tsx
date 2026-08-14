import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: number;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: number) => void;
  onAction: (toast: ToastData) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, onAction }) => {
  const icons: Record<ToastVariant, typeof Info> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };
  const Icon = icons[toast.variant];

  const border: Record<ToastVariant, string> = {
    success: 'border-emerald-200',
    error: 'border-red-200',
    warning: 'border-amber-200',
    info: 'border-blue-200'
  };
  const iconColor: Record<ToastVariant, string> = {
    success: 'text-emerald-600',
    error: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600'
  };

  return (
    <div role="status" aria-live="polite" className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-lg ${border[toast.variant]}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor[toast.variant]}`} />
      <span className="flex-1 leading-snug text-slate-800">{toast.message}</span>
      {toast.actionLabel && (
        <button
          type="button"
          onClick={() => onAction(toast)}
          className="shrink-0 pt-0.5 text-xs font-bold text-blue-700 underline-offset-2 transition-colors hover:text-blue-900 hover:underline"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 self-start rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
