/**
 * Widget Empty State
 *
 * Compact empty state component designed for dashboard widgets.
 * Provides consistent, beautiful empty states with an icon, message,
 * and optional action button.
 */

import React from 'react';

interface WidgetEmptyStateProps {
  /** Emoji icon to display */
  icon: string;
  /** Short message describing the empty state */
  message: string;
  /** Optional hint or instruction text */
  hint?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const WidgetEmptyState: React.FC<WidgetEmptyStateProps> = ({
  icon,
  message,
  hint,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
      <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-surface-light-elevated dark:bg-surface-dark mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
        {message}
      </p>
      {hint && (
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-3 max-w-[200px]">
          {hint}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-1.5 text-xs font-medium bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button transition-all duration-standard ease-smooth"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
