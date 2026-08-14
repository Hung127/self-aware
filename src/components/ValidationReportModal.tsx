import React from 'react';
import { TestResult } from '../types';
import { ShieldCheck, CheckCircle2, XCircle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="validation-title" className="my-8 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="validation-title" className="font-bold text-lg text-slate-900">System data validation</h3>
              <p className="text-xs text-slate-500">Automated test suite verification for personal calibration heuristics</p>
            </div>
          </div>
          <button
            onClick={onClose}
             aria-label="Close validation report"
             className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Summary status pill */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            allPassed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center space-x-3">
              {allPassed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600" />
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
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-rose-100 border-rose-300 text-rose-800'
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
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{res.name}</span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                      res.passed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
