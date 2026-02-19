import React from 'react';
import { useWidgetStore } from '../../stores/useWidgetStore';

/**
 * Widget Settings Section
 * Provides centralized configuration for all widget-specific settings.
 * Changes here sync bidirectionally with widget inline settings.
 */

const REDDIT_SUBREDDITS = [
  'programming',
  'webdev',
  'javascript',
  'typescript',
  'react',
  'python',
  'tech',
  'sysadmin',
  'devops',
  'coding',
  'learnprogramming',
  'gamedev',
  'rust',
  'golang',
  'csharp',
];

export const WidgetSettingsSection: React.FC = () => {
  const widgetSettings = useWidgetStore((s) => s.widgetSettings);
  const updateWidgetSettings = useWidgetStore((s) => s.updateWidgetSettings);

  // GitHub settings
  const githubUsername = widgetSettings.github?.username || '';

  // Pomodoro settings
  const pomodoroDuration = widgetSettings.pomodoro?.duration || 25;

  // Crypto settings
  const cryptoRefreshRate = widgetSettings.crypto?.refreshRate || 1;

  // Reddit settings
  const redditSubreddit = widgetSettings.reddit?.subreddit || 'programming';

  // Unsplash settings
  const unsplashCategory = widgetSettings.unsplash?.category || 'nature';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
          Widget Settings
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
          Configure individual widget preferences. Changes sync automatically with widgets on the Dashboard.
        </p>
      </div>

      {/* GitHub Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          GitHub Widget
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              GitHub Username <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={githubUsername}
              onChange={(e) => updateWidgetSettings('github', { username: e.target.value })}
              placeholder="Enter your GitHub username"
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Required for the GitHub widget to display your profile stats
            </p>
          </div>
        </div>
      </div>

      {/* Pomodoro Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Pomodoro Timer
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Work Duration (minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={pomodoroDuration}
                onChange={(e) => updateWidgetSettings('pomodoro', { duration: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg appearance-none cursor-pointer accent-accent-blue"
              />
              <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary w-12 text-right">
                {pomodoroDuration}m
              </span>
            </div>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Standard Pomodoro is 25 minutes. Adjust based on your focus preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Crypto Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Crypto Widget
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Refresh Rate (minutes)
            </label>
            <select
              value={cryptoRefreshRate}
              onChange={(e) => updateWidgetSettings('crypto', { refreshRate: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value={1}>1 minute (real-time)</option>
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              More frequent updates use more API calls
            </p>
          </div>
        </div>
      </div>

      {/* Reddit Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Reddit Widget
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Default Subreddit
            </label>
            <select
              value={redditSubreddit}
              onChange={(e) => updateWidgetSettings('reddit', { subreddit: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              {REDDIT_SUBREDDITS.map((sub) => (
                <option key={sub} value={sub}>
                  r/{sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Unsplash Widget */}
      <div className="bg-surface-light-elevated dark:bg-surface-dark rounded-lg p-4">
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Unsplash Widget
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Image Category
            </label>
            <select
              value={unsplashCategory}
              onChange={(e) => updateWidgetSettings('unsplash', { category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value="nature">Nature</option>
              <option value="architecture">Architecture</option>
              <option value="technology">Technology</option>
              <option value="travel">Travel</option>
              <option value="minimal">Minimal</option>
              <option value="abstract">Abstract</option>
              <option value="space">Space</option>
              <option value="ocean">Ocean</option>
              <option value="forest">Forest</option>
              <option value="city">City</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info about other widget settings */}
      <div className="bg-status-info/10 border border-status-info/20 rounded-lg p-4">
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <strong>Note:</strong> Some widgets (YouTube Channels, Twitch Streamers, Countdown Events, Tab Manager)
          have list-based settings that are managed directly within the widget on the Dashboard.
          Click the widget to access those settings.
        </p>
      </div>
    </div>
  );
};
