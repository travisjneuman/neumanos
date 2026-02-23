/**
 * Keyboard Shortcuts Customization Store
 *
 * Persists user-customized key bindings to localStorage.
 * Custom bindings override defaults when matching via useShortcutsStore.findByKeys.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { keysMatch } from '../services/shortcuts';
import { DEFAULT_SHORTCUTS } from '../services/shortcuts';

interface KeyboardShortcutsState {
  /** Map of shortcutId -> custom key combination */
  customBindings: Record<string, string[]>;

  /** Set a custom binding for a shortcut */
  setBinding: (id: string, keys: string[]) => void;

  /** Reset a single shortcut to default */
  resetBinding: (id: string) => void;

  /** Reset all custom bindings */
  resetAll: () => void;

  /** Get the effective keys for a shortcut (custom or default) */
  getBinding: (id: string, defaultKeys: string[]) => string[];

  /**
   * Check if a key combination conflicts with an existing shortcut.
   * Returns the label of the conflicting shortcut, or null if no conflict.
   */
  checkConflict: (keys: string[], excludeId?: string) => string | null;
}

// Build a combined list of all known shortcuts for conflict detection
// (DEFAULT_SHORTCUTS from shortcuts.ts + extended shortcuts)
const EXTENDED_SHORTCUT_DEFS: Array<{ id: string; keys: string[]; label: string }> = [
  { id: 'go-dashboard', keys: ['g', 'd'], label: 'Go to Dashboard' },
  { id: 'go-tasks', keys: ['g', 't'], label: 'Go to Tasks' },
  { id: 'go-notes', keys: ['g', 'n'], label: 'Go to Notes' },
  { id: 'go-calendar', keys: ['g', 'c'], label: 'Go to Calendar' },
  { id: 'go-settings', keys: ['g', 's'], label: 'Go to Settings' },
  { id: 'new-task', keys: ['n'], label: 'Create new task' },
  { id: 'search-tasks', keys: ['/'], label: 'Search tasks' },
  { id: 'new-event', keys: ['n'], label: 'Create new event' },
  { id: 'today-view', keys: ['t'], label: 'Go to today' },
  { id: 'bold', keys: ['mod', 'b'], label: 'Bold text' },
  { id: 'italic', keys: ['mod', 'i'], label: 'Italic text' },
  { id: 'underline', keys: ['mod', 'u'], label: 'Underline text' },
];

const ALL_KNOWN_SHORTCUTS = [
  ...DEFAULT_SHORTCUTS.map((s) => ({ id: s.id, keys: s.keys, label: s.label })),
  ...EXTENDED_SHORTCUT_DEFS,
];

export const useKeyboardShortcutsStore = create<KeyboardShortcutsState>()(
  persist(
    (set, get) => ({
      customBindings: {},

      setBinding: (id, keys) => {
        set((state) => ({
          customBindings: { ...state.customBindings, [id]: keys },
        }));
      },

      resetBinding: (id) => {
        set((state) => {
          const next = { ...state.customBindings };
          delete next[id];
          return { customBindings: next };
        });
      },

      resetAll: () => {
        set({ customBindings: {} });
      },

      getBinding: (id, defaultKeys) => {
        const custom = get().customBindings[id];
        return custom ?? defaultKeys;
      },

      checkConflict: (keys, excludeId) => {
        const { customBindings } = get();

        for (const shortcut of ALL_KNOWN_SHORTCUTS) {
          if (shortcut.id === excludeId) continue;

          const effectiveKeys = customBindings[shortcut.id] ?? shortcut.keys;
          if (keysMatch(keys, effectiveKeys)) {
            return shortcut.label;
          }
        }

        return null;
      },
    }),
    {
      name: 'keyboard-shortcuts-custom',
    }
  )
);
