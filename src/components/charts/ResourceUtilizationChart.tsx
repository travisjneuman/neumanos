/**
 * ResourceUtilizationChart
 *
 * Horizontal bar chart showing resource utilization percentages.
 * Features:
 * - X-axis: utilization percentage (0-120%+)
 * - Y-axis: resource names
 * - Color thresholds: green <80%, yellow 80-100%, red >100%
 * - Tooltips with capacity and assigned hours breakdown
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useResourceStore } from '../../stores/useResourceStore';
import { useKanbanStore } from '../../stores/useKanbanStore';

interface ResourceUtilizationChartProps {
  height?: number;
}

export function ResourceUtilizationChart({ height = 256 }: ResourceUtilizationChartProps) {
  const resources = useResourceStore((s) => s.resources);
  const tasks = useKanbanStore((s) => s.tasks);

  // Build estimated hours map
  const estimatedHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.estimatedHours) {
        map.set(t.id, t.estimatedHours);
      }
    });
    return map;
  }, [tasks]);

  // Calculate chart data
  const chartData = useMemo(() => {
    return resources.map((resource) => {
      const assignedHours = resource.assignedTasks.reduce((sum, taskId) => {
        return sum + (estimatedHoursMap.get(taskId) || 0);
      }, 0);

      const utilization =
        resource.capacity > 0 ? (assignedHours / resource.capacity) * 100 : 0;

      return {
        name: resource.name,
        utilization: Math.round(utilization * 10) / 10,
        assignedHours,
        capacity: resource.capacity,
        taskCount: resource.assignedTasks.length,
      };
    });
  }, [resources, estimatedHoursMap]);

  // Get bar color based on utilization
  const getBarColor = (utilization: number): string => {
    if (utilization > 100) return 'var(--status-error)';
    if (utilization >= 80) return 'var(--status-warning)';
    return 'var(--status-success)';
  };

  if (chartData.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary text-sm">
          No resources available. Add resources in Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border-light dark:stroke-border-dark"
          />
          <XAxis
            type="number"
            domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]}
            tick={{ fontSize: 12 }}
            className="fill-text-light-secondary dark:fill-text-dark-secondary"
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            className="fill-text-light-secondary dark:fill-text-dark-secondary"
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-light-elevated)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${value ?? 0}%`, 'Utilization']}
            labelFormatter={(label) => {
              const resource = chartData.find((r) => r.name === label);
              if (!resource) return label;
              return `${label} (${resource.assignedHours}h / ${resource.capacity}h, ${resource.taskCount} task${resource.taskCount !== 1 ? 's' : ''})`;
            }}
          />
          <ReferenceLine
            x={100}
            stroke="var(--status-error)"
            strokeDasharray="4 4"
            label={{
              value: '100%',
              position: 'top',
              fill: 'var(--status-error)',
              fontSize: 10,
            }}
          />
          <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ResourceUtilizationChart;
