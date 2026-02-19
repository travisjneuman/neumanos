/**
 * Backup History Section Component
 *
 * Displays list of past backups with status, size, and type information.
 */

import React from 'react';
import { formatFileSize } from '../../services/brainBackup';
import type { BackupHistoryEntry } from '../../services/backupPreferences';

interface BackupHistorySectionProps {
  backupHistory: BackupHistoryEntry[];
}

export const BackupHistorySection: React.FC<BackupHistorySectionProps> = ({
  backupHistory,
}) => {
  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        Backup History
      </h2>

      {backupHistory.length === 0 ? (
        <p className="text-text-light-secondary dark:text-text-dark-secondary">No backups yet</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {backupHistory.map((entry) => {
            const statusClasses =
              entry.status === 'success'
                ? 'text-status-success-text dark:text-status-success-text-dark'
                : 'text-status-error-text dark:text-status-error-text-dark';
            const destinationLabel =
              entry.destination === 'google-drive'
                ? 'Google Drive'
                : entry.destination === 'local'
                  ? 'Local Folder'
                  : 'Download';
            const attemptsLabel =
              entry.attempts && entry.attempts > 1
                ? `${entry.attempts} attempts`
                : entry.attempts === 1
                  ? '1 attempt'
                  : undefined;
            const icon =
              entry.destination === 'google-drive'
                ? '☁️'
                : entry.type === 'auto'
                  ? '🔄'
                  : '📦';

            return (
              <div
                key={entry.id}
                className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-text-light-primary dark:text-text-dark-primary">{entry.filename}</p>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {new Date(entry.timestamp).toLocaleString()} • {formatFileSize(entry.size)}
                    {entry.compressed && ' • Compressed'} • {destinationLabel}
                  </p>
                  <p className={`text-sm ${statusClasses}`}>
                    {entry.status === 'success' ? 'Success' : 'Failed'}
                    {attemptsLabel ? ` • ${attemptsLabel}` : ''}
                  </p>
                  {entry.errorMessage && (
                    <p className="text-sm text-status-error-text dark:text-status-error-text-dark">
                      ⚠️ {entry.errorMessage}
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-2xl">{icon}</span>
                  <span className={`text-xs font-semibold ${statusClasses}`}>
                    {entry.status === 'success' ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
