/**
 * useAnalyticsWorker
 *
 * Exposes analytics calculation functions backed by a Web Worker.
 * Falls back to synchronous main-thread calculations when workers are
 * unavailable (SSR, older browsers, Jest, etc.).
 */

import { useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Shared types (kept inline to avoid worker-bundle leakage)
// ---------------------------------------------------------------------------

export interface ActivityEvent {
  /** ISO timestamp of the event */
  timestamp: string;
  /** Module / feature area (e.g. "kanban", "notes") */
  module: string;
}

type WorkerResponse =
  | { type: 'dailyStats'; requestId: string; stats: Record<string, number> }
  | { type: 'moduleDistribution'; requestId: string; distribution: Record<string, number> }
  | { type: 'productivityScore'; requestId: string; score: number }
  | { type: 'error'; requestId: string; message: string };

// ---------------------------------------------------------------------------
// Main-thread fallback functions (pure — no side-effects)
// ---------------------------------------------------------------------------

function mainThreadDailyStats(events: ActivityEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const day = e.timestamp.slice(0, 10);
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return counts;
}

function mainThreadModuleDistribution(events: ActivityEvent[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const e of events) {
    const mod = e.module || 'unknown';
    dist[mod] = (dist[mod] ?? 0) + 1;
  }
  return dist;
}

function mainThreadProductivityScore(
  tasksCompleted: number,
  habitsDone: number,
  hoursTracked: number,
): number {
  const taskScore = Math.min(tasksCompleted / 20, 1) * 50;
  const habitScore = Math.min(habitsDone / 10, 1) * 30;
  const hourScore = Math.min(hoursTracked / 8, 1) * 20;
  return Math.round(taskScore + habitScore + hourScore);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseAnalyticsWorkerReturn {
  /** Counts events per calendar day. Returns a YYYY-MM-DD -> count map. */
  calculateDailyStats: (events: ActivityEvent[]) => Promise<Record<string, number>>;
  /** Counts events per module name. */
  calculateModuleDistribution: (events: ActivityEvent[]) => Promise<Record<string, number>>;
  /**
   * Computes a 0–100 composite productivity score.
   *
   * Weights: tasks (50 pts, max 20), habits (30 pts, max 10), hours (20 pts, max 8).
   */
  calculateProductivityScore: (
    tasksCompleted: number,
    habitsDone: number,
    hoursTracked: number,
  ) => Promise<number>;
}

type PendingResolver = (value: unknown) => void;

export function useAnalyticsWorker(): UseAnalyticsWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingResolver>>(new Map());
  const requestIdRef = useRef(0);

  const supportsWorker = typeof Worker !== 'undefined';

  useEffect(() => {
    if (!supportsWorker) return;

    const worker = new Worker(
      new URL('../workers/analyticsWorker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      const resolve = pendingRef.current.get(msg.requestId);
      if (!resolve) return;

      pendingRef.current.delete(msg.requestId);

      if (msg.type === 'dailyStats') {
        resolve(msg.stats);
      } else if (msg.type === 'moduleDistribution') {
        resolve(msg.distribution);
      } else if (msg.type === 'productivityScore') {
        resolve(msg.score);
      } else if (msg.type === 'error') {
        // Resolve with empty/zero rather than rejecting to keep callers simple
        resolve({});
      }
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, [supportsWorker]);

  // Utility: post a message and return a promise that resolves with the response
  function postMessage<T>(message: Record<string, unknown>): Promise<T> {
    const requestId = String(++requestIdRef.current);
    const messageWithId = { ...message, requestId };

    if (workerRef.current) {
      return new Promise<T>((resolve) => {
        pendingRef.current.set(requestId, resolve as PendingResolver);
        workerRef.current!.postMessage(messageWithId);
      });
    }

    // Worker not ready — caller will use inline fallback
    return Promise.resolve(undefined as unknown as T);
  }

  const calculateDailyStats = useCallback(
    (events: ActivityEvent[]): Promise<Record<string, number>> => {
      if (!workerRef.current) {
        return Promise.resolve(mainThreadDailyStats(events));
      }
      return postMessage<Record<string, number>>({
        type: 'calculateDailyStats',
        events,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const calculateModuleDistribution = useCallback(
    (events: ActivityEvent[]): Promise<Record<string, number>> => {
      if (!workerRef.current) {
        return Promise.resolve(mainThreadModuleDistribution(events));
      }
      return postMessage<Record<string, number>>({
        type: 'calculateModuleDistribution',
        events,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const calculateProductivityScore = useCallback(
    (
      tasksCompleted: number,
      habitsDone: number,
      hoursTracked: number,
    ): Promise<number> => {
      if (!workerRef.current) {
        return Promise.resolve(
          mainThreadProductivityScore(tasksCompleted, habitsDone, hoursTracked),
        );
      }
      return postMessage<number>({
        type: 'calculateProductivityScore',
        tasksCompleted,
        habitsDone,
        hoursTracked,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { calculateDailyStats, calculateModuleDistribution, calculateProductivityScore };
}
