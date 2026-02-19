/**
 * Account Settings Component
 *
 * User profile settings (display name, email).
 * Data is persisted locally in IndexedDB via useSettingsStore.
 */

import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const AccountSettings: React.FC = () => {
  const displayName = useSettingsStore((s) => s.displayName);
  const email = useSettingsStore((s) => s.email);
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const setEmail = useSettingsStore((s) => s.setEmail);

  return (
    <div id="account" className="bento-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">👤</span>
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          Account Settings
        </h2>
      </div>

      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            placeholder="Enter your name"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Your name for personalization (e.g., default task assignee).
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            placeholder="email@example.com"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Optional. May be used for notifications and account recovery (future feature).
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 p-3 bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info-border dark:border-status-info-border-dark rounded-lg">
          <p className="text-xs text-status-info-text dark:text-status-info-text-dark">
            <strong>🔒 Privacy:</strong> All account data is stored locally on your device. Nothing is sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
};
