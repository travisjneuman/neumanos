/**
 * Focus Mode Store
 *
 * Manages the state for distraction-free focus mode, including:
 * - Active state (is focus mode on)
 * - Linked task (which task is being worked on)
 * - Session tracking (when focus started)
 * - Notification preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';

interface FocusModeState {
  /** Whether focus mode is currently active */
  isActive: boolean;
  /** ID of the task being worked on during focus */
  linkedTaskId: string | null;
  /** ISO timestamp when focus session started */
  startedAt: string | null;
  /** Whether to hide notifications during focus */
  hideNotifications: boolean;
  /** Whether to hide the sidebar in focus mode */
  hideSidebar: boolean;
  /** Whether to hide the header in focus mode */
  hideHeader: boolean;
}

interface FocusModeActions {
  /** Start a focus session, optionally linked to a task */
  startFocus: (taskId?: string) => void;
  /** End the current focus session */
  endFocus: () => void;
  /** Toggle focus mode on/off */
  toggleFocus: () => void;
  /** Link a task to the current focus session */
  linkTask: (taskId: string) => void;
  /** Unlink the current task */
  unlinkTask: () => void;
  /** Toggle notification hiding */
  toggleHideNotifications: () => void;
  /** Toggle sidebar visibility */
  toggleHideSidebar: () => void;
  /** Toggle header visibility */
  toggleHideHeader: () => void;
  /** Get duration of current session in seconds */
  getSessionDuration: () => number;
}

type FocusModeStore = FocusModeState & FocusModeActions;

const initialState: FocusModeState = {
  isActive: false,
  linkedTaskId: null,
  startedAt: null,
  hideNotifications: true,
  hideSidebar: true,
  hideHeader: true,
};

export const useFocusModeStore = create<FocusModeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startFocus: (taskId) =>
        set({
          isActive: true,
          linkedTaskId: taskId || null,
          startedAt: new Date().toISOString(),
        }),

      endFocus: () =>
        set({
          isActive: false,
          linkedTaskId: null,
          startedAt: null,
        }),

      toggleFocus: () => {
        const { isActive, startFocus, endFocus } = get();
        if (isActive) {
          endFocus();
        } else {
          startFocus();
        }
      },

      linkTask: (taskId) =>
        set({ linkedTaskId: taskId }),

      unlinkTask: () =>
        set({ linkedTaskId: null }),

      toggleHideNotifications: () =>
        set((state) => ({ hideNotifications: !state.hideNotifications })),

      toggleHideSidebar: () =>
        set((state) => ({ hideSidebar: !state.hideSidebar })),

      toggleHideHeader: () =>
        set((state) => ({ hideHeader: !state.hideHeader })),

      getSessionDuration: () => {
        const { startedAt, isActive } = get();
        if (!isActive || !startedAt) return 0;
        const start = new Date(startedAt).getTime();
        const now = Date.now();
        return Math.floor((now - start) / 1000);
      },
    }),
    {
      name: 'focus-mode',
      storage: createJSONStorage(() => createSyncedStorage()),
      // Only persist preferences, not active session state
      partialize: (state) => ({
        hideNotifications: state.hideNotifications,
        hideSidebar: state.hideSidebar,
        hideHeader: state.hideHeader,
      }),
    }
  )
);
