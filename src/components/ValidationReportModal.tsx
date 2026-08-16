import React from 'react';
import { TestResult } from '../types';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { ModalShell } from './ui/ModalShell';
import { Button } from './ui/Button';

interface ValidationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: TestResult[];
}

export const ValidationReportModal: React.FC<ValidationReportModalProps> = ({
  isOpen,
  onClose,
  results
}) => {
  if (!isOpen) return null;

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  return (
    <ModalShell
      title="System data validation"
      description="Automated test suite verification for personal calibration heuristics"
      icon={<ShieldCheck className="h-5 w-5" />}
      iconClassName="border-success-border bg-success-soft text-success"
      onClose={onClose}
      maxWidth="max-w-2xl"
      initialFocus="none"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="secondary" autoFocus onClick={onClose}>
            Close Report
          </Button>
        </div>
      }
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {/* Summary status pill */}
        <div
          className={`flex items-center justify-between rounded-xl border p-4 ${
            allPassed
              ? 'border-success-border bg-success-soft text-success-ink'
              : 'border-danger-border bg-danger-soft text-danger-ink'
          }`}
        >
          <div className="flex items-center space-x-3">
            {allPassed ? (
              <CheckCircle2 className="h-6 w-6 text-success" />
            ) : (
              <XCircle className="h-6 w-6 text-danger" />
            )}
            <div>
              <span className="block text-base font-bold text-text-primary">
                {allPassed ? 'All Validation Suite Tests Passed' : 'Validation Issues Detected'}
              </span>
              <span className="text-xs text-text-muted">
                {passedCount} of {totalCount} edge-case verification checks succeeded
              </span>
            </div>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              allPassed
                ? 'border-success-border bg-success-soft text-success-ink'
                : 'border-danger-border-strong bg-danger-soft text-danger-ink'
            }`}
          >
            {Math.round((passedCount / totalCount) * 100)}% PASS
          </span>
        </div>

        {/* Test list */}
        <div className="space-y-3 pt-2">
          {results.map((res, i) => (
            <div key={i} className="flex items-start space-x-3 rounded-xl border border-border bg-surface-secondary p-3.5">
              <div className="mt-0.5 shrink-0">
                {res.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-danger" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-primary">{res.name}</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${
                      res.passed
                        ? 'border-success-border bg-success-soft text-success-ink'
                        : 'border-danger-border bg-danger-soft text-danger-ink'
                    }`}
                  >
                    {res.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  {res.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
};
