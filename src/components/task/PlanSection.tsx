import React from 'react';
import { TaskCategory, BehavioralTaskType } from '../../types';
import { CATEGORIES, PROGRAMMING_TASK_TYPES, formatMinutesToHours } from '../../utils/calibrationEngine';
import { Field, inputCls } from '../ui/Field';
import { FormSectionHeading } from './FormSectionHeading';

interface PlanSectionProps {
  title: string;
  titleError?: string;
  onTitleChange: (value: string) => void;
  category: TaskCategory;
  onCategoryChange: (value: TaskCategory) => void;
  tag: string;
  onTagChange: (value: string) => void;
  scheduledDate: string;
  onScheduledDateChange: (value: string) => void;
  behavioralTaskType: BehavioralTaskType;
  onBehavioralTaskTypeChange: (value: BehavioralTaskType) => void;
  startTime: string;
  onStartTimeChange: (value: string) => void;
  plannedMinutes: number;
  onPlannedMinutesChange: (value: number) => void;
}

export const PlanSection: React.FC<PlanSectionProps> = ({
  title,
  titleError,
  onTitleChange,
  category,
  onCategoryChange,
  tag,
  onTagChange,
  scheduledDate,
  onScheduledDateChange,
  behavioralTaskType,
  onBehavioralTaskTypeChange,
  startTime,
  onStartTimeChange,
  plannedMinutes,
  onPlannedMinutesChange
}) => (
  <div className="space-y-4">
    <FormSectionHeading
      step="1"
      title="Scheduled Plan"
      description="What is scheduled on your calendar or agenda?"
    />

    <Field label="Task name" error={titleError}>
      <input
        type="text"
        placeholder="e.g., Study Machine Learning, Refactor React state"
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        className={`${inputCls} ${titleError ? 'border-danger-border-strong focus:border-danger focus:ring-danger/20' : ''}`}
      />
    </Field>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Field label="Category">
        <select
          value={category}
          onChange={e => onCategoryChange(e.target.value as TaskCategory)}
          className={inputCls}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tag" optional>
        <input
          type="text"
          placeholder="e.g. Assignment"
          value={tag}
          onChange={e => onTagChange(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Date">
        <input
          type="date"
          value={scheduledDate}
          onChange={e => onScheduledDateChange(e.target.value)}
          required
          className={inputCls}
        />
      </Field>
    </div>

    {category === 'Programming' && (
      <Field label="Task type" optional helper="Optional reference class">
        <select
          value={behavioralTaskType}
          onChange={e => onBehavioralTaskTypeChange(e.target.value as BehavioralTaskType)}
          className={inputCls}
        >
          {PROGRAMMING_TASK_TYPES.map(bt => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
          <option value="other">other</option>
        </select>
      </Field>
    )}

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Planned start time">
        <input
          type="time"
          value={startTime}
          onChange={e => onStartTimeChange(e.target.value)}
          required
          className={inputCls}
        />
      </Field>

      <Field label="Schedule block" helper="Calendar slot">
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="5"
            max="1440"
            step="5"
            value={plannedMinutes}
            onChange={e => onPlannedMinutesChange(Math.max(5, parseInt(e.target.value) || 0))}
            required
            className={inputCls}
          />
          <span className="whitespace-nowrap text-xs font-semibold text-text-muted">
            ({formatMinutesToHours(plannedMinutes)})
          </span>
        </div>
      </Field>
    </div>
  </div>
);
