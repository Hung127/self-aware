import React from 'react';
import { ExternalLink, Globe, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmbedPanelProps {
  isSyncing: boolean;
  embedSrc: string;
  embedLoading: boolean;
  onSync: () => void;
  onEmbedLoad: () => void;
}

export const EmbedPanel: React.FC<EmbedPanelProps> = ({ isSyncing, embedSrc, embedLoading, onSync, onEmbedLoad }) => (
  <div className="flex h-[650px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
    <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-6 py-3 text-xs font-semibold text-text-secondary">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <span>Calendar embed</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 font-bold text-primary-ink hover:underline"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync calendar</span>
        </button>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-bold text-primary-ink hover:underline"
        >
          <span>Open in full tab</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>

    <div className="relative flex-1 bg-surface-secondary">
      {embedLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-secondary text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading calendar preview...</span>
        </div>
      )}
      <iframe
        src={embedSrc}
        title="Google Calendar Embed View"
        className="h-full w-full border-none"
        onLoad={onEmbedLoad}
      />
      {!embedLoading && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-ink shadow-card transition-colors hover:bg-surface-secondary"
          >
            Open in Google Calendar
          </a>
        </div>
      )}
    </div>
  </div>
);
