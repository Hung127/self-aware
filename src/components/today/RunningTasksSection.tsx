import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { TaskMetaLine } from './TaskMetaLine';
import type { TaskItem } from '../../types';
import { formatMinutesToHours } from '../../utils/calibrationEngine';

function formatSecondsToHMS(totalSecs: number) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) {
    return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

interface RunningTasksSectionProps {
  tasks: TaskItem[];
  elapsed: Record<string, number>;
  onFinish: (task: TaskItem) => void;
}

export const RunningTasksSection: React.FC<RunningTasksSectionProps> = ({ tasks, elapsed, onFinish }) => {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary-ink">Currently Running ({tasks.length})</h2>
      </div>

      <div className="space-y-3">
        {tasks.map(task => {
          const elapsedSecs = elapsed[task.id] || 0;
          return (
            <div key={task.id} className="rounded-xl border-2 border-primary bg-primary-soft/30 p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info" className="font-mono font-bold">
                      {new Date(task.plannedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                    <h3 className="text-base font-bold text-text-primary">{task.title}</h3>
                    <Badge tone="neutral">{task.category}</Badge>
                  </div>

                  <div className="pt-1">
                    <TaskMetaLine
                      items={[
                        { label: 'Forecast', value: formatMinutesToHours(task.estimatedDurationMinutes) },
                        { label: 'Confidence', value: `${task.confidence}%` },
                        { label: 'Started at', value: task.execution.actualStart ? new Date(task.execution.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--' }
                      ]}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">Elapsed time</span>
                    <span className="font-mono text-xl font-extrabold text-primary-ink">{formatSecondsToHMS(elapsedSecs)}</span>
                  </div>

                  <Button onClick={() => onFinish(task)} variant="success" className="h-10 px-4 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Finish &amp; Record</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
