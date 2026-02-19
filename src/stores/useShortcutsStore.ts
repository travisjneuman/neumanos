/**
 * Keyboard Shortcuts Store
 *
 * Central registry for all keyboard shortcuts in the application.
 * NOT persisted - shortcuts are code-defined, not user-customizable.
 */

import { create } from 'zustand';
import type { ShortcutContext, ShortcutDefinition } from '../services/shortcuts';
import { keysMatch } from '../services/shortcuts';

export interface RegisteredShortcut extends ShortcutDefinition {
  handler: () => void;
}

interface ShortcutsState {
  // Registry of all shortcuts (keyed by id)
  shortcuts: Map<string, RegisteredShortcut>;

  // Current active context (determines which shortcuts are active)
  activeContext: ShortcutContext;

  // Stack of modal contexts (modals push/pop their context)
  contextStack: ShortcutContext[];

  // Actions
  register: (shortcut: RegisteredShortcut) => void;
  unregister: (id: string) => void;
  setContext: (context: ShortcutContext) => void;
  pushContext: (context: ShortcutContext) => void;
  popContext: () => void;

  // Queries
  getActiveShortcuts: () => RegisteredShortcut[];
  findByKeys: (keys: string[]) => RegisteredShortcut | undefined;
  findConflicts: (keys: string[], excludeId?: string) => RegisteredShortcut[];
  getAllShortcuts: () => RegisteredShortcut[];
}

export const useShortcutsStore = create<ShortcutsState>((set, get) => {
  // Cached result for getAllShortcuts to prevent infinite loop with useSyncExternalStore
  let cachedAllShortcuts: RegisteredShortcut[] | null = null;
  let cachedShortcutsMap: Map<string, RegisteredShortcut> | null = null;

  return {
  shortcuts: new Map(),
  activeContext: 'global',
  contextStack: [],

  register: (shortcut) => {
    set((state) => {
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.set(shortcut.id, shortcut);
      // Invalidate cache when shortcuts change
      cachedAllShortcuts = null;
      cachedShortcutsMap = null;
      return { shortcuts: newShortcuts };
    });
  },

  unregister: (id) => {
    set((state) => {
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.delete(id);
      // Invalidate cache when shortcuts change
      cachedAllShortcuts = null;
      cachedShortcutsMap = null;
      return { shortcuts: newShortcuts };
    });
  },

  setContext: (context) => {
    set({ activeContext: context, contextStack: [] });
  },

  pushContext: (context) => {
    set((state) => ({
      contextStack: [...state.contextStack, state.activeContext],
      activeContext: context,
    }));
  },

  popContext: () => {
    set((state) => {
      if (state.contextStack.length === 0) return state;
      const newStack = [...state.contextStack];
      const previousContext = newStack.pop()!;
      return {
        contextStack: newStack,
        activeContext: previousContext,
      };
    });
  },

  getActiveShortcuts: () => {
    const { shortcuts, activeContext } = get();
    const active: RegisteredShortcut[] = [];

    shortcuts.forEach((shortcut) => {
      // When in 'modal' context, only allow:
      // - Shortcuts explicitly for 'modal' context
      // - Shortcuts with allowInModal flag (future)
      // This prevents single-key shortcuts like 'C' from firing when a modal is open
      if (activeContext === 'modal') {
        if (shortcut.context === 'modal') {
          active.push(shortcut);
        }
        return;
      }

      // Global shortcuts are always active outside of modal context
      // Context-specific shortcuts only active when context matches
      if (!shortcut.context || shortcut.context === 'global' || shortcut.context === activeContext) {
        active.push(shortcut);
      }
    });

    // Sort by priority (higher priority first)
    return active.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  },

  findByKeys: (keys) => {
    const activeShortcuts = get().getActiveShortcuts();

    // Find first matching shortcut (already sorted by priority)
    return activeShortcuts.find((shortcut) => keysMatch(keys, shortcut.keys));
  },

  findConflicts: (keys, excludeId) => {
    const { shortcuts } = get();
    const conflicts: RegisteredShortcut[] = [];

    shortcuts.forEach((shortcut) => {
      if (shortcut.id !== excludeId && keysMatch(keys, shortcut.keys)) {
        conflicts.push(shortcut);
      }
    });

    return conflicts;
  },

  getAllShortcuts: () => {
    const { shortcuts } = get();

    // Return cached result if shortcuts map hasn't changed
    if (cachedAllShortcuts !== null && cachedShortcutsMap === shortcuts) {
      return cachedAllShortcuts;
    }

    // Compute and cache the sorted array
    cachedShortcutsMap = shortcuts;
    cachedAllShortcuts = Array.from(shortcuts.values()).sort((a, b) => {
      // Sort by context, then by label
      if (a.context !== b.context) {
        if (a.context === 'global') return -1;
        if (b.context === 'global') return 1;
        return (a.context ?? '').localeCompare(b.context ?? '');
      }
      return a.label.localeCompare(b.label);
    });

    return cachedAllShortcuts;
  },
}});

// Selector for getting formatted shortcuts for help display
export const selectShortcutsForHelp = () => {
  const { getAllShortcuts } = useShortcutsStore.getState();
  return getAllShortcuts().map((shortcut) => ({
    id: shortcut.id,
    keys: shortcut.keys,
    label: shortcut.label,
    description: shortcut.description,
    context: shortcut.context,
  }));
};
