import React from 'react';
import type { AppSettings, TaskItem, SleepRecord } from '../types';
import { SettingsHeader } from './settings/SettingsHeader';
import { CalendarConnectionCard } from './settings/CalendarConnectionCard';
import { CalibrationBehaviorCard } from './settings/CalibrationBehaviorCard';
import { DataBackupsCard } from './settings/DataBackupsCard';
import { AdvancedTestingCard } from './settings/AdvancedTestingCard';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRunValidationSuite: () => void;
  onSeedSampleData: (preset?: 'standard' | 'rich' | 'edge' | 'empty' | 'generated') => void;
  onClearAllData: () => void;
  tasks: TaskItem[];
  sleepRecords: SleepRecord[];
  onImportData: (importedTasks: TaskItem[], importedSleep: SleepRecord[], importedSettings?: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onRunValidationSuite,
  onSeedSampleData,
  onClearAllData,
  tasks,
  sleepRecords,
  onImportData
}) => (
  <div className="mx-auto max-w-content space-y-8 pb-16">
    <SettingsHeader />

    <CalendarConnectionCard
      settings={settings}
      onUpdateSettings={onUpdateSettings}
      tasks={tasks}
      sleepRecords={sleepRecords}
      onImportData={onImportData}
    />

    <CalibrationBehaviorCard settings={settings} onUpdateSettings={onUpdateSettings} />

    <DataBackupsCard
      settings={settings}
      tasks={tasks}
      sleepRecords={sleepRecords}
      onImportData={onImportData}
      onClearAllData={onClearAllData}
    />

    <AdvancedTestingCard
      onRunValidationSuite={onRunValidationSuite}
      onSeedSampleData={onSeedSampleData}
    />
  </div>
);
