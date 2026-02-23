import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';

/**
 * Automatic Time Tracking Utilities
 *
 * Detects context changes (page, task, note) and automatically creates
 * time tracking entries based on user activity.
 */

/**
 * Hook for detecting page context and updating automatic tracking
 */
export function useAutomaticPageTracking() {
  const location = useLocation();
  const updateContext = useTimeTrackingStore((s) => s.updateContext);
  const automaticTrackingEnabled = useTimeTrackingStore((s) => s.automaticTrackingEnabled);
  const autoStartThreshold = useTimeTrackingStore((s) => s.autoStartThreshold);
  const startAutomaticEntry = useTimeTrackingStore((s) => s.startAutomaticEntry);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!automaticTrackingEnabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Get page name from pathname
    const path = location.pathname;
    let pageName = 'Unknown';

    if (path === '/') pageName = 'Dashboard';
    else if (path.startsWith('/tasks')) pageName = 'Tasks';
    else if (path.startsWith('/notes')) pageName = 'Notes';
    else if (path.startsWith('/schedule')) pageName = 'Schedule';
    else if (path.startsWith('/diagrams')) pageName = 'Diagrams';
    else if (path.startsWith('/links')) pageName = 'Links';
    else if (path.startsWith('/automations')) pageName = 'Automations';
    else if (path.startsWith('/forms')) pageName = 'Forms';
    else if (path.startsWith('/settings')) pageName = 'Settings';
    else if (path.startsWith('/graph')) pageName = 'Graph View';

    // Update context immediately
    updateContext({
      type: 'page',
      id: path,
      name: pageName,
    });

    // Start automatic entry after threshold
    timeoutRef.current = setTimeout(() => {
      startAutomaticEntry();
    }, autoStartThreshold * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [location.pathname, automaticTrackingEnabled, autoStartThreshold, updateContext, startAutomaticEntry]);
}

/**
 * Hook for detecting task context (when viewing/editing a specific task)
 */
export function useAutomaticTaskTracking(taskId: string | null, taskName: string | null) {
  const updateContext = useTimeTrackingStore((s) => s.updateContext);
  const automaticTrackingEnabled = useTimeTrackingStore((s) => s.automaticTrackingEnabled);
  const autoStartThreshold = useTimeTrackingStore((s) => s.autoStartThreshold);
  const startAutomaticEntry = useTimeTrackingStore((s) => s.startAutomaticEntry);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!automaticTrackingEnabled || !taskId || !taskName) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update context immediately
    updateContext({
      type: 'task',
      id: taskId,
      name: taskName,
    });

    // Start automatic entry after threshold
    timeoutRef.current = setTimeout(() => {
      startAutomaticEntry();
    }, autoStartThreshold * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [taskId, taskName, automaticTrackingEnabled, autoStartThreshold, updateContext, startAutomaticEntry]);
}

/**
 * Hook for detecting note context (when viewing/editing a specific note)
 */
export function useAutomaticNoteTracking(noteId: string | null, noteTitle: string | null) {
  const updateContext = useTimeTrackingStore((s) => s.updateContext);
  const automaticTrackingEnabled = useTimeTrackingStore((s) => s.automaticTrackingEnabled);
  const autoStartThreshold = useTimeTrackingStore((s) => s.autoStartThreshold);
  const startAutomaticEntry = useTimeTrackingStore((s) => s.startAutomaticEntry);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!automaticTrackingEnabled || !noteId || !noteTitle) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update context immediately
    updateContext({
      type: 'note',
      id: noteId,
      name: noteTitle,
    });

    // Start automatic entry after threshold
    timeoutRef.current = setTimeout(() => {
      startAutomaticEntry();
    }, autoStartThreshold * 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [noteId, noteTitle, automaticTrackingEnabled, autoStartThreshold, updateContext, startAutomaticEntry]);
}

/**
 * Integration with idle detection
 */
export function useAutomaticIdleStop() {
  const automaticTrackingEnabled = useTimeTrackingStore((s) => s.automaticTrackingEnabled);
  const activeEntry = useTimeTrackingStore((s) => s.activeEntry);
  const stopTimer = useTimeTrackingStore((s) => s.stopTimer);

  return {
    onIdle: () => {
      // Stop automatic entries when user goes idle
      if (automaticTrackingEnabled && activeEntry && activeEntry.automatic) {
        stopTimer();
      }
    },
    onReturn: () => {
      // Optionally restart tracking when user returns
      // (currently disabled - user must manually restart)
    },
  };
}
