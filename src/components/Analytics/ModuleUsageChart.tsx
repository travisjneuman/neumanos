/**
 * Module Usage Chart
 *
 * Donut chart showing activity distribution across modules.
 * Uses Recharts PieChart with color-coded segments.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useActivityStore } from '../../stores/useActivityStore';
import type { ModuleType } from '../../stores/useActivityStore';
import { useAnalyticsWorker } from '../../hooks/useAnalyticsWorker';
import type { ActivityEvent as WorkerActivityEvent } from '../../hooks/useAnalyticsWorker';

const MODULE_COLORS: Record<ModuleType, string> = {
  notes: '#f59e0b',
  tasks: '#22c55e',
  calendar: '#3b82f6',
  docs: '#a855f7',
  'time-tracking': '#06b6d4',
  habits: '#f43f5e',
  links: '#6366f1',
  ai: '#10b981',
  forms: '#f97316',
  diagrams: '#14b8a6',
};

const MODULE_LABELS: Record<ModuleType, string> = {
  notes: 'Notes',
  tasks: 'Tasks',
  calendar: 'Calendar',
  docs: 'Documents',
  'time-tracking': 'Time Tracking',
  habits: 'Habits',
  links: 'Links',
  ai: 'AI',
  forms: 'Forms',
  diagrams: 'Diagrams',
};

export const ModuleUsageChart: React.FC = () => {
  const events = useActivityStore((s) => s.events);
  const { calculateModuleDistribution } = useAnalyticsWorker();

  // Worker-computed module distribution
  const [workerDistribution, setWorkerDistribution] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (events.length === 0) {
      setWorkerDistribution(null);
      return;
    }
    const workerEvents: WorkerActivityEvent[] = events.map((e) => ({
      timestamp: e.timestamp,
      module: e.module,
    }));
    let cancelled = false;
    calculateModuleDistribution(workerEvents).then((dist) => {
      if (!cancelled) setWorkerDistribution(dist);
    });
    return () => { cancelled = true; };
  }, [events, calculateModuleDistribution]);

  const chartData = useMemo(() => {
    // Use worker results when available, fall back to inline computation
    const counts: Partial<Record<ModuleType, number>> = workerDistribution
      ? (workerDistribution as Partial<Record<ModuleType, number>>)
      : (() => {
          const c: Partial<Record<ModuleType, number>> = {};
          for (const event of events) {
            c[event.module] = (c[event.module] || 0) + 1;
          }
          return c;
        })();

    return Object.entries(counts)
      .map(([module, count]) => ({
        name: MODULE_LABELS[module as ModuleType] || module,
        value: count as number,
        module: module as ModuleType,
      }))
      .sort((a, b) => b.value - a.value);
  }, [events, workerDistribution]);

  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border-light dark:border-border-dark p-5 bg-surface-light dark:bg-surface-dark">
        <h3 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          Module Usage
        </h3>
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            No activity data yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark p-5 bg-surface-light dark:bg-surface-dark">
      <h3 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        Module Usage
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.module} fill={MODULE_COLORS[entry.module]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface-dark-elevated, #1f2937)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--color-text-dark-primary, #f9fafb)',
              fontSize: '12px',
            }}
            formatter={((value: number) => [
              `${value} (${Math.round((value / total) * 100)}%)`,
            ]) as never}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
        {chartData.slice(0, 6).map((entry) => (
          <div key={entry.module} className="flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: MODULE_COLORS[entry.module] }}
            />
            <span className="text-text-light-secondary dark:text-text-dark-secondary truncate">
              {entry.name}
            </span>
            <span className="text-text-light-tertiary dark:text-text-dark-tertiary ml-auto">
              {Math.round((entry.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
