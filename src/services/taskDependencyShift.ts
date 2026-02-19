/**
 * Task Dependency Shift Service
 * Calculates how dependent tasks should shift when a task's dates change
 */

import type { Task, DependencyType } from '../types';
import { logger } from './logger';

const log = logger.module('TaskDependencyShift');

interface TaskShift {
  taskId: string;
  newStartDate: string | null;
  newDueDate: string | null;
  reason: string; // For activity logging
}

/**
 * Calculate date with offset (handles null dates)
 */
function addDays(dateStr: string | null, days: number): string | null {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1Str: string, date2Str: string): number {
  const [y1, m1, d1] = date1Str.split('-').map(Number);
  const [y2, m2, d2] = date2Str.split('-').map(Number);

  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);

  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate how a single dependent task should shift
 */
function calculateSingleTaskShift(
  dependent: Task,
  blocker: Task,
  dependencyType: DependencyType,
  _lag: number,
  oldBlockerStartDate: string | null,
  oldBlockerDueDate: string | null
): TaskShift | null {
  // Determine what changed and how much
  let shiftDays = 0;
  let applyToStartDate = false;
  let applyToDueDate = false;

  switch (dependencyType) {
    case 'finish-to-start': {
      // Dependent starts when blocker finishes
      // If blocker's due date changed, shift dependent's start date
      if (blocker.dueDate && oldBlockerDueDate && blocker.dueDate !== oldBlockerDueDate) {
        shiftDays = daysBetween(oldBlockerDueDate, blocker.dueDate);
        applyToStartDate = true;
        applyToDueDate = true; // Shift both to maintain duration
      }
      break;
    }

    case 'start-to-start': {
      // Dependent starts when blocker starts
      // If blocker's start date changed, shift dependent's start date
      if (blocker.startDate && oldBlockerStartDate && blocker.startDate !== oldBlockerStartDate) {
        shiftDays = daysBetween(oldBlockerStartDate, blocker.startDate);
        applyToStartDate = true;
        applyToDueDate = true; // Shift both to maintain duration
      }
      break;
    }

    case 'finish-to-finish': {
      // Dependent finishes when blocker finishes
      // If blocker's due date changed, shift dependent's due date
      if (blocker.dueDate && oldBlockerDueDate && blocker.dueDate !== oldBlockerDueDate) {
        shiftDays = daysBetween(oldBlockerDueDate, blocker.dueDate);
        applyToDueDate = true;
        applyToStartDate = true; // Shift both to maintain duration
      }
      break;
    }

    case 'start-to-finish': {
      // Dependent finishes when blocker starts (rare)
      // If blocker's start date changed, shift dependent's due date
      if (blocker.startDate && oldBlockerStartDate && blocker.startDate !== oldBlockerStartDate) {
        shiftDays = daysBetween(oldBlockerStartDate, blocker.startDate);
        applyToDueDate = true;
        applyToStartDate = true; // Shift both to maintain duration
      }
      break;
    }
  }

  // No shift needed
  if (shiftDays === 0) return null;

  // Calculate new dates
  const newStartDate = applyToStartDate && dependent.startDate
    ? addDays(dependent.startDate, shiftDays)
    : dependent.startDate;

  const newDueDate = applyToDueDate && dependent.dueDate
    ? addDays(dependent.dueDate, shiftDays)
    : dependent.dueDate;

  // Check if anything actually changed
  if (newStartDate === dependent.startDate && newDueDate === dependent.dueDate) {
    return null;
  }

  return {
    taskId: dependent.id,
    newStartDate,
    newDueDate,
    reason: `Auto-shifted ${shiftDays > 0 ? '+' : ''}${shiftDays} days due to ${dependencyType} dependency on "${blocker.title}"`,
  };
}

/**
 * Calculate how dependent tasks should shift when a task's dates change
 */
export function calculateDependentShifts(
  changedTask: Task,
  oldStartDate: string | null,
  oldDueDate: string | null,
  allTasks: Task[]
): TaskShift[] {
  log.info('Calculating dependent shifts', {
    taskId: changedTask.id,
    oldStart: oldStartDate,
    newStart: changedTask.startDate,
    oldDue: oldDueDate,
    newDue: changedTask.dueDate,
  });

  const shifts: TaskShift[] = [];
  const processed = new Set<string>(); // Prevent infinite loops

  // Find all tasks that depend on the changed task
  const dependents = allTasks.filter(task =>
    task.dependencies?.some(dep => dep.taskId === changedTask.id)
  );

  log.info(`Found ${dependents.length} dependent tasks`);

  // Calculate shifts for direct dependents
  for (const dependent of dependents) {
    if (processed.has(dependent.id)) continue;
    processed.add(dependent.id);

    const dependency = dependent.dependencies!.find(dep => dep.taskId === changedTask.id)!;

    const shift = calculateSingleTaskShift(
      dependent,
      changedTask,
      dependency.type,
      dependency.lag,
      oldStartDate,
      oldDueDate
    );

    if (shift) {
      shifts.push(shift);

      // Recursively calculate shifts for tasks that depend on this dependent
      // (cascade effect)
      const cascadeShifts = calculateDependentShifts(
        { ...dependent, startDate: shift.newStartDate, dueDate: shift.newDueDate },
        dependent.startDate,
        dependent.dueDate,
        allTasks
      );

      shifts.push(...cascadeShifts);
    }
  }

  log.info(`Calculated ${shifts.length} total shifts (including cascades)`);

  return shifts;
}

/**
 * Check if auto-shift should be applied
 * (based on user settings and whether dates actually changed)
 */
export function shouldAutoShift(
  task: Task,
  oldStartDate: string | null,
  oldDueDate: string | null,
  autoShiftEnabled: boolean
): boolean {
  if (!autoShiftEnabled) return false;

  const startChanged = task.startDate !== oldStartDate;
  const dueChanged = task.dueDate !== oldDueDate;

  return startChanged || dueChanged;
}
