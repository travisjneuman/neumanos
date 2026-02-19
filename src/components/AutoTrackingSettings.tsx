import { useState } from 'react';
import { Activity, Clock, Info } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';

/**
 * Automatic Tracking Settings Component
 *
 * UI for configuring automatic time tracking behavior.
 */

export function AutoTrackingSettings() {
  const autoTrackingSettings = useSettingsStore((s) => s.autoTrackingSettings);
  const setAutoTrackingSettings = useSettingsStore((s) => s.setAutoTrackingSettings);
  const setAutomaticTracking = useTimeTrackingStore((s) => s.setAutomaticTracking);
  const setAutoStartThreshold = useTimeTrackingStore((s) => s.setAutoStartThreshold);

  const [enabled, setEnabled] = useState(autoTrackingSettings.enabled);
  const [threshold, setThreshold] = useState(autoTrackingSettings.autoStartThreshold);
  const [stopOnIdle, setStopOnIdle] = useState(autoTrackingSettings.autoStopOnIdle);

  const handleEnabledChange = (value: boolean) => {
    setEnabled(value);
    setAutoTrackingSettings({ enabled: value });
    setAutomaticTracking(value);
  };

  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    setAutoTrackingSettings({ autoStartThreshold: value });
    setAutoStartThreshold(value);
  };

  const handleStopOnIdleChange = (value: boolean) => {
    setStopOnIdle(value);
    setAutoTrackingSettings({ autoStopOnIdle: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-accent-primary" />
        <div>
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Automatic Time Tracking
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Track time automatically based on your activity
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
        <Info className="w-5 h-5 text-accent-blue dark:text-accent-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <p className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            How it works
          </p>
          <p>
            When enabled, NeumanOS will automatically start tracking time when you:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Stay on a page for the threshold duration</li>
            <li>Focus on a specific task or note</li>
            <li>Keep working without going idle</li>
          </ul>
          <p className="mt-2">
            Entries are tagged with "Automatic" so you can easily identify them.
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <div>
            <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
              Enable Automatic Tracking
            </p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Start tracking time automatically when you work
            </p>
          </div>
          <button
            onClick={() => handleEnabledChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled
                ? 'bg-accent-primary'
                : 'bg-surface-light-tertiary dark:bg-surface-dark-tertiary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auto-Start Threshold */}
        <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                Auto-Start Threshold
              </p>
            </div>
            <span className="text-sm font-mono text-accent-primary">
              {threshold}s
            </span>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
            How long to stay in a context before automatically starting a timer
          </p>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={threshold}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
            disabled={!enabled}
            className="w-full h-2 bg-surface-light-tertiary dark:bg-surface-dark-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
            <span>10s (Immediate)</span>
            <span>60s (Balanced)</span>
            <span>120s (Patient)</span>
          </div>
        </div>

        {/* Auto-Stop on Idle */}
        <div className="flex items-center justify-between p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <div>
            <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
              Stop on Idle
            </p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Automatically stop tracking when you go idle
            </p>
          </div>
          <button
            onClick={() => handleStopOnIdleChange(!stopOnIdle)}
            disabled={!enabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              stopOnIdle
                ? 'bg-accent-primary'
                : 'bg-surface-light-tertiary dark:bg-surface-dark-tertiary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                stopOnIdle ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Preview */}
      {enabled && (
        <div className="p-4 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <p className="text-sm font-medium text-accent-green dark:text-accent-green mb-2">
            ✓ Automatic tracking is active
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Stay on a page or task for {threshold} seconds to automatically start tracking.
            {stopOnIdle && ' Timer will stop when you go idle.'}
          </p>
        </div>
      )}
    </div>
  );
}
