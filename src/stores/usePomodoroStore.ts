import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Pomodoro Timer Store
 *
 * Manages Pomodoro timer state, modes, and session tracking.
 * Integrates with time tracking to create entries for completed focus sessions.
 */

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusDuration: number;       // Minutes (default: 25)
  shortBreakDuration: number;  // Minutes (default: 5)
  longBreakDuration: number;   // Minutes (default: 15)
  sessionsUntilLongBreak: number; // Default: 4
  autoStartBreaks: boolean;    // Auto-start break timer
  autoStartFocus: boolean;     // Auto-start next focus after break
  soundEnabled: boolean;       // Play sound on timer end
  notificationsEnabled: boolean; // Show desktop notifications
}

export interface PomodoroState {
  // Timer state
  mode: PomodoroMode;
  timeRemaining: number;       // Seconds
  isRunning: boolean;
  isPaused: boolean;

  // Session tracking
  sessionsCompleted: number;   // Focus sessions completed (resets after long break)
  totalSessionsToday: number;  // Total focus sessions today

  // Task integration
  linkedTaskId: string | null; // Currently linked task
  linkedTaskName: string | null;

  // Settings
  settings: PomodoroSettings;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  skipSession: () => void;

  // Task linking
  linkToTask: (taskId: string, taskName: string) => void;
  unlinkTask: () => void;

  // Settings
  updateSettings: (settings: Partial<PomodoroSettings>) => void;

  // Internal
  tick: () => void; // Called every second by timer
  completeSession: () => void; // Called when timer reaches 0
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'focus',
      timeRemaining: DEFAULT_SETTINGS.focusDuration * 60,
      isRunning: false,
      isPaused: false,
      sessionsCompleted: 0,
      totalSessionsToday: 0,
      linkedTaskId: null,
      linkedTaskName: null,
      settings: DEFAULT_SETTINGS,

      // Actions
      startTimer: () => {
        const { mode, settings } = get();
        const duration = mode === 'focus'
          ? settings.focusDuration
          : mode === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration;

        set({
          isRunning: true,
          isPaused: false,
          timeRemaining: duration * 60,
        });
      },

      pauseTimer: () => {
        set({ isPaused: true, isRunning: false });
      },

      resumeTimer: () => {
        set({ isPaused: false, isRunning: true });
      },

      stopTimer: () => {
        const { mode, settings } = get();
        const duration = mode === 'focus'
          ? settings.focusDuration
          : mode === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration;

        set({
          isRunning: false,
          isPaused: false,
          timeRemaining: duration * 60,
        });
      },

      skipSession: () => {
        const { mode, sessionsCompleted, settings } = get();

        // Determine next mode
        let nextMode: PomodoroMode;
        let newSessionsCompleted = sessionsCompleted;

        if (mode === 'focus') {
          // After focus, go to break
          newSessionsCompleted = sessionsCompleted + 1;

          if (newSessionsCompleted >= settings.sessionsUntilLongBreak) {
            nextMode = 'longBreak';
            newSessionsCompleted = 0; // Reset after long break
          } else {
            nextMode = 'shortBreak';
          }
        } else {
          // After break, go to focus
          nextMode = 'focus';
        }

        const duration = nextMode === 'focus'
          ? settings.focusDuration
          : nextMode === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration;

        set({
          mode: nextMode,
          timeRemaining: duration * 60,
          isRunning: false,
          isPaused: false,
          sessionsCompleted: newSessionsCompleted,
        });
      },

      linkToTask: (taskId: string, taskName: string) => {
        set({ linkedTaskId: taskId, linkedTaskName: taskName });
      },

      unlinkTask: () => {
        set({ linkedTaskId: null, linkedTaskName: null });
      },

      updateSettings: (newSettings: Partial<PomodoroSettings>) => {
        const { settings } = get();
        set({ settings: { ...settings, ...newSettings } });
      },

      tick: () => {
        const { isRunning, isPaused, timeRemaining } = get();

        if (!isRunning || isPaused) return;

        if (timeRemaining <= 0) {
          get().completeSession();
          return;
        }

        set({ timeRemaining: timeRemaining - 1 });
      },

      completeSession: () => {
        const { mode, sessionsCompleted, totalSessionsToday, settings } = get();

        // Determine next mode
        let nextMode: PomodoroMode;
        let newSessionsCompleted = sessionsCompleted;
        let newTotalSessions = totalSessionsToday;

        if (mode === 'focus') {
          // Completed a focus session
          newSessionsCompleted = sessionsCompleted + 1;
          newTotalSessions = totalSessionsToday + 1;

          // Determine break type
          if (newSessionsCompleted >= settings.sessionsUntilLongBreak) {
            nextMode = 'longBreak';
            newSessionsCompleted = 0; // Reset counter
          } else {
            nextMode = 'shortBreak';
          }
        } else {
          // Completed a break, go to focus
          nextMode = 'focus';
        }

        const duration = nextMode === 'focus'
          ? settings.focusDuration
          : nextMode === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration;

        const shouldAutoStart = mode === 'focus'
          ? settings.autoStartBreaks
          : settings.autoStartFocus;

        set({
          mode: nextMode,
          timeRemaining: duration * 60,
          isRunning: shouldAutoStart,
          isPaused: false,
          sessionsCompleted: newSessionsCompleted,
          totalSessionsToday: newTotalSessions,
        });
      },
    }),
    {
      name: 'pomodoro-storage',
      partialize: (state) => ({
        // Persist settings and session count, but not active timer state
        settings: state.settings,
        totalSessionsToday: state.totalSessionsToday,
        linkedTaskId: state.linkedTaskId,
        linkedTaskName: state.linkedTaskName,
      }),
    }
  )
);

// Timer tick interval - runs every second
let timerInterval: ReturnType<typeof setInterval> | null = null;

export function startPomodoroInterval() {
  if (timerInterval) return; // Already running

  timerInterval = setInterval(() => {
    usePomodoroStore.getState().tick();
  }, 1000);
}

export function stopPomodoroInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Initialize timer interval on store creation
if (typeof window !== 'undefined') {
  startPomodoroInterval();
}
