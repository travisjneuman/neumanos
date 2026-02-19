import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task } from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';
import { logger } from '../services/logger';

const log = logger.module('KanbanArchiveStore');

/**
 * Phase 8.1: Extracted Archive Store
 *
 * Single-responsibility store for archived task management.
 * Separated from useKanbanStore for maintainability and testability.
 *
 * Cross-store pattern: This store manages archived tasks state.
 * Archive/restore operations coordinate with useKanbanStore.
 */

interface KanbanArchiveState {
  archivedTasks: Task[];
}

interface KanbanArchiveActions {
  /**
   * Archive a task - moves from active tasks to archive.
   * Coordinates with useKanbanStore to remove from active tasks.
   */
  archiveTask: (task: Task) => void;

  /**
   * Restore an archived task - moves back to active tasks.
   * Returns the restored task for useKanbanStore to add back.
   */
  restoreTask: (id: string) => Task | null;

  /**
   * Permanently delete an archived task.
   */
  deleteArchivedTask: (id: string) => void;

  /**
   * Get all archived tasks, sorted by archive date (most recent first).
   */
  getArchivedTasks: () => Task[];

  /**
   * Get tasks eligible for auto-archive (completed > 14 days ago).
   */
  getTasksToAutoArchive: (activeTasks: Task[]) => Task[];

  /**
   * Bulk archive multiple tasks at once.
   */
  bulkArchiveTasks: (tasks: Task[]) => void;

  /**
   * Get archive statistics.
   */
  getArchiveStats: () => {
    totalArchived: number;
    archivedThisMonth: number;
    oldestArchived: string | null;
  };
}

type KanbanArchiveStore = KanbanArchiveState & KanbanArchiveActions;

export const useKanbanArchiveStore = create<KanbanArchiveStore>()(
  persist(
    (set, get) => ({
      // Initial state
      archivedTasks: [],

      // ==================== ARCHIVE ACTIONS ====================

      archiveTask: (task: Task) => {
        const archivedTask: Task = {
          ...task,
          archivedAt: new Date().toISOString(),
        };

        set((state) => ({
          archivedTasks: [...state.archivedTasks, archivedTask],
        }));

        log.info('Task archived', { taskId: task.id, title: task.title });
      },

      restoreTask: (id: string) => {
        const archivedTask = get().archivedTasks.find((t) => t.id === id);
        if (!archivedTask) {
          log.warn('Archived task not found for restore', { taskId: id });
          return null;
        }

        // Remove archivedAt field when restoring
        const { archivedAt, ...restoredTask } = archivedTask;

        set((state) => ({
          archivedTasks: state.archivedTasks.filter((t) => t.id !== id),
        }));

        log.info('Task restored from archive', { taskId: id });
        return restoredTask as Task;
      },

      deleteArchivedTask: (id: string) => {
        const task = get().archivedTasks.find((t) => t.id === id);

        set((state) => ({
          archivedTasks: state.archivedTasks.filter((t) => t.id !== id),
        }));

        if (task) {
          log.info('Archived task permanently deleted', { taskId: id, title: task.title });
        }
      },

      getArchivedTasks: () => {
        return get().archivedTasks.slice().sort((a, b) => {
          // Sort by archive date (most recent first)
          const dateA = new Date(a.archivedAt || 0).getTime();
          const dateB = new Date(b.archivedAt || 0).getTime();
          return dateB - dateA;
        });
      },

      getTasksToAutoArchive: (activeTasks: Task[]) => {
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        return activeTasks.filter((task) => {
          // Only archive tasks in "done" status
          if (task.status !== 'done') return false;

          // Check if task has been completed for > 14 days
          if (task.lastCompletedAt) {
            const completedDate = new Date(task.lastCompletedAt);
            return completedDate < fourteenDaysAgo;
          }

          return false;
        });
      },

      bulkArchiveTasks: (tasks: Task[]) => {
        const now = new Date().toISOString();
        const archivedTasks = tasks.map((task) => ({
          ...task,
          archivedAt: now,
        }));

        set((state) => ({
          archivedTasks: [...state.archivedTasks, ...archivedTasks],
        }));

        log.info('Bulk archived tasks', { count: tasks.length });
      },

      getArchiveStats: () => {
        const archived = get().archivedTasks;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const archivedThisMonth = archived.filter((task) => {
          if (!task.archivedAt) return false;
          return new Date(task.archivedAt) >= startOfMonth;
        }).length;

        const oldestArchived = archived.reduce((oldest, task) => {
          if (!task.archivedAt) return oldest;
          if (!oldest) return task.archivedAt;
          return new Date(task.archivedAt) < new Date(oldest) ? task.archivedAt : oldest;
        }, null as string | null);

        return {
          totalArchived: archived.length,
          archivedThisMonth,
          oldestArchived,
        };
      },
    }),
    {
      name: 'kanban-archive',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1,
      migrate: (persistedState: unknown, _version: number) => {
        // Future migrations go here
        return persistedState as KanbanArchiveState;
      },
      partialize: (state) => ({
        archivedTasks: state.archivedTasks,
      }),
    }
  )
);

/**
 * Selector: Get archived task by ID
 */
export const selectArchivedTask = (id: string) => {
  return useKanbanArchiveStore.getState().archivedTasks.find((t) => t.id === id);
};

/**
 * Selector: Get archived tasks count
 */
export const selectArchivedTasksCount = () => {
  return useKanbanArchiveStore.getState().archivedTasks.length;
};
