/**
 * Task Recurrence Service Tests
 *
 * Tests recurring task generation and calculation logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { format, addDays } from 'date-fns';
import type { Task, TaskStatus, TaskPriority } from '../../types';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock templateStore
vi.mock('../../stores/useTemplateStore', () => ({
  useTemplateStore: {
    getState: () => ({
      getTemplate: vi.fn().mockReturnValue(null),
    }),
  },
}));

// Import after mocking
import {
  calculateNextOccurrence,
  generateNextInstance,
  shouldGenerateNextInstance,
  getTaskInstances,
  updateNextOccurrence,
} from '../taskRecurrence';

// Helper to create a recurring parent task
function createRecurringTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'recurring-1',
    title: 'Recurring Task',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    created: '2025-01-01T00:00:00Z',
    startDate: null,
    dueDate: '2025-01-15',
    tags: [],
    projectIds: [],
    isRecurringParent: true,
    recurrence: {
      frequency: 'daily',
      interval: 1,
      endType: 'never',
    },
    ...overrides,
  };
}

describe('taskRecurrence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateNextOccurrence', () => {
    describe('daily recurrence', () => {
      it('should calculate next day for daily recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'daily', interval: 1, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-01-16');
      });

      it('should respect interval for daily recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'daily', interval: 3, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-01-18');
      });

      it('should handle month boundaries', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'daily', interval: 1, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-31');
        expect(next).toBe('2025-02-01');
      });

      it('should handle year boundaries', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'daily', interval: 1, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-12-31');
        expect(next).toBe('2026-01-01');
      });
    });

    describe('weekly recurrence', () => {
      it('should calculate next week for weekly recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'weekly', interval: 1, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-01-22');
      });

      it('should respect interval for weekly recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'weekly', interval: 2, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-01-29');
      });

      it('should handle specific days of week', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
            endType: 'never',
          },
        });

        // Jan 15, 2025 is a Wednesday (day 3)
        // Next should be Friday (day 5)
        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-01-17'); // Friday
      });

      it('should wrap to next week when no more days this week', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: [1, 3], // Mon, Wed
            endType: 'never',
          },
        });

        // Jan 15, 2025 is a Wednesday (day 3)
        // Next Monday is Jan 20
        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-01-20'); // Next Monday
      });
    });

    describe('monthly recurrence', () => {
      it('should calculate next month for monthly recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'monthly', interval: 1, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-02-15');
      });

      it('should respect interval for monthly recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'monthly', interval: 3, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-04-15');
      });

      it('should handle specific day of month', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'monthly',
            interval: 1,
            dayOfMonth: 28,
            endType: 'never',
          },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-02-28');
      });

      it('should clamp day of month for short months', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'monthly',
            interval: 1,
            dayOfMonth: 31,
            endType: 'never',
          },
        });

        // February 2025 has 28 days
        const next = calculateNextOccurrence(task, '2025-01-31');
        expect(next).toBe('2025-02-28');
      });

      it('should handle ordinal patterns (first Monday)', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'monthly',
            interval: 1,
            weekOfMonth: 1,
            dayOfWeekInMonth: 1, // Monday
            endType: 'never',
          },
        });

        // First Monday of February 2025 is Feb 3
        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-02-03');
      });

      it('should handle ordinal patterns (last Friday)', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'monthly',
            interval: 1,
            weekOfMonth: -1, // Last
            dayOfWeekInMonth: 5, // Friday
            endType: 'never',
          },
        });

        // Last Friday of February 2025 is Feb 28
        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2025-02-28');
      });
    });

    describe('yearly recurrence', () => {
      it('should calculate next year for yearly recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'yearly', interval: 1, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2026-01-15');
      });

      it('should respect interval for yearly recurrence', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'yearly', interval: 2, endType: 'never' },
        });

        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBe('2027-01-15');
      });

      it('should handle leap year boundaries', () => {
        const task = createRecurringTask({
          recurrence: { frequency: 'yearly', interval: 1, endType: 'never' },
        });

        // Feb 29, 2024 (leap year) to Feb 28, 2025 (no leap year)
        const next = calculateNextOccurrence(task, '2024-02-29');
        expect(next).toBe('2025-02-28');
      });
    });

    describe('end conditions', () => {
      it('should return null when end date is passed', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'daily',
            interval: 1,
            endType: 'until',
            endDate: '2025-01-20',
          },
        });

        const next = calculateNextOccurrence(task, '2025-01-20');
        expect(next).toBeNull();
      });

      it('should return date when end date is not yet reached', () => {
        const task = createRecurringTask({
          recurrence: {
            frequency: 'daily',
            interval: 1,
            endType: 'until',
            endDate: '2025-01-25',
          },
        });

        const next = calculateNextOccurrence(task, '2025-01-20');
        expect(next).toBe('2025-01-21');
      });

      it('should return null for task without recurrence', () => {
        const task = createRecurringTask({ recurrence: undefined });
        const next = calculateNextOccurrence(task, '2025-01-15');
        expect(next).toBeNull();
      });
    });
  });

  describe('generateNextInstance', () => {
    it('should generate a new instance with correct properties', () => {
      const parent = createRecurringTask({
        id: 'parent-1',
        title: 'Weekly Report',
        dueDate: '2025-01-15',
        recurrence: { frequency: 'weekly', interval: 1, endType: 'never' },
      });

      const instance = generateNextInstance(parent);

      expect(instance).not.toBeNull();
      expect(instance!.id).toBe('parent-1-2025-01-22');
      expect(instance!.recurrenceId).toBe('parent-1');
      expect(instance!.isRecurringParent).toBe(false);
      expect(instance!.dueDate).toBe('2025-01-22');
      expect(instance!.status).toBe('todo');
      expect(instance!.progress).toBe(0);
    });

    it('should return null for non-recurring task', () => {
      const task = createRecurringTask({ isRecurringParent: false });
      const instance = generateNextInstance(task);
      expect(instance).toBeNull();
    });

    it('should return null when series has ended', () => {
      const parent = createRecurringTask({
        recurrence: {
          frequency: 'daily',
          interval: 1,
          endType: 'until',
          endDate: '2025-01-14',
        },
        dueDate: '2025-01-15',
      });

      const instance = generateNextInstance(parent);
      expect(instance).toBeNull();
    });

    it('should use nextOccurrence when available', () => {
      const parent = createRecurringTask({
        dueDate: '2025-01-15',
        nextOccurrence: '2025-02-01',
        recurrence: { frequency: 'weekly', interval: 1, endType: 'never' },
      });

      const instance = generateNextInstance(parent);
      expect(instance!.dueDate).toBe('2025-02-08'); // Week after nextOccurrence
    });

    it('should calculate from completion date when recurFromCompletion is enabled', () => {
      const parent = createRecurringTask({
        dueDate: '2025-01-15',
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          endType: 'never',
          recurFromCompletion: true,
        },
      });

      const completedInstance: Task = {
        ...parent,
        id: 'completed-1',
        lastCompletedAt: '2025-01-20T10:00:00Z',
      };

      const instance = generateNextInstance(parent, completedInstance);
      expect(instance!.dueDate).toBe('2025-01-27'); // Week after completion
    });
  });

  describe('shouldGenerateNextInstance', () => {
    it('should return true when no active instances exist', () => {
      const parent = createRecurringTask();
      const allTasks: Task[] = [parent];

      const should = shouldGenerateNextInstance(parent, allTasks);
      expect(should).toBe(true);
    });

    it('should return false when active instance exists', () => {
      const parent = createRecurringTask({ id: 'parent-1' });
      const instance = createRecurringTask({
        id: 'instance-1',
        recurrenceId: 'parent-1',
        isRecurringParent: false,
        dueDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), // Future date
        status: 'todo',
      });

      const should = shouldGenerateNextInstance(parent, [parent, instance]);
      expect(should).toBe(false);
    });

    it('should return true when all instances are completed', () => {
      const parent = createRecurringTask({ id: 'parent-1' });
      const instance = createRecurringTask({
        id: 'instance-1',
        recurrenceId: 'parent-1',
        isRecurringParent: false,
        status: 'done',
      });

      const should = shouldGenerateNextInstance(parent, [parent, instance]);
      expect(should).toBe(true);
    });

    it('should return false when recurrence limit is reached', () => {
      const parent = createRecurringTask({
        id: 'parent-1',
        recurrence: {
          frequency: 'daily',
          interval: 1,
          endType: 'after',
          endCount: 3,
        },
      });

      // Create 3 completed instances
      const instances = [1, 2, 3].map((i) =>
        createRecurringTask({
          id: `instance-${i}`,
          recurrenceId: 'parent-1',
          isRecurringParent: false,
          status: 'done',
        })
      );

      const should = shouldGenerateNextInstance(parent, [parent, ...instances]);
      expect(should).toBe(false);
    });

    it('should return false for non-recurring task', () => {
      const task = createRecurringTask({ isRecurringParent: false });
      const should = shouldGenerateNextInstance(task, [task]);
      expect(should).toBe(false);
    });
  });

  describe('getTaskInstances', () => {
    it('should return all instances of a recurring task', () => {
      const parent = createRecurringTask({ id: 'parent-1' });
      const instance1 = createRecurringTask({
        id: 'instance-1',
        recurrenceId: 'parent-1',
      });
      const instance2 = createRecurringTask({
        id: 'instance-2',
        recurrenceId: 'parent-1',
      });
      const otherTask = createRecurringTask({
        id: 'other-1',
        recurrenceId: 'other-parent',
      });

      const instances = getTaskInstances(parent, [parent, instance1, instance2, otherTask]);

      expect(instances).toHaveLength(2);
      expect(instances.map((i) => i.id)).toContain('instance-1');
      expect(instances.map((i) => i.id)).toContain('instance-2');
    });

    it('should return empty array when no instances exist', () => {
      const parent = createRecurringTask({ id: 'parent-1' });
      const instances = getTaskInstances(parent, [parent]);
      expect(instances).toEqual([]);
    });
  });

  describe('updateNextOccurrence', () => {
    it('should calculate next occurrence from current nextOccurrence', () => {
      const parent = createRecurringTask({
        nextOccurrence: '2025-01-15',
        recurrence: { frequency: 'daily', interval: 1, endType: 'never' },
      });

      const next = updateNextOccurrence(parent);
      expect(next).toBe('2025-01-16');
    });

    it('should use dueDate when nextOccurrence is not set', () => {
      const parent = createRecurringTask({
        dueDate: '2025-01-15',
        nextOccurrence: undefined,
        recurrence: { frequency: 'daily', interval: 1, endType: 'never' },
      });

      const next = updateNextOccurrence(parent);
      expect(next).toBe('2025-01-16');
    });

    it('should return undefined for non-recurring task', () => {
      const task = createRecurringTask({ isRecurringParent: false });
      const next = updateNextOccurrence(task);
      expect(next).toBeUndefined();
    });

    it('should return undefined when series has ended', () => {
      const parent = createRecurringTask({
        dueDate: '2025-01-20',
        recurrence: {
          frequency: 'daily',
          interval: 1,
          endType: 'until',
          endDate: '2025-01-20',
        },
      });

      const next = updateNextOccurrence(parent);
      expect(next).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle tasks with both recurrence and template', () => {
      const parent = createRecurringTask({
        recurrence: {
          frequency: 'daily',
          interval: 1,
          endType: 'never',
          templateId: 'template-1',
        },
      });

      // Mock template store to return a template
      vi.mock('../../stores/useTemplateStore', () => ({
        useTemplateStore: {
          getState: () => ({
            getTemplate: vi.fn().mockReturnValue({
              id: 'template-1',
              name: 'Test Template',
              description: 'Template description',
              tags: ['tag1', 'tag2'],
              checklist: [{ id: 'c1', text: 'Item 1', completed: false }],
            }),
          }),
        },
      }));

      const instance = generateNextInstance(parent);
      expect(instance).not.toBeNull();
    });

    it('should handle empty daysOfWeek array in weekly recurrence', () => {
      const task = createRecurringTask({
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [],
          endType: 'never',
        },
      });

      const next = calculateNextOccurrence(task, '2025-01-15');
      expect(next).toBe('2025-01-22');
    });

    it('should handle interval of 0 (should default to 1)', () => {
      const task = createRecurringTask({
        recurrence: { frequency: 'daily', interval: 0, endType: 'never' },
      });

      // With interval 0, addDays(date, 0) returns the same date
      const next = calculateNextOccurrence(task, '2025-01-15');
      expect(next).toBe('2025-01-15');
    });

    it('should handle large intervals', () => {
      const task = createRecurringTask({
        recurrence: { frequency: 'yearly', interval: 10, endType: 'never' },
      });

      const next = calculateNextOccurrence(task, '2025-01-15');
      expect(next).toBe('2035-01-15');
    });
  });
});
