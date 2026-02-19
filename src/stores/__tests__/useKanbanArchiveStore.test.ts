import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKanbanArchiveStore, selectArchivedTask, selectArchivedTasksCount } from '../useKanbanArchiveStore';
import type { Task, TaskStatus, TaskPriority } from '../../types';

// Mock createSyncedStorage
vi.mock('../../lib/syncedStorage', () => ({
  createSyncedStorage: () => ({
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

/**
 * Phase 8.1: Unit tests for useKanbanArchiveStore
 *
 * Tests archive store functionality in isolation:
 * - Archive/restore operations
 * - Bulk operations
 * - Sorting and filtering
 * - Statistics
 */

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Task',
  description: 'Test description',
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  created: new Date().toISOString(),
  startDate: null,
  dueDate: null,
  tags: [],
  projectIds: [],
  ...overrides,
});

describe('useKanbanArchiveStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useKanbanArchiveStore.setState({ archivedTasks: [] });
  });

  describe('archiveTask', () => {
    it('should add a task to archived tasks with archivedAt timestamp', () => {
      const task = createMockTask({ id: 'task-1', title: 'Task to archive' });

      useKanbanArchiveStore.getState().archiveTask(task);

      const archived = useKanbanArchiveStore.getState().archivedTasks;
      expect(archived).toHaveLength(1);
      expect(archived[0].id).toBe('task-1');
      expect(archived[0].title).toBe('Task to archive');
      expect(archived[0].archivedAt).toBeDefined();
    });

    it('should preserve all task properties when archiving', () => {
      const task = createMockTask({
        id: 'task-2',
        title: 'Complex task',
        description: 'With description',
        priority: 'high',
        tags: ['tag1', 'tag2'],
        dueDate: '2025-12-31',
      });

      useKanbanArchiveStore.getState().archiveTask(task);

      const archived = useKanbanArchiveStore.getState().archivedTasks[0];
      expect(archived.title).toBe('Complex task');
      expect(archived.description).toBe('With description');
      expect(archived.priority).toBe('high');
      expect(archived.tags).toEqual(['tag1', 'tag2']);
      expect(archived.dueDate).toBe('2025-12-31');
    });
  });

  describe('restoreTask', () => {
    it('should remove task from archive and return it without archivedAt', () => {
      const task = createMockTask({ id: 'task-3', title: 'Task to restore' });
      useKanbanArchiveStore.getState().archiveTask(task);

      const restoredTask = useKanbanArchiveStore.getState().restoreTask('task-3');

      expect(restoredTask).not.toBeNull();
      expect(restoredTask!.id).toBe('task-3');
      expect(restoredTask!.archivedAt).toBeUndefined();
      expect(useKanbanArchiveStore.getState().archivedTasks).toHaveLength(0);
    });

    it('should return null for non-existent task', () => {
      const result = useKanbanArchiveStore.getState().restoreTask('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('deleteArchivedTask', () => {
    it('should permanently delete an archived task', () => {
      const task = createMockTask({ id: 'task-4' });
      useKanbanArchiveStore.getState().archiveTask(task);

      useKanbanArchiveStore.getState().deleteArchivedTask('task-4');

      expect(useKanbanArchiveStore.getState().archivedTasks).toHaveLength(0);
    });

    it('should not affect other archived tasks', () => {
      const task1 = createMockTask({ id: 'task-5' });
      const task2 = createMockTask({ id: 'task-6' });
      useKanbanArchiveStore.getState().archiveTask(task1);
      useKanbanArchiveStore.getState().archiveTask(task2);

      useKanbanArchiveStore.getState().deleteArchivedTask('task-5');

      const archived = useKanbanArchiveStore.getState().archivedTasks;
      expect(archived).toHaveLength(1);
      expect(archived[0].id).toBe('task-6');
    });
  });

  describe('getArchivedTasks', () => {
    it('should return tasks sorted by archive date (most recent first)', () => {
      const task1 = createMockTask({ id: 'task-7' });
      const task2 = createMockTask({ id: 'task-8' });
      const task3 = createMockTask({ id: 'task-9' });

      // Manually set archivedAt to control order
      useKanbanArchiveStore.setState({
        archivedTasks: [
          { ...task1, archivedAt: '2025-12-01T00:00:00Z' },
          { ...task2, archivedAt: '2025-12-03T00:00:00Z' }, // Most recent
          { ...task3, archivedAt: '2025-12-02T00:00:00Z' },
        ],
      });

      const sorted = useKanbanArchiveStore.getState().getArchivedTasks();

      expect(sorted[0].id).toBe('task-8'); // Dec 3 (most recent)
      expect(sorted[1].id).toBe('task-9'); // Dec 2
      expect(sorted[2].id).toBe('task-7'); // Dec 1 (oldest)
    });
  });

  describe('getTasksToAutoArchive', () => {
    it('should return done tasks completed more than 14 days ago', () => {
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const oldCompletedTask = createMockTask({
        id: 'old-done',
        status: 'done',
        lastCompletedAt: fifteenDaysAgo.toISOString(),
      });

      const recentCompletedTask = createMockTask({
        id: 'recent-done',
        status: 'done',
        lastCompletedAt: fiveDaysAgo.toISOString(),
      });

      const inProgressTask = createMockTask({
        id: 'in-progress',
        status: 'inprogress',
      });

      const activeTasks = [oldCompletedTask, recentCompletedTask, inProgressTask];

      const toArchive = useKanbanArchiveStore.getState().getTasksToAutoArchive(activeTasks);

      expect(toArchive).toHaveLength(1);
      expect(toArchive[0].id).toBe('old-done');
    });

    it('should not include tasks without lastCompletedAt', () => {
      const doneTaskNoDate = createMockTask({
        id: 'done-no-date',
        status: 'done',
        // No lastCompletedAt
      });

      const toArchive = useKanbanArchiveStore.getState().getTasksToAutoArchive([doneTaskNoDate]);

      expect(toArchive).toHaveLength(0);
    });
  });

  describe('bulkArchiveTasks', () => {
    it('should archive multiple tasks at once', () => {
      const tasks = [
        createMockTask({ id: 'bulk-1' }),
        createMockTask({ id: 'bulk-2' }),
        createMockTask({ id: 'bulk-3' }),
      ];

      useKanbanArchiveStore.getState().bulkArchiveTasks(tasks);

      const archived = useKanbanArchiveStore.getState().archivedTasks;
      expect(archived).toHaveLength(3);
      expect(archived.every((t) => t.archivedAt)).toBe(true);
    });

    it('should set the same archivedAt for all bulk archived tasks', () => {
      const tasks = [
        createMockTask({ id: 'bulk-4' }),
        createMockTask({ id: 'bulk-5' }),
      ];

      useKanbanArchiveStore.getState().bulkArchiveTasks(tasks);

      const archived = useKanbanArchiveStore.getState().archivedTasks;
      expect(archived[0].archivedAt).toBe(archived[1].archivedAt);
    });
  });

  describe('getArchiveStats', () => {
    it('should return correct statistics', () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      useKanbanArchiveStore.setState({
        archivedTasks: [
          { ...createMockTask({ id: 'stat-1' }), archivedAt: now.toISOString() },
          { ...createMockTask({ id: 'stat-2' }), archivedAt: now.toISOString() },
          { ...createMockTask({ id: 'stat-3' }), archivedAt: lastMonth.toISOString() },
        ],
      });

      const stats = useKanbanArchiveStore.getState().getArchiveStats();

      expect(stats.totalArchived).toBe(3);
      expect(stats.archivedThisMonth).toBe(2);
      expect(stats.oldestArchived).toBe(lastMonth.toISOString());
    });

    it('should return null for oldestArchived when no tasks', () => {
      const stats = useKanbanArchiveStore.getState().getArchiveStats();

      expect(stats.totalArchived).toBe(0);
      expect(stats.archivedThisMonth).toBe(0);
      expect(stats.oldestArchived).toBeNull();
    });
  });

  describe('selectors', () => {
    it('selectArchivedTask should find task by ID', () => {
      const task = createMockTask({ id: 'selector-test' });
      useKanbanArchiveStore.getState().archiveTask(task);

      const found = selectArchivedTask('selector-test');

      expect(found).toBeDefined();
      expect(found!.id).toBe('selector-test');
    });

    it('selectArchivedTask should return undefined for non-existent ID', () => {
      const found = selectArchivedTask('non-existent');
      expect(found).toBeUndefined();
    });

    it('selectArchivedTasksCount should return correct count', () => {
      useKanbanArchiveStore.setState({
        archivedTasks: [
          { ...createMockTask({ id: 'count-1' }), archivedAt: new Date().toISOString() },
          { ...createMockTask({ id: 'count-2' }), archivedAt: new Date().toISOString() },
        ],
      });

      expect(selectArchivedTasksCount()).toBe(2);
    });
  });
});
