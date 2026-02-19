import { describe, it, expect, beforeEach } from 'vitest';
import { useKanbanCommentsStore, selectTotalComments, selectTaskHasComments, selectTaskCommentCount } from '../useKanbanCommentsStore';
import type { Task, TaskComment, ActivityLogEntry } from '../../types';

/**
 * Phase 8.3: Tests for useKanbanCommentsStore
 *
 * Tests comment CRUD, activity logging, query helpers, and statistics.
 */

// Reset store between tests
beforeEach(() => {
  useKanbanCommentsStore.setState({});
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
    comments: [],
    activityLog: [],
    ...overrides,
  };
}

/**
 * Create a mock store getter for testing
 */
function createMockStore(tasks: Task[]) {
  let currentTasks = [...tasks];

  return {
    getStore: () => ({
      tasks: currentTasks,
      _updateTaskFieldsDirect: (id: string, updates: Partial<Task>) => {
        currentTasks = currentTasks.map(t =>
          t.id === id ? { ...t, ...updates } : t
        );
      },
    }),
    getTasks: () => currentTasks,
  };
}

// ==================== COMMENT OBJECT CREATION ====================

describe('createComment', () => {
  it('creates a comment with proper structure', () => {
    const store = useKanbanCommentsStore.getState();
    const comment = store.createComment('task-1', 'Test comment');

    expect(comment.id).toMatch(/^comment-/);
    expect(comment.taskId).toBe('task-1');
    expect(comment.text).toBe('Test comment');
    expect(comment.author).toBe('You');
    expect(comment.createdAt).toBeTruthy();
  });

  it('creates comment with custom author', () => {
    const store = useKanbanCommentsStore.getState();
    const comment = store.createComment('task-1', 'Test', 'Custom Author');

    expect(comment.author).toBe('Custom Author');
  });

  it('generates unique IDs for each comment', () => {
    const store = useKanbanCommentsStore.getState();
    const comment1 = store.createComment('task-1', 'First');
    const comment2 = store.createComment('task-1', 'Second');

    expect(comment1.id).not.toBe(comment2.id);
  });
});

describe('createActivityEntry', () => {
  it('creates an activity entry with proper structure', () => {
    const store = useKanbanCommentsStore.getState();
    const entry = store.createActivityEntry({
      action: 'updated',
      field: 'status',
      oldValue: 'todo',
      newValue: 'done',
    });

    expect(entry.id).toMatch(/^activity-/);
    expect(entry.action).toBe('updated');
    expect(entry.field).toBe('status');
    expect(entry.oldValue).toBe('todo');
    expect(entry.newValue).toBe('done');
    expect(entry.timestamp).toBeTruthy();
    expect(entry.userId).toBe('You');
  });

  it('generates unique IDs for each entry', () => {
    const store = useKanbanCommentsStore.getState();
    const entry1 = store.createActivityEntry({ action: 'created' });
    const entry2 = store.createActivityEntry({ action: 'updated' });

    expect(entry1.id).not.toBe(entry2.id);
  });
});

// ==================== COMMENT CRUD ====================

describe('addComment', () => {
  it('adds a comment to a task', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.addComment('task-1', 'New comment', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments).toHaveLength(1);
    expect(updatedTask.comments![0].text).toBe('New comment');
  });

  it('logs activity when adding comment', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.addComment('task-1', 'New comment', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.activityLog).toHaveLength(1);
    expect(updatedTask.activityLog![0].action).toBe('commented');
  });

  it('truncates long comments in activity log preview', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    const longComment = 'A'.repeat(100);
    store.addComment('task-1', longComment, mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    const activityNewValue = updatedTask.activityLog![0].newValue;
    expect(activityNewValue).toHaveLength(53); // 50 + '...'
    expect(activityNewValue!.endsWith('...')).toBe(true);
  });

  it('does not add comment to non-existent task', () => {
    const mockStore = createMockStore([]);
    const store = useKanbanCommentsStore.getState();

    store.addComment('non-existent', 'Comment', mockStore.getStore);

    expect(mockStore.getTasks()).toHaveLength(0);
  });

  it('does not add empty comment', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.addComment('task-1', '   ', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments).toHaveLength(0);
  });

  it('preserves existing comments when adding new one', () => {
    const existingComment: TaskComment = {
      id: 'existing',
      taskId: 'task-1',
      text: 'Existing comment',
      author: 'You',
      createdAt: new Date().toISOString(),
    };
    const task = createMockTask({
      id: 'task-1',
      comments: [existingComment],
    });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.addComment('task-1', 'New comment', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments).toHaveLength(2);
    expect(updatedTask.comments![0].id).toBe('existing');
    expect(updatedTask.comments![1].text).toBe('New comment');
  });
});

describe('updateComment', () => {
  it('updates comment text', () => {
    const comment: TaskComment = {
      id: 'comment-1',
      taskId: 'task-1',
      text: 'Original text',
      author: 'You',
      createdAt: new Date().toISOString(),
    };
    const task = createMockTask({ id: 'task-1', comments: [comment] });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.updateComment('task-1', 'comment-1', 'Updated text', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments![0].text).toBe('Updated text');
    expect(updatedTask.comments![0].updatedAt).toBeTruthy();
  });

  it('does not update non-existent comment', () => {
    const task = createMockTask({ id: 'task-1', comments: [] });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.updateComment('task-1', 'non-existent', 'Text', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments).toHaveLength(0);
  });

  it('does not update to empty text', () => {
    const comment: TaskComment = {
      id: 'comment-1',
      taskId: 'task-1',
      text: 'Original text',
      author: 'You',
      createdAt: new Date().toISOString(),
    };
    const task = createMockTask({ id: 'task-1', comments: [comment] });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.updateComment('task-1', 'comment-1', '  ', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments![0].text).toBe('Original text');
  });
});

describe('deleteComment', () => {
  it('deletes a comment from task', () => {
    const comment: TaskComment = {
      id: 'comment-1',
      taskId: 'task-1',
      text: 'To delete',
      author: 'You',
      createdAt: new Date().toISOString(),
    };
    const task = createMockTask({ id: 'task-1', comments: [comment] });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.deleteComment('task-1', 'comment-1', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments).toHaveLength(0);
  });

  it('preserves other comments when deleting one', () => {
    const comments: TaskComment[] = [
      { id: 'c1', taskId: 'task-1', text: 'First', author: 'You', createdAt: new Date().toISOString() },
      { id: 'c2', taskId: 'task-1', text: 'Second', author: 'You', createdAt: new Date().toISOString() },
      { id: 'c3', taskId: 'task-1', text: 'Third', author: 'You', createdAt: new Date().toISOString() },
    ];
    const task = createMockTask({ id: 'task-1', comments });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.deleteComment('task-1', 'c2', mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.comments).toHaveLength(2);
    expect(updatedTask.comments!.map(c => c.id)).toEqual(['c1', 'c3']);
  });

  it('handles deleting non-existent comment gracefully', () => {
    const task = createMockTask({ id: 'task-1', comments: [] });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.deleteComment('task-1', 'non-existent', mockStore.getStore);

    // Should not throw, task unchanged
    expect(mockStore.getTasks()[0].comments).toHaveLength(0);
  });
});

// ==================== ACTIVITY LOGGING ====================

describe('logActivity', () => {
  it('adds activity entry to task', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.logActivity('task-1', { action: 'created' }, mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.activityLog).toHaveLength(1);
    expect(updatedTask.activityLog![0].action).toBe('created');
  });

  it('limits activity log to 100 entries', () => {
    const existingLogs: ActivityLogEntry[] = Array.from({ length: 100 }, (_, i) => ({
      id: `activity-${i}`,
      action: 'updated' as const,
      timestamp: new Date().toISOString(),
      userId: 'You',
    }));
    const task = createMockTask({ id: 'task-1', activityLog: existingLogs });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.logActivity('task-1', { action: 'moved' }, mockStore.getStore);

    const updatedTask = mockStore.getTasks()[0];
    expect(updatedTask.activityLog).toHaveLength(100);
    expect(updatedTask.activityLog![99].action).toBe('moved'); // Newest is last
  });

  it('does not log to non-existent task', () => {
    const mockStore = createMockStore([]);
    const store = useKanbanCommentsStore.getState();

    store.logActivity('non-existent', { action: 'created' }, mockStore.getStore);

    expect(mockStore.getTasks()).toHaveLength(0);
  });

  it('includes all provided fields', () => {
    const task = createMockTask({ id: 'task-1' });
    const mockStore = createMockStore([task]);
    const store = useKanbanCommentsStore.getState();

    store.logActivity('task-1', {
      action: 'updated',
      field: 'priority',
      oldValue: 'low',
      newValue: 'high',
    }, mockStore.getStore);

    const entry = mockStore.getTasks()[0].activityLog![0];
    expect(entry.field).toBe('priority');
    expect(entry.oldValue).toBe('low');
    expect(entry.newValue).toBe('high');
  });
});

// ==================== QUERY HELPERS ====================

describe('getTaskComments', () => {
  it('returns comments for a task', () => {
    const comments: TaskComment[] = [
      { id: 'c1', taskId: 'task-1', text: 'First', author: 'You', createdAt: new Date().toISOString() },
      { id: 'c2', taskId: 'task-1', text: 'Second', author: 'You', createdAt: new Date().toISOString() },
    ];
    const tasks = [createMockTask({ id: 'task-1', comments })];
    const store = useKanbanCommentsStore.getState();

    const result = store.getTaskComments('task-1', tasks);

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('First');
  });

  it('returns empty array for task without comments', () => {
    const tasks = [createMockTask({ id: 'task-1', comments: [] })];
    const store = useKanbanCommentsStore.getState();

    const result = store.getTaskComments('task-1', tasks);

    expect(result).toEqual([]);
  });

  it('returns empty array for non-existent task', () => {
    const store = useKanbanCommentsStore.getState();

    const result = store.getTaskComments('non-existent', []);

    expect(result).toEqual([]);
  });
});

describe('getTaskActivity', () => {
  it('returns activity for a task sorted by timestamp descending', () => {
    const now = Date.now();
    const logs: ActivityLogEntry[] = [
      { id: 'a1', action: 'created', timestamp: new Date(now - 2000).toISOString(), userId: 'You' },
      { id: 'a2', action: 'updated', timestamp: new Date(now - 1000).toISOString(), userId: 'You' },
      { id: 'a3', action: 'moved', timestamp: new Date(now).toISOString(), userId: 'You' },
    ];
    const tasks = [createMockTask({ id: 'task-1', activityLog: logs })];
    const store = useKanbanCommentsStore.getState();

    const result = store.getTaskActivity('task-1', tasks);

    expect(result[0].id).toBe('a3'); // Most recent first
    expect(result[2].id).toBe('a1');
  });

  it('respects limit parameter', () => {
    const logs: ActivityLogEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      action: 'updated' as const,
      timestamp: new Date().toISOString(),
      userId: 'You',
    }));
    const tasks = [createMockTask({ id: 'task-1', activityLog: logs })];
    const store = useKanbanCommentsStore.getState();

    const result = store.getTaskActivity('task-1', tasks, 3);

    expect(result).toHaveLength(3);
  });
});

describe('getRecentActivity', () => {
  it('returns recent activity across all tasks', () => {
    const now = Date.now();
    const tasks = [
      createMockTask({
        id: 'task-1',
        title: 'Task 1',
        activityLog: [
          { id: 'a1', action: 'created', timestamp: new Date(now - 1000).toISOString(), userId: 'You' },
        ],
      }),
      createMockTask({
        id: 'task-2',
        title: 'Task 2',
        activityLog: [
          { id: 'a2', action: 'updated', timestamp: new Date(now).toISOString(), userId: 'You' },
        ],
      }),
    ];
    const store = useKanbanCommentsStore.getState();

    const result = store.getRecentActivity(tasks);

    expect(result).toHaveLength(2);
    expect(result[0].taskTitle).toBe('Task 2'); // Most recent first
    expect(result[1].taskTitle).toBe('Task 1');
  });

  it('respects limit parameter', () => {
    const logs: ActivityLogEntry[] = Array.from({ length: 30 }, (_, i) => ({
      id: `a${i}`,
      action: 'updated' as const,
      timestamp: new Date().toISOString(),
      userId: 'You',
    }));
    const tasks = [createMockTask({ id: 'task-1', activityLog: logs })];
    const store = useKanbanCommentsStore.getState();

    const result = store.getRecentActivity(tasks, 5);

    expect(result).toHaveLength(5);
  });
});

describe('searchComments', () => {
  it('finds comments containing search term', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        title: 'Task 1',
        comments: [
          { id: 'c1', taskId: 'task-1', text: 'Meeting notes from Monday', author: 'You', createdAt: new Date().toISOString() },
          { id: 'c2', taskId: 'task-1', text: 'Follow up needed', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
      createMockTask({
        id: 'task-2',
        title: 'Task 2',
        comments: [
          { id: 'c3', taskId: 'task-2', text: 'Another meeting scheduled', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
    ];
    const store = useKanbanCommentsStore.getState();

    const result = store.searchComments('meeting', tasks);

    expect(result).toHaveLength(2);
    expect(result[0].comment.text).toContain('Meeting');
  });

  it('is case-insensitive', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        title: 'Task 1',
        comments: [
          { id: 'c1', taskId: 'task-1', text: 'UPPERCASE text', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
    ];
    const store = useKanbanCommentsStore.getState();

    const result = store.searchComments('uppercase', tasks);

    expect(result).toHaveLength(1);
  });

  it('returns empty array when no matches', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        comments: [
          { id: 'c1', taskId: 'task-1', text: 'Hello world', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
    ];
    const store = useKanbanCommentsStore.getState();

    const result = store.searchComments('xyz123', tasks);

    expect(result).toEqual([]);
  });
});

// ==================== STATISTICS ====================

describe('getCommentStats', () => {
  it('calculates correct statistics', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        comments: [
          { id: 'c1', taskId: 'task-1', text: 'First', author: 'You', createdAt: new Date().toISOString() },
          { id: 'c2', taskId: 'task-1', text: 'Second', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
      createMockTask({
        id: 'task-2',
        comments: [
          { id: 'c3', taskId: 'task-2', text: 'Third', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
      createMockTask({ id: 'task-3', comments: [] }),
    ];
    const store = useKanbanCommentsStore.getState();

    const stats = store.getCommentStats(tasks);

    expect(stats.totalComments).toBe(3);
    expect(stats.tasksWithComments).toBe(2);
    expect(stats.avgCommentsPerTask).toBe(1.5);
  });

  it('handles empty tasks', () => {
    const store = useKanbanCommentsStore.getState();

    const stats = store.getCommentStats([]);

    expect(stats.totalComments).toBe(0);
    expect(stats.tasksWithComments).toBe(0);
    expect(stats.avgCommentsPerTask).toBe(0);
  });
});

describe('getActivityStats', () => {
  it('calculates correct statistics', () => {
    const now = Date.now();
    const tasks = [
      createMockTask({
        id: 'task-1',
        activityLog: [
          { id: 'a1', action: 'created', timestamp: new Date(now).toISOString(), userId: 'You' },
          { id: 'a2', action: 'updated', timestamp: new Date(now).toISOString(), userId: 'You' },
        ],
      }),
      createMockTask({
        id: 'task-2',
        activityLog: [
          { id: 'a3', action: 'moved', timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), userId: 'You' }, // 2 days ago
        ],
      }),
    ];
    const store = useKanbanCommentsStore.getState();

    const stats = store.getActivityStats(tasks);

    expect(stats.totalActivities).toBe(3);
    expect(stats.activitiesByAction.created).toBe(1);
    expect(stats.activitiesByAction.updated).toBe(1);
    expect(stats.activitiesByAction.moved).toBe(1);
    expect(stats.recentActivityCount).toBe(2); // Only 2 from last 24 hours
  });
});

// ==================== SELECTORS ====================

describe('selectTotalComments', () => {
  it('returns total comment count across all tasks', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        comments: [
          { id: 'c1', taskId: 'task-1', text: 'First', author: 'You', createdAt: new Date().toISOString() },
          { id: 'c2', taskId: 'task-1', text: 'Second', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
      createMockTask({
        id: 'task-2',
        comments: [
          { id: 'c3', taskId: 'task-2', text: 'Third', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
    ];

    expect(selectTotalComments(tasks)).toBe(3);
  });
});

describe('selectTaskHasComments', () => {
  it('returns true for task with comments', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        comments: [
          { id: 'c1', taskId: 'task-1', text: 'Comment', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
    ];

    expect(selectTaskHasComments('task-1', tasks)).toBe(true);
  });

  it('returns false for task without comments', () => {
    const tasks = [createMockTask({ id: 'task-1', comments: [] })];

    expect(selectTaskHasComments('task-1', tasks)).toBe(false);
  });

  it('returns false for non-existent task', () => {
    expect(selectTaskHasComments('non-existent', [])).toBe(false);
  });
});

describe('selectTaskCommentCount', () => {
  it('returns comment count for task', () => {
    const tasks = [
      createMockTask({
        id: 'task-1',
        comments: [
          { id: 'c1', taskId: 'task-1', text: 'First', author: 'You', createdAt: new Date().toISOString() },
          { id: 'c2', taskId: 'task-1', text: 'Second', author: 'You', createdAt: new Date().toISOString() },
        ],
      }),
    ];

    expect(selectTaskCommentCount('task-1', tasks)).toBe(2);
  });

  it('returns 0 for task without comments', () => {
    const tasks = [createMockTask({ id: 'task-1', comments: [] })];

    expect(selectTaskCommentCount('task-1', tasks)).toBe(0);
  });
});
