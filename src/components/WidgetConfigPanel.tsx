/**
 * Widget Configuration Panels
 *
 * Renders widget-specific settings forms based on widget ID.
 * Used inside WidgetSettingsModal for per-widget configuration.
 */

import React from 'react';
import { useWidgetStore, type WidgetSettings } from '../stores/useWidgetStore';

interface WidgetConfigPanelProps {
  widgetId: string;
}

/** Refresh interval options shared across refreshable widgets */
const REFRESH_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Manual only', value: 0 },
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
];

/** Reusable select for refresh interval */
const RefreshIntervalSelect: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
      Auto-Refresh Interval
    </label>
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-3 py-2 text-sm rounded-button bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-standard ease-smooth"
    >
      {REFRESH_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

/** Reusable text input field */
const SettingsInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}> = ({ label, value, onChange, placeholder, hint }) => (
  <div>
    <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-button bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-standard ease-smooth"
    />
    {hint && (
      <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-1">
        {hint}
      </p>
    )}
  </div>
);

/** Reusable number input field */
const SettingsNumber: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}> = ({ label, value, onChange, min = 1, max = 50, hint }) => (
  <div>
    <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
      {label}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      className="w-full px-3 py-2 text-sm rounded-button bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-standard ease-smooth"
    />
    {hint && (
      <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-1">
        {hint}
      </p>
    )}
  </div>
);

/** Configuration panels for each widget type */
const WIDGET_CONFIGS: Record<string, React.FC<{
  settings: WidgetSettings;
  update: (patch: Partial<WidgetSettings>) => void;
}>> = {
  hackernews: ({ settings, update }) => (
    <div className="space-y-3">
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 15}
        onChange={(v) => update({ refreshRate: v })}
      />
      <SettingsNumber
        label="Stories to Show"
        value={settings.maxItems ?? 5}
        onChange={(v) => update({ maxItems: v })}
        min={3}
        max={15}
        hint="Number of top stories displayed"
      />
    </div>
  ),

  crypto: ({ settings, update }) => (
    <div className="space-y-3">
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 1}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),

  reddit: ({ settings, update }) => (
    <div className="space-y-3">
      <SettingsInput
        label="Subreddit"
        value={settings.subreddit ?? 'programming'}
        onChange={(v) => update({ subreddit: v })}
        placeholder="programming"
        hint="Subreddit name without r/"
      />
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 15}
        onChange={(v) => update({ refreshRate: v })}
      />
      <SettingsNumber
        label="Posts to Show"
        value={settings.maxItems ?? 5}
        onChange={(v) => update({ maxItems: v })}
        min={3}
        max={15}
      />
    </div>
  ),

  github: ({ settings, update }) => (
    <div className="space-y-3">
      <SettingsInput
        label="GitHub Username"
        value={settings.username ?? ''}
        onChange={(v) => update({ username: v })}
        placeholder="octocat"
      />
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),

  quote: ({ settings, update }) => (
    <div className="space-y-3">
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),

  unsplash: ({ settings, update }) => (
    <div className="space-y-3">
      <SettingsInput
        label="Photo Category"
        value={settings.category ?? 'nature'}
        onChange={(v) => update({ category: v })}
        placeholder="nature, architecture, travel..."
      />
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),

  pomodoro: ({ settings, update }) => (
    <div className="space-y-3">
      <SettingsNumber
        label="Focus Duration (minutes)"
        value={settings.duration ?? 25}
        onChange={(v) => update({ duration: v })}
        min={5}
        max={90}
        hint="Typical: 25 min (Pomodoro) or 50 min (deep work)"
      />
    </div>
  ),

  devto: ({ settings, update }) => (
    <div className="space-y-3">
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 30}
        onChange={(v) => update({ refreshRate: v })}
      />
      <SettingsNumber
        label="Articles to Show"
        value={settings.maxItems ?? 5}
        onChange={(v) => update({ maxItems: v })}
        min={3}
        max={15}
      />
    </div>
  ),

  worldclock: ({ settings, update }) => (
    <div className="space-y-3">
      <SettingsInput
        label="Timezones"
        value={(settings.timezones ?? []).join(', ')}
        onChange={(v) => update({ timezones: v.split(',').map((s) => s.trim()).filter(Boolean) })}
        placeholder="America/New_York, Europe/London, Asia/Tokyo"
        hint="Comma-separated timezone identifiers"
      />
    </div>
  ),

  currency: ({ settings, update }) => (
    <div className="space-y-3">
      <SettingsInput
        label="Base Currency"
        value={settings.baseCurrency ?? 'USD'}
        onChange={(v) => update({ baseCurrency: v.toUpperCase() })}
        placeholder="USD"
      />
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),

  weathermap: ({ settings, update }) => (
    <div className="space-y-3">
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),

  stockmarket: ({ settings, update }) => (
    <div className="space-y-3">
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),

  ainews: ({ settings, update }) => (
    <div className="space-y-3">
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
      <SettingsNumber
        label="Papers to Show"
        value={settings.maxItems ?? 5}
        onChange={(v) => update({ maxItems: v })}
        min={3}
        max={10}
      />
    </div>
  ),

  packagestats: ({ settings, update }) => (
    <div className="space-y-3">
      <SettingsInput
        label="NPM Packages"
        value={(settings.packageNames ?? []).join(', ')}
        onChange={(v) => update({ packageNames: v.split(',').map((s) => s.trim()).filter(Boolean) })}
        placeholder="react, vue, svelte"
        hint="Comma-separated package names"
      />
      <RefreshIntervalSelect
        value={settings.refreshRate ?? 60}
        onChange={(v) => update({ refreshRate: v })}
      />
    </div>
  ),
};

/** Widgets that support refresh interval but have no other settings */
const REFRESH_ONLY_WIDGETS = new Set([
  'facts', 'joke', 'wikipedia', 'bored', 'wordofday',
  'ipinfo', 'airquality', 'githubtrending', 'awesomelists', 'sports',
]);

export const WidgetConfigPanel: React.FC<WidgetConfigPanelProps> = ({ widgetId }) => {
  // Strip instance suffix for multi-instance widgets (e.g., "github-1" -> "github")
  const baseType = widgetId.replace(/-\d+$/, '');

  const settings = useWidgetStore((state) => state.getWidgetSettings(widgetId));
  const updateSettings = useWidgetStore((state) => state.updateWidgetSettings);

  const handleUpdate = (patch: Partial<WidgetSettings>) => {
    updateSettings(widgetId, patch);
  };

  // Check for dedicated config panel
  const ConfigComponent = WIDGET_CONFIGS[baseType];
  if (ConfigComponent) {
    return <ConfigComponent settings={settings} update={handleUpdate} />;
  }

  // Fallback: refresh-only widgets
  if (REFRESH_ONLY_WIDGETS.has(baseType)) {
    return (
      <div className="space-y-3">
        <RefreshIntervalSelect
          value={settings.refreshRate ?? 60}
          onChange={(v) => handleUpdate({ refreshRate: v })}
        />
      </div>
    );
  }

  // Widgets with no configurable settings
  return (
    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
      This widget has no additional settings.
    </p>
  );
};
