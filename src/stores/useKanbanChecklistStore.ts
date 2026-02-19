import { create } from 'zustand';
import type { Task, ChecklistItem } from '../types';
import { logger } from '../services/logger';

const log = logger.module('KanbanChecklistStore');

/**
 * Phase 8.4: Checklist statistics interface
 */
export interface ChecklistStats {
  totalItems: number;
  completedItems: number;
  completionRate: number;
  tasksWithChecklists: number;
  avgItemsPerTask: number;
}

/**
 * Phase 8.4: Checklist progress for a single task
 */
export interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
}

/**
 * Phase 8.4: Kanban Checklist Store State
 *
 * Manages:
 * - Checklist item CRUD operations (delegates to useKanbanStore)
 * - Toggle and reorder operations
 * - Progress calculations and statistics
 *
 * Note: Checklist items remain on Task objects in useKanbanStore.
 * This store provides focused operations and query functions.
 */
interface KanbanChecklistState {
  // ==================== ITEM CREATION ====================

  /**
   * Create a new checklist item object (pure function)
   * @returns ChecklistItem object ready to add to task
   */
  createChecklistItem: (text: string, order: number) => ChecklistItem;

  // ==================== CHECKLIST CRUD ====================

  /**
   * Add a checklist item to a task
   */
  addChecklistItem: (
    taskId: string,
    text: string,
    getStore: () => {
      tasks: Task[];
      _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void;
      logActivity: (taskId: string, entry: { action: 'checklist_updated'; newValue?: string; oldValue?: string }) => void;
    }
  ) => void;

  /**
   * Update a checklist item's properties
   */
  updateChecklistItem: (
    taskId: string,
    itemId: string,
    updates: Partial<ChecklistItem>,
    getStore: () => {
      tasks: Task[];
      _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void;
    }
  ) => void;

  /**
   * Delete a checklist item from a task
   */
  deleteChecklistItem: (
    taskId: string,
    itemId: string,
    getStore: () => {
      tasks: Task[];
      _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void;
      logActivity: (taskId: string, entry: { action: 'checklist_updated'; oldValue?: string }) => void;
    }
  ) => void;

  /**
   * Toggle a checklist item's completed status
   */
  toggleChecklistItem: (
    taskId: string,
    itemId: string,
    getStore: () => {
      tasks: Task[];
      _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void;
      logActivity: (taskId: string, entry: { action: 'checklist_updated'; newValue?: string }) => void;
    }
  ) => void;

  /**
   * Reorder checklist items
   */
  reorderChecklistItems: (
    taskId: string,
    itemIds: string[],
    getStore: () => {
      tasks: Task[];
      _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void;
    }
  ) => void;

  // ==================== QUERY HELPERS ====================

  /**
   * Get checklist items for a task
   */
  getTaskChecklist: (taskId: string, tasks: Task[]) => ChecklistItem[];

  /**
   * Get checklist progress for a task
   */
  getTaskProgress: (taskId: string, tasks: Task[]) => ChecklistProgress;

  /**
   * Get all incomplete checklist items across tasks
   */
  getIncompleteItems: (
    tasks: Task[]
  ) => { taskId: string; taskTitle: string; item: ChecklistItem }[];

  /**
   * Search checklist items by text
   */
  searchChecklistItems: (
    searchTerm: string,
    tasks: Task[]
  ) => { taskId: string; taskTitle: string; item: ChecklistItem }[];

  // ==================== STATISTICS ====================

  /**
   * Get checklist statistics across all tasks
   */
  getChecklistStats: (tasks: Task[]) => ChecklistStats;
}

/**
 * Phase 8.4: Kanban Checklist Store
 *
 * Single-responsibility store for:
 * - Checklist item CRUD operations
 * - Toggle and reorder operations
 * - Progress and statistics calculations
 *
 * Works with tasks from useKanbanStore via method parameters.
 * No persisted state - all data lives on Task objects.
 */
export const useKanbanChecklistStore = create<KanbanChecklistState>()(
  (_set, get) => ({
    // ==================== ITEM CREATION ====================

    createChecklistItem: (text, order) => {
      return {
        id: `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        completed: false,
        order,
        createdAt: new Date().toISOString(),
      };
    },

    // ==================== CHECKLIST CRUD ====================

    addChecklistItem: (taskId, text, getStore) => {
      const store = getStore();
      const task = store.tasks.find((t) => t.id === taskId);

      if (!task) {
        log.warn('Cannot add checklist item: task not found', { taskId });
        return;
      }

      if (!text.trim()) {
        log.warn('Cannot add empty checklist item', { taskId });
        return;
      }

      const currentChecklist = task.checklist || [];
      const newItem = get().createChecklistItem(text, currentChecklist.length);

      store._updateTaskFieldsDirect(taskId, {
        checklist: [...currentChecklist, newItem],
      });

      // Log the activity
      store.logActivity(taskId, {
        action: 'checklist_updated',
        newValue: `Added: ${text}`,
      });

      log.info('Checklist item added', { taskId, itemId: newItem.id });
    },

    updateChecklistItem: (taskId, itemId, updates, getStore) => {
      const store = getStore();
      const task = store.tasks.find((t) => t.id === taskId);

      if (!task) {
        log.warn('Cannot update checklist item: task not found', { taskId });
        return;
      }

      const item = task.checklist?.find((i) => i.id === itemId);
      if (!item) {
        log.warn('Cannot update checklist item: item not found', { taskId, itemId });
        return;
      }

      store._updateTaskFieldsDirect(taskId, {
        checklist: (task.checklist || []).map((i) =>
          i.id === itemId ? { ...i, ...updates } : i
        ),
      });

      log.info('Checklist item updated', { taskId, itemId });
    },

    deleteChecklistItem: (taskId, itemId, getStore) => {
      const store = getStore();
      const task = store.tasks.find((t) => t.id === taskId);

      if (!task) {
        log.warn('Cannot delete checklist item: task not found', { taskId });
        return;
      }

      const item = task.checklist?.find((i) => i.id === itemId);
      if (!item) {
        log.warn('Cannot delete checklist item: item not found', { taskId, itemId });
        return;
      }

      store._updateTaskFieldsDirect(taskId, {
        checklist: (task.checklist || []).filter((i) => i.id !== itemId),
      });

      // Log the deletion
      store.logActivity(taskId, {
        action: 'checklist_updated',
        oldValue: `Removed: ${item.text}`,
      });

      log.info('Checklist item deleted', { taskId, itemId });
    },

    toggleChecklistItem: (taskId, itemId, getStore) => {
      const store = getStore();
      const task = store.tasks.find((t) => t.id === taskId);

      if (!task) {
        log.warn('Cannot toggle checklist item: task not found', { taskId });
        return;
      }

      const item = task.checklist?.find((i) => i.id === itemId);
      if (!item) {
        log.warn('Cannot toggle checklist item: item not found', { taskId, itemId });
        return;
      }

      const newCompleted = !item.completed;

      store._updateTaskFieldsDirect(taskId, {
        checklist: (task.checklist || []).map((i) =>
          i.id === itemId ? { ...i, completed: newCompleted } : i
        ),
      });

      // Log the toggle
      store.logActivity(taskId, {
        action: 'checklist_updated',
        newValue: `${newCompleted ? 'Completed' : 'Unchecked'}: ${item.text}`,
      });

      log.info('Checklist item toggled', { taskId, itemId, completed: newCompleted });
    },

    reorderChecklistItems: (taskId, itemIds, getStore) => {
      const store = getStore();
      const task = store.tasks.find((t) => t.id === taskId);

      if (!task) {
        log.warn('Cannot reorder checklist: task not found', { taskId });
        return;
      }

      if (!task.checklist || task.checklist.length === 0) {
        log.warn('Cannot reorder empty checklist', { taskId });
        return;
      }

      const reordered = itemIds
        .map((id) => task.checklist?.find((item) => item.id === id))
        .filter((item): item is ChecklistItem => item !== undefined)
        .map((item, index) => ({ ...item, order: index }));

      if (reordered.length !== task.checklist.length) {
        log.warn('Reorder mismatch: some items not found', {
          taskId,
          expected: task.checklist.length,
          found: reordered.length,
        });
      }

      store._updateTaskFieldsDirect(taskId, {
        checklist: reordered,
      });

      log.info('Checklist reordered', { taskId, newOrder: itemIds });
    },

    // ==================== QUERY HELPERS ====================

    getTaskChecklist: (taskId, tasks) => {
      const task = tasks.find((t) => t.id === taskId);
      const checklist = task?.checklist || [];
      // Return sorted by order
      return [...checklist].sort((a, b) => a.order - b.order);
    },

    getTaskProgress: (taskId, tasks) => {
      const task = tasks.find((t) => t.id === taskId);
      const checklist = task?.checklist || [];

      if (checklist.length === 0) {
        return { total: 0, completed: 0, percentage: 0 };
      }

      const completed = checklist.filter((item) => item.completed).length;
      return {
        total: checklist.length,
        completed,
        percentage: Math.round((completed / checklist.length) * 100),
      };
    },

    getIncompleteItems: (tasks) => {
      const result: { taskId: string; taskTitle: string; item: ChecklistItem }[] = [];

      for (const task of tasks) {
        if (task.checklist) {
          for (const item of task.checklist) {
            if (!item.completed) {
              result.push({
                taskId: task.id,
                taskTitle: task.title,
                item,
              });
            }
          }
        }
      }

      // Sort by creation date (newest first)
      result.sort(
        (a, b) =>
          new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime()
      );

      return result;
    },

    searchChecklistItems: (searchTerm, tasks) => {
      const result: { taskId: string; taskTitle: string; item: ChecklistItem }[] = [];
      const lowerSearch = searchTerm.toLowerCase();

      for (const task of tasks) {
        if (task.checklist) {
          for (const item of task.checklist) {
            if (item.text.toLowerCase().includes(lowerSearch)) {
              result.push({
                taskId: task.id,
                taskTitle: task.title,
                item,
              });
            }
          }
        }
      }

      return result;
    },

    // ==================== STATISTICS ====================

    getChecklistStats: (tasks) => {
      const tasksWithChecklists = tasks.filter(
        (t) => t.checklist && t.checklist.length > 0
      );

      let totalItems = 0;
      let completedItems = 0;

      for (const task of tasks) {
        if (task.checklist) {
          totalItems += task.checklist.length;
          completedItems += task.checklist.filter((i) => i.completed).length;
        }
      }

      return {
        totalItems,
        completedItems,
        completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        tasksWithChecklists: tasksWithChecklists.length,
        avgItemsPerTask:
          tasksWithChecklists.length > 0
            ? Math.round((totalItems / tasksWithChecklists.length) * 10) / 10
            : 0,
      };
    },
  })
);

// ==================== SELECTORS ====================

/**
 * Selector: Get total checklist item count across all tasks
 */
export const selectTotalChecklistItems = (tasks: Task[]): number => {
  return tasks.reduce((sum, t) => sum + (t.checklist?.length || 0), 0);
};

/**
 * Selector: Check if a task has checklist items
 */
export const selectTaskHasChecklist = (taskId: string, tasks: Task[]): boolean => {
  const task = tasks.find((t) => t.id === taskId);
  return (task?.checklist?.length || 0) > 0;
};

/**
 * Selector: Get checklist completion percentage for a task
 */
export const selectTaskChecklistProgress = (taskId: string, tasks: Task[]): number => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task?.checklist || task.checklist.length === 0) return 0;
  const completed = task.checklist.filter((i) => i.completed).length;
  return Math.round((completed / task.checklist.length) * 100);
};
