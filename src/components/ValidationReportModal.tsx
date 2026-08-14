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
      iconClassName="border-emerald-100 bg-emerald-50 text-emerald-600"
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
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Summary status pill */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            allPassed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center space-x-3">
              {allPassed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <span className="font-bold text-base block text-slate-900">
                  {allPassed ? 'All Validation Suite Tests Passed' : 'Validation Issues Detected'}
                </span>
                <span className="text-xs text-slate-600">
                  {passedCount} of {totalCount} edge-case verification checks succeeded
                </span>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              allPassed
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-red-100 border-red-300 text-red-700'
            }`}>
              {Math.round((passedCount / totalCount) * 100)}% PASS
            </span>
          </div>

          {/* Test list */}
          <div className="space-y-3 pt-2">
            {results.map((res, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3"
              >
                <div className="mt-0.5 shrink-0">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{res.name}</span>
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-md ${
                      res.passed
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {res.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
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
