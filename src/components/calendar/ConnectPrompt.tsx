import React from 'react';
import { Plug } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConnectPromptProps {
  isSyncing: boolean;
  onConnect: () => void;
}

export const ConnectPrompt: React.FC<ConnectPromptProps> = ({ isSyncing, onConnect }) => (
  <div className="flex flex-col justify-between gap-4 rounded-xl border border-primary-border bg-primary-soft p-4 sm:flex-row sm:items-center">
    <div className="flex items-start gap-3">
      <Plug className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <span className="font-semibold text-text-primary">Connect your Google Calendar</span>
        <p className="mt-0.5 text-sm text-text-secondary">
          Import planned events automatically and keep your plan and predictions in sync.
        </p>
      </div>
    </div>
    <Button onClick={onConnect} loading={isSyncing} className="shrink-0">
      {isSyncing ? 'Connecting...' : 'Connect Google Calendar'}
    </Button>
  </div>
);
