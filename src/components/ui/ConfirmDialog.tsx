import React from 'react';
import { ModalShell } from './ModalShell';
import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onClose
}) => {
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      maxWidth="max-w-md"
      initialFocus="none"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button autoFocus type="button" variant="tertiary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-slate-700">{message}</p>
    </ModalShell>
  );
};
