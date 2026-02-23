/**
 * Notification Preferences Store
 *
 * Manages notification settings for habits, tasks, events, and quiet hours.
 * Persisted to localStorage (small, bounded UI preferences).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationPrefs {
  enabled: boolean;
  habitReminders: boolean;
  taskDueReminders: boolean;
  eventReminders: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  soundEnabled: boolean;
}

interface NotificationState extends NotificationPrefs {
  setEnabled: (enabled: boolean) => void;
  setHabitReminders: (enabled: boolean) => void;
  setTaskDueReminders: (enabled: boolean) => void;
  setEventReminders: (enabled: boolean) => void;
  setQuietHoursStart: (time: string) => void;
  setQuietHoursEnd: (time: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  updatePrefs: (prefs: Partial<NotificationPrefs>) => void;
  isInQuietHours: () => boolean;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      enabled: false,
      habitReminders: true,
      taskDueReminders: true,
      eventReminders: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      soundEnabled: true,

      setEnabled: (enabled) => set({ enabled }),
      setHabitReminders: (habitReminders) => set({ habitReminders }),
      setTaskDueReminders: (taskDueReminders) => set({ taskDueReminders }),
      setEventReminders: (eventReminders) => set({ eventReminders }),
      setQuietHoursStart: (quietHoursStart) => set({ quietHoursStart }),
      setQuietHoursEnd: (quietHoursEnd) => set({ quietHoursEnd }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      updatePrefs: (prefs) => set(prefs),

      isInQuietHours: () => {
        const { quietHoursStart, quietHoursEnd } = get();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = quietHoursStart.split(':').map(Number);
        const [endH, endM] = quietHoursEnd.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Handle overnight quiet hours (e.g., 22:00 - 08:00)
        if (startMinutes > endMinutes) {
          return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      },
    }),
    {
      name: 'notification-preferences',
    }
  )
);
