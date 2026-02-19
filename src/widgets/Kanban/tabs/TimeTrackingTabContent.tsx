import React from 'react';
import type { TimeEntry } from '../../../types';

interface TimeTrackingTabContentProps {
  entries: TimeEntry[];
  totalSeconds: number;
  estimatedHours?: number;
  isTimerActive: boolean;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

/**
 * Time Tracking Tab Content
 * Displays timer controls and time entry history for a task.
 */
export const TimeTrackingTabContent: React.FC<TimeTrackingTabContentProps> = ({
  entries,
  totalSeconds,
  estimatedHours,
  isTimerActive,
  onStartTimer,
  onStopTimer,
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatTime = (seconds: number): string => {
    const hours = seconds / 3600;
    return hours < 0.1 ? '<0.1h' : `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-4">
      {/* Timer Controls */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Total Time: {formatTime(totalSeconds)}
            </h3>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {formatDuration(totalSeconds)}
            </p>
          </div>
          {isTimerActive ? (
            <button
              onClick={onStopTimer}
              className="px-4 py-2 bg-status-error text-white text-sm font-medium rounded-lg hover:bg-status-error/90 transition-colors flex items-center gap-2"
            >
              <span className="animate-pulse">⏱️</span>
              Stop Timer
            </button>
          ) : (
            <button
              onClick={onStartTimer}
              className="px-4 py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors flex items-center gap-2"
            >
              ▶️ Start Timer
            </button>
          )}
        </div>

        {/* Estimated Hours Comparison */}
        {estimatedHours && (
          <div className="pt-3 border-t border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-light-secondary dark:text-text-dark-secondary">
                Estimated: {estimatedHours}h
              </span>
              <span className={`font-medium ${
                totalSeconds / 3600 > estimatedHours
                  ? 'text-status-error'
                  : 'text-status-success'
              }`}>
                {totalSeconds / 3600 > estimatedHours
                  ? `Over by ${((totalSeconds / 3600) - estimatedHours).toFixed(1)}h`
                  : `${(estimatedHours - (totalSeconds / 3600)).toFixed(1)}h remaining`
                }
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 w-full bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  totalSeconds / 3600 > estimatedHours
                    ? 'bg-accent-red'
                    : 'bg-accent-blue'
                }`}
                style={{
                  width: `${Math.min(100, (totalSeconds / 3600 / estimatedHours) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Time Entries List */}
      <div>
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          Time Entries ({entries.length})
        </h4>
        {entries.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {entries.map((entry, index) => (
              <div
                key={entry.id || index}
                className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-3 border border-border-light dark:border-border-dark"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {entry.description}
                    </p>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                      {new Date(entry.startTime).toLocaleString()}
                      {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      !entry.endTime
                        ? 'text-accent-blue animate-pulse'
                        : 'text-text-light-primary dark:text-text-dark-primary'
                    }`}>
                      {formatTime(entry.duration)}
                    </p>
                    {!entry.endTime && (
                      <p className="text-xs text-accent-blue">Running...</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-text-light-secondary dark:text-text-dark-secondary text-xs">
            ⏱️ No time entries yet
          </div>
        )}
      </div>
    </div>
  );
};
