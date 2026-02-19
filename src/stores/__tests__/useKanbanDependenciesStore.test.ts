import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useKanbanDependenciesStore,
  selectHasBaseline,
  selectBaselineTaskCount,
  selectBaselineDate,
} from '../useKanbanDependenciesStore';
import type { Task, TaskStatus, TaskPriority, TaskDependency } from '../../types';

// Mock createSyncedStorage
vi.mock('../../lib/syncedStorage', () => ({
  createSyncedStorage: () => ({
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }),
}));

/**
 * Phase 8.2: Unit tests for useKanbanDependenciesStore
 *
 * Tests dependency store functionality:
 * - Baseline management (set, clear, get)
 * - Dependency queries (blockers, blocked, overdue)
 * - Circular dependency detection
 * - Dependency validation
 * - Critical path analysis
 * - Statistics
 * - Selectors
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

const createMockDependency = (
  taskId: string,
  type: TaskDependency['type'] = 'finish-to-start',
  lag = 0
): TaskDependency => ({
  taskId,
  type,
  lag,
});

describe('useKanbanDependenciesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useKanbanDependenciesStore.setState({ baseline: null });
  });

  // ==================== BASELINE TESTS ====================

  describe('baseline management', () => {
    it('should set baseline from tasks', () => {
      const tasks = [
        createMockTask({ id: 'task-1', startDate: '2025-01-01', dueDate: '2025-01-15' }),
        createMockTask({ id: 'task-2', startDate: '2025-01-10', dueDate: '2025-01-20' }),
      ];

      useKanbanDependenciesStore.getState().setBaseline(tasks);

      const baseline = useKanbanDependenciesStore.getState().baseline;
      expect(baseline).not.toBeNull();
      expect(baseline!.tasks).toHaveLength(2);
      expect(baseline!.setAt).toBeDefined();
    });

    it('should clear baseline', () => {
      const tasks = [createMockTask({ id: 'task-1' })];
      useKanbanDependenciesStore.getState().setBaseline(tasks);

      useKanbanDependenciesStore.getState().clearBaseline();

      expect(useKanbanDependenciesStore.getState().baseline).toBeNull();
    });

    it('should get baseline', () => {
      // Note: createBaselineSnapshot only includes tasks with dates
      const tasks = [createMockTask({ id: 'task-1', startDate: '2025-01-01', dueDate: '2025-01-15' })];
      useKanbanDependenciesStore.getState().setBaseline(tasks);

      const baseline = useKanbanDependenciesStore.getState().getBaseline();

      expect(baseline).not.toBeNull();
      expect(baseline!.tasks).toHaveLength(1);
    });

    it('should return null when no baseline set', () => {
      const baseline = useKanbanDependenciesStore.getState().getBaseline();
      expect(baseline).toBeNull();
    });
  });

  // ==================== DEPENDENCY QUERY TESTS ====================

  describe('getBlockers', () => {
    it('should return tasks that block the given task', () => {
      const blocker1 = createMockTask({ id: 'blocker-1', title: 'Blocker 1' });
      const blocker2 = createMockTask({ id: 'blocker-2', title: 'Blocker 2' });
      const mainTask = createMockTask({
        id: 'main-task',
        dependencies: [
          createMockDependency('blocker-1'),
          createMockDependency('blocker-2'),
        ],
      });
      const unrelatedTask = createMockTask({ id: 'unrelated' });

      const tasks = [blocker1, blocker2, mainTask, unrelatedTask];
      const blockers = useKanbanDependenciesStore.getState().getBlockers('main-task', tasks);

      expect(blockers).toHaveLength(2);
      expect(blockers.map(t => t.id)).toContain('blocker-1');
      expect(blockers.map(t => t.id)).toContain('blocker-2');
    });

    it('should return empty array for task without dependencies', () => {
      const task = createMockTask({ id: 'task-1' });
      const blockers = useKanbanDependenciesStore.getState().getBlockers('task-1', [task]);
      expect(blockers).toEqual([]);
    });

    it('should return empty array for non-existent task', () => {
      const blockers = useKanbanDependenciesStore.getState().getBlockers('non-existent', []);
      expect(blockers).toEqual([]);
    });
  });

  describe('getBlocked', () => {
    it('should return tasks that are blocked by the given task', () => {
      const blocker = createMockTask({ id: 'blocker' });
      const blockedTask1 = createMockTask({
        id: 'blocked-1',
        dependencies: [createMockDependency('blocker')],
      });
      const blockedTask2 = createMockTask({
        id: 'blocked-2',
        dependencies: [createMockDependency('blocker')],
      });
      const unrelatedTask = createMockTask({ id: 'unrelated' });

      const tasks = [blocker, blockedTask1, blockedTask2, unrelatedTask];
      const blocked = useKanbanDependenciesStore.getState().getBlocked('blocker', tasks);

      expect(blocked).toHaveLength(2);
      expect(blocked.map(t => t.id)).toContain('blocked-1');
      expect(blocked.map(t => t.id)).toContain('blocked-2');
    });

    it('should return empty array when no tasks depend on given task', () => {
      const task = createMockTask({ id: 'task-1' });
      const blocked = useKanbanDependenciesStore.getState().getBlocked('task-1', [task]);
      expect(blocked).toEqual([]);
    });
  });

  describe('getOverdueBlockers', () => {
    it('should return blocker tasks that are overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const overdueBlocker = createMockTask({
        id: 'overdue-blocker',
        status: 'todo',
        dueDate: yesterday.toISOString().split('T')[0],
      });
      const onTimeBlocker = createMockTask({
        id: 'on-time-blocker',
        status: 'todo',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      const mainTask = createMockTask({
        id: 'main-task',
        dependencies: [
          createMockDependency('overdue-blocker'),
          createMockDependency('on-time-blocker'),
        ],
      });

      const tasks = [overdueBlocker, onTimeBlocker, mainTask];
      const overdueBlockers = useKanbanDependenciesStore.getState().getOverdueBlockers('main-task', tasks);

      expect(overdueBlockers).toHaveLength(1);
      expect(overdueBlockers[0].id).toBe('overdue-blocker');
    });

    it('should not include completed blockers as overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const completedBlocker = createMockTask({
        id: 'completed-blocker',
        status: 'done',
        dueDate: yesterday.toISOString().split('T')[0],
      });
      const mainTask = createMockTask({
        id: 'main-task',
        dependencies: [createMockDependency('completed-blocker')],
      });

      const tasks = [completedBlocker, mainTask];
      const overdueBlockers = useKanbanDependenciesStore.getState().getOverdueBlockers('main-task', tasks);

      expect(overdueBlockers).toHaveLength(0);
    });

    it('should not include blockers without due dates', () => {
      const blockerWithoutDue = createMockTask({
        id: 'no-due-blocker',
        status: 'todo',
        dueDate: null,
      });
      const mainTask = createMockTask({
        id: 'main-task',
        dependencies: [createMockDependency('no-due-blocker')],
      });

      const tasks = [blockerWithoutDue, mainTask];
      const overdueBlockers = useKanbanDependenciesStore.getState().getOverdueBlockers('main-task', tasks);

      expect(overdueBlockers).toHaveLength(0);
    });
  });

  // ==================== CIRCULAR DEPENDENCY TESTS ====================

  describe('wouldCreateCircularDependency', () => {
    it('should detect self-dependency as circular', () => {
      const task = createMockTask({ id: 'task-1' });

      const isCircular = useKanbanDependenciesStore.getState()
        .wouldCreateCircularDependency('task-1', 'task-1', [task]);

      expect(isCircular).toBe(true);
    });

    it('should detect direct circular dependency', () => {
      const taskA = createMockTask({
        id: 'task-a',
        dependencies: [createMockDependency('task-b')],
      });
      const taskB = createMockTask({ id: 'task-b' });

      const tasks = [taskA, taskB];

      // If B depends on A, and A already depends on B, it's circular
      const isCircular = useKanbanDependenciesStore.getState()
        .wouldCreateCircularDependency('task-b', 'task-a', tasks);

      expect(isCircular).toBe(true);
    });

    it('should detect indirect circular dependency (A→B→C→A)', () => {
      const taskA = createMockTask({ id: 'task-a' });
      const taskB = createMockTask({
        id: 'task-b',
        dependencies: [createMockDependency('task-a')],
      });
      const taskC = createMockTask({
        id: 'task-c',
        dependencies: [createMockDependency('task-b')],
      });

      const tasks = [taskA, taskB, taskC];

      // If A depends on C, it creates: A→C→B→A (circular)
      const isCircular = useKanbanDependenciesStore.getState()
        .wouldCreateCircularDependency('task-a', 'task-c', tasks);

      expect(isCircular).toBe(true);
    });

    it('should allow valid non-circular dependencies', () => {
      const taskA = createMockTask({ id: 'task-a' });
      const taskB = createMockTask({
        id: 'task-b',
        dependencies: [createMockDependency('task-a')],
      });
      const taskC = createMockTask({ id: 'task-c' });

      const tasks = [taskA, taskB, taskC];

      // C depending on B is fine (C→B→A, no cycle)
      const isCircular = useKanbanDependenciesStore.getState()
        .wouldCreateCircularDependency('task-c', 'task-b', tasks);

      expect(isCircular).toBe(false);
    });
  });

  // ==================== DEPENDENCY VALIDATION TESTS ====================

  describe('validateDependency', () => {
    it('should reject self-dependency', () => {
      const task = createMockTask({ id: 'task-1' });
      const dependency = createMockDependency('task-1');

      const result = useKanbanDependenciesStore.getState()
        .validateDependency('task-1', dependency, [task]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot depend on itself');
    });

    it('should reject if task not found', () => {
      const dependency = createMockDependency('other-task');

      const result = useKanbanDependenciesStore.getState()
        .validateDependency('non-existent', dependency, []);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    it('should reject if dependency task not found', () => {
      const task = createMockTask({ id: 'task-1' });
      const dependency = createMockDependency('non-existent');

      const result = useKanbanDependenciesStore.getState()
        .validateDependency('task-1', dependency, [task]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Dependency task not found');
    });

    it('should reject duplicate dependencies', () => {
      const taskA = createMockTask({
        id: 'task-a',
        dependencies: [createMockDependency('task-b')],
      });
      const taskB = createMockTask({ id: 'task-b' });
      const dependency = createMockDependency('task-b');

      const result = useKanbanDependenciesStore.getState()
        .validateDependency('task-a', dependency, [taskA, taskB]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should reject circular dependencies', () => {
      const taskA = createMockTask({
        id: 'task-a',
        dependencies: [createMockDependency('task-b')],
      });
      const taskB = createMockTask({ id: 'task-b' });
      const dependency = createMockDependency('task-a');

      const result = useKanbanDependenciesStore.getState()
        .validateDependency('task-b', dependency, [taskA, taskB]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('circular');
    });

    it('should accept valid dependencies', () => {
      const taskA = createMockTask({ id: 'task-a' });
      const taskB = createMockTask({ id: 'task-b' });
      const dependency = createMockDependency('task-a');

      const result = useKanbanDependenciesStore.getState()
        .validateDependency('task-b', dependency, [taskA, taskB]);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // ==================== CRITICAL PATH TESTS ====================

  describe('getCriticalPath', () => {
    it('should return critical path for tasks with dependencies', () => {
      const taskA = createMockTask({
        id: 'task-a',
        startDate: '2025-01-01',
        dueDate: '2025-01-10',
      });
      const taskB = createMockTask({
        id: 'task-b',
        startDate: '2025-01-11',
        dueDate: '2025-01-20',
        dependencies: [createMockDependency('task-a')],
      });

      const tasks = [taskA, taskB];
      const criticalPath = useKanbanDependenciesStore.getState().getCriticalPath(tasks);

      // Critical path should include tasks on the longest chain
      expect(Array.isArray(criticalPath)).toBe(true);
    });

    it('should return empty array for tasks without dates', () => {
      const task = createMockTask({ id: 'task-1' });
      const criticalPath = useKanbanDependenciesStore.getState().getCriticalPath([task]);

      expect(criticalPath).toEqual([]);
    });
  });

  describe('getTaskSlack', () => {
    it('should return 0 for non-existent task', () => {
      const slack = useKanbanDependenciesStore.getState().getTaskSlack('non-existent', []);
      expect(slack).toBe(0);
    });

    it('should calculate slack for task', () => {
      const task = createMockTask({
        id: 'task-1',
        startDate: '2025-01-01',
        dueDate: '2025-01-10',
      });

      const slack = useKanbanDependenciesStore.getState().getTaskSlack('task-1', [task]);

      expect(typeof slack).toBe('number');
    });
  });

  // ==================== STATISTICS TESTS ====================

  describe('getDependencyStats', () => {
    it('should calculate correct statistics', () => {
      const taskA = createMockTask({ id: 'task-a' });
      const taskB = createMockTask({
        id: 'task-b',
        dependencies: [createMockDependency('task-a')],
      });
      const taskC = createMockTask({
        id: 'task-c',
        dependencies: [
          createMockDependency('task-a'),
          createMockDependency('task-b'),
        ],
      });
      const taskD = createMockTask({ id: 'task-d' });

      const tasks = [taskA, taskB, taskC, taskD];
      const stats = useKanbanDependenciesStore.getState().getDependencyStats(tasks);

      expect(stats.totalTasksWithDependencies).toBe(2); // B and C have dependencies
      expect(stats.totalDependencies).toBe(3); // B has 1, C has 2
      expect(stats.avgDependenciesPerTask).toBe(1.5); // 3 deps / 2 tasks
    });

    it('should return zero stats for tasks without dependencies', () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];

      const stats = useKanbanDependenciesStore.getState().getDependencyStats(tasks);

      expect(stats.totalTasksWithDependencies).toBe(0);
      expect(stats.totalDependencies).toBe(0);
      expect(stats.avgDependenciesPerTask).toBe(0);
    });

    it('should count tasks with overdue blockers', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const overdueBlocker = createMockTask({
        id: 'overdue-blocker',
        status: 'todo',
        dueDate: yesterday.toISOString().split('T')[0],
      });
      const blockedTask = createMockTask({
        id: 'blocked-task',
        dependencies: [createMockDependency('overdue-blocker')],
      });

      const tasks = [overdueBlocker, blockedTask];
      const stats = useKanbanDependenciesStore.getState().getDependencyStats(tasks);

      expect(stats.tasksWithOverdueBlockers).toBe(1);
    });
  });

  // ==================== SELECTOR TESTS ====================

  describe('selectors', () => {
    describe('selectHasBaseline', () => {
      it('should return false when no baseline', () => {
        expect(selectHasBaseline()).toBe(false);
      });

      it('should return true when baseline exists', () => {
        useKanbanDependenciesStore.getState().setBaseline([createMockTask({ id: 'task-1' })]);
        expect(selectHasBaseline()).toBe(true);
      });
    });

    describe('selectBaselineTaskCount', () => {
      it('should return 0 when no baseline', () => {
        expect(selectBaselineTaskCount()).toBe(0);
      });

      it('should return correct count when baseline exists', () => {
        // Note: createBaselineSnapshot only includes tasks with dates
        const tasks = [
          createMockTask({ id: 'task-1', startDate: '2025-01-01', dueDate: '2025-01-10' }),
          createMockTask({ id: 'task-2', startDate: '2025-01-05', dueDate: '2025-01-15' }),
          createMockTask({ id: 'task-3', startDate: '2025-01-10', dueDate: '2025-01-20' }),
        ];
        useKanbanDependenciesStore.getState().setBaseline(tasks);

        expect(selectBaselineTaskCount()).toBe(3);
      });
    });

    describe('selectBaselineDate', () => {
      it('should return null when no baseline', () => {
        expect(selectBaselineDate()).toBeNull();
      });

      it('should return date string when baseline exists', () => {
        // Note: createBaselineSnapshot only includes tasks with dates
        useKanbanDependenciesStore.getState().setBaseline([
          createMockTask({ id: 'task-1', startDate: '2025-01-01', dueDate: '2025-01-15' })
        ]);

        const date = selectBaselineDate();
        expect(date).not.toBeNull();
        expect(typeof date).toBe('string');
      });
    });
  });
});
