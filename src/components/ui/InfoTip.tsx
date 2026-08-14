import React from 'react';
import { Info } from 'lucide-react';

interface InfoTipProps {
  text: string;
  label?: string;
}

export const InfoTip: React.FC<InfoTipProps> = ({ text, label }) => (
  <button
    type="button"
    aria-label={label || text}
    title={text}
    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600 focus-visible:text-blue-600"
  >
    <Info className="h-3.5 w-3.5" />
  </button>
);
