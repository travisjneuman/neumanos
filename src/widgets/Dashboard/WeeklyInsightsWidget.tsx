/**
 * Weekly Insights Dashboard Widget
 *
 * Shows a compact view of the current week's productivity score,
 * top win, and top improvement area with a link to the full report.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { generateRetrospectiveData } from '../../services/weeklyRetrospective';
import { generateInsights } from '../../services/ai/insightsGenerator';
import type { WeeklyInsights } from '../../services/ai/insightsGenerator';

export const WeeklyInsightsWidget: React.FC = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await generateRetrospectiveData(new Date());
        if (cancelled) return;
        const result = generateInsights(data);
        if (!cancelled) setInsights(result);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-bg-light-tertiary dark:bg-bg-dark-tertiary rounded w-2/3" />
        <div className="h-3 bg-bg-light-tertiary dark:bg-bg-dark-tertiary rounded w-full" />
        <div className="h-3 bg-bg-light-tertiary dark:bg-bg-dark-tertiary rounded w-4/5" />
      </div>
    );
  }

  if (!insights) {
    return (
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
        No data yet. Complete some tasks and habits to see your weekly insights.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Productivity Score */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
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
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-light-primary dark:text-text-dark-primary">
            {insights.productivityScore}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            Productivity Score
          </p>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            This week
          </p>
        </div>
      </div>

      {/* Top Win */}
      <div className="flex items-start gap-2 text-xs">
        <CheckCircle size={12} className="text-accent-green mt-0.5 shrink-0" />
        <span className="text-text-light-primary dark:text-text-dark-primary line-clamp-2">
          {insights.wins[0]}
        </span>
      </div>

      {/* Top Improvement */}
      <div className="flex items-start gap-2 text-xs">
        <TrendingUp size={12} className="text-accent-yellow mt-0.5 shrink-0" />
        <span className="text-text-light-primary dark:text-text-dark-primary line-clamp-2">
          {insights.improvements[0]}
        </span>
      </div>

      {/* View Report Link */}
      <button
        onClick={() => navigate('/retrospective')}
        className="flex items-center gap-1 text-xs text-primary-cyan hover:text-primary-cyan/80 transition-colors mt-1"
      >
        <Sparkles size={12} />
        View Full Report
        <ArrowRight size={12} />
      </button>
    </div>
  );
};
