import { useEffect, useCallback } from 'react';
import { useHabitStore } from '../../stores/useHabitStore';

/** Request notification permission if needed */
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Show a browser notification for a habit reminder */
function showHabitNotification(title: string, icon?: string) {
  if (Notification.permission !== 'granted') return;
  const body = `Time to complete: ${title}`;
  const notification = new Notification(icon ? `${icon} Habit Reminder` : 'Habit Reminder', {
    body,
    icon: '/icons/icon-192x192.png',
    tag: `habit-reminder-${title}`,
    requireInteraction: false,
  });
  // Auto close after 10 seconds
  setTimeout(() => notification.close(), 10000);
}

/**
 * Hook that manages habit reminder scheduling.
 * Checks every minute if any habit reminders are due.
 * This is a local-only, privacy-first approach using the Notification API.
 */
export function useHabitReminders() {
  const habits = useHabitStore((s) => s.habits);
  const isCompletedOnDate = useHabitStore((s) => s.isCompletedOnDate);

  const checkReminders = useCallback(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    for (const habit of habits) {
      if (
        habit.archivedAt ||
        !habit.reminder?.enabled ||
        !habit.reminder.time
      ) {
        continue;
      }

      // Check if this is the right minute
      if (habit.reminder.time !== currentTime) continue;

      // Don't remind if already completed today
      if (isCompletedOnDate(habit.id, todayKey)) continue;

      showHabitNotification(habit.title, habit.icon);
    }
  }, [habits, isCompletedOnDate]);

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission();

    // Check every minute
    const interval = setInterval(checkReminders, 60_000);

    // Also check immediately
    checkReminders();

    return () => clearInterval(interval);
  }, [checkReminders]);
}

/** Export for external use */
export { requestNotificationPermission };
