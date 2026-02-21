/**
 * useWidgetRefresh - Reusable auto-refresh hook for dashboard widgets
 *
 * Handles:
 * - Auto-refresh based on widget store settings
 * - Manual refresh with loading state
 * - Time since last refresh tracking
 * - Minimum visual feedback duration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWidgetStore } from '../stores/useWidgetStore';

interface UseWidgetRefreshOptions {
  /** Widget ID to read settings from */
  widgetId: string;
  /** The fetch/refresh function to call */
  fetchFn: () => Promise<void>;
  /** Default refresh rate in minutes if not set in store (0 = manual) */
  defaultRefreshRate?: number;
}

interface UseWidgetRefreshReturn {
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
  /** Timestamp of last successful refresh */
  lastRefreshed: Date | null;
  /** Human-readable time since last refresh */
  lastRefreshedLabel: string;
  /** Trigger a manual refresh */
  refresh: () => Promise<void>;
  /** Current refresh interval in minutes (0 = manual) */
  refreshRate: number;
}

export function useWidgetRefresh({
  widgetId,
  fetchFn,
  defaultRefreshRate = 0,
}: UseWidgetRefreshOptions): UseWidgetRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [lastRefreshedLabel, setLastRefreshedLabel] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Strip instance suffix for settings lookup
  const baseType = widgetId.replace(/-\d+$/, '');
  const settings = useWidgetStore((state) => state.getWidgetSettings(baseType));
  const refreshRate = settings.refreshRate ?? defaultRefreshRate;

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchFn();
      setLastRefreshed(new Date());
    } finally {
      // Minimum 400ms visual feedback
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [fetchFn, isRefreshing]);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (refreshRate > 0) {
      intervalRef.current = setInterval(() => {
        fetchFn().then(() => setLastRefreshed(new Date()));
      }, refreshRate * 60 * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshRate, fetchFn]);

  // Update the "last refreshed" label every 30s
  useEffect(() => {
    const updateLabel = () => {
      if (!lastRefreshed) {
        setLastRefreshedLabel('');
        return;
      }
      const diffMs = Date.now() - lastRefreshed.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) {
        setLastRefreshedLabel('just now');
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        setLastRefreshedLabel(`${mins}m ago`);
      } else {
        const hrs = Math.floor(diffSec / 3600);
        setLastRefreshedLabel(`${hrs}h ago`);
      }
    };

    updateLabel();
    const timer = setInterval(updateLabel, 30_000);
    return () => clearInterval(timer);
  }, [lastRefreshed]);

  return {
    isRefreshing,
    lastRefreshed,
    lastRefreshedLabel,
    refresh,
    refreshRate,
  };
}
