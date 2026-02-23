/**
 * Analytics Calculation Web Worker
 *
 * Offloads CPU-bound analytics aggregation from the main thread.
 * All operations are pure functions over serializable data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal activity event representation the worker accepts. */
interface ActivityEvent {
  /** ISO timestamp */
  timestamp: string;
  /** Module / feature area that was active (e.g. "kanban", "notes") */
  module: string;
}

interface DailyStatsRequest {
  type: 'calculateDailyStats';
  requestId: string;
  events: ActivityEvent[];
}

interface ModuleDistributionRequest {
  type: 'calculateModuleDistribution';
  requestId: string;
  events: ActivityEvent[];
}

interface ProductivityScoreRequest {
  type: 'calculateProductivityScore';
  requestId: string;
  tasksCompleted: number;
  habitsDone: number;
  hoursTracked: number;
}

type AnalyticsRequest =
  | DailyStatsRequest
  | ModuleDistributionRequest
  | ProductivityScoreRequest;

// Response shapes
interface DailyStatsResponse {
  type: 'dailyStats';
  requestId: string;
  /** date string (YYYY-MM-DD) -> event count */
  stats: Record<string, number>;
}

interface ModuleDistributionResponse {
  type: 'moduleDistribution';
  requestId: string;
  /** module name -> event count */
  distribution: Record<string, number>;
}

interface ProductivityScoreResponse {
  type: 'productivityScore';
  requestId: string;
  /** 0–100 composite score */
  score: number;
}

interface ErrorResponse {
  type: 'error';
  requestId: string;
  message: string;
}

type WorkerResponse =
  | DailyStatsResponse
  | ModuleDistributionResponse
  | ProductivityScoreResponse
  | ErrorResponse;

// ---------------------------------------------------------------------------
// Pure calculation functions
// ---------------------------------------------------------------------------

/**
 * Counts events per calendar day.
 * Returns a map of YYYY-MM-DD -> count.
 */
function calculateDailyStats(events: ActivityEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const event of events) {
    const day = event.timestamp.slice(0, 10); // "YYYY-MM-DD"
    counts[day] = (counts[day] ?? 0) + 1;
  }

  return counts;
}

/**
 * Counts events per module name.
 */
function calculateModuleDistribution(events: ActivityEvent[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const event of events) {
    const module = event.module || 'unknown';
    distribution[module] = (distribution[module] ?? 0) + 1;
  }

  return distribution;
}

/**
 * Produces a 0–100 composite productivity score.
 *
 * Weights:
 *   - Tasks completed: up to 50 points (20 tasks = max)
 *   - Habits done:     up to 30 points (10 habits = max)
 *   - Hours tracked:   up to 20 points (8 hours = max)
 *
 * Each component is clamped before summing so the result is always 0–100.
 */
function calculateProductivityScore(
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
// Message handler
// ---------------------------------------------------------------------------

self.addEventListener('message', (event: MessageEvent<AnalyticsRequest>) => {
  const req = event.data;

  try {
    if (req.type === 'calculateDailyStats') {
      const stats = calculateDailyStats(req.events);
      const response: WorkerResponse = { type: 'dailyStats', requestId: req.requestId, stats };
      self.postMessage(response);

    } else if (req.type === 'calculateModuleDistribution') {
      const distribution = calculateModuleDistribution(req.events);
      const response: WorkerResponse = {
        type: 'moduleDistribution',
        requestId: req.requestId,
        distribution,
      };
      self.postMessage(response);

    } else if (req.type === 'calculateProductivityScore') {
      const score = calculateProductivityScore(
        req.tasksCompleted,
        req.habitsDone,
        req.hoursTracked,
      );
      const response: WorkerResponse = {
        type: 'productivityScore',
        requestId: req.requestId,
        score,
      };
      self.postMessage(response);
    }
  } catch (err) {
    const reqWithId = req as { requestId?: string };
    const message = err instanceof Error ? err.message : String(err);
    const response: WorkerResponse = {
      type: 'error',
      requestId: reqWithId.requestId ?? '',
      message,
    };
    self.postMessage(response);
  }
});
