import React from 'react';
import type { ActivityLogEntry } from '../../../types';

interface ActivityTabContentProps {
  activityLog: ActivityLogEntry[] | undefined;
}

/**
 * Activity Tab Content
 * Displays the activity log timeline for a task.
 * Read-only view - no state management needed.
 */
export const ActivityTabContent: React.FC<ActivityTabContentProps> = ({
  activityLog,
}) => {
  if (!activityLog || activityLog.length === 0) {
    return (
      <div className="text-center py-2 text-text-light-secondary dark:text-text-dark-secondary text-xs">
        📋 No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {activityLog
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((entry) => (
          <div key={entry.id} className="flex gap-3 items-start">
            <div className="w-2 h-2 mt-2 rounded-full bg-accent-blue flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                {entry.action === 'created' && 'Created task'}
                {entry.action === 'updated' && entry.field && `Updated ${entry.field}`}
                {entry.action === 'moved' && 'Moved to different column'}
                {entry.action === 'commented' && 'Added comment'}
                {entry.action === 'checklist_updated' && 'Updated checklist'}
                {entry.oldValue && entry.newValue && (
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">
                    {' '}from "{entry.oldValue}" to "{entry.newValue}"
                  </span>
                )}
              </p>
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
    </div>
  );
};
