import React, { useId } from 'react';

interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, helper, error, optional, htmlFor, className = '', children }) => {
  const autoId = useId();
  const inputId = htmlFor || autoId;
  const describedBy = [helper ? `${inputId}-helper` : null, error ? `${inputId}-error` : null].filter(Boolean).join(' ') || undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, {
        id: children.props.id ?? inputId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>}
      </label>
      {control}
      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-slate-500">{helper}</p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
};

export const inputCls =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50';

export const inputErrorCls =
  'border-red-300 focus:border-red-500 focus:ring-red-500/20';
