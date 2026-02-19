import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Task,
  TaskDependency,
  ProjectBaseline,
} from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';
import { logger } from '../services/logger';
import { calculateCriticalPath, calculateSlack } from '../utils/criticalPath';
import { createBaselineSnapshot } from '../utils/baseline';

const log = logger.module('KanbanDependenciesStore');

/**
 * Phase 8.2: Task shift interface for dependent task date adjustments
 * Used by applyDependentShifts for cascading date changes
 */
export interface TaskShift {
  taskId: string;
  newStartDate: string | null;
  newDueDate: string | null;
  reason: string;
}

/**
 * Phase 8.2: Dependencies Store State
 * Manages:
 * - Project baseline snapshots for variance tracking
 * - Dependency query helpers (blockers, blocked tasks)
 * - Critical path analysis delegation
 *
 * Note: Task.dependencies[] remains on individual tasks in useKanbanStore.
 * This store manages the baseline state and provides pure query functions.
 */
interface KanbanDependenciesState {
  // ==================== STATE ====================
  baseline: ProjectBaseline | null;

  // ==================== BASELINE ACTIONS ====================
  setBaseline: (tasks: Task[]) => void;
  clearBaseline: () => void;
  getBaseline: () => ProjectBaseline | null;

  // ==================== DEPENDENCY QUERIES ====================
  // These take tasks as input for flexibility and testability

  /**
   * Get tasks that block a given task (tasks in this task's dependencies)
   */
  getBlockers: (taskId: string, tasks: Task[]) => Task[];

  /**
   * Get tasks that are blocked by a given task (tasks that depend on this task)
   */
  getBlocked: (taskId: string, tasks: Task[]) => Task[];

  /**
   * Get blocker tasks that are overdue (for dependency warnings)
   */
  getOverdueBlockers: (taskId: string, tasks: Task[]) => Task[];

  // ==================== DEPENDENCY VALIDATION ====================

  /**
   * Check if adding a dependency would create a circular reference
   * @returns true if circular, false if safe to add
   */
  wouldCreateCircularDependency: (
    taskId: string,
    dependencyTaskId: string,
    tasks: Task[]
  ) => boolean;

  /**
   * Validate a dependency before adding
   * @returns { valid: boolean; error?: string }
   */
  validateDependency: (
    taskId: string,
    dependency: TaskDependency,
    tasks: Task[]
  ) => { valid: boolean; error?: string };

  // ==================== CRITICAL PATH ANALYSIS ====================

  /**
   * Calculate the critical path through all tasks
   * @returns Array of task IDs on the critical path
   */
  getCriticalPath: (tasks: Task[]) => string[];

  /**
   * Calculate slack (float) for a specific task
   * @returns Number of days the task can be delayed without affecting project end
   */
  getTaskSlack: (taskId: string, tasks: Task[]) => number;

  // ==================== DEPENDENCY STATISTICS ====================

  /**
   * Get statistics about task dependencies
   */
  getDependencyStats: (tasks: Task[]) => DependencyStats;
}

/**
 * Statistics about task dependencies in the project
 */
export interface DependencyStats {
  totalTasksWithDependencies: number;
  totalDependencies: number;
  avgDependenciesPerTask: number;
  criticalPathLength: number;
  tasksWithOverdueBlockers: number;
}

/**
 * Phase 8.2: Kanban Dependencies Store
 *
 * Single-responsibility store for:
 * - Project baseline management
 * - Dependency query operations
 * - Critical path analysis
 *
 * Works with tasks from useKanbanStore via method parameters.
 */
export const useKanbanDependenciesStore = create<KanbanDependenciesState>()(
  persist(
    (set, get) => ({
      // ==================== STATE ====================
      baseline: null,

      // ==================== BASELINE ACTIONS ====================

      setBaseline: (tasks) => {
        const baseline = createBaselineSnapshot(tasks);
        set({ baseline });
        log.info('Baseline set', {
          taskCount: baseline.tasks.length,
          setAt: baseline.setAt
        });
      },

      clearBaseline: () => {
        set({ baseline: null });
        log.info('Baseline cleared');
      },

      getBaseline: () => {
        return get().baseline;
      },

      // ==================== DEPENDENCY QUERIES ====================

      getBlockers: (taskId, tasks) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.dependencies) return [];

        const blockerIds = task.dependencies.map(d => d.taskId);
        return tasks.filter(t => blockerIds.includes(t.id));
      },

      getBlocked: (taskId, tasks) => {
        return tasks.filter(t =>
          t.dependencies?.some(d => d.taskId === taskId)
        );
      },

      getOverdueBlockers: (taskId, tasks) => {
        const blockers = get().getBlockers(taskId, tasks);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return blockers.filter(blocker => {
          // Blocker is overdue if:
          // 1. It's not done
          // 2. It has a due date
          // 3. Due date is before today
          if (blocker.status === 'done') return false;
          if (!blocker.dueDate) return false;

          const dueDate = new Date(blocker.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          return dueDate < today;
        });
      },

      // ==================== DEPENDENCY VALIDATION ====================

      wouldCreateCircularDependency: (taskId, dependencyTaskId, tasks) => {
        // Self-dependency check
        if (taskId === dependencyTaskId) return true;

        // Check if we can reach taskId starting from dependencyTaskId
        // by following the dependency chain (upstream traversal)
        // If so, adding taskId -> dependencyTaskId would create a cycle
        const canReach = (fromId: string, visited = new Set<string>()): boolean => {
          if (fromId === taskId) return true;
          if (visited.has(fromId)) return false;

          visited.add(fromId);

          const fromTask = tasks.find(t => t.id === fromId);
          if (!fromTask || !fromTask.dependencies) return false;

          // Traverse upstream through dependencies
          return fromTask.dependencies.some(dep =>
            canReach(dep.taskId, visited)
          );
        };

        return canReach(dependencyTaskId);
      },

      validateDependency: (taskId, dependency, tasks) => {
        // Check self-dependency
        if (taskId === dependency.taskId) {
          return { valid: false, error: 'Task cannot depend on itself' };
        }

        // Check if task exists
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          return { valid: false, error: 'Task not found' };
        }

        // Check if dependency task exists
        const dependencyTask = tasks.find(t => t.id === dependency.taskId);
        if (!dependencyTask) {
          return { valid: false, error: 'Dependency task not found' };
        }

        // Check for duplicate
        if (task.dependencies?.some(d => d.taskId === dependency.taskId)) {
          return { valid: false, error: 'Dependency already exists' };
        }

        // Check for circular dependency
        if (get().wouldCreateCircularDependency(taskId, dependency.taskId, tasks)) {
          return { valid: false, error: 'Would create circular dependency' };
        }

        return { valid: true };
      },

      // ==================== CRITICAL PATH ANALYSIS ====================

      getCriticalPath: (tasks) => {
        return calculateCriticalPath(tasks);
      },

      getTaskSlack: (taskId, tasks) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return 0;
        return calculateSlack(task, tasks);
      },

      // ==================== DEPENDENCY STATISTICS ====================

      getDependencyStats: (tasks) => {
        const tasksWithDependencies = tasks.filter(
          t => t.dependencies && t.dependencies.length > 0
        );

        const totalDependencies = tasks.reduce(
          (sum, t) => sum + (t.dependencies?.length || 0),
          0
        );

        const criticalPath = get().getCriticalPath(tasks);

        // Count tasks with overdue blockers
        const tasksWithOverdueBlockers = tasks.filter(task => {
          const overdueBlockers = get().getOverdueBlockers(task.id, tasks);
          return overdueBlockers.length > 0;
        }).length;

        return {
          totalTasksWithDependencies: tasksWithDependencies.length,
          totalDependencies,
          avgDependenciesPerTask: tasksWithDependencies.length > 0
            ? totalDependencies / tasksWithDependencies.length
            : 0,
          criticalPathLength: criticalPath.length,
          tasksWithOverdueBlockers,
        };
      },
    }),
    {
      name: 'kanban-dependencies-store',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1,
      migrate: (persistedState: unknown, _version: number) => {
        // Future migrations here
        return persistedState as KanbanDependenciesState;
      },
      partialize: (state) => ({
        baseline: state.baseline,
      }),
    }
  )
);

// ==================== SELECTORS ====================

/**
 * Selector: Check if a baseline exists
 */
export const selectHasBaseline = (): boolean => {
  return useKanbanDependenciesStore.getState().baseline !== null;
};

/**
 * Selector: Get baseline task count
 */
export const selectBaselineTaskCount = (): number => {
  const baseline = useKanbanDependenciesStore.getState().baseline;
  return baseline?.tasks.length || 0;
};

/**
 * Selector: Get baseline set date
 */
export const selectBaselineDate = (): string | null => {
  const baseline = useKanbanDependenciesStore.getState().baseline;
  return baseline?.setAt || null;
};
