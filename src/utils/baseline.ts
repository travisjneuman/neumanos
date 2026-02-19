/**
 * Baseline Snapshot and Variance Utilities
 * Phase 1.4: Baseline Comparison
 */

import type { Task, ProjectBaseline, BaselineTask, VarianceStatus } from '../types';

/**
 * Create a baseline snapshot of current project state
 * @param tasks - All tasks in the project
 * @returns ProjectBaseline snapshot
 */
export function createBaselineSnapshot(tasks: Task[]): ProjectBaseline {
  // Only snapshot tasks with dates
  const tasksWithDates = tasks.filter((task) => task.startDate || task.dueDate);

  const baselineTasks: BaselineTask[] = tasksWithDates.map((task) => ({
    id: task.id,
    startDate: task.startDate,
    dueDate: task.dueDate,
    progress: task.progress || 0,
  }));

  return {
    setAt: new Date().toISOString(),
    tasks: baselineTasks,
  };
}

/**
 * Calculate variance in days between current task and baseline task
 * Positive = ahead of schedule, Negative = behind schedule
 * @param currentTask - Current task state
 * @param baselineTask - Baseline task snapshot
 * @returns Variance in days (null if no dates)
 */
export function calculateVarianceDays(
  currentTask: Task,
  baselineTask: BaselineTask | undefined
): number | null {
  if (!baselineTask) return null;

  // Use due date as primary comparison point
  if (currentTask.dueDate && baselineTask.dueDate) {
    const currentDue = new Date(currentTask.dueDate);
    const baselineDue = new Date(baselineTask.dueDate);
    const diffTime = baselineDue.getTime() - currentDue.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Fallback to start date
  if (currentTask.startDate && baselineTask.startDate) {
    const currentStart = new Date(currentTask.startDate);
    const baselineStart = new Date(baselineTask.startDate);
    const diffTime = baselineStart.getTime() - currentStart.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  return null;
}

/**
 * Determine variance status based on days variance
 * @param varianceDays - Days variance (positive = ahead, negative = behind)
 * @returns VarianceStatus
 */
export function getVarianceStatus(varianceDays: number | null): VarianceStatus {
  if (varianceDays === null) return 'on-track';

  const threshold = 1; // ±1 day = on-track

  if (varianceDays > threshold) return 'ahead'; // Ahead of schedule
  if (varianceDays < -threshold) return 'behind'; // Behind schedule
  return 'on-track';
}

/**
 * Get baseline task by ID
 * @param baseline - Project baseline
 * @param taskId - Task ID to find
 * @returns BaselineTask or undefined
 */
export function getBaselineTask(
  baseline: ProjectBaseline | null,
  taskId: string
): BaselineTask | undefined {
  if (!baseline) return undefined;
  return baseline.tasks.find((t) => t.id === taskId);
}

/**
 * Calculate variance summary for all tasks
 * @param tasks - Current tasks
 * @param baseline - Project baseline
 * @returns Summary stats
 */
export function calculateVarianceSummary(tasks: Task[], baseline: ProjectBaseline | null) {
  if (!baseline) {
    return { ahead: 0, behind: 0, onTrack: 0 };
  }

  const summary = { ahead: 0, behind: 0, onTrack: 0 };

  tasks.forEach((task) => {
    const baselineTask = getBaselineTask(baseline, task.id);
    const variance = calculateVarianceDays(task, baselineTask);
    const status = getVarianceStatus(variance);

    if (status === 'ahead') summary.ahead++;
    else if (status === 'behind') summary.behind++;
    else summary.onTrack++;
  });

  return summary;
}
