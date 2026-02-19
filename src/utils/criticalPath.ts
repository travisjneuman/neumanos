/**
 * Critical Path Analysis Utilities
 *
 * Implements Critical Path Method (CPM) algorithm to identify the longest
 * dependency chain in a project, which determines the minimum project duration.
 *
 * Tasks on the critical path have zero slack time - any delay directly impacts
 * the project end date.
 */

import type { Task } from '../types';
import { logger } from '../services/logger';

const log = logger.module('CriticalPath');

interface TaskSchedule {
  taskId: string;
  earliestStart: number; // Days from project start
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number; // latestStart - earliestStart (or latestFinish - earliestFinish)
  duration: number; // Days between start and due
}

/**
 * Convert date string to day number (days from project start)
 */
function dateToDays(dateStr: string | null, projectStart: Date): number {
  if (!dateStr) return 0;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const diffTime = date.getTime() - projectStart.getTime();
  return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate task duration in days
 */
function getTaskDuration(task: Task): number {
  if (!task.startDate || !task.dueDate) return 1; // Default 1 day if dates missing

  const [y1, m1, d1] = task.startDate.split('-').map(Number);
  const [y2, m2, d2] = task.dueDate.split('-').map(Number);

  const start = new Date(y1, m1 - 1, d1);
  const due = new Date(y2, m2 - 1, d2);

  const diffTime = due.getTime() - start.getTime();
  return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1); // +1 to include end day
}

/**
 * Build dependency graph
 */
function buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  tasks.forEach(task => {
    if (!graph.has(task.id)) {
      graph.set(task.id, []);
    }

    task.dependencies?.forEach(dep => {
      if (!graph.has(dep.taskId)) {
        graph.set(dep.taskId, []);
      }
      // dep.taskId → task.id (blocker → dependent)
      graph.get(dep.taskId)!.push(task.id);
    });
  });

  return graph;
}

/**
 * Forward pass: Calculate earliest start/finish for each task
 */
function forwardPass(
  tasks: Task[],
  projectStart: Date,
  _graph: Map<string, string[]>
): Map<string, TaskSchedule> {
  const schedules = new Map<string, TaskSchedule>();
  const processed = new Set<string>();

  // Initialize all tasks
  tasks.forEach(task => {
    const duration = getTaskDuration(task);
    const earliestStart = task.startDate ? dateToDays(task.startDate, projectStart) : 0;

    schedules.set(task.id, {
      taskId: task.id,
      earliestStart,
      earliestFinish: earliestStart + duration,
      latestStart: 0, // Will be calculated in backward pass
      latestFinish: 0, // Will be calculated in backward pass
      slack: 0, // Will be calculated after backward pass
      duration,
    });
  });

  // Topological sort and calculate earliest times
  function processTask(taskId: string) {
    if (processed.has(taskId)) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Process all dependencies first
    task.dependencies?.forEach(dep => {
      processTask(dep.taskId);
    });

    // Calculate earliest start based on dependencies
    let maxEarliestFinish = task.startDate ? dateToDays(task.startDate, projectStart) : 0;

    task.dependencies?.forEach(dep => {
      const depSchedule = schedules.get(dep.taskId);
      if (!depSchedule) return;

      let depFinish = 0;
      switch (dep.type) {
        case 'finish-to-start':
          depFinish = depSchedule.earliestFinish + (dep.lag || 0);
          break;
        case 'start-to-start':
          depFinish = depSchedule.earliestStart + (dep.lag || 0);
          break;
        case 'finish-to-finish':
          // This task must finish when dep finishes, so work backwards
          depFinish = depSchedule.earliestFinish + (dep.lag || 0) - schedules.get(taskId)!.duration;
          break;
        case 'start-to-finish':
          // This task must finish when dep starts, so work backwards
          depFinish = depSchedule.earliestStart + (dep.lag || 0) - schedules.get(taskId)!.duration;
          break;
      }

      maxEarliestFinish = Math.max(maxEarliestFinish, depFinish);
    });

    const schedule = schedules.get(taskId)!;
    schedule.earliestStart = maxEarliestFinish;
    schedule.earliestFinish = schedule.earliestStart + schedule.duration;

    processed.add(taskId);
  }

  // Process all tasks
  tasks.forEach(task => processTask(task.id));

  return schedules;
}

/**
 * Backward pass: Calculate latest start/finish for each task
 */
function backwardPass(
  tasks: Task[],
  schedules: Map<string, TaskSchedule>,
  graph: Map<string, string[]>
): void {
  // Find project end (latest earliestFinish)
  let projectEnd = 0;
  schedules.forEach(schedule => {
    projectEnd = Math.max(projectEnd, schedule.earliestFinish);
  });

  // Initialize all tasks with project end
  const processed = new Set<string>();

  // Start from tasks with no dependents
  function processTask(taskId: string) {
    if (processed.has(taskId)) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const dependents = graph.get(taskId) || [];

    // Process all dependents first
    dependents.forEach(depId => {
      processTask(depId);
    });

    const schedule = schedules.get(taskId)!;

    if (dependents.length === 0) {
      // No dependents - can finish at project end
      schedule.latestFinish = projectEnd;
      schedule.latestStart = schedule.latestFinish - schedule.duration;
    } else {
      // Calculate latest finish based on dependents
      let minLatestStart = Infinity;

      dependents.forEach(depId => {
        const dependent = tasks.find(t => t.id === depId);
        if (!dependent) return;

        const depSchedule = schedules.get(depId);
        if (!depSchedule) return;

        const dependency = dependent.dependencies?.find(d => d.taskId === taskId);
        if (!dependency) return;

        let latestFinish = 0;
        switch (dependency.type) {
          case 'finish-to-start':
            latestFinish = depSchedule.latestStart - (dependency.lag || 0);
            break;
          case 'start-to-start':
            latestFinish = depSchedule.latestStart - (dependency.lag || 0) + schedule.duration;
            break;
          case 'finish-to-finish':
            latestFinish = depSchedule.latestFinish - (dependency.lag || 0);
            break;
          case 'start-to-finish':
            latestFinish = depSchedule.latestFinish - (dependency.lag || 0) + schedule.duration;
            break;
        }

        minLatestStart = Math.min(minLatestStart, latestFinish - schedule.duration);
      });

      schedule.latestStart = minLatestStart === Infinity ? schedule.earliestStart : minLatestStart;
      schedule.latestFinish = schedule.latestStart + schedule.duration;
    }

    // Calculate slack
    schedule.slack = schedule.latestStart - schedule.earliestStart;

    processed.add(taskId);
  }

  // Process all tasks from the end
  tasks.forEach(task => processTask(task.id));
}

/**
 * Calculate critical path for a set of tasks
 * @returns Array of task IDs on critical path
 */
export function calculateCriticalPath(tasks: Task[]): string[] {
  if (tasks.length === 0) return [];

  // Filter to tasks with dates
  const tasksWithDates = tasks.filter(t => t.startDate || t.dueDate);
  if (tasksWithDates.length === 0) return [];

  log.info(`Calculating critical path for ${tasksWithDates.length} tasks`);

  // Find project start date
  let projectStart: Date | null = null;
  tasksWithDates.forEach(task => {
    if (task.startDate) {
      const [year, month, day] = task.startDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (!projectStart || date < projectStart) {
        projectStart = date;
      }
    }
  });

  if (!projectStart) {
    projectStart = new Date(); // Fallback to today
  }

  // Build dependency graph
  const graph = buildDependencyGraph(tasksWithDates);

  // Forward pass
  const schedules = forwardPass(tasksWithDates, projectStart, graph);

  // Backward pass
  backwardPass(tasksWithDates, schedules, graph);

  // Find critical tasks (slack = 0)
  const criticalTasks: string[] = [];
  schedules.forEach((schedule, taskId) => {
    if (Math.abs(schedule.slack) < 0.1) { // Allow small floating point error
      criticalTasks.push(taskId);
    }
  });

  log.info(`Critical path identified: ${criticalTasks.length} tasks`, { criticalTasks });

  return criticalTasks;
}

/**
 * Calculate slack time for a specific task
 * @returns Number of days task can be delayed without affecting project end
 */
export function calculateSlack(task: Task, allTasks: Task[]): number {
  if (!task.startDate || !task.dueDate) return 0;

  // Find project start
  let projectStart: Date | null = null;
  allTasks.forEach(t => {
    if (t.startDate) {
      const [year, month, day] = t.startDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (!projectStart || date < projectStart) {
        projectStart = date;
      }
    }
  });

  if (!projectStart) return 0;

  // Build schedules
  const graph = buildDependencyGraph(allTasks);
  const schedules = forwardPass(allTasks, projectStart, graph);
  backwardPass(allTasks, schedules, graph);

  const schedule = schedules.get(task.id);
  return schedule ? schedule.slack : 0;
}
