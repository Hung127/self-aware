import { TaskItem, TaskCategory } from '../types';

export interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  status: string;
  htmlLink?: string;
}

export function inferCategoryFromTitle(title: string): TaskCategory {
  const lower = title.toLowerCase();
  if (
    lower.includes('code') ||
    lower.includes('coding') ||
    lower.includes('algorithm') ||
    lower.includes('bug') ||
    lower.includes('react') ||
    lower.includes('api') ||
    lower.includes('db') ||
    lower.includes('dev') ||
    lower.includes('ml') ||
    lower.includes('programming') ||
    lower.includes('git') ||
    lower.includes('refactor') ||
    lower.includes('script')
  ) {
    return 'Programming';
  }
  if (
    lower.includes('study') ||
    lower.includes('dsa') ||
    lower.includes('exam') ||
    lower.includes('lecture') ||
    lower.includes('course') ||
    lower.includes('math') ||
    lower.includes('homework')
  ) {
    return 'Studying';
  }
  if (lower.includes('read') || lower.includes('chapter') || lower.includes('paper') || lower.includes('book')) {
    return 'Reading';
  }
  if (lower.includes('write') || lower.includes('doc') || lower.includes('essay') || lower.includes('draft') || lower.includes('report')) {
    return 'Writing';
  }
  if (lower.includes('gym') || lower.includes('workout') || lower.includes('run') || lower.includes('yoga') || lower.includes('exercise')) {
    return 'Exercise';
  }
  if (lower.includes('dinner') || lower.includes('call') || lower.includes('groceries') || lower.includes('doctor') || lower.includes('family')) {
    return 'Personal';
  }
  return 'Other';
}

/**
 * Returns mock Google Calendar events for user preview/import.
 */
export function getMockGCalEvents(): GCalEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  return [
    {
      id: 'gcal-import-1',
      summary: 'Deep Learning Transformer Architecture Reading',
      description: 'Review Vaswani et al. paper and implementation details.',
      start: { dateTime: `${today}T15:30:00.000Z` },
      end: { dateTime: `${today}T17:30:00.000Z` },
      status: 'confirmed'
    },
    {
      id: 'gcal-import-2',
      summary: 'Mobile UI Layout & Responsiveness Audit',
      description: 'Audit mobile navigation touch targets and accessibility.',
      start: { dateTime: `${tomorrow}T10:00:00.000Z` },
      end: { dateTime: `${tomorrow}T11:30:00.000Z` },
      status: 'confirmed'
    },
    {
      id: 'gcal-import-3',
      summary: 'Weekly Project Retrospective & Documentation',
      description: 'Summarize calibration metrics and system updates.',
      start: { dateTime: `${tomorrow}T14:00:00.000Z` },
      end: { dateTime: `${tomorrow}T15:00:00.000Z` },
      status: 'confirmed'
    }
  ];
}

/**
 * Converts a Google Calendar event into a plan-only record. Calendar time is
 * scheduling context, not a user forecast.
 */
export function convertGCalEventToTask(event: GCalEvent): TaskItem {
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  const durationMins = Math.max(15, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
  const category = inferCategoryFromTitle(event.summary);
  const dateStr = start.toISOString().split('T')[0];

  return {
    id: `task-gcal-${event.id}-${Date.now()}`,
    title: event.summary,
    category,
    plannedStart: event.start.dateTime,
    plannedEnd: event.end.dateTime,
    plannedDurationMinutes: durationMins,
    estimatedDurationMinutes: 0,
    confidence: 0,
    planSource: 'google_calendar',
    predictionStatus: 'not_recorded',
    googleCalendarEventId: event.id,
    originalPlannedStart: event.start.dateTime,
    originalEstimatedDurationMinutes: 0,
    createdAt: new Date().toISOString(),
    execution: {
      status: 'not_started',
      postponedCount: 0,
      originalScheduledDate: dateStr,
    }
  };
}
