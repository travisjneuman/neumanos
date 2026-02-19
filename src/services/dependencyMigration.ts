/**
 * Dependency Migration Service
 * Migrates from global SimpleTaskDependency[] (old) to task-level TaskDependency[] (new)
 *
 * Migration automatically runs on app initialization if old format detected.
 */

import type { Task, SimpleTaskDependency, TaskDependency } from '../types';
import { logger } from './logger';

const log = logger.module('DependencyMigration');

/**
 * Migrate from old SimpleTaskDependency[] format to new task-level TaskDependency[]
 * @param tasks - Current tasks array
 * @param oldDependencies - Global SimpleTaskDependency[] from KanbanState
 * @returns Migrated tasks with dependencies on each task
 */
export function migrateDependenciesToTaskLevel(
  tasks: Task[],
  oldDependencies: SimpleTaskDependency[]
): Task[] {
  if (!oldDependencies || oldDependencies.length === 0) {
    log.info('No dependencies to migrate');
    return tasks;
  }

  log.info(`Migrating ${oldDependencies.length} dependencies to task level`);

  // Group dependencies by target task (tasks that are blocked by others)
  const dependenciesByTarget = new Map<string, SimpleTaskDependency[]>();
  oldDependencies.forEach(dep => {
    const existing = dependenciesByTarget.get(dep.targetTaskId) || [];
    existing.push(dep);
    dependenciesByTarget.set(dep.targetTaskId, existing);
  });

  // Migrate: Add dependencies to each task
  const migratedTasks = tasks.map(task => {
    const taskDependencies = dependenciesByTarget.get(task.id);

    if (!taskDependencies || taskDependencies.length === 0) {
      return task; // No dependencies for this task
    }

    // Convert SimpleTaskDependency[] to TaskDependency[]
    // SimpleTaskDependency represents "sourceTask blocks targetTask"
    // TaskDependency on a task represents "this task depends on taskId"
    const newDependencies: TaskDependency[] = taskDependencies.map(dep => ({
      taskId: dep.sourceTaskId, // The task this one depends on (the blocker)
      type: 'finish-to-start' as const, // Default to FS (most common)
      lag: 0, // No lag in old format
    }));

    return {
      ...task,
      dependencies: newDependencies,
    };
  });

  log.info('Migration complete', {
    tasksAffected: migratedTasks.filter(t => t.dependencies && t.dependencies.length > 0).length,
    totalDependencies: oldDependencies.length,
  });

  return migratedTasks;
}

/**
 * Check if migration is needed (old format exists)
 * @param kanbanState - Current KanbanState
 * @returns True if global dependencies array exists (needs migration)
 */
export function needsMigration(kanbanState: any): boolean {
  return Boolean(kanbanState.dependencies && Array.isArray(kanbanState.dependencies));
}
