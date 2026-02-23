import React from 'react';
import type { WhenTag } from '../../types';

interface WhenTagPickerProps {
  value?: WhenTag;
  onChange: (tag: WhenTag | undefined) => void;
  compact?: boolean;
}

const WHEN_TAGS: { value: WhenTag; label: string; icon: string; description: string }[] = [
  { value: 'today', label: 'Today', icon: '☀️', description: 'Do it today' },
  { value: 'evening', label: 'This Evening', icon: '🌙', description: 'For tonight' },
  { value: 'upcoming', label: 'Upcoming', icon: '📅', description: 'Next few days' },
  { value: 'anytime', label: 'Anytime', icon: '📌', description: 'No time pressure' },
  { value: 'someday', label: 'Someday', icon: '💭', description: 'Maybe later' },
];

export const WhenTagPicker: React.FC<WhenTagPickerProps> = ({ value, onChange, compact = false }) => {
  if (compact) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value as WhenTag || undefined)}
        className="px-2 py-1 text-xs border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
      >
        <option value="">No when tag</option>
        {WHEN_TAGS.map((t) => (
          <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="when-tag-picker space-y-1">
      {WHEN_TAGS.map((tag) => {
        const isActive = value === tag.value;
        return (
          <button
            key={tag.value}
            onClick={() => onChange(isActive ? undefined : tag.value)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
              isActive
                ? 'bg-accent-blue/10 text-accent-blue font-medium border border-accent-blue/30'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated border border-transparent'
            }`}
          >
            <span>{tag.icon}</span>
            <div className="flex-1">
              <span className="block">{tag.label}</span>
              {!compact && (
                <span className="block text-xs opacity-60">{tag.description}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

/** Inline badge for when tag display on cards */
export const WhenTagBadge: React.FC<{ tag: WhenTag }> = ({ tag }) => {
  const config = WHEN_TAGS.find((t) => t.value === tag);
  if (!config) return null;

  // Evening tasks get special treatment after 6pm
  const isEvening = tag === 'evening';
  const isAfter6pm = new Date().getHours() >= 18;
  const highlight = isEvening && isAfter6pm;

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded ${
        highlight
          ? 'bg-accent-purple/20 text-accent-purple font-medium animate-pulse'
          : tag === 'someday'
          ? 'bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary opacity-60'
          : 'bg-accent-blue/10 text-accent-blue'
      }`}
      title={config.description}
    >
      {config.icon} {config.label}
    </span>
  );
};
