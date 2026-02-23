/**
 * Default Views Settings Section
 *
 * Configure the default view for Tasks, Calendar, and Notes modules.
 */

import React from 'react';
import { Layout } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { DefaultViews } from '../../stores/useSettingsStore';

const TASK_VIEWS: { value: DefaultViews['tasks']; label: string }[] = [
  { value: 'board', label: 'Board (Kanban)' },
  { value: 'list', label: 'List' },
  { value: 'eisenhower', label: 'Eisenhower Matrix' },
  { value: 'gantt', label: 'Gantt Chart' },
];

const CALENDAR_VIEWS: { value: DefaultViews['calendar']; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

const NOTES_VIEWS: { value: DefaultViews['notes']; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
];

export const DefaultViewsSection: React.FC = () => {
  const defaultViews = useSettingsStore((s) => s.defaultViews);
  const setDefaultViews = useSettingsStore((s) => s.setDefaultViews);

  return (
    <div className="bento-card p-6">
      <div className="flex items-center gap-3 mb-1">
        <Layout className="w-5 h-5 text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          Default Views
        </h2>
      </div>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        Set the default view when opening each module.
      </p>

      <div className="space-y-4">
        {/* Tasks Default View */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Tasks
          </label>
          <select
            value={defaultViews?.tasks ?? 'board'}
            onChange={(e) => setDefaultViews({ tasks: e.target.value as DefaultViews['tasks'] })}
            className="w-full sm:w-64 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {TASK_VIEWS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Calendar Default View */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Calendar
          </label>
          <select
            value={defaultViews?.calendar ?? 'month'}
            onChange={(e) => setDefaultViews({ calendar: e.target.value as DefaultViews['calendar'] })}
            className="w-full sm:w-64 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {CALENDAR_VIEWS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Notes Default View */}
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Notes
          </label>
          <select
            value={defaultViews?.notes ?? 'list'}
            onChange={(e) => setDefaultViews({ notes: e.target.value as DefaultViews['notes'] })}
            className="w-full sm:w-64 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {NOTES_VIEWS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
