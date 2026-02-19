import { create } from 'zustand';
import type { Task, TaskComment, ActivityLogEntry } from '../types';
import { logger } from '../services/logger';

const log = logger.module('KanbanCommentsStore');

/**
 * Phase 8.3: Comment statistics interface
 */
export interface CommentStats {
  totalComments: number;
  tasksWithComments: number;
  avgCommentsPerTask: number;
}

/**
 * Phase 8.3: Activity statistics interface
 */
export interface ActivityStats {
  totalActivities: number;
  activitiesByAction: Record<ActivityLogEntry['action'], number>;
  recentActivityCount: number; // Last 24 hours
}

/**
 * Phase 8.3: Kanban Comments Store State
 *
 * Manages:
 * - Comment CRUD operations (delegates to useKanbanStore)
 * - Activity logging (delegates to useKanbanStore)
 * - Query helpers for comments and activity logs
 *
 * Note: Comments and activity logs remain on Task objects in useKanbanStore.
 * This store provides focused operations and query functions.
 */
interface KanbanCommentsState {
  // ==================== COMMENT OBJECT CREATION ====================

  /**
   * Create a new comment object (pure function)
   * @returns TaskComment object ready to add to task
   */
  createComment: (taskId: string, text: string, author?: string) => TaskComment;

  /**
   * Create a new activity log entry object (pure function)
   * @returns ActivityLogEntry object ready to add to task
   */
  createActivityEntry: (
    details: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId'>
  ) => ActivityLogEntry;

  // ==================== COMMENT CRUD ====================
  // These call useKanbanStore._updateTaskFieldsDirect to avoid double-logging

  /**
   * Add a comment to a task
   */
  addComment: (
    taskId: string,
    text: string,
    getStore: () => { tasks: Task[]; _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void }
  ) => void;

  /**
   * Update an existing comment
   */
  updateComment: (
    taskId: string,
    commentId: string,
    text: string,
    getStore: () => { tasks: Task[]; _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void }
  ) => void;

  /**
   * Delete a comment from a task
   */
  deleteComment: (
    taskId: string,
    commentId: string,
    getStore: () => { tasks: Task[]; _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void }
  ) => void;

  // ==================== ACTIVITY LOGGING ====================

  /**
   * Log an activity entry for a task
   */
  logActivity: (
    taskId: string,
    entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId'>,
    getStore: () => { tasks: Task[]; _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => void }
  ) => void;

  // ==================== QUERY HELPERS ====================

  /**
   * Get all comments for a task
   */
  getTaskComments: (taskId: string, tasks: Task[]) => TaskComment[];

  /**
   * Get activity log for a task
   */
  getTaskActivity: (
    taskId: string,
    tasks: Task[],
    limit?: number
  ) => ActivityLogEntry[];

  /**
   * Get recent activity across all tasks
   * @returns Activity entries with their task IDs, sorted by timestamp descending
   */
  getRecentActivity: (
    tasks: Task[],
    limit?: number
  ) => { taskId: string; taskTitle: string; entry: ActivityLogEntry }[];

  /**
   * Search comments across all tasks
   * @returns Matching comments with their task IDs
   */
  searchComments: (
    searchTerm: string,
    tasks: Task[]
  ) => { taskId: string; taskTitle: string; comment: TaskComment }[];

  // ==================== STATISTICS ====================

  /**
   * Get comment statistics across all tasks
   */
  getCommentStats: (tasks: Task[]) => CommentStats;

  /**
   * Get activity statistics across all tasks
   */
  getActivityStats: (tasks: Task[]) => ActivityStats;
}

/**
 * Phase 8.3: Kanban Comments Store
 *
 * Single-responsibility store for:
 * - Comment CRUD operations
 * - Activity log management
 * - Comment/activity queries and statistics
 *
 * Works with tasks from useKanbanStore via method parameters.
 * No persisted state - all data lives on Task objects.
 */
export const useKanbanCommentsStore = create<KanbanCommentsState>()((_set, get) => ({
  // ==================== COMMENT OBJECT CREATION ====================

  createComment: (taskId, text, author = 'You') => {
    return {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      text,
      author,
      createdAt: new Date().toISOString(),
    };
  },

  createActivityEntry: (details) => {
    return {
      ...details,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: 'You', // For now, always "You"
    };
  },

  // ==================== COMMENT CRUD ====================

  addComment: (taskId, text, getStore) => {
    const store = getStore();
    const task = store.tasks.find((t) => t.id === taskId);

    if (!task) {
      log.warn('Cannot add comment: task not found', { taskId });
      return;
    }

    if (!text.trim()) {
      log.warn('Cannot add empty comment', { taskId });
      return;
    }

    const newComment = get().createComment(taskId, text);

    // Update task with new comment
    store._updateTaskFieldsDirect(taskId, {
      comments: [...(task.comments || []), newComment],
    });

    // Log the comment activity
    get().logActivity(
      taskId,
      {
        action: 'commented',
        newValue: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      },
      getStore
    );

    log.info('Comment added', { taskId, commentId: newComment.id });
  },

  updateComment: (taskId, commentId, text, getStore) => {
    const store = getStore();
    const task = store.tasks.find((t) => t.id === taskId);

    if (!task) {
      log.warn('Cannot update comment: task not found', { taskId });
      return;
    }

    const comment = task.comments?.find((c) => c.id === commentId);
    if (!comment) {
      log.warn('Cannot update comment: comment not found', { taskId, commentId });
      return;
    }

    if (!text.trim()) {
      log.warn('Cannot update to empty comment', { taskId, commentId });
      return;
    }

    store._updateTaskFieldsDirect(taskId, {
      comments: (task.comments || []).map((c) =>
        c.id === commentId
          ? { ...c, text, updatedAt: new Date().toISOString() }
          : c
      ),
    });

    log.info('Comment updated', { taskId, commentId });
  },

  deleteComment: (taskId, commentId, getStore) => {
    const store = getStore();
    const task = store.tasks.find((t) => t.id === taskId);

    if (!task) {
      log.warn('Cannot delete comment: task not found', { taskId });
      return;
    }

    const comment = task.comments?.find((c) => c.id === commentId);
    if (!comment) {
      log.warn('Cannot delete comment: comment not found', { taskId, commentId });
      return;
    }

    store._updateTaskFieldsDirect(taskId, {
      comments: (task.comments || []).filter((c) => c.id !== commentId),
    });

    log.info('Comment deleted', { taskId, commentId });
  },

  // ==================== ACTIVITY LOGGING ====================

  logActivity: (taskId, entry, getStore) => {
    const store = getStore();
    const task = store.tasks.find((t) => t.id === taskId);

    if (!task) {
      log.warn('Cannot log activity: task not found', { taskId });
      return;
    }

    const newEntry = get().createActivityEntry(entry);

    store._updateTaskFieldsDirect(taskId, {
      activityLog: [
        ...(task.activityLog || []),
        newEntry,
      ].slice(-100), // Keep last 100 entries max (prevent bloat)
    });
  },

  // ==================== QUERY HELPERS ====================

  getTaskComments: (taskId, tasks) => {
    const task = tasks.find((t) => t.id === taskId);
    return task?.comments || [];
  },

  getTaskActivity: (taskId, tasks, limit) => {
    const task = tasks.find((t) => t.id === taskId);
    const activity = task?.activityLog || [];

    // Sort by timestamp descending (most recent first)
    const sorted = [...activity].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return limit ? sorted.slice(0, limit) : sorted;
  },

  getRecentActivity: (tasks, limit = 20) => {
    const allActivity: { taskId: string; taskTitle: string; entry: ActivityLogEntry }[] = [];

    for (const task of tasks) {
      if (task.activityLog) {
        for (const entry of task.activityLog) {
          allActivity.push({
            taskId: task.id,
            taskTitle: task.title,
            entry,
          });
        }
      }
    }

    // Sort by timestamp descending
    allActivity.sort(
      (a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime()
    );

    return allActivity.slice(0, limit);
  },

  searchComments: (searchTerm, tasks) => {
    const results: { taskId: string; taskTitle: string; comment: TaskComment }[] = [];
    const lowerSearch = searchTerm.toLowerCase();

    for (const task of tasks) {
      if (task.comments) {
        for (const comment of task.comments) {
          if (comment.text.toLowerCase().includes(lowerSearch)) {
            results.push({
              taskId: task.id,
              taskTitle: task.title,
              comment,
            });
          }
        }
      }
    }

    // Sort by creation date descending
    results.sort(
      (a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime()
    );

    return results;
  },

  // ==================== STATISTICS ====================

  getCommentStats: (tasks) => {
    const tasksWithComments = tasks.filter(
      (t) => t.comments && t.comments.length > 0
    );

    const totalComments = tasks.reduce(
      (sum, t) => sum + (t.comments?.length || 0),
      0
    );

    return {
      totalComments,
      tasksWithComments: tasksWithComments.length,
      avgCommentsPerTask:
        tasksWithComments.length > 0
          ? totalComments / tasksWithComments.length
          : 0,
    };
  },

  getActivityStats: (tasks) => {
    const allActivities: ActivityLogEntry[] = [];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const task of tasks) {
      if (task.activityLog) {
        allActivities.push(...task.activityLog);
      }
    }

    // Count by action type
    const activitiesByAction: Record<ActivityLogEntry['action'], number> = {
      created: 0,
      updated: 0,
      moved: 0,
      commented: 0,
      checklist_updated: 0,
    };

    let recentCount = 0;

    for (const activity of allActivities) {
      activitiesByAction[activity.action]++;
      if (new Date(activity.timestamp).getTime() > oneDayAgo) {
        recentCount++;
      }
    }

    return {
      totalActivities: allActivities.length,
      activitiesByAction,
      recentActivityCount: recentCount,
    };
  },
}));

// ==================== SELECTORS ====================

/**
 * Selector: Get total comment count across all tasks
 */
export const selectTotalComments = (tasks: Task[]): number => {
  return tasks.reduce((sum, t) => sum + (t.comments?.length || 0), 0);
};

/**
 * Selector: Check if a task has comments
 */
export const selectTaskHasComments = (taskId: string, tasks: Task[]): boolean => {
  const task = tasks.find((t) => t.id === taskId);
  return (task?.comments?.length || 0) > 0;
};

/**
 * Selector: Get comment count for a task
 */
export const selectTaskCommentCount = (taskId: string, tasks: Task[]): number => {
  const task = tasks.find((t) => t.id === taskId);
  return task?.comments?.length || 0;
};
