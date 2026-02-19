/**
 * useShortcut Hook
 *
 * Register a keyboard shortcut with automatic cleanup on unmount.
 *
 * @example
 * useShortcut({
 *   id: 'open-search',
 *   keys: ['mod', 'k'],
 *   label: 'Open search',
 *   handler: () => setShowSearch(true),
 * });
 */

import { useEffect, useCallback } from 'react';
import { useShortcutsStore, type RegisteredShortcut } from '../stores/useShortcutsStore';
import type { ShortcutContext } from '../services/shortcuts';

interface UseShortcutOptions {
  /** Unique identifier for this shortcut */
  id: string;

  /** Key combination, e.g., ['mod', 'k'] or ['c'] */
  keys: string[];

  /** Human-readable label for help display */
  label: string;

  /** Detailed description (optional) */
  description?: string;

  /** When this shortcut is active: 'global' | 'kanban' | 'notes' | etc */
  context?: ShortcutContext;

  /** Function to call when shortcut is triggered */
  handler: () => void;

  /** Allow triggering in input fields (default: false) */
  allowInInput?: boolean;

  /** Priority for conflict resolution (higher wins, default: 0) */
  priority?: number;

  /** Whether the shortcut is currently enabled (default: true) */
  enabled?: boolean;
}

/**
 * Register a keyboard shortcut that auto-unregisters on component unmount
 */
export function useShortcut(options: UseShortcutOptions): void {
  const {
    id,
    keys,
    label,
    description,
    context,
    handler,
    allowInInput = false,
    priority = 0,
    enabled = true,
  } = options;

  const register = useShortcutsStore((s) => s.register);
  const unregister = useShortcutsStore((s) => s.unregister);

  // Memoize handler to prevent unnecessary re-registrations
  const stableHandler = useCallback(handler, [handler]);

  useEffect(() => {
    if (!enabled) {
      // Ensure we unregister if disabled
      unregister(id);
      return;
    }

    const shortcut: RegisteredShortcut = {
      id,
      keys,
      label,
      description,
      context,
      handler: stableHandler,
      allowInInput,
      priority,
    };

    register(shortcut);

    return () => {
      unregister(id);
    };
  }, [
    id,
    keys.join(','), // Compare keys array by content
    label,
    description,
    context,
    stableHandler,
    allowInInput,
    priority,
    enabled,
    register,
    unregister,
  ]);
}

/**
 * Hook to push/pop shortcut context (for modals, overlays, etc.)
 *
 * @example
 * // In a modal component:
 * useShortcutContext('modal');
 *
 * // With enabled flag (for conditional modals):
 * useShortcutContext('modal', isOpen);
 */
export function useShortcutContext(context: ShortcutContext, enabled: boolean = true): void {
  const pushContext = useShortcutsStore((s) => s.pushContext);
  const popContext = useShortcutsStore((s) => s.popContext);

  useEffect(() => {
    if (!enabled) return;

    pushContext(context);
    return () => {
      popContext();
    };
  }, [context, enabled, pushContext, popContext]);
}

/**
 * Hook to set the current page context (not pushed, just set)
 *
 * @example
 * // In a page component:
 * usePageShortcutContext('notes');
 */
export function usePageShortcutContext(context: ShortcutContext): void {
  const setContext = useShortcutsStore((s) => s.setContext);

  useEffect(() => {
    setContext(context);
  }, [context, setContext]);
}
