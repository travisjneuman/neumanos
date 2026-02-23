/**
 * useOfflineStatus Hook
 *
 * Wraps navigator.onLine + online/offline events to provide reactive
 * connectivity state with reconnection detection for "back online" toasts.
 */

import { useState, useEffect, useRef } from 'react';

export interface OfflineStatus {
  /** Whether the browser reports a network connection */
  isOnline: boolean;
  /** Convenience inverse of isOnline */
  isOffline: boolean;
  /** True for ~3 seconds after transitioning from offline back to online */
  showReconnected: boolean;
}

export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOfflineRef = useRef(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        setShowReconnected(true);
        // Clear any existing timer to avoid race conditions
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        // Auto-dismiss after 3 seconds
        timerRef.current = setTimeout(() => {
          setShowReconnected(false);
          timerRef.current = null;
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      // If we go offline while showing reconnected, dismiss it
      setShowReconnected(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isOnline, isOffline: !isOnline, showReconnected };
}
