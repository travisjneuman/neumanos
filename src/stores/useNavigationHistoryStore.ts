/**
 * Navigation History Store
 *
 * Tracks page navigation history for back/forward browser-like navigation.
 * Session-only (not persisted) - resets when the app reloads.
 */

import { create } from 'zustand';

interface NavigationHistoryState {
  /** Stack of visited paths (current position is at currentIndex) */
  history: string[];
  /** Current position in the history stack */
  currentIndex: number;
  /** Whether we're currently navigating via back/forward (prevents double-push) */
  isNavigating: boolean;

  /** Push a new path to history (called on every route change) */
  push: (path: string) => void;
  /** Go back in history, returns the path or null if can't go back */
  goBack: () => string | null;
  /** Go forward in history, returns the path or null if can't go forward */
  goForward: () => string | null;
  /** Whether back navigation is available */
  canGoBack: () => boolean;
  /** Whether forward navigation is available */
  canGoForward: () => boolean;
  /** Get the current path from history */
  getCurrentPath: () => string | null;
  /** Mark navigation as complete (called after programmatic navigation) */
  completeNavigation: () => void;
}

export const useNavigationHistoryStore = create<NavigationHistoryState>((set, get) => ({
  history: [],
  currentIndex: -1,
  isNavigating: false,

  push: (path: string) => {
    const { history, currentIndex, isNavigating } = get();

    // Skip if we're in the middle of a back/forward navigation
    if (isNavigating) return;

    // Skip if the path is the same as current
    if (currentIndex >= 0 && history[currentIndex] === path) return;

    // Trim any forward history when navigating to a new page
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(path);

    // Keep history manageable (max 50 entries)
    const trimmed = newHistory.length > 50 ? newHistory.slice(-50) : newHistory;

    set({
      history: trimmed,
      currentIndex: trimmed.length - 1,
    });
  },

  goBack: () => {
    const { history, currentIndex } = get();
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    set({ currentIndex: newIndex, isNavigating: true });
    return history[newIndex];
  },

  goForward: () => {
    const { history, currentIndex } = get();
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    set({ currentIndex: newIndex, isNavigating: true });
    return history[newIndex];
  },

  canGoBack: () => {
    return get().currentIndex > 0;
  },

  canGoForward: () => {
    const { history, currentIndex } = get();
    return currentIndex < history.length - 1;
  },

  getCurrentPath: () => {
    const { history, currentIndex } = get();
    return currentIndex >= 0 ? history[currentIndex] : null;
  },

  completeNavigation: () => {
    set({ isNavigating: false });
  },
}));
