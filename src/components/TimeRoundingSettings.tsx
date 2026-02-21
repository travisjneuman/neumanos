import { Clock, Info } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { formatDuration, roundDuration } from '../utils/timeFormatters';

const ROUNDING_OPTIONS: { value: 0 | 5 | 15 | 30; label: string }[] = [
  { value: 0, label: 'Exact (no rounding)' },
  { value: 5, label: 'Nearest 5 minutes' },
  { value: 15, label: 'Nearest 15 minutes' },
  { value: 30, label: 'Nearest 30 minutes' },
];

// Example durations to show rounding effect
const EXAMPLE_SECONDS = [
  7 * 60 + 23,   // 7m 23s
  23 * 60 + 12,  // 23m 12s
  67 * 60 + 45,  // 1h 07m 45s
  142 * 60 + 30, // 2h 22m 30s
];

/**
 * TimeRoundingSettings Component
 *
 * Configure time rounding rules for time entries.
 * Shows a preview of how rounding affects different durations.
 */
export function TimeRoundingSettings() {
  const roundingMinutes = useTimeTrackingStore((s) => s.roundingMinutes);

  const handleRoundingChange = (value: number) => {
    useTimeTrackingStore.setState({ roundingMinutes: value as 0 | 5 | 15 | 30 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6 text-accent-primary" />
        <div>
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Time Rounding
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Configure how time durations are rounded when stopping timers
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
        <Info className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <p>
            Rounding is applied when you stop a timer or export entries.
            The actual start and end times are preserved, only the reported
            duration is rounded.
          </p>
        </div>
      </div>

      {/* Rounding Options */}
      <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
        <p className="font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
          Rounding Interval
        </p>
        <div className="space-y-2">
          {ROUNDING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                roundingMinutes === option.value
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
            >
              <input
                type="radio"
                name="rounding"
                value={option.value}
                checked={roundingMinutes === option.value}
                onChange={() => handleRoundingChange(option.value)}
                className="w-4 h-4 text-accent-primary border-border-light dark:border-border-dark focus:ring-2 focus:ring-accent-primary"
              />
              <span className={`text-sm font-medium ${
                roundingMinutes === option.value
                  ? 'text-accent-primary'
                  : 'text-text-light-primary dark:text-text-dark-primary'
              }`}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rounding Preview */}
      <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
        <p className="font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
          Rounding Preview
        </p>
        <div className="overflow-hidden rounded-lg border border-border-light dark:border-border-dark">
          <table className="w-full">
            <thead className="bg-surface-light-elevated dark:bg-surface-dark-elevated">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase">
                  Actual
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase">
                  Rounded
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {EXAMPLE_SECONDS.map((seconds) => {
                const rounded = roundDuration(seconds, roundingMinutes);
                const diff = rounded - seconds;
                return (
                  <tr key={seconds}>
                    <td className="px-4 py-2 text-sm font-mono text-text-light-primary dark:text-text-dark-primary">
                      {formatDuration(seconds, { showSeconds: true })}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono font-semibold text-accent-primary">
                      {formatDuration(rounded, { showSeconds: false })}
                    </td>
                    <td className={`px-4 py-2 text-sm font-mono ${
                      diff === 0
                        ? 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        : diff > 0
                        ? 'text-status-success-text'
                        : 'text-status-error'
                    }`}>
                      {diff === 0 ? 'No change' : `${diff > 0 ? '+' : ''}${Math.floor(diff / 60)}m ${Math.abs(diff % 60)}s`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
