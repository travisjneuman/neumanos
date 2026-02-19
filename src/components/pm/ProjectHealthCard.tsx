/**
 * ProjectHealthCard
 *
 * Health indicator card for projects showing key PM metrics.
 * Features:
 * - Schedule Performance Index (SPI): earned value / planned value
 * - On-time completion rate: tasks completed by dueDate
 * - Scope change indicator: tasks added after baseline
 * - Resource utilization: actual hours / estimated hours
 * - Overall health indicator (green/yellow/red)
 * - Trend arrow showing improvement/decline
 */

import { useMemo } from 'react';
import {
  Activity,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { Task } from '../../types';

interface ProjectHealthCardProps {
  tasks: Task[];
  projectId?: string; // Filter by project, or show all if not provided
  compact?: boolean; // Compact mode for smaller displays
}

interface HealthMetrics {
  spi: number; // Schedule Performance Index
  onTimeRate: number; // % of tasks completed on time
  scopeChange: number; // % scope change (positive = added, negative = removed)
  utilization: number; // Actual / Estimated hours %
  overallHealth: 'healthy' | 'at-risk' | 'critical';
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Calculate health metrics for a set of tasks
 */
function calculateHealthMetrics(tasks: Task[]): HealthMetrics {
  const now = new Date();
  const completedTasks = tasks.filter((t) => t.status === 'done');

  // 1. Schedule Performance Index (SPI)
  // Earned Value = completed task hours
  // Planned Value = expected hours by now (based on due dates)
  let earnedValue = 0;
  let plannedValue = 0;

  completedTasks.forEach((task) => {
    const hours = task.estimatedHours || 1;
    earnedValue += hours;
  });

  tasks.forEach((task) => {
    if (!task.dueDate) return;
    const dueDate = new Date(task.dueDate);
    if (dueDate <= now) {
      // This task should be completed by now
      plannedValue += task.estimatedHours || 1;
    }
  });

  const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;

  // 2. On-time completion rate
  // Tasks that were completed by their due date
  let onTimeTasks = 0;
  let tasksWithDueDate = 0;

  completedTasks.forEach((task) => {
    if (!task.dueDate) return;
    tasksWithDueDate++;
    const dueDate = new Date(task.dueDate);
    const completedDate = task.lastCompletedAt
      ? new Date(task.lastCompletedAt)
      : null;
    if (completedDate && completedDate <= dueDate) {
      onTimeTasks++;
    }
  });

  const onTimeRate =
    tasksWithDueDate > 0 ? (onTimeTasks / tasksWithDueDate) * 100 : 100;

  // 3. Scope change indicator
  // Compare current task count to baseline (if available)
  // For now, estimate based on tasks without baseline data
  const tasksWithBaseline = tasks.filter((t) => t.baseline);
  const tasksWithoutBaseline = tasks.filter((t) => !t.baseline);
  const scopeChange =
    tasksWithBaseline.length > 0
      ? (tasksWithoutBaseline.length / tasksWithBaseline.length) * 100
      : 0;

  // 4. Resource utilization
  // Actual hours / Estimated hours
  let totalEstimated = 0;
  let totalActual = 0;

  tasks.forEach((task) => {
    if (task.estimatedHours) totalEstimated += task.estimatedHours;
    if (task.actualHours) totalActual += task.actualHours;
    // Also consider timeTracking.actual
    if (task.timeTracking?.actual) {
      totalActual += task.timeTracking.actual;
    }
  });

  const utilization =
    totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0;

  // 5. Overall health determination
  let overallHealth: 'healthy' | 'at-risk' | 'critical' = 'healthy';

  if (spi < 0.7 || onTimeRate < 50) {
    overallHealth = 'critical';
  } else if (spi < 0.9 || onTimeRate < 75) {
    overallHealth = 'at-risk';
  }

  // 6. Trend calculation (compare recent vs older tasks)
  // Look at last 7 days vs previous 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentCompleted = completedTasks.filter((t) => {
    if (!t.lastCompletedAt) return false;
    const d = new Date(t.lastCompletedAt);
    return d >= sevenDaysAgo;
  }).length;

  const olderCompleted = completedTasks.filter((t) => {
    if (!t.lastCompletedAt) return false;
    const d = new Date(t.lastCompletedAt);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recentCompleted > olderCompleted * 1.2) {
    trend = 'improving';
  } else if (recentCompleted < olderCompleted * 0.8) {
    trend = 'declining';
  }

  return {
    spi: Math.round(spi * 100) / 100,
    onTimeRate: Math.round(onTimeRate),
    scopeChange: Math.round(scopeChange),
    utilization: Math.round(utilization),
    overallHealth,
    trend,
  };
}

export function ProjectHealthCard({
  tasks,
  projectId,
  compact = false,
}: ProjectHealthCardProps) {
  const filteredTasks = useMemo(() => {
    if (!projectId) return tasks;
    return tasks.filter((t) => t.projectIds?.includes(projectId));
  }, [tasks, projectId]);

  const metrics = useMemo(
    () => calculateHealthMetrics(filteredTasks),
    [filteredTasks]
  );

  // Health color mapping
  const healthColors = {
    healthy: {
      bg: 'bg-status-success/10',
      border: 'border-status-success/30',
      text: 'text-status-success',
      icon: CheckCircle,
    },
    'at-risk': {
      bg: 'bg-status-warning/10',
      border: 'border-status-warning/30',
      text: 'text-status-warning',
      icon: AlertTriangle,
    },
    critical: {
      bg: 'bg-status-error/10',
      border: 'border-status-error/30',
      text: 'text-status-error',
      icon: AlertTriangle,
    },
  };

  const healthConfig = healthColors[metrics.overallHealth];
  const HealthIcon = healthConfig.icon;

  // Trend icon
  const TrendIcon =
    metrics.trend === 'improving'
      ? TrendingUp
      : metrics.trend === 'declining'
        ? TrendingDown
        : Minus;
  const trendColor =
    metrics.trend === 'improving'
      ? 'text-status-success'
      : metrics.trend === 'declining'
        ? 'text-status-error'
        : 'text-text-light-tertiary dark:text-text-dark-tertiary';

  // SPI color
  const spiColor =
    metrics.spi >= 1
      ? 'text-status-success'
      : metrics.spi >= 0.9
        ? 'text-status-warning'
        : 'text-status-error';

  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg border ${healthConfig.bg} ${healthConfig.border}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HealthIcon className={`w-4 h-4 ${healthConfig.text}`} />
            <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {metrics.overallHealth === 'healthy'
                ? 'Healthy'
                : metrics.overallHealth === 'at-risk'
                  ? 'At Risk'
                  : 'Critical'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TrendIcon className={`w-3 h-3 ${trendColor}`} />
            <span className={`text-xs ${spiColor}`}>
              SPI: {metrics.spi.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border ${healthConfig.bg} ${healthConfig.border}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HealthIcon className={`w-5 h-5 ${healthConfig.text}`} />
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
            Project Health
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          <span
            className={`text-xs capitalize ${trendColor}`}
          >
            {metrics.trend}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* SPI */}
        <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Schedule Performance
            </span>
          </div>
          <p className={`text-xl font-bold ${spiColor}`}>
            {metrics.spi.toFixed(2)}
          </p>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {metrics.spi >= 1
              ? 'Ahead of schedule'
              : metrics.spi >= 0.9
                ? 'On track'
                : 'Behind schedule'}
          </p>
        </div>

        {/* On-time Rate */}
        <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              On-time Rate
            </span>
          </div>
          <p
            className={`text-xl font-bold ${
              metrics.onTimeRate >= 80
                ? 'text-status-success'
                : metrics.onTimeRate >= 60
                  ? 'text-status-warning'
                  : 'text-status-error'
            }`}
          >
            {metrics.onTimeRate}%
          </p>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {filteredTasks.filter((t) => t.status === 'done' && t.dueDate)
              .length}{' '}
            tasks with deadlines
          </p>
        </div>

        {/* Scope Change */}
        <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Scope Change
            </span>
          </div>
          <p
            className={`text-xl font-bold ${
              metrics.scopeChange === 0
                ? 'text-status-success'
                : metrics.scopeChange <= 20
                  ? 'text-status-warning'
                  : 'text-status-error'
            }`}
          >
            {metrics.scopeChange > 0 ? '+' : ''}
            {metrics.scopeChange}%
          </p>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {metrics.scopeChange === 0
              ? 'No scope creep'
              : 'Added since baseline'}
          </p>
        </div>

        {/* Utilization */}
        <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Time Utilization
            </span>
          </div>
          <p
            className={`text-xl font-bold ${
              metrics.utilization <= 100
                ? 'text-status-success'
                : metrics.utilization <= 120
                  ? 'text-status-warning'
                  : 'text-status-error'
            }`}
          >
            {metrics.utilization}%
          </p>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {metrics.utilization <= 100
              ? 'Within budget'
              : 'Over budget'}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark">
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          SPI: Earned Value ÷ Planned Value • {'>'}1.0 = ahead, 1.0 = on track,
          {'<'}1.0 = behind
        </p>
      </div>
    </div>
  );
}

export default ProjectHealthCard;
