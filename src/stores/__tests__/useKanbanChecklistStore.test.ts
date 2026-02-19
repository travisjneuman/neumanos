import { describe, it, expect, beforeEach } from 'vitest';
import {
  useKanbanChecklistStore,
  selectTotalChecklistItems,
  selectTaskHasChecklist,
  selectTaskChecklistProgress,
} from '../useKanbanChecklistStore';
import type { Task, ChecklistItem } from '../../types';

/**
 * Phase 8.4: Tests for useKanbanChecklistStore
 *
 * Tests checklist CRUD, toggle, reorder, progress, and statistics.
 */

// Reset store between tests
beforeEach(() => {
  useKanbanChecklistStore.setState({});
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a mock task for testing
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Date.now()}`,
    title: 'Test Task',
    description: '',
    status: 'todo',
    priority: 'medium',
    created: new Date().toISOString(),
    startDate: null,
    dueDate: null,
    tags: [],
    projectIds: [],
    checklist: [],
    ...overrides,
  };
}

/**
 * Create a mock store getter for testing
 */
function createMockStore(tasks: Task[]) {
  let currentTasks = [...tasks];
  const activityLogs: { taskId: string; entry: unknown }[] = [];

  return {
    getStore: () => ({
      tasks: currentTasks,
      _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => {
        currentTasks = currentTasks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        );
      },
      logActivity: (taskId: string, entry: unknown) => {
        activityLogs.push({ taskId, entry });
      },
    }),
    getTasks: () => currentTasks,
    getActivityLogs: () => activityLogs,
  };
}

/**
 * Create a mock checklist item
 */
function createMockChecklistItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: `check-${Date.now()}`,
    text: 'Test item',
    completed: false,
    order: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ==================== ITEM CREATION ====================

describe('createChecklistItem', () => {
  it('creates a checklist item with proper structure', () => {
    const store = useKanbanChecklistStore.getState();
    const item = store.createChecklistItem('Test item', 0);

    expect(item.id).toMatch(/^check-/);
    expect(item.text).toBe('Test item');
    expect(item.completed).toBe(false);
    expect(item.order).toBe(0);
    expect(item.createdAt).toBeTruthy();
  });

  it('respects order parameter', () => {
    const store = useKanbanChecklistStore.getState();
    const item = store.createChecklistItem('Test', 5);

    expect(item.order).toBe(5);
  });

  it('generates unique IDs for each item', () => {
    const store = useKanbanChecklistStore.getState();
    const item1 = store.createChecklistItem('First', 0);
    const item2 = store.createChecklistItem('Second', 1);

    expect(item1.id).not.toBe(item2.id);
  });
});

// ==================== CHECKLIST CRUD ====================

describe('addChecklistItem', () => {
  it('adds a checklist item to a task', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.addChecklistItem('task-1', 'New item', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist).toHaveLength(1);
    expect(updatedTask.checklist![0].text).toBe('New item');
  });

  it('logs activity when adding item', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.addChecklistItem('task-1', 'New item', mockStore.getStore);

    const logs = mockStore.getActivityLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].taskId).toBe('task-1');
  });

  it('sets correct order for new items', () => {
    const existingItems: ChecklistItem[] = [
      createMockChecklistItem({ id: 'c1', order: 0 }),
      createMockChecklistItem({ id: 'c2', order: 1 }),
    ];
    const task = createMockTask({ id: 'task-1', checklist: existingItems });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.addChecklistItem('task-1', 'Third item', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist).toHaveLength(3);
    expect(updatedTask.checklist![2].order).toBe(2);
  });

  it('does not add item to non-existent task', () => {
    const mockStore = createMockStore([]);
    const store = useKanbanChecklistStore.getState();

    store.addChecklistItem('non-existent', 'Item', mockStore.getStore);

    expect(mockStore.getTasks()).toHaveLength(0);
  });

  it('does not add empty item', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.addChecklistItem('task-1', '   ', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist).toHaveLength(0);
  });
});

describe('updateChecklistItem', () => {
  it('updates item text', () => {
    const item = createMockChecklistItem({ id: 'item-1', text: 'Original' });
    const task = createMockTask({ id: 'task-1', checklist: [item] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.updateChecklistItem('task-1', 'item-1', { text: 'Updated' }, mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist![0].text).toBe('Updated');
  });

  it('updates item completed status', () => {
    const item = createMockChecklistItem({ id: 'item-1', completed: false });
    const task = createMockTask({ id: 'task-1', checklist: [item] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.updateChecklistItem('task-1', 'item-1', { completed: true }, mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist![0].completed).toBe(true);
  });

  it('does not update non-existent item', () => {
    const task = createMockTask({ id: 'task-1', checklist: [] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.updateChecklistItem('task-1', 'non-existent', { text: 'New' }, mockStore.getStore);

    // Should not throw, checklist unchanged
    expect(mockStore.getTasks()[0].checklist).toHaveLength(0);
  });
});

describe('deleteChecklistItem', () => {
  it('deletes an item from task', () => {
    const item = createMockChecklistItem({ id: 'item-1' });
    const task = createMockTask({ id: 'task-1', checklist: [item] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.deleteChecklistItem('task-1', 'item-1', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist).toHaveLength(0);
  });

  it('logs activity when deleting', () => {
    const item = createMockChecklistItem({ id: 'item-1', text: 'To delete' });
    const task = createMockTask({ id: 'task-1', checklist: [item] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.deleteChecklistItem('task-1', 'item-1', mockStore.getStore);

    const logs = mockStore.getActivityLogs();
    expect(logs).toHaveLength(1);
  });

  it('preserves other items when deleting one', () => {
    const items = [
      createMockChecklistItem({ id: 'c1', text: 'First' }),
      createMockChecklistItem({ id: 'c2', text: 'Second' }),
      createMockChecklistItem({ id: 'c3', text: 'Third' }),
    ];
    const task = createMockTask({ id: 'task-1', checklist: items });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.deleteChecklistItem('task-1', 'c2', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist).toHaveLength(2);
    expect(updatedTask.checklist!.map((c) => c.id)).toEqual(['c1', 'c3']);
  });
});

describe('toggleChecklistItem', () => {
  it('toggles incomplete to complete', () => {
    const item = createMockChecklistItem({ id: 'item-1', completed: false });
    const task = createMockTask({ id: 'task-1', checklist: [item] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.toggleChecklistItem('task-1', 'item-1', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist![0].completed).toBe(true);
  });

  it('toggles complete to incomplete', () => {
    const item = createMockChecklistItem({ id: 'item-1', completed: true });
    const task = createMockTask({ id: 'task-1', checklist: [item] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.toggleChecklistItem('task-1', 'item-1', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist![0].completed).toBe(false);
  });

  it('logs activity when toggling', () => {
    const item = createMockChecklistItem({ id: 'item-1', text: 'Test item' });
    const task = createMockTask({ id: 'task-1', checklist: [item] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.toggleChecklistItem('task-1', 'item-1', mockStore.getStore);

    const logs = mockStore.getActivityLogs();
    expect(logs).toHaveLength(1);
  });
});

describe('reorderChecklistItems', () => {
  it('reorders items according to new order', () => {
    const items = [
      createMockChecklistItem({ id: 'c1', order: 0 }),
      createMockChecklistItem({ id: 'c2', order: 1 }),
      createMockChecklistItem({ id: 'c3', order: 2 }),
    ];
    const task = createMockTask({ id: 'task-1', checklist: items });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.reorderChecklistItems('task-1', ['c3', 'c1', 'c2'], mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.checklist![0].id).toBe('c3');
    expect(updatedTask.checklist![0].order).toBe(0);
    expect(updatedTask.checklist![1].id).toBe('c1');
    expect(updatedTask.checklist![1].order).toBe(1);
    expect(updatedTask.checklist![2].id).toBe('c2');
    expect(updatedTask.checklist![2].order).toBe(2);
  });

  it('handles empty checklist gracefully', () => {
    const task = createMockTask({ id: 'task-1', checklist: [] });
    const mockStore = createMockStore([task]);
    const store = useKanbanChecklistStore.getState();

    store.reorderChecklistItems('task-1', [], mockStore.getStore);

    // Should not throw
    expect(mockStore.getTasks()[0].checklist).toHaveLength(0);
  });
});

// ==================== QUERY HELPERS ====================

describe('getTaskChecklist', () => {
  it('returns checklist items sorted by order', () => {
    const items = [
      createMockChecklistItem({ id: 'c3', order: 2 }),
      createMockChecklistItem({ id: 'c1', order: 0 }),
      createMockChecklistItem({ id: 'c2', order: 1 }),
    ];
    const tasks = [createMockTask({ id: 'task-1', checklist: items })];
    const store = useKanbanChecklistStore.getState();

    const result = store.getTaskChecklist('task-1', tasks);

    expect(result[0].id).toBe('c1');
    expect(result[1].id).toBe('c2');
    expect(result[2].id).toBe('c3');
  });

  it('returns empty array for task without checklist', () => {
    const tasks = [createMockTask({ id: 'task-1', checklist: [] })];
    const store = useKanbanChecklistStore.getState();

    const result = store.getTaskChecklist('task-1', tasks);

    expect(result).toEqual([]);
  });
});

describe('getTaskProgress', () => {
  it('calculates correct progress', () => {
    const items = [
      createMockChecklistItem({ id: 'c1', completed: true }),
      createMockChecklistItem({ id: 'c2', completed: true }),
      createMockChecklistItem({ id: 'c3', completed: false }),
      createMockChecklistItem({ id: 'c4', completed: false }),
    ];
    const tasks = [createMockTask({ id: 'task-1', checklist: items })];
    const store = useKanbanChecklistStore.getState();

    const progress = store.getTaskProgress('task-1', tasks);

    expect(progress.total).toBe(4);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(50);
  });

  it('returns zero for empty checklist', () => {
    const tasks = [createMockTask({ id: 'task-1', checklist: [] })];
    const store = useKanbanChecklistStore.getState();

    const progress = store.getTaskProgress('task-1', tasks);

    expect(progress.total).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('returns 100% for all completed', () => {
    const items = [
      createMockChecklistItem({ id: 'c1', completed: true }),
      createMockChecklistItem({ id: 'c2', completed: true }),
    ];
    const tasks = [createMockTask({ id: 'task-1', checklist: items })];
    const store = useKanbanChecklistStore.getState();

    const progress = store.getTaskProgress('task-1', tasks);

    expect(progress.percentage).toBe(100);
  });
});

describe('getIncompleteItems', () => {
  it('returns all incomplete items across tasks', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        title: 'Task 1',
        checklist: [
          createMockChecklistItem({ id: 'c1', text: 'Incomplete', completed: false }),
          createMockChecklistItem({ id: 'c2', text: 'Complete', completed: true }),
        ],
      }),
      createMockTask({
        id: 'task-2',
        title: 'Task 2',
        checklist: [
          createMockChecklistItem({ id: 'c3', text: 'Also incomplete', completed: false }),
        ],
      }),
    ];
    const store = useKanbanChecklistStore.getState();

    const result = store.getIncompleteItems(tasks);

    expect(result).toHaveLength(2);
    expect(result.every((r) => !r.item.completed)).toBe(true);
  });
});

describe('searchChecklistItems', () => {
  it('finds items containing search term', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        title: 'Task 1',
        checklist: [
          createMockChecklistItem({ id: 'c1', text: 'Buy groceries' }),
          createMockChecklistItem({ id: 'c2', text: 'Call mom' }),
        ],
      }),
      createMockTask({
        id: 'task-2',
        title: 'Task 2',
        checklist: [
          createMockChecklistItem({ id: 'c3', text: 'Buy gifts' }),
        ],
      }),
    ];
    const store = useKanbanChecklistStore.getState();

    const result = store.searchChecklistItems('buy', tasks);

    expect(result).toHaveLength(2);
    expect(result[0].item.text).toContain('Buy');
  });

  it('is case-insensitive', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        checklist: [createMockChecklistItem({ text: 'UPPERCASE TEST' })],
      }),
    ];
    const store = useKanbanChecklistStore.getState();

    const result = store.searchChecklistItems('uppercase', tasks);

    expect(result).toHaveLength(1);
  });
});

// ==================== STATISTICS ====================

describe('getChecklistStats', () => {
  it('calculates correct statistics', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        checklist: [
          createMockChecklistItem({ completed: true }),
          createMockChecklistItem({ completed: true }),
          createMockChecklistItem({ completed: false }),
        ],
      }),
      createMockTask({
        id: 'task-2',
        checklist: [
          createMockChecklistItem({ completed: false }),
        ],
      }),
      createMockTask({ id: 'task-3', checklist: [] }),
    ];
    const store = useKanbanChecklistStore.getState();

    const stats = store.getChecklistStats(tasks);

    expect(stats.totalItems).toBe(4);
    expect(stats.completedItems).toBe(2);
    expect(stats.completionRate).toBe(50);
    expect(stats.tasksWithChecklists).toBe(2);
    expect(stats.avgItemsPerTask).toBe(2);
  });

  it('handles empty tasks', () => {
    const store = useKanbanChecklistStore.getState();

    const stats = store.getChecklistStats([]);

    expect(stats.totalItems).toBe(0);
    expect(stats.completedItems).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.tasksWithChecklists).toBe(0);
    expect(stats.avgItemsPerTask).toBe(0);
  });
});

// ==================== SELECTORS ====================

describe('selectTotalChecklistItems', () => {
  it('returns total item count', () => {
    const tasks = [
      createMockTask({
        checklist: [
          createMockChecklistItem(),
          createMockChecklistItem(),
        ],
      }),
      createMockTask({
        checklist: [createMockChecklistItem()],
      }),
    ];

    expect(selectTotalChecklistItems(tasks)).toBe(3);
  });
});

describe('selectTaskHasChecklist', () => {
  it('returns true for task with items', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        checklist: [createMockChecklistItem()],
      }),
    ];

    expect(selectTaskHasChecklist('task-1', tasks)).toBe(true);
  });

  it('returns false for task without items', () => {
    const tasks = [createMockTask({ id: 'task-1', checklist: [] })];

    expect(selectTaskHasChecklist('task-1', tasks)).toBe(false);
  });
});

describe('selectTaskChecklistProgress', () => {
  it('returns correct percentage', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        checklist: [
          createMockChecklistItem({ completed: true }),
          createMockChecklistItem({ completed: true }),
          createMockChecklistItem({ completed: false }),
        ],
      }),
    ];

    expect(selectTaskChecklistProgress('task-1', tasks)).toBe(67);
  });

  it('returns 0 for empty checklist', () => {
    const tasks = [createMockTask({ id: 'task-1', checklist: [] })];

    expect(selectTaskChecklistProgress('task-1', tasks)).toBe(0);
  });
});
