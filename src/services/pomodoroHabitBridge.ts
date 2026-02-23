/**
 * Pomodoro-Habit Bridge
 *
 * Auto-completes habits tagged for Pomodoro tracking when a focus session finishes.
 * Habits qualify if they have trackViaPomodoro enabled or tags including 'pomodoro'/'deep-work'.
 */

import { useHabitStore } from '../stores/useHabitStore';
import { toast } from '../stores/useToastStore';

/** Date key in YYYY-M-D format (non-padded, matching project convention) */
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Called when a Pomodoro focus session completes.
 * Checks for habits that should be auto-tracked and completes them.
 *
 * @param totalSessionsToday - Total focus sessions completed today (after this one)
 */
export function onPomodoroComplete(totalSessionsToday: number): void {
  const store = useHabitStore.getState();
  const today = new Date();
  const dateKey = getDateKey(today);

  const activeHabits = store.habits.filter((h) => !h.archivedAt);

  const pomodoroHabits = activeHabits.filter(
    (h) => h.trackViaPomodoro === true
  );

  for (const habit of pomodoroHabits) {
    const sessionsRequired = habit.pomodoroSessionsRequired ?? 1;

    // Only auto-complete once the required number of sessions is met
    if (totalSessionsToday < sessionsRequired) continue;

    // Skip if already completed today
    if (store.isCompletedOnDate(habit.id, dateKey)) continue;

    // Auto-complete the habit
    store.toggleCompletion(habit.id, dateKey, `Auto-tracked via Pomodoro (${totalSessionsToday} sessions)`);
    toast.success(`Habit "${habit.title}" tracked`, 'Pomodoro session completed');
  }
}
