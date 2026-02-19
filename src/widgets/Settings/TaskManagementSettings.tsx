/**
 * Task Management Settings Component
 *
 * Settings for task behavior and dependencies:
 * - Auto-shift dependent tasks
 * - WIP (Work In Progress) limits enforcement
 */

import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const TaskManagementSettings: React.FC = () => {
  // Task Management Settings
  const autoShiftDependentTasks = useSettingsStore((state) => state.autoShiftDependentTasks);
  const setAutoShiftDependentTasks = useSettingsStore((state) => state.setAutoShiftDependentTasks);
  const enforceWipLimits = useSettingsStore((state) => state.enforceWipLimits);
  const setEnforceWipLimits = useSettingsStore((state) => state.setEnforceWipLimits);

  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        Task Management
      </h2>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        Configure how tasks and dependencies behave in your projects.
      </p>

      <div className="space-y-4">
        {/* Auto-shift dependent tasks */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="auto-shift-tasks"
            checked={autoShiftDependentTasks}
            onChange={(e) => setAutoShiftDependentTasks(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="auto-shift-tasks"
              className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer"
            >
              Automatically shift dependent tasks when dates change
            </label>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              When you move a task's dates, dependent tasks will be automatically shifted based on their dependency types (Finish-to-Start, Start-to-Start, etc.). A confirmation dialog will be shown before applying shifts.
            </p>
          </div>
        </div>

        {/* Enforce WIP Limits */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="enforce-wip-limits"
            checked={enforceWipLimits}
            onChange={(e) => setEnforceWipLimits(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-accent-primary focus:ring-2 focus:ring-accent-primary cursor-pointer"
          />
          <div className="flex-1">
            <label
              htmlFor="enforce-wip-limits"
              className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer"
            >
              Enforce WIP limits strictly (prevent moves into full columns)
            </label>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              When enabled, you cannot drag tasks into columns that have reached their WIP (Work In Progress) limit. When disabled (default), warnings are shown but moves are allowed. Set WIP limits in Kanban board via column settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
