/**
 * Auto-Save Settings Component
 *
 * Configures auto-save to local file system:
 * - Directory selection (File System Access API)
 * - Filename customization
 * - Version count
 * - Manual save trigger
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  isFileSystemAccessSupported,
  requestAutoSaveDirectory,
  autoSave,
  getDirectoryHandle,
  formatFileSize,
} from '../../services/brainBackup';
import {
  loadPreferences,
  savePreferences,
  addHistoryEntry,
  type BackupPreferences,
} from '../../services/backupPreferences';
import { autoSaveManager } from '../../services/autoSave';
import { logger } from '../../services/logger';

const log = logger.module('AutoSaveSettings');

interface AutoSaveSettingsProps {
  onMessage: (message: { type: 'success' | 'error' | 'info' | 'warning'; text: string } | null) => void;
  onRefresh: () => void;
}

export const AutoSaveSettings: React.FC<AutoSaveSettingsProps> = ({
  onMessage,
  onRefresh,
}) => {
  const [preferences, setPreferences] = useState<BackupPreferences | null>(null);
  const [autoSaveDirectory, setAutoSaveDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  const [versionCount, setVersionCount] = useState(7);
  const [recentlySaved, setRecentlySaved] = useState<'autoSave' | null>(null);

  const loadData = useCallback(async () => {
    const prefs = await loadPreferences();
    setPreferences(prefs);

    // Initialize customization state
    const filename = prefs.customFilename || 'NeumanOS';
    const nameWithoutExt = filename.replace(/\.brain$/i, '');
    setCustomFilename(nameWithoutExt);
    setVersionCount(prefs.versionCount || 7);

    // Restore saved directory handle
    if (prefs.autoSaveEnabled) {
      try {
        const savedHandle = await getDirectoryHandle();
        if (savedHandle) {
          setAutoSaveDirectory(savedHandle);
        }
      } catch (error) {
        log.warn('Could not restore auto-save directory handle', { error });
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Restore directory handle on mount
  useEffect(() => {
    const restoreDirectoryHandle = async () => {
      try {
        const savedHandle = await getDirectoryHandle();
        if (savedHandle) {
          setAutoSaveDirectory(savedHandle);
        }
      } catch (error) {
        console.error('Failed to restore directory handle:', error);
      }
    };
    restoreDirectoryHandle();
  }, []);

  const handleSetupAutoSave = async () => {
    try {
      const dirHandle = await requestAutoSaveDirectory();
      setAutoSaveDirectory(dirHandle);

      // Enable auto-save with directory handle
      await autoSaveManager.enableLocal(dirHandle);

      await loadData();
      onRefresh();
      onMessage({ type: 'success', text: 'Auto-save enabled! Your data will be automatically saved to the selected folder.' });
    } catch (error) {
      onMessage({ type: 'error', text: `${error}` });
    }
  };

  const handleAutoSaveNow = async () => {
    if (!autoSaveDirectory) {
      onMessage({ type: 'error', text: 'Please configure auto-save directory first' });
      return;
    }

    try {
      onMessage({ type: 'info', text: 'Saving...' });
      const result = await autoSave(autoSaveDirectory);

      await addHistoryEntry({
        filename: result.filename,
        size: result.size,
        compressed: result.compressed,
        type: 'auto',
        destination: 'local',
        status: 'success',
      });

      await loadData();
      onRefresh();
      onMessage({ type: 'success', text: `Auto-saved: ${result.filename} (${formatFileSize(result.size)})` });
    } catch (error) {
      onMessage({ type: 'error', text: `Auto-save failed: ${error}` });
    }
  };

  const toggleAutoSave = async () => {
    if (!preferences) return;

    if (preferences.autoSaveEnabled) {
      // Disable auto-save
      await autoSaveManager.disableLocal();
      setAutoSaveDirectory(null);
      await loadData();
      onRefresh();
      onMessage({ type: 'info', text: 'Auto-save disabled' });

      setRecentlySaved('autoSave');
      setTimeout(() => setRecentlySaved(null), 2000);
    } else {
      // Enable auto-save - request directory
      await handleSetupAutoSave();
    }
  };

  const handleSaveCustomization = async () => {
    if (!preferences) return;

    if (!customFilename.trim()) {
      onMessage({ type: 'error', text: 'Filename cannot be empty' });
      return;
    }

    if (versionCount < 1 || versionCount > 100) {
      onMessage({ type: 'error', text: 'Version count must be between 1 and 100' });
      return;
    }

    try {
      const filenameWithExtension = `${customFilename.trim()}.brain`;

      await savePreferences({
        customFilename: filenameWithExtension,
        versionCount: versionCount,
      });

      await loadData();
      onRefresh();
      onMessage({ type: 'success', text: 'Auto-save preferences updated!' });
    } catch (error) {
      onMessage({ type: 'error', text: `Failed to save preferences: ${error}` });
    }
  };

  if (!preferences) {
    return null;
  }

  return (
    <>
      {/* Simple Auto-Save Card (for File System Access API browsers) */}
      {isFileSystemAccessSupported() && (
        <div className="bento-card p-6">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
            Auto-Save
          </h2>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
            Automatically save backups to a folder on your computer
          </p>

          {!autoSaveDirectory ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSetupAutoSave}
              className="w-full p-4 rounded-lg bg-surface-dark dark:bg-surface-dark-elevated text-white hover:bg-border-dark dark:hover:bg-border-dark transition-colors"
            >
              📁 Choose Auto-Save Folder
            </motion.button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent-green">
                <span>✅</span>
                <span>Auto-save folder configured</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAutoSaveNow}
                className="w-full p-4 rounded-lg bg-accent-green text-white hover:bg-accent-green-hover transition-colors"
              >
                💾 Save Now
              </motion.button>
            </div>
          )}
        </div>
      )}

      {/* Detailed Auto-Save Configuration */}
      <div className="bento-card p-6">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
          Auto-Save to File
        </h2>

        {!isFileSystemAccessSupported() ? (
          <div className="p-4 bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg">
            <p className="text-sm text-accent-yellow">
              <strong>⚠️ Not Supported in {navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'this browser'}</strong>
              <br />
              Auto-save to file requires a Chromium-based browser (Chrome, Edge, Brave, Arc, Opera, etc.).
              <br />
              Your data is still automatically saved to IndexedDB. You can manually export backups anytime.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <label className="flex items-center justify-between p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg cursor-pointer hover:bg-border-light dark:hover:bg-border-dark transition-colors">
              <div>
                <p className="font-medium text-text-light-primary dark:text-text-dark-primary">Enable Auto-Save</p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {preferences.autoSaveEnabled
                    ? 'Your data is automatically saved to the selected folder'
                    : 'Automatically save your data to a local file'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {recentlySaved === 'autoSave' && (
                  <span className="text-sm font-medium text-accent-green animate-fade-in">
                    ✓ Saved
                  </span>
                )}
                <input
                  type="checkbox"
                  checked={preferences.autoSaveEnabled}
                  onChange={toggleAutoSave}
                  className="w-6 h-6 rounded"
                />
              </div>
            </label>

            {/* Auto-Save Status */}
            {preferences.autoSaveEnabled && (
              <div className="p-4 bg-accent-green/10 border border-accent-green/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <p className="font-semibold text-accent-green mb-1">
                      Auto-Save Enabled
                    </p>
                    <p className="text-sm text-accent-green">
                      Your data is automatically backed up to your selected folder whenever changes are made.
                      {preferences.lastAutoSave && (
                        <>
                          <br />
                          <strong>Last auto-save:</strong> {new Date(preferences.lastAutoSave).toLocaleString()}
                        </>
                      )}
                    </p>
                    {preferences.customFilename && (
                      <p className="text-sm text-accent-green mt-2">
                        <strong>Filename:</strong> {preferences.customFilename}
                        <br />
                        <strong>Versions kept:</strong> {preferences.versionCount || 7}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Customization Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Customize Auto-Save
              </h3>

              {/* Filename Input */}
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Backup Filename
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder="Neuman"
                    className="flex-1 px-4 py-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                  />
                  <span className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">.brain</span>
                </div>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Enter the filename (e.g., "Neuman", "MyBackup"). The .brain extension is automatically added.
                </p>
              </div>

              {/* Version Count Input */}
              <div>
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                  Versions to Keep
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={versionCount}
                  onChange={(e) => setVersionCount(parseInt(e.target.value) || 7)}
                  className="w-full px-4 py-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Number of timestamped backups to keep in the hidden .neuman-backups folder (1-100)
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveCustomization}
                className="w-full px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium shadow-soft hover:shadow-medium transition-all duration-200"
              >
                💾 Save Preferences
              </button>
            </div>

            {/* Manual Save Now Button */}
            {preferences.autoSaveEnabled && (
              <button
                onClick={handleAutoSaveNow}
                className="w-full px-4 py-3 bg-accent-secondary hover:bg-accent-secondary-hover text-white rounded-lg font-medium shadow-soft hover:shadow-medium transition-all duration-200"
              >
                💾 Save Now (Manual Trigger)
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
