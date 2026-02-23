/**
 * Portfolio Metrics Component
 *
 * Aggregate stats across all projects: total open tasks,
 * hours this week, velocity (tasks completed per week rolling average),
 * and at-risk project count with trend arrows.
 */

import { useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { Task } from '../../types';

interface ProjectSummaryInput {
  openCount: number;
  inProgressCount: number;
  doneCount: number;
  overdueCount: number;
  totalCount: number;
  hoursThisWeek: number;
  health: 'green' | 'yellow' | 'red';
}

interface Props {
  summaries: ProjectSummaryInput[];
  tasks: Task[];
}

function TrendArrow({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  if (direction === 'up') return <TrendingUp className="w-3.5 h-3.5 text-accent-green" />;
  if (direction === 'down') return <TrendingDown className="w-3.5 h-3.5 text-accent-red" />;
  return <Minus className="w-3.5 h-3.5 text-text-light-secondary dark:text-text-dark-secondary" />;
}

export function PortfolioMetrics({ summaries, tasks }: Props) {
  const totalOpen = summaries.reduce((sum, s) => sum + s.openCount + s.inProgressCount, 0);
  const totalHoursThisWeek = summaries.reduce((sum, s) => sum + s.hoursThisWeek, 0);
  const atRiskCount = summaries.filter((s) => s.health === 'red').length;

  // Velocity: tasks completed in last 7 days vs previous 7 days
  const { velocityThisWeek, velocityLastWeek } = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const completedThisWeek = tasks.filter(
      (t) => t.status === 'done' && t.lastCompletedAt && new Date(t.lastCompletedAt) >= oneWeekAgo
    ).length;

    const completedLastWeek = tasks.filter(
      (t) =>
        t.status === 'done' &&
        t.lastCompletedAt &&
        new Date(t.lastCompletedAt) >= twoWeeksAgo &&
        new Date(t.lastCompletedAt) < oneWeekAgo
    ).length;

    return { velocityThisWeek: completedThisWeek, velocityLastWeek: completedLastWeek };
  }, [tasks]);

  const velocityTrend: 'up' | 'down' | 'flat' =
    velocityThisWeek > velocityLastWeek ? 'up' : velocityThisWeek < velocityLastWeek ? 'down' : 'flat';

  const metrics = [
    {
      label: 'Open Tasks',
      value: totalOpen,
      icon: CheckSquare,
      color: 'text-accent-blue',
      bgColor: 'bg-accent-blue/10',
      trend: null as 'up' | 'down' | 'flat' | null,
    },
    {
      label: 'Hours This Week',
      value: `${Math.round(totalHoursThisWeek * 10) / 10}h`,
      icon: Clock,
      color: 'text-accent-purple',
      bgColor: 'bg-accent-purple/10',
      trend: null,
    },
    {
      label: 'Velocity (tasks/wk)',
      value: velocityThisWeek,
      icon: Zap,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
      trend: velocityTrend,
    },
    {
      label: 'At-Risk Projects',
      value: atRiskCount,
      icon: AlertTriangle,
      color: atRiskCount > 0 ? 'text-accent-red' : 'text-accent-green',
      bgColor: atRiskCount > 0 ? 'bg-accent-red/10' : 'bg-accent-green/10',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${m.bgColor}`}>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {m.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {m.value}
              </span>
              {m.trend && <TrendArrow direction={m.trend} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
