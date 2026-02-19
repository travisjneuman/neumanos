/**
 * BurndownChart
 *
 * Recharts-based burndown chart for sprint/project tracking.
 * Features:
 * - Ideal burndown line (linear from total to 0)
 * - Actual burndown based on task completion dates
 * - Uses task.effort (story points) if available, otherwise counts tasks
 * - Reference line for "today" if within sprint
 * - Gradient area fill under actual line
 */

import { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import type { Task } from '../../types';

interface BurndownChartProps {
  tasks: Task[];
  sprintStart: Date;
  sprintEnd: Date;
  height?: number;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  ideal: number;
  actual: number;
  completed: number;
}

/**
 * Get task completion date (when moved to "done")
 */
function getCompletionDate(task: Task): Date | null {
  if (task.status !== 'done') return null;
  // Use lastCompletedAt if available, otherwise use a fallback
  if (task.lastCompletedAt) {
    return new Date(task.lastCompletedAt);
  }
  // Fallback: if no lastCompletedAt, we can't determine when it was completed
  return null;
}

/**
 * Get task value (story points if available, otherwise 1)
 */
function getTaskValue(task: Task): number {
  return task.effort || 1;
}

export function BurndownChart({
  tasks,
  sprintStart,
  sprintEnd,
  height = 256,
}: BurndownChartProps) {
  const chartData = useMemo(() => {
    // Filter tasks that are relevant to this sprint
    // (created before sprint end, or have start/due date within sprint)
    const sprintTasks = tasks.filter((task) => {
      const created = new Date(task.created);
      if (created > sprintEnd) return false;

      // Include if task has dates within sprint range
      if (task.startDate) {
        const start = new Date(task.startDate);
        if (start <= sprintEnd && start >= sprintStart) return true;
      }
      if (task.dueDate) {
        const due = new Date(task.dueDate);
        if (due <= sprintEnd && due >= sprintStart) return true;
      }

      // Include if created before sprint end
      return created <= sprintEnd;
    });

    // Calculate total story points
    const totalPoints = sprintTasks.reduce(
      (sum, task) => sum + getTaskValue(task),
      0
    );

    // Generate date range
    const dates: Date[] = [];
    const current = new Date(sprintStart);
    while (current <= sprintEnd) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const totalDays = dates.length;
    const pointsPerDay = totalPoints / Math.max(totalDays - 1, 1);

    // Build chart data
    const data: ChartDataPoint[] = dates.map((date, index) => {
      // Ideal burndown: linear decrease
      const idealRemaining = Math.max(0, totalPoints - pointsPerDay * index);

      // Actual burndown: calculate completed points by this date
      const completedByDate = sprintTasks
        .filter((task) => {
          const completionDate = getCompletionDate(task);
          if (!completionDate) return false;
          // Task completed on or before this date
          return (
            completionDate.getFullYear() === date.getFullYear() &&
            completionDate.getMonth() === date.getMonth() &&
            completionDate.getDate() === date.getDate()
          ) || completionDate < date;
        })
        .reduce((sum, task) => sum + getTaskValue(task), 0);

      const actualRemaining = totalPoints - completedByDate;

      return {
        date: date.toISOString().split('T')[0],
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: Math.round(actualRemaining * 10) / 10,
        completed: completedByDate,
      };
    });

    return { data, totalPoints };
  }, [tasks, sprintStart, sprintEnd]);

  const today = new Date();
  const isToday = today >= sprintStart && today <= sprintEnd;

  if (chartData.data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary text-sm">
          No sprint data available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData.data}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--accent-primary)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--accent-primary)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border-light dark:stroke-border-dark"
          />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11 }}
            className="fill-text-light-secondary dark:fill-text-dark-secondary"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-text-light-secondary dark:fill-text-dark-secondary"
            label={{
              value: 'Remaining',
              angle: -90,
              position: 'insideLeft',
              className:
                'fill-text-light-secondary dark:fill-text-dark-secondary',
              fontSize: 11,
            }}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-light-elevated)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value, name) => {
              const displayName =
                name === 'ideal'
                  ? 'Ideal'
                  : name === 'actual'
                    ? 'Actual'
                    : String(name ?? '');
              return [
                `${value ?? 0} ${chartData.totalPoints > tasks.length ? 'pts' : 'tasks'}`,
                displayName,
              ];
            }}
          />
          {/* Today reference line */}
          {isToday && (
            <ReferenceLine
              x={`${today.getMonth() + 1}/${today.getDate()}`}
              stroke="var(--accent-secondary)"
              strokeDasharray="4 4"
              label={{
                value: 'Today',
                position: 'top',
                fill: 'var(--accent-secondary)',
                fontSize: 10,
              }}
            />
          )}
          {/* Ideal burndown line (dashed, gray) */}
          <Line
            type="linear"
            dataKey="ideal"
            stroke="var(--text-light-tertiary)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="ideal"
          />
          {/* Area fill under actual line */}
          <Area
            type="monotone"
            dataKey="actual"
            fill="url(#actualGradient)"
            stroke="transparent"
          />
          {/* Actual burndown line (solid, primary) */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="var(--accent-primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--accent-primary)', r: 3 }}
            activeDot={{ r: 5 }}
            name="actual"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BurndownChart;
