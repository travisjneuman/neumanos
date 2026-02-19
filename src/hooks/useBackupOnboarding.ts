/**
 * useBackupOnboarding Hook
 *
 * Manages backup reminder modal state for returning users
 * - Check if browser supports File System Access API (Chrome/Edge/Brave only)
 * - Check if user has backup folder configured
 * - Check reminder preference (every session / 7 days / never)
 * - Calculate if modal should show
 *
 * NOTE: First-time users see backup options in OnboardingModal Step 4.
 * This hook is for returning users who skipped backup setup.
 */

import { useEffect, useState } from 'react';
import { useThemeStore } from '../stores/useThemeStore';
import { isFileSystemAccessSupported } from '../services/brainBackup';

export function useBackupOnboarding() {
  const backupPreferences = useThemeStore((state) => state.backupPreferences);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  // Use sessionStorage to persist hasChecked across page reloads within the same session
  const [hasChecked, setHasChecked] = useState(() => {
    return sessionStorage.getItem('backup-modal-checked') === 'true';
  });

  useEffect(() => {
    // Only check once per session (persists across page navigations)
    if (hasChecked) return;

    const checkShouldShow = () => {
      // CRITICAL: Don't show backup modal if browser doesn't support FSA
      // (Firefox, Safari, older browsers) - users can't use auto-save anyway
      if (!isFileSystemAccessSupported()) {
        markAsChecked();
        return false;
      }

      // Don't show if user already has backup configured
      if (backupPreferences.hasBackupFolder) {
        markAsChecked();
        return false;
      }

      // Check reminder preference
      const { reminderPreference, nextReminderDate } = backupPreferences;

      // Never show again
      if (reminderPreference === 'never') {
        markAsChecked();
        return false;
      }

      // Show every session
      if (reminderPreference === 'every-session') {
        markAsChecked();
        return true;
      }

      // Show in 7 days - check if date has passed
      if (reminderPreference === 'in-7-days' && nextReminderDate) {
        const now = new Date();
        const reminderDate = new Date(nextReminderDate);

        if (now >= reminderDate) {
          markAsChecked();
          return true;
        }
      }

      // Show monthly - check if 1st of month reminder date has passed
      if (reminderPreference === 'monthly' && nextReminderDate) {
        const now = new Date();
        const reminderDate = new Date(nextReminderDate);

        if (now >= reminderDate) {
          markAsChecked();
          return true;
        }
      }

      markAsChecked();
      return false;
    };

    const shouldShow = checkShouldShow();
    setShouldShowModal(shouldShow);
  }, [backupPreferences, hasChecked]);

  // Helper to mark as checked in both state and sessionStorage
  const markAsChecked = () => {
    sessionStorage.setItem('backup-modal-checked', 'true');
    setHasChecked(true);
  };

  return {
    shouldShowModal,
    dismissModal: () => setShouldShowModal(false),
  };
}
