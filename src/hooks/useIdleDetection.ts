import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Idle Detection Hook for Time Tracking
 *
 * Detects when user becomes idle and provides callbacks for handling
 * idle time in time tracking. Privacy-first approach using only:
 * - Mouse movement
 * - Keyboard input
 * - Page visibility
 *
 * No screen capture, no activity monitoring beyond basic events.
 */

export interface IdleDetectionConfig {
  /**
   * Idle threshold in milliseconds
   * Default: 5 minutes (300000ms)
   */
  threshold: number;

  /**
   * Whether idle detection is enabled
   * Default: false
   */
  enabled: boolean;

  /**
   * Callback when user becomes idle
   */
  onIdle?: (idleTime: number) => void;

  /**
   * Callback when user returns from idle
   */
  onReturn?: (idleTime: number) => void;
}

export interface IdleDetectionState {
  /**
   * Whether user is currently idle
   */
  isIdle: boolean;

  /**
   * Timestamp when user went idle (null if not idle)
   */
  idleSince: number | null;

  /**
   * Current idle duration in milliseconds
   */
  idleDuration: number;

  /**
   * Last activity timestamp
   */
  lastActivity: number;
}

const DEFAULT_THRESHOLD = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for detecting user idle state
 */
export function useIdleDetection(config: IdleDetectionConfig): IdleDetectionState {
  const { threshold = DEFAULT_THRESHOLD, enabled = false, onIdle, onReturn } = config;

  const [isIdle, setIsIdle] = useState(false);
  const [idleSince, setIdleSince] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);
  const onIdleCallbackRef = useRef(onIdle);
  const onReturnCallbackRef = useRef(onReturn);

  // Update callback refs when they change
  useEffect(() => {
    onIdleCallbackRef.current = onIdle;
    onReturnCallbackRef.current = onReturn;
  }, [onIdle, onReturn]);

  /**
   * Reset idle timer (user activity detected)
   */
  const resetIdleTimer = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    setLastActivity(now);

    // If was idle, trigger return callback
    if (isIdleRef.current && idleSince !== null) {
      const idleTime = now - idleSince;
      onReturnCallbackRef.current?.(idleTime);
      setIsIdle(false);
      setIdleSince(null);
      isIdleRef.current = false;
    }

    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set new timer
    idleTimerRef.current = setTimeout(() => {
      const idleStart = Date.now();
      setIsIdle(true);
      setIdleSince(idleStart);
      isIdleRef.current = true;
      onIdleCallbackRef.current?.(0);
    }, threshold);
  }, [enabled, threshold, idleSince]);

  /**
   * Activity event handlers
   */
  useEffect(() => {
    if (!enabled) {
      // Clean up when disabled
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      setIsIdle(false);
      setIdleSince(null);
      isIdleRef.current = false;
      return;
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    // Throttle activity detection to avoid excessive updates
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const throttledReset = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetIdleTimer();
        throttleTimer = null;
      }, 1000); // Throttle to max once per second
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Page visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetIdleTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [enabled, resetIdleTimer]);

  // Calculate current idle duration
  const idleDuration = isIdle && idleSince !== null ? Date.now() - idleSince : 0;

  return {
    isIdle,
    idleSince,
    idleDuration,
    lastActivity
  };
}

/**
 * Persistent idle detection settings (stored in localStorage)
 */
export interface IdleDetectionSettings {
  enabled: boolean;
  thresholdMinutes: number;
}

const SETTINGS_KEY = 'time-tracking-idle-detection';

export function getIdleDetectionSettings(): IdleDetectionSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load idle detection settings', error);
  }

  return {
    enabled: false,
    thresholdMinutes: 5
  };
}

export function saveIdleDetectionSettings(settings: IdleDetectionSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save idle detection settings', error);
  }
}
