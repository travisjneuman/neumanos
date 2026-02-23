/**
 * Productivity Trends Chart
 *
 * Line chart showing productivity metrics over time:
 * tasks completed, notes created/updated, and time entries.
 */

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useActivityStore } from '../../stores/useActivityStore';

type TrendRange = '7d' | '30d' | '90d';

export const ProductivityTrends: React.FC = () => {
  const [range, setRange] = useState<TrendRange>('30d');
  const events = useActivityStore((s) => s.events);

  const chartData = useMemo(() => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const now = new Date();
    const data: Array<{ date: string; label: string; tasks: number; notes: number; timeEntries: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      data.push({ date: dateKey, label, tasks: 0, notes: 0, timeEntries: 0 });
    }

    for (const event of events) {
      const dateKey = event.timestamp.split('T')[0];
      const entry = data.find((d) => d.date === dateKey);
      if (!entry) continue;

      if (event.module === 'tasks' && (event.type === 'completed' || event.type === 'created')) {
        entry.tasks++;
      } else if (event.module === 'notes') {
        entry.notes++;
      } else if (event.module === 'time-tracking') {
        entry.timeEntries++;
      }
    }

    return data;
  }, [range, events]);

  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark p-5 bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
          Productivity Trends
        </h3>

        <div className="flex items-center gap-1 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-0.5">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                range === r
                  ? 'bg-accent-primary text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-text-dark-tertiary, #9ca3af)' }}
            interval={range === '7d' ? 0 : range === '30d' ? 6 : 14}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-text-dark-tertiary, #9ca3af)' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface-dark-elevated, #1f2937)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--color-text-dark-primary, #f9fafb)',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
          />
          <Line
            type="monotone"
            dataKey="tasks"
            name="Tasks"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="notes"
            name="Notes"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="timeEntries"
            name="Time Entries"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
