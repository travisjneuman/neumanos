/**
 * Timeline Field Editor Component
 *
 * Dual date picker for selecting a date range (start and end dates).
 * Validates that end date is >= start date.
 */

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import type { TimelineValue } from '../../types/customFields';

interface TimelineFieldEditorProps {
  value: TimelineValue | null;
  onChange: (value: TimelineValue) => void;
  className?: string;
}

export function TimelineFieldEditor({
  value,
  onChange,
  className = '',
}: TimelineFieldEditorProps) {
  const [startDate, setStartDate] = useState<string>(
    value?.startDate ? new Date(value.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState<string>(
    value?.endDate ? new Date(value.endDate).toISOString().split('T')[0] : ''
  );
  const [error, setError] = useState<string | null>(null);

  // Sync with external value changes
  useEffect(() => {
    if (value) {
      setStartDate(value.startDate ? new Date(value.startDate).toISOString().split('T')[0] : '');
      setEndDate(value.endDate ? new Date(value.endDate).toISOString().split('T')[0] : '');
    }
  }, [value]);

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);

    if (!newStartDate) {
      setError('Start date is required');
      return;
    }

    // Validate against end date
    if (endDate && new Date(newStartDate) > new Date(endDate)) {
      setError('Start date must be before or equal to end date');
      return;
    }

    setError(null);

    // Update value if both dates are set
    if (endDate) {
      onChange({
        startDate: new Date(newStartDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    setEndDate(newEndDate);

    if (!newEndDate) {
      setError('End date is required');
      return;
    }

    // Validate against start date
    if (startDate && new Date(newEndDate) < new Date(startDate)) {
      setError('End date must be after or equal to start date');
      return;
    }

    setError(null);

    // Update value if both dates are set
    if (startDate) {
      onChange({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(newEndDate).toISOString(),
      });
    }
  };

  // Calculate duration in days
  const duration =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1 // +1 to include both start and end dates
      : null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Start Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className={`w-full px-3 py-2 pl-9 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
                error
                  ? 'border-status-error dark:border-status-error'
                  : 'border-border-light dark:border-border-dark'
              } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
              }`}
              aria-label="Timeline start date"
              aria-invalid={error ? 'true' : 'false'}
            />
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary pointer-events-none" />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            End Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={startDate || undefined}
              className={`w-full px-3 py-2 pl-9 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
                error
                  ? 'border-status-error dark:border-status-error'
                  : 'border-border-light dark:border-border-dark'
              } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
                error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
              }`}
              aria-label="Timeline end date"
              aria-invalid={error ? 'true' : 'false'}
            />
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Duration Display */}
      {duration !== null && !error && (
        <div className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Duration: {duration} {duration === 1 ? 'day' : 'days'}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-xs text-status-error-text dark:text-status-error-text-dark">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Format timeline value for display
 */
export function formatTimelineValue(value: TimelineValue | null): string {
  if (!value) return '';

  const start = new Date(value.startDate);
  const end = new Date(value.endDate);

  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate duration
  const durationDays =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return `${startStr} - ${endStr} (${durationDays} ${durationDays === 1 ? 'day' : 'days'})`;
}

/**
 * Format timeline value for compact display (e.g., in cards)
 */
export function formatTimelineValueCompact(value: TimelineValue | null): string {
  if (!value) return '';

  const start = new Date(value.startDate);
  const end = new Date(value.endDate);

  const startStr = start.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
  });

  const endStr = end.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
  });

  return `${startStr} - ${endStr}`;
}
