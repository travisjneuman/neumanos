import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Task } from '../types';

/**
 * Tasks Database using Dexie.js for IndexedDB
 * Handles efficient storage and querying of Kanban tasks with compound indexes
 */
class TasksDatabase extends Dexie {
  tasks!: Table<Task, string>;

  constructor() {
    // Historical name retained for data continuity — do not rename without migration
    super('NeumanBrainTasks');

    // Schema version 1 with compound indexes for common query patterns
    this.version(1).stores({
      // Primary key: id
      // Compound indexes:
      // - [status+cardNumber]: For Kanban column sorting (by card number within column)
      // - [dueDate+status]: For calendar queries and overdue tasks
      // - status: For column filtering
      // - dueDate: For date-based queries
      // - *tags: MultiEntry index for tag filtering
      tasks: 'id, [status+cardNumber], [dueDate+status], status, dueDate, *tags, priority, isRecurringParent, recurrenceId'
    });
  }
}

// Create database instance
export const db = new TasksDatabase();

/**
 * Tasks Database Helper Functions
 * Provides a clean API for database operations optimized with compound indexes
 */
export const tasksDb = {
  // ==================== TASKS CRUD ====================

  /**
   * Add a new task
   */
  async addTask(task: Task): Promise<void> {
    await db.tasks.add(task);
  },

  /**
   * Get a single task by ID
   */
  async getTask(id: string): Promise<Task | undefined> {
    return await db.tasks.get(id);
  },

  /**
   * Update a task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await db.tasks.update(id, updates);
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return await db.tasks.toArray();
  },

  // ==================== OPTIMIZED QUERIES (using compound indexes) ====================

  /**
   * Get tasks by status (column), sorted by cardNumber (OPTIMIZED with compound index)
   * Uses [status+cardNumber] compound index for fast Kanban column rendering
   */
  async getTasksByStatus(status: string, order: 'asc' | 'desc' = 'asc'): Promise<Task[]> {
    const collection = db.tasks
      .where('[status+cardNumber]')
      .between(
        [status, Dexie.minKey],
        [status, Dexie.maxKey],
        true,
        true
      );

    return order === 'desc'
      ? await collection.reverse().toArray()
      : await collection.toArray();
  },

  /**
   * Get tasks by due date range and completion status (OPTIMIZED with compound index)
   * Uses [dueDate+status] compound index for calendar views and overdue queries
   */
  async getTasksByDueDateRange(
    startDate: string | null,
    endDate: string | null,
    excludeDone = false
  ): Promise<Task[]> {
    if (!startDate || !endDate) {
      // If no date range, return empty array
      return [];
    }

    // Use compound index for efficient range queries
    const tasks = await db.tasks
      .where('dueDate')
      .between(startDate, endDate, true, true)
      .toArray();

    return excludeDone
      ? tasks.filter(t => t.status !== 'done')
      : tasks;
  },

  /**
   * Get overdue tasks (not completed, past due date) (OPTIMIZED)
   * Uses [dueDate+status] compound index
   */
  async getOverdueTasks(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tasks = await db.tasks
      .where('dueDate')
      .below(todayStr)
      .toArray();

    return tasks.filter(t => t.status !== 'done');
  },

  /**
   * Get tasks due today
   */
  async getTasksDueToday(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return await db.tasks
      .where('dueDate')
      .equals(todayStr)
      .toArray();
  },

  /**
   * Get tasks by tag
   */
  async getTasksByTag(tag: string): Promise<Task[]> {
    return await db.tasks
      .where('tags')
      .equals(tag)
      .toArray();
  },

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(priority: string): Promise<Task[]> {
    return await db.tasks
      .where('priority')
      .equals(priority)
      .toArray();
  },

  /**
   * Get recurring parent tasks
   */
  async getRecurringParents(): Promise<Task[]> {
    return await db.tasks
      .where('isRecurringParent')
      .equals(1)
      .toArray();
  },

  /**
   * Get recurring task instances by parent ID
   */
  async getRecurringInstances(parentId: string): Promise<Task[]> {
    return await db.tasks
      .where('recurrenceId')
      .equals(parentId)
      .toArray();
  },

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk update tasks (for status changes, bulk edits, etc.)
   */
  async bulkUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>): Promise<void> {
    await db.transaction('rw', db.tasks, async () => {
      for (const { id, updates: taskUpdates } of updates) {
        await db.tasks.update(id, taskUpdates);
      }
    });
  },

  /**
   * Bulk delete tasks
   */
  async bulkDeleteTasks(ids: string[]): Promise<void> {
    await db.tasks.bulkDelete(ids);
  },

  /**
   * Import tasks (for backup restore)
   */
  async importTasks(tasks: Task[]): Promise<void> {
    await db.tasks.bulkAdd(tasks);
  },

  /**
   * Export all tasks (for backup)
   */
  async exportAllTasks(): Promise<Task[]> {
    return await db.tasks.toArray();
  },

  /**
   * Clear all tasks (for testing or reset)
   */
  async clearAllTasks(): Promise<void> {
    await db.tasks.clear();
  },

  // ==================== STATISTICS ====================

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalTasks: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdueCount: number;
    dueTodayCount: number;
    recurringParentsCount: number;
  }> {
    const tasks = await db.tasks.toArray();
    const overdue = await this.getOverdueTasks();
    const dueToday = await this.getTasksDueToday();
    const recurringParents = tasks.filter(t => t.isRecurringParent);

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    tasks.forEach(task => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
    });

    return {
      totalTasks: tasks.length,
      byStatus,
      byPriority,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      recurringParentsCount: recurringParents.length
    };
  }
};

export default tasksDb;
