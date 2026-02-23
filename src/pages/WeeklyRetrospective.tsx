/**
 * Weekly Retrospective Page
 *
 * Provides a comprehensive view of weekly productivity metrics
 * with AI-powered insights and week-over-week comparisons.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Flame,
  CalendarDays,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { generateRetrospectiveData } from '../services/weeklyRetrospective';
import type { RetroData } from '../services/weeklyRetrospective';
import {
  generateInsights,
  clearInsightsCache,
  formatHours,
} from '../services/ai/insightsGenerator';
import type { WeeklyInsights } from '../services/ai/insightsGenerator';

// ─── Helpers ────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? 'text-accent-green' : 'text-accent-red'
      }`}
    >
      <Icon size={12} />
      {isPositive ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────

export function WeeklyRetrospective() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [retroData, setRetroData] = useState<RetroData | null>(null);
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const isCurrentWeek = useMemo(() => {
    const thisWeek = getWeekStart(new Date());
    return currentWeekStart.getTime() === thisWeek.getTime();
  }, [currentWeekStart]);

  const isFutureWeek = useMemo(() => {
    const thisWeek = getWeekStart(new Date());
    return currentWeekStart.getTime() > thisWeek.getTime();
  }, [currentWeekStart]);

  // Load data for the selected week
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateRetrospectiveData(currentWeekStart);
      setRetroData(data);

      // Generate template insights (fast, synchronous)
      const templateInsights = generateInsights(data);
      setInsights(templateInsights);
    } catch (err) {
      console.error('Failed to load retrospective data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateWeek = useCallback(
    (direction: -1 | 1) => {
      setCurrentWeekStart((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + direction * 7);
        return next;
      });
    },
    []
  );

  const regenerateInsights = useCallback(() => {
    if (!retroData) return;
    setInsightsLoading(true);
    clearInsightsCache(retroData.weekStart);
    const newInsights = generateInsights(retroData);
    setInsights(newInsights);
    setInsightsLoading(false);
  }, [retroData]);

  const exportAsNote = useCallback(() => {
    if (!retroData || !insights) return;

    const content = `# Weekly Retrospective: ${retroData.weekLabel}

## Metrics
- **Tasks Completed:** ${retroData.tasks.completed}
- **Tasks Created:** ${retroData.tasks.created}
- **Overdue Tasks:** ${retroData.tasks.overdue}
- **Task Completion Rate:** ${retroData.tasks.completionRate}%
- **Time Tracked:** ${formatHours(retroData.time.totalSeconds)}
- **Habit Completion:** ${retroData.habits.overallCompletionRate}%
- **Calendar Events:** ${retroData.calendar.totalEvents}

## Wins
${insights.wins.map((w, i) => `${i + 1}. ${w}`).join('\n')}

## Areas for Improvement
${insights.improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

## Action Item
${insights.actionItem}

## Productivity Score: ${insights.productivityScore}/100

---
*Generated on ${new Date().toLocaleDateString()}*
`;

    // Copy to clipboard as a simple export
    navigator.clipboard.writeText(content).then(() => {
      // Could integrate with notes store in the future
      alert('Retrospective copied to clipboard!');
    });
  }, [retroData, insights]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-cyan border-r-transparent" />
          <p className="mt-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Loading retrospective...
          </p>
        </div>
      </div>
    );
  }

  if (!retroData || !insights) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-text-light-secondary dark:text-text-dark-secondary">
        No data available for this week.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Weekly Retrospective
          </h1>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
            {retroData.weekLabel}
            {isCurrentWeek && (
              <span className="ml-2 text-xs bg-primary-cyan/20 text-primary-cyan px-2 py-0.5 rounded-full">
                Current Week
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg hover:bg-bg-light-tertiary dark:hover:bg-bg-dark-tertiary transition-colors"
            title="Previous week"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentWeekStart(getWeekStart(new Date()))}
            className="px-3 py-1.5 text-sm rounded-lg hover:bg-bg-light-tertiary dark:hover:bg-bg-dark-tertiary transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek(1)}
            disabled={isFutureWeek}
            className="p-2 rounded-lg hover:bg-bg-light-tertiary dark:hover:bg-bg-dark-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<CheckCircle size={20} className="text-accent-green" />}
          label="Tasks Done"
          value={retroData.tasks.completed}
          delta={retroData.comparison?.tasks.completedDelta}
        />
        <MetricCard
          icon={<Clock size={20} className="text-accent-blue" />}
          label="Hours Tracked"
          value={formatHours(retroData.time.totalSeconds)}
          delta={
            retroData.comparison
              ? Math.round(retroData.comparison.time.totalSecondsDelta / 3600)
              : undefined
          }
          deltaSuffix="h"
        />
        <MetricCard
          icon={<Flame size={20} className="text-accent-orange" />}
          label="Habit Rate"
          value={`${retroData.habits.overallCompletionRate}%`}
          delta={retroData.comparison?.habits.rateDelta}
          deltaSuffix="%"
        />
        <MetricCard
          icon={<CalendarDays size={20} className="text-accent-purple" />}
          label="Events"
          value={retroData.calendar.totalEvents}
          delta={retroData.comparison?.calendar.eventsDelta}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task Details */}
        <div className="p-4 rounded-xl bg-bg-light-secondary dark:bg-bg-dark-secondary border border-border-light dark:border-border-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Task Breakdown
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">Created</span>
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">{retroData.tasks.created}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">Completed</span>
              <span className="font-medium text-accent-green">{retroData.tasks.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">Overdue</span>
              <span className={`font-medium ${retroData.tasks.overdue > 0 ? 'text-accent-red' : 'text-text-light-primary dark:text-text-dark-primary'}`}>
                {retroData.tasks.overdue}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">Completion Rate</span>
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">{retroData.tasks.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Time Details */}
        <div className="p-4 rounded-xl bg-bg-light-secondary dark:bg-bg-dark-secondary border border-border-light dark:border-border-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Time Tracking
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">Total</span>
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">{formatHours(retroData.time.totalSeconds)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">Daily Average</span>
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">{formatHours(retroData.time.dailyAverageSeconds)}</span>
            </div>
            {retroData.time.mostProductiveDay && (
              <div className="flex justify-between">
                <span className="text-text-light-secondary dark:text-text-dark-secondary">Most Productive</span>
                <span className="font-medium text-text-light-primary dark:text-text-dark-primary">{retroData.time.mostProductiveDay}</span>
              </div>
            )}
            {retroData.time.hoursByProject.length > 0 && (
              <div className="pt-2 border-t border-border-light dark:border-border-dark">
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">Top Projects</p>
                {retroData.time.hoursByProject.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-text-light-secondary dark:text-text-dark-secondary truncate mr-2">{p.projectName}</span>
                    <span className="font-medium text-text-light-primary dark:text-text-dark-primary shrink-0">{formatHours(p.seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="p-5 rounded-xl bg-bg-light-secondary dark:bg-bg-dark-secondary border border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary-cyan" />
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Weekly Insights
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-bg-light-tertiary dark:bg-bg-dark-tertiary text-text-light-secondary dark:text-text-dark-secondary">
              {insights.source === 'ai' ? 'AI Generated' : 'Template'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={regenerateInsights}
              disabled={insightsLoading}
              className="p-1.5 rounded-lg hover:bg-bg-light-tertiary dark:hover:bg-bg-dark-tertiary transition-colors disabled:opacity-50"
              title="Regenerate insights"
            >
              <RefreshCw size={14} className={insightsLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={exportAsNote}
              className="p-1.5 rounded-lg hover:bg-bg-light-tertiary dark:hover:bg-bg-dark-tertiary transition-colors"
              title="Export as note"
            >
              <FileText size={14} />
            </button>
          </div>
        </div>

        {/* Productivity Score */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-bg-light-tertiary dark:bg-bg-dark-tertiary">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-current text-border-light dark:text-border-dark"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-current text-primary-cyan"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${insights.productivityScore}, 100`}
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-light-primary dark:text-text-dark-primary">
              {insights.productivityScore}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              Productivity Score
            </p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Based on tasks, habits, and time tracking
            </p>
          </div>
        </div>

        {/* 3-2-1 Format */}
        <div className="space-y-4">
          {/* Wins */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-green mb-2">
              3 Wins
            </h4>
            <ul className="space-y-1.5">
              {insights.wins.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-light-primary dark:text-text-dark-primary">
                  <CheckCircle size={14} className="text-accent-green mt-0.5 shrink-0" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-accent-yellow mb-2">
              2 Areas to Improve
            </h4>
            <ul className="space-y-1.5">
              {insights.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-light-primary dark:text-text-dark-primary">
                  <TrendingUp size={14} className="text-accent-yellow mt-0.5 shrink-0" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Item */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-cyan mb-2">
              1 Action Item
            </h4>
            <div className="flex items-start gap-2 text-sm text-text-light-primary dark:text-text-dark-primary p-3 rounded-lg bg-primary-cyan/10 border border-primary-cyan/20">
              <Sparkles size={14} className="text-primary-cyan mt-0.5 shrink-0" />
              <span>{insights.actionItem}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Metric Card ────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaSuffix = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: number;
  deltaSuffix?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-bg-light-secondary dark:bg-bg-dark-secondary border border-border-light dark:border-border-dark">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {value}
        </span>
        {delta !== undefined && <DeltaBadge value={delta} suffix={deltaSuffix} />}
      </div>
    </div>
  );
}

export default WeeklyRetrospective;
