/**
 * Activity Feed Widget
 *
 * Dashboard widget showing the last 5 activity items
 * with compact display and navigation to the full Activity Feed page.
 */

import React from 'react';
import { BaseWidget } from './BaseWidget';
import { useActivityStore } from '../../stores/useActivityStore';
import { useNavigate } from 'react-router-dom';
import { WidgetEmptyState } from '../../components/WidgetEmptyState';
import type { WidgetComponentProps } from './WidgetRegistry';
import type { ModuleType } from '../../stores/useActivityStore';

const MODULE_ICONS: Record<ModuleType, string> = {
  notes: '📝',
  tasks: '✅',
  calendar: '📅',
  docs: '📄',
  'time-tracking': '⏱️',
  habits: '🎯',
  links: '🔗',
  ai: '🤖',
  forms: '📋',
  diagrams: '🔷',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  completed: 'Completed',
  viewed: 'Viewed',
};

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export const ActivityFeedWidget: React.FC<WidgetComponentProps> = () => {
  const getActivities = useActivityStore((s) => s.getActivities);
  const navigate = useNavigate();

  const recentEvents = getActivities({ limit: 5 });

  return (
    <BaseWidget title="Activity Feed" icon="📊" subtitle="Recent activity">
      <div className="flex flex-col h-full min-h-[160px]">
        {recentEvents.length > 0 ? (
          <div className="space-y-1.5 mb-4">
            {recentEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate('/activity')}
                className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all"
              >
                <span className="text-sm flex-shrink-0">
                  {event.entityIcon || MODULE_ICONS[event.module]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                    {EVENT_TYPE_LABELS[event.type] || event.type} {event.entityTitle}
                  </div>
                </div>
                <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0">
                  {getRelativeTime(event.timestamp)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <WidgetEmptyState
            icon="📊"
            message="No activity yet"
            hint="Events will appear as you use NeumanOS"
          />
        )}
        <button
          onClick={() => navigate('/activity')}
          className="w-full mt-auto px-4 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth"
        >
          View All Activity →
        </button>
      </div>
    </BaseWidget>
  );
};
