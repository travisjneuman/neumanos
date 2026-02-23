/**
 * Habit-Task Bridge Service
 *
 * Converts between habits and tasks, and syncs completion state.
 * Provides bidirectional linking between habit tracker and kanban board.
 */

import { useHabitStore } from '../stores/useHabitStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { toast } from '../stores/useToastStore';
import type { Habit, Task, HabitFrequency } from '../types';

/**
 * Convert a habit into a recurring kanban task.
 * Creates a new task linked to the habit with matching recurrence settings.
 */
export function convertHabitToTask(habitId: string): string | null {
  const habitStore = useHabitStore.getState();
  const kanbanStore = useKanbanStore.getState();

  const habit = habitStore.habits.find((h) => h.id === habitId);
  if (!habit) {
    toast.error('Habit not found');
    return null;
  }

  if (habit.linkedTaskId) {
    toast.warning('Already linked', 'This habit is already linked to a task');
    return habit.linkedTaskId;
  }

  // Map habit frequency to task recurrence
  const recurrence = mapHabitFrequencyToRecurrence(habit);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Create the task
  kanbanStore.addTask({
    title: habit.title,
    description: habit.description || `Recurring task from habit: ${habit.title}`,
    status: 'todo',
    priority: habit.difficulty === 'hard' ? 'high' : habit.difficulty === 'medium' ? 'medium' : 'low',
    tags: ['habit', habit.category],
    startDate: null,
    dueDate: todayStr,
    projectIds: habit.projectIds,
    recurrence,
    isRecurringParent: recurrence ? true : undefined,
    linkedHabitId: habitId,
  });

  // Find the just-created task (latest by id)
  const tasks = useKanbanStore.getState().tasks;
  const newTask = tasks[tasks.length - 1];

  if (newTask) {
    // Link habit back to task
    habitStore.updateHabit(habitId, { linkedTaskId: newTask.id });
    toast.success('Task created', `"${habit.title}" is now tracked as a task`);
    return newTask.id;
  }

  return null;
}

/**
 * Convert a recurring task into a habit.
 * Creates a new habit linked to the task.
 */
export function convertTaskToHabit(taskId: string): string | null {
  const kanbanStore = useKanbanStore.getState();
  const habitStore = useHabitStore.getState();

  const task = kanbanStore.tasks.find((t) => t.id === taskId);
  if (!task) {
    toast.error('Task not found');
    return null;
  }

  if (task.linkedHabitId) {
    toast.warning('Already linked', 'This task is already linked to a habit');
    return task.linkedHabitId;
  }

  // Map task recurrence to habit frequency
  const { frequency, targetDays, timesPerWeek } = mapRecurrenceToHabitFrequency(task);

  const habitId = habitStore.addHabit({
    title: task.title,
    description: task.description || undefined,
    color: '#2563eb',
    category: 'productivity',
    difficulty: task.priority === 'high' ? 'hard' : task.priority === 'medium' ? 'medium' : 'easy',
    frequency,
    targetDays,
    timesPerWeek,
    freezesPerWeek: 1,
    projectIds: task.projectIds,
    linkedTaskId: taskId,
  });

  // Link task back to habit
  kanbanStore.updateTask(taskId, { linkedHabitId: habitId });

  toast.success('Habit created', `"${task.title}" is now tracked as a habit`);
  return habitId;
}

/**
 * Sync completion between a linked habit and task.
 * When a habit is completed, mark the linked task as done (and vice versa).
 */
export function syncCompletion(habitId: string, taskId: string): void {
  const habitStore = useHabitStore.getState();
  const kanbanStore = useKanbanStore.getState();

  const habit = habitStore.habits.find((h) => h.id === habitId);
  const task = kanbanStore.tasks.find((t) => t.id === taskId);

  if (!habit || !task) return;

  const todayKey = getDateKey(new Date());
  const habitCompleted = habitStore.isCompletedOnDate(habitId, todayKey);
  const taskCompleted = task.status === 'done';

  // Sync habit -> task
  if (habitCompleted && !taskCompleted) {
    kanbanStore.moveTask(taskId, 'done');
  }

  // Sync task -> habit
  if (taskCompleted && !habitCompleted) {
    habitStore.toggleCompletion(habitId, todayKey);
  }
}

// ─── Helpers ─────────────────────────────────────────────

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function mapHabitFrequencyToRecurrence(habit: Habit): Task['recurrence'] {
  switch (habit.frequency) {
    case 'daily':
      return {
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      };
    case 'weekdays':
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5],
        endType: 'never',
      };
    case 'weekends':
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [0, 6],
        endType: 'never',
      };
    case 'specific-days':
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: habit.targetDays || [],
        endType: 'never',
      };
    case 'times-per-week':
      // No direct mapping; use weekly with interval
      return {
        frequency: 'weekly',
        interval: 1,
        endType: 'never',
      };
    default:
      return {
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      };
  }
}

function mapRecurrenceToHabitFrequency(task: Task): {
  frequency: HabitFrequency;
  targetDays?: number[];
  timesPerWeek?: number;
} {
  if (!task.recurrence) {
    return { frequency: 'daily' };
  }

  const rec = task.recurrence;

  if (rec.frequency === 'daily') {
    return { frequency: 'daily' };
  }

  if (rec.frequency === 'weekly' && rec.daysOfWeek) {
    const days = [...rec.daysOfWeek].sort();
    // Check for weekdays pattern
    if (days.length === 5 && JSON.stringify(days) === '[1,2,3,4,5]') {
      return { frequency: 'weekdays' };
    }
    // Check for weekends pattern
    if (days.length === 2 && JSON.stringify(days) === '[0,6]') {
      return { frequency: 'weekends' };
    }
    return { frequency: 'specific-days', targetDays: days };
  }

  // Default: daily
  return { frequency: 'daily' };
}
