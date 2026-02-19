/**
 * Backup Options Section Component
 *
 * Toggle options for backup behavior:
 * - Compression enable/disable
 * - Reminder enable/disable
 */

import React, { useState } from 'react';
import {
  savePreferences,
  type BackupPreferences,
} from '../../services/backupPreferences';

interface BackupOptionsSectionProps {
  preferences: BackupPreferences;
  onRefresh: () => void;
  onMessage: (message: { type: 'success' | 'error' | 'info' | 'warning'; text: string } | null) => void;
}

export const BackupOptionsSection: React.FC<BackupOptionsSectionProps> = ({
  preferences,
  onRefresh,
  onMessage,
}) => {
  const [recentlySaved, setRecentlySaved] = useState<'compression' | 'reminder' | null>(null);

  const toggleCompression = async () => {
    const newValue = !preferences.compressionEnabled;
    await savePreferences({ compressionEnabled: newValue });
    onRefresh();
    onMessage({ type: 'info', text: `Compression ${newValue ? 'enabled' : 'disabled'}` });

    setRecentlySaved('compression');
    setTimeout(() => setRecentlySaved(null), 2000);
  };

  const toggleReminder = async () => {
    const newValue = !preferences.reminderEnabled;
    await savePreferences({ reminderEnabled: newValue });
    onRefresh();
    onMessage({ type: 'info', text: `Backup reminders ${newValue ? 'enabled' : 'disabled'}` });

    setRecentlySaved('reminder');
    setTimeout(() => setRecentlySaved(null), 2000);
  };

  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        Backup Options
      </h2>

      <div className="space-y-4">
        {/* Compression */}
        <label className="flex items-center justify-between p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg cursor-pointer hover:bg-border-light dark:hover:bg-border-dark transition-colors">
          <div>
            <p className="font-medium text-text-light-primary dark:text-text-dark-primary">Enable Compression</p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Reduces file size by ~70% (recommended)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {recentlySaved === 'compression' && (
              <span className="text-sm font-medium text-status-success-text dark:text-status-success-text-dark animate-fade-in">
                ✓ Saved
              </span>
            )}
            <input
              type="checkbox"
              checked={preferences.compressionEnabled}
              onChange={toggleCompression}
              className="w-6 h-6 rounded"
            />
          </div>
        </label>

        {/* Reminders */}
        <label className="flex items-center justify-between p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg cursor-pointer hover:bg-border-light dark:hover:bg-border-dark transition-colors">
          <div>
            <p className="font-medium text-text-light-primary dark:text-text-dark-primary">Backup Reminders</p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Remind me every {preferences.reminderDays} days
            </p>
          </div>
          <div className="flex items-center gap-2">
            {recentlySaved === 'reminder' && (
              <span className="text-sm font-medium text-status-success-text dark:text-status-success-text-dark animate-fade-in">
                ✓ Saved
              </span>
            )}
            <input
              type="checkbox"
              checked={preferences.reminderEnabled}
              onChange={toggleReminder}
              className="w-6 h-6 rounded"
            />
          </div>
        </label>
      </div>
    </div>
  );
};
