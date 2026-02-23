/**
 * AI Daily Briefing Widget
 *
 * Auto-generates a morning summary using cross-module context.
 * Shows today's events, overdue tasks, habit status, and productivity trends.
 * Caches the briefing (regenerate once per day or on demand).
 */

import React, { useState, useCallback, useMemo } from 'react';
import { BaseWidget } from './BaseWidget';
import { buildCrossModuleContext } from '../../services/ai/contextBuilder';
import { formatDateKey } from '../../utils/dateUtils';
import { Sparkles } from 'lucide-react';
import type { WidgetComponentProps } from './WidgetRegistry';
import type { CrossModuleContext } from '../../services/ai/contextBuilder';

interface CachedBriefing {
  dateKey: string;
  context: CrossModuleContext;
  generatedAt: number;
}

// Simple in-memory cache for the briefing
let cachedBriefing: CachedBriefing | null = null;

function getBriefing(): CrossModuleContext {
  const todayKey = formatDateKey(new Date());

  // Return cached if same day
  if (cachedBriefing && cachedBriefing.dateKey === todayKey) {
    return cachedBriefing.context;
  }

  // Build fresh context
  const context = buildCrossModuleContext();
  cachedBriefing = {
    dateKey: todayKey,
    context,
    generatedAt: Date.now(),
  };
  return context;
}

export const AIBriefingWidget: React.FC<WidgetComponentProps> = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const context = useMemo(() => {
    // refreshKey forces re-evaluation
    void refreshKey;
    return getBriefing();
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    cachedBriefing = null;
    setRefreshKey((k) => k + 1);
  }, []);

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const totalItems =
    context.calendar.todayEvents.length +
    context.tasks.overdueCount +
    context.tasks.dueTodayCount +
    context.habits.todayPending.length;

  return (
    <BaseWidget
      title="Daily Briefing"
      icon="🌅"
      subtitle={todayDate}
      onRefresh={handleRefresh}
    >
      <div className="flex flex-col gap-3 text-sm min-h-[120px]">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-text-light-secondary dark:text-text-dark-secondary">
            <Sparkles size={24} className="mb-2 text-accent-primary" />
            <p className="text-xs">No items for today. Enjoy your free day!</p>
          </div>
        ) : (
          <>
            {/* Today's Events */}
            {context.calendar.todayEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">📅</span>
                  <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                    Events ({context.calendar.todayEvents.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {context.calendar.todayEvents.slice(0, 4).map((event, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-light-secondary dark:text-text-dark-secondary pl-5">
                      {event.startTime && (
                        <span className="text-accent-green font-mono text-[10px] w-10 flex-shrink-0">
                          {event.startTime}
                        </span>
                      )}
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Tasks */}
            {context.tasks.overdueCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs">🔴</span>
                <span className="text-xs text-accent-red font-medium">
                  {context.tasks.overdueCount} overdue task{context.tasks.overdueCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Due Today */}
            {context.tasks.dueTodayCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs">📋</span>
                <span className="text-xs text-text-light-primary dark:text-text-dark-primary">
                  {context.tasks.dueTodayCount} task{context.tasks.dueTodayCount !== 1 ? 's' : ''} due today
                </span>
              </div>
            )}

            {/* In Progress Tasks */}
            {context.tasks.inProgress.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">🔨</span>
                  <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                    In Progress ({context.tasks.inProgress.length})
                  </span>
                </div>
                <div className="space-y-0.5 pl-5">
                  {context.tasks.inProgress.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center gap-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        task.priority === 'high' ? 'bg-accent-red' : task.priority === 'medium' ? 'bg-accent-yellow' : 'bg-accent-green'
                      }`} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Habits */}
            {(context.habits.todayCompleted.length > 0 || context.habits.todayPending.length > 0) && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">🎯</span>
                  <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                    Habits ({context.habits.todayCompleted.length}/{context.habits.todayCompleted.length + context.habits.todayPending.length})
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap pl-5">
                  {context.habits.todayCompleted.map((h) => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded">
                      {h}
                    </span>
                  ))}
                  {context.habits.todayPending.slice(0, 4).map((h) => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-tertiary rounded">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time Tracking */}
            {(context.timeTracking.activeTimer || context.timeTracking.todayHours > 0) && (
              <div className="flex items-center gap-2">
                <span className="text-xs">⏱️</span>
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {context.timeTracking.activeTimer
                    ? `Tracking: ${context.timeTracking.activeTimer.description}`
                    : `${context.timeTracking.todayHours}h logged today`}
                </span>
              </div>
            )}

            {/* Top Streaks */}
            {context.habits.topStreaks.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                <span>🔥</span>
                <span>
                  Top streak: {context.habits.topStreaks[0].title} ({context.habits.topStreaks[0].streak} days)
                </span>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary text-center mt-auto pt-1 border-t border-border-light dark:border-border-dark">
          {cachedBriefing
            ? `Updated ${new Date(cachedBriefing.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
            : 'Generating...'}
        </div>
      </div>
    </BaseWidget>
  );
};
