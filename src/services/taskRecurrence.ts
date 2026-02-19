/**
 * Task Recurrence Service
 * Handles generation and calculation of recurring task instances
 */

import { format, addDays, addWeeks, addMonths, addYears, isBefore, isAfter, parseISO, startOfDay } from 'date-fns';
import type { Task } from '../types';
import { logger } from './logger';
import { useTemplateStore } from '../stores/useTemplateStore';

const log = logger.module('TaskRecurrence');

/**
 * Get the Nth occurrence of a day of week in a month (e.g., 2nd Tuesday)
 * @param monthStart First day of the target month
 * @param dayOfWeek Day of week (0=Sunday, 6=Saturday)
 * @param n Which occurrence (1-4)
 * @returns Date of the Nth occurrence
 * @throws Error if the Nth occurrence doesn't exist in the month
 */
function getNthDayOfWeekInMonth(monthStart: Date, dayOfWeek: number, n: number): Date {
  const firstDay = new Date(monthStart);
  firstDay.setDate(1);

  // Find first occurrence of target day in month
  const daysUntilTarget = (dayOfWeek - firstDay.getDay() + 7) % 7;
  firstDay.setDate(1 + daysUntilTarget);

  // Add (n-1) weeks
  const targetDate = addWeeks(firstDay, n - 1);

  // Verify still in same month
  if (targetDate.getMonth() !== monthStart.getMonth()) {
    throw new Error(`No ${n}th occurrence of day ${dayOfWeek} in month ${monthStart.getMonth() + 1}`);
  }

  return targetDate;
}

/**
 * Get the last occurrence of a day of week in a month (e.g., last Friday)
 * @param monthStart First day of the target month
 * @param dayOfWeek Day of week (0=Sunday, 6=Saturday)
 * @returns Date of the last occurrence
 */
function getLastDayOfWeekInMonth(monthStart: Date, dayOfWeek: number): Date {
  // Start from last day of month
  const lastDay = new Date(monthStart);
  lastDay.setMonth(lastDay.getMonth() + 1);
  lastDay.setDate(0); // Last day of previous month

  // Work backwards to find last occurrence
  const daysBack = (lastDay.getDay() - dayOfWeek + 7) % 7;
  lastDay.setDate(lastDay.getDate() - daysBack);

  return lastDay;
}

/**
 * Calculate next occurrence for ordinal monthly patterns (e.g., "first Monday", "last Friday")
 * @param baseDate Starting date
 * @param weekOfMonth Which week (1-4 or -1 for last)
 * @param dayOfWeek Day of week (0=Sunday, 6=Saturday)
 * @param interval Number of months between occurrences
 * @returns Next occurrence date
 */
function calculateNextOrdinalOccurrence(
  baseDate: Date,
  weekOfMonth: number,
  dayOfWeek: number,
  interval: number
): Date {
  // Start with base date's month + interval
  const nextMonth = addMonths(baseDate, interval);
  const monthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);

  if (weekOfMonth === -1) {
    // Last occurrence of dayOfWeek in month
    return getLastDayOfWeekInMonth(monthStart, dayOfWeek);
  } else {
    // Nth occurrence of dayOfWeek in month (1-4)
    try {
      return getNthDayOfWeekInMonth(monthStart, dayOfWeek, weekOfMonth);
    } catch (error) {
      // If Nth occurrence doesn't exist, skip to next month
      log.warn('Nth occurrence not found, skipping to next month', {
        weekOfMonth,
        dayOfWeek,
        month: monthStart.getMonth() + 1,
        error: error instanceof Error ? error.message : String(error)
      });
      // Recursively try next interval
      return calculateNextOrdinalOccurrence(baseDate, weekOfMonth, dayOfWeek, interval * 2);
    }
  }
}

/**
 * Calculate the next occurrence date based on recurrence rules
 * @param task Task with recurrence rules
 * @param fromDate Starting date (YYYY-MM-DD)
 * @returns Next occurrence date (YYYY-MM-DD) or null if series has ended
 */
export function calculateNextOccurrence(task: Task, fromDate: string): string | null {
  if (!task.recurrence) return null;

  const { frequency, interval, daysOfWeek, dayOfMonth, weekOfMonth, dayOfWeekInMonth, endType, endDate } = task.recurrence;
  let nextDate = parseISO(fromDate);

  // Add interval based on frequency
  switch (frequency) {
    case 'daily':
      nextDate = addDays(nextDate, interval);
      break;

    case 'weekly':
      // For weekly, find next matching day of week
      if (daysOfWeek && daysOfWeek.length > 0) {
        const currentDay = nextDate.getDay();
        let daysToAdd = interval * 7;

        // Find next matching day in the cycle
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
        const nextMatchingDay = sortedDays.find(day => day > currentDay);

        if (nextMatchingDay !== undefined) {
          // Next occurrence is this week
          daysToAdd = nextMatchingDay - currentDay;
        } else {
          // Next occurrence is next week (first day in cycle)
          daysToAdd = (interval - 1) * 7 + (7 - currentDay + sortedDays[0]);
        }

        nextDate = addDays(nextDate, daysToAdd);
      } else {
        nextDate = addWeeks(nextDate, interval);
      }
      break;

    case 'monthly':
      // Check for ordinal patterns (e.g., "first Monday", "last Friday")
      if (weekOfMonth !== undefined && dayOfWeekInMonth !== undefined) {
        nextDate = calculateNextOrdinalOccurrence(nextDate, weekOfMonth, dayOfWeekInMonth, interval);
      } else {
        // Standard day-of-month pattern
        nextDate = addMonths(nextDate, interval);

        // If specific day of month is set, adjust
        if (dayOfMonth) {
          const targetDay = Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate());
          nextDate.setDate(targetDay);
        }
      }
      break;

    case 'yearly':
      nextDate = addYears(nextDate, interval);
      break;
  }

  const nextDateStr = format(nextDate, 'yyyy-MM-dd');

  // Check if series has ended
  if (endType === 'until' && endDate) {
    if (isAfter(nextDate, parseISO(endDate))) {
      log.debug('Series ended by date', { endDate, nextDate: nextDateStr });
      return null;
    }
  }

  // Note: endCount is tracked per task completion, not calculated here

  return nextDateStr;
}

/**
 * Generate the next instance of a recurring task
 * @param parentTask The parent/template task with recurrence rules
 * @param lastCompletedInstance Optional: the last completed instance (for recurFromCompletion)
 * @returns New task instance or null if series has ended
 */
export function generateNextInstance(parentTask: Task, lastCompletedInstance?: Task): Task | null {
  if (!parentTask.recurrence || !parentTask.isRecurringParent) {
    log.warn('Attempted to generate instance from non-recurring task', { taskId: parentTask.id });
    return null;
  }

  // Calculate next occurrence from completion date (if recurFromCompletion) or due date
  let fromDate: string;
  if (parentTask.recurrence.recurFromCompletion && lastCompletedInstance?.lastCompletedAt) {
    // Use completion date when recurFromCompletion is enabled
    fromDate = format(new Date(lastCompletedInstance.lastCompletedAt), 'yyyy-MM-dd');
    log.debug('Using completion date for next occurrence', { completionDate: fromDate });
  } else {
    // Default: use parent's nextOccurrence, due date, or today
    fromDate = parentTask.nextOccurrence || parentTask.dueDate || format(new Date(), 'yyyy-MM-dd');
  }

  const nextOccurrenceDate = calculateNextOccurrence(parentTask, fromDate);

  if (!nextOccurrenceDate) {
    log.debug('No next occurrence (series ended)', { taskId: parentTask.id });
    return null;
  }

  // Create new task instance
  const instance: Task = {
    ...parentTask,
    id: `${parentTask.id}-${nextOccurrenceDate}`, // Unique ID per instance
    recurrenceId: parentTask.id, // Link back to parent
    isRecurringParent: false, // This is an instance, not parent
    nextOccurrence: undefined, // Instances don't calculate next
    dueDate: nextOccurrenceDate,
    startDate: nextOccurrenceDate, // Could offset this by X days if needed
    created: new Date().toISOString(),
    status: 'todo', // Reset to todo
    progress: 0, // Reset progress
    lastCompletedAt: undefined,
    archivedAt: undefined,
  };

  // P2: Apply template if templateId is set
  if (parentTask.recurrence.templateId) {
    const { getTemplate } = useTemplateStore.getState();
    const template = getTemplate(parentTask.recurrence.templateId);

    if (template) {
      // Apply template fields
      instance.description = template.description;
      instance.tags = [...template.tags];

      // Apply checklist with new IDs and reset completion status
      if (template.checklist) {
        instance.checklist = template.checklist.map(item => ({
          ...item,
          id: `${instance.id}-checklist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          completed: false,
        }));
      }

      // Apply custom fields
      if (template.customFields) {
        instance.customFields = { ...template.customFields };
      }

      log.info('Applied template to recurring instance', {
        templateId: template.id,
        templateName: template.name,
        instanceId: instance.id,
      });
    } else {
      log.warn('Template not found, continuing without template', {
        templateId: parentTask.recurrence.templateId,
        instanceId: instance.id,
      });
    }
  }

  log.info('Generated recurring task instance', {
    parentId: parentTask.id,
    instanceId: instance.id,
    dueDate: nextOccurrenceDate
  });

  return instance;
}

/**
 * Check if a new instance should be generated for a recurring task
 * @param parentTask The parent recurring task
 * @param allTasks All tasks in the system
 * @returns True if new instance should be created
 */
export function shouldGenerateNextInstance(parentTask: Task, allTasks: Task[]): boolean {
  if (!parentTask.recurrence || !parentTask.isRecurringParent) {
    return false;
  }

  // Get all instances of this recurring task
  const instances = getTaskInstances(parentTask, allTasks);

  // Check if there's an incomplete instance with a future/today due date
  const hasActiveInstance = instances.some(instance =>
    instance.status !== 'done' &&
    instance.dueDate &&
    !isBefore(parseISO(instance.dueDate), startOfDay(new Date()))
  );

  if (hasActiveInstance) {
    log.debug('Active instance exists, no new generation needed', { parentId: parentTask.id });
    return false;
  }

  // Check endCount if applicable
  if (parentTask.recurrence.endType === 'after' && parentTask.recurrence.endCount) {
    const completedCount = instances.filter(i => i.status === 'done').length;
    if (completedCount >= parentTask.recurrence.endCount) {
      log.debug('Recurrence limit reached', {
        parentId: parentTask.id,
        completedCount,
        endCount: parentTask.recurrence.endCount
      });
      return false;
    }
  }

  log.debug('Should generate next instance', { parentId: parentTask.id });
  return true;
}

/**
 * Get all instances of a recurring task
 * @param parentTask The parent recurring task
 * @param allTasks All tasks in the system
 * @returns Array of task instances
 */
export function getTaskInstances(parentTask: Task, allTasks: Task[]): Task[] {
  return allTasks.filter(task => task.recurrenceId === parentTask.id);
}

/**
 * Update parent task's nextOccurrence field
 * @param parentTask The parent recurring task
 * @returns Updated nextOccurrence date or undefined
 */
export function updateNextOccurrence(parentTask: Task): string | undefined {
  if (!parentTask.recurrence || !parentTask.isRecurringParent) {
    return undefined;
  }

  const fromDate = parentTask.nextOccurrence || parentTask.dueDate || format(new Date(), 'yyyy-MM-dd');
  const next = calculateNextOccurrence(parentTask, fromDate);

  if (next) {
    log.debug('Updated nextOccurrence', { taskId: parentTask.id, nextOccurrence: next });
  }

  return next || undefined;
}
