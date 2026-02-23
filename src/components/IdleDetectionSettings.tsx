import { useState } from 'react';
import { Eye, Clock, Info } from 'lucide-react';
import { getIdleDetectionSettings, saveIdleDetectionSettings } from '../hooks/useIdleDetection';

/**
 * Idle Detection Settings Component
 *
 * Configure idle detection threshold and behavior for time tracking.
 * Shows a prompt when user returns from idle to keep/discard idle time.
 */
export function IdleDetectionSettings() {
  const [settings, setSettings] = useState(() => getIdleDetectionSettings());

  const handleEnabledChange = (enabled: boolean) => {
    const updated = { ...settings, enabled };
    setSettings(updated);
    saveIdleDetectionSettings(updated);
  };

  const handleThresholdChange = (minutes: number) => {
    const updated = { ...settings, thresholdMinutes: minutes };
    setSettings(updated);
    saveIdleDetectionSettings(updated);
  };

  const THRESHOLD_OPTIONS = [
    { value: 3, label: '3 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Eye className="w-6 h-6 text-accent-primary" />
        <div>
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Idle Detection
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Detect when you step away and handle idle time in running timers
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
        <Info className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <p>
            When enabled and a timer is running, NeumanOS will track mouse and
            keyboard activity. After the configured idle period, you will see a
            prompt asking whether to keep or discard the idle time.
          </p>
        </div>
      </div>

      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
        <div>
          <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
            Enable Idle Detection
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Monitor activity when a timer is running
          </p>
        </div>
        <button
          onClick={() => handleEnabledChange(!settings.enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enabled
              ? 'bg-accent-primary'
              : 'bg-surface-light-tertiary dark:bg-surface-dark-tertiary'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Idle Threshold */}
      <div className="p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
          <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
            Idle Threshold
          </p>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
          How long without activity before showing the idle prompt
        </p>
        <div className="space-y-2">
          {THRESHOLD_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                settings.thresholdMinutes === option.value
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              } ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="radio"
                name="idleThreshold"
                value={option.value}
                checked={settings.thresholdMinutes === option.value}
                onChange={() => handleThresholdChange(option.value)}
                disabled={!settings.enabled}
                className="w-4 h-4 text-accent-primary border-border-light dark:border-border-dark focus:ring-2 focus:ring-accent-primary"
              />
              <span
                className={`text-sm font-medium ${
                  settings.thresholdMinutes === option.value
                    ? 'text-accent-primary'
                    : 'text-text-light-primary dark:text-text-dark-primary'
                }`}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      {settings.enabled && (
        <div className="p-4 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <p className="text-sm font-medium text-accent-green mb-1">
            Idle detection is active
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            When a timer is running and no activity is detected for{' '}
            {settings.thresholdMinutes} minutes, you will be prompted to handle
            the idle time.
          </p>
        </div>
      )}
    </div>
  );
}
