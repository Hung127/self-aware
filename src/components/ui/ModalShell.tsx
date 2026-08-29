import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalShellProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  headerBg?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
  initialFocus?: 'first' | 'none';
}

export const ModalShell: React.FC<ModalShellProps> = ({
  title,
  description,
  icon,
  iconClassName,
  headerBg = 'bg-slate-50',
  onClose,
  children,
  maxWidth = 'max-w-xl',
  footer,
  initialFocus = 'first'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    if (initialFocus !== 'none') {
      const focusable = dialog?.querySelector<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const elements = (Array.from(dialog.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')) as HTMLElement[]).filter(element => !element.hasAttribute('disabled'));
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [onClose, initialFocus]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: reduceMotion ? 0 : 0.18 } }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4"
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.18 } }}
        className={`my-8 flex max-h-[calc(100vh-2rem)] w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-modal`}
      >
        <header className={`flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 ${headerBg}`}>
          <div className="flex items-start gap-3">
            {icon && (
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 ${iconClassName || ''}`}>
                {icon}
              </div>
            )}
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-slate-900">{title}</h2>
              {description && <p id="modal-description" className="mt-1 text-sm text-slate-600">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">{footer}</footer>}
      </motion.div>
    </motion.div>
  );
};
