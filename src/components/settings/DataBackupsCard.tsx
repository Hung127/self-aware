import React, { useState } from 'react';
import { Database, Download, Trash2, Upload } from 'lucide-react';
import type { AppSettings, TaskItem, SleepRecord } from '../../types';
import { STORAGE_SCHEMA_VERSION, normalizeImportedTasks, normalizeSleepRecords, sanitizeSettings } from '../../utils/storage';
import { CardSection } from '../ui/CardSection';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface DataBackupsCardProps {
  settings: AppSettings;
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  onImportData: (tasks: TaskItem[], sleep: SleepRecord[], settings?: AppSettings) => void;
  onClearAllData: () => void;
}

export const DataBackupsCard: React.FC<DataBackupsCardProps> = ({
  settings,
  tasks,
  sleepRecords,
  onImportData,
  onClearAllData
}) => {
  const [dataStatusMsg, setDataStatusMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [clearAllTarget, setClearAllTarget] = useState(false);

  const handleExportJson = () => {
    const exportObject = {
      version: '2.0',
      schemaVersion: STORAGE_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      settings,
      tasks,
      sleepRecords
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `personal_calibration_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || typeof json !== 'object') {
          setDataStatusMsg({ type: 'error', text: 'This file is not a valid calibration backup.' });
          return;
        }
        if (!Array.isArray(json.tasks)) {
          setDataStatusMsg({ type: 'error', text: 'This file is not a valid calibration backup (missing tasks array).' });
          return;
        }
        if (json.sleepRecords !== undefined && !Array.isArray(json.sleepRecords)) {
          setDataStatusMsg({ type: 'error', text: 'This file is not a valid calibration backup (sleepRecords must be an array).' });
          return;
        }
        if (json.settings !== undefined && (typeof json.settings !== 'object' || json.settings === null)) {
          setDataStatusMsg({ type: 'error', text: 'This file is not a valid calibration backup (settings must be an object).' });
          return;
        }

        const { tasks: normalizedTasks, rejected } = normalizeImportedTasks(json.tasks);
        const { records: normalizedSleep, rejected: rejectedSleep } = normalizeSleepRecords(json.sleepRecords || []);
        const importedSettings = sanitizeSettings(json.settings);

        onImportData(normalizedTasks, normalizedSleep, importedSettings);
        const skippedNote = rejected.length + rejectedSleep.length > 0
          ? ` ${rejected.length} task record(s) and ${rejectedSleep.length} sleep record(s) skipped.`
          : '';
        setDataStatusMsg({
          type: rejected.length + rejectedSleep.length > 0 ? 'warning' : 'success',
          text: skippedNote
            ? `Backup imported with ${skippedNote.trim()}`
            : 'Backup imported successfully.'
        });
      } catch (err) {
        setDataStatusMsg({ type: 'error', text: 'The backup file could not be read.' });
      }
    };
    reader.readAsText(file);
  };

  const msgTone =
    dataStatusMsg?.type === 'success'
      ? 'border-success-border bg-success-soft text-success-ink'
      : dataStatusMsg?.type === 'warning'
        ? 'border-warning-border bg-warning-soft text-warning-ink'
        : 'border-danger-border bg-danger-soft text-danger-ink';

  return (
    <CardSection
      icon={<Database className="h-5 w-5" />}
      title="Data & backups"
      subtitle="Export, import, or erase your calibration data"
    >
      <div className="space-y-4">
        {dataStatusMsg && (
          <p role="status" aria-live="polite" className={`rounded-lg border px-3 py-2 text-sm ${msgTone}`}>
            {dataStatusMsg.text}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-medium text-text-secondary">
            Active Dataset Status:{' '}
            <strong className="text-text-primary">{tasks.length} tasks</strong>,{' '}
            <strong className="text-text-primary">{sleepRecords.length} sleep logs</strong> stored.
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleExportJson} variant="secondary" size="sm" className="rounded-xl">
              <Download className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </Button>

            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-1.5 font-semibold text-text-secondary transition-colors hover:bg-surface">
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <Button
              onClick={() => setClearAllTarget(true)}
              aria-label="Clear all calibration data"
              variant="danger"
              size="sm"
              className="rounded-xl"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear All Data</span>
            </Button>
          </div>
        </div>
      </div>

      {clearAllTarget && (
        <ConfirmDialog
          title="Erase all data?"
          message="Permanently deletes all tasks, sleep records, and settings. Export a backup first."
          confirmLabel="Erase everything"
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={onClearAllData}
          onClose={() => setClearAllTarget(false)}
        />
      )}
    </CardSection>
  );
};
