/**
 * useGlobalShortcuts Hook
 *
 * Attaches a single global keydown listener that dispatches to registered shortcuts.
 * Should be called once at the app root (Layout.tsx).
 *
 * Features:
 * - Single window listener (not multiple scattered useEffects)
 * - Capture phase to intercept before Lexical/inputs
 * - Input field detection (blocks shortcuts unless allowInInput)
 * - Priority-based conflict resolution
 */

import { useEffect } from 'react';
import { useShortcutsStore } from '../stores/useShortcutsStore';
import { parseKeyboardEvent, isInputElement } from '../services/shortcuts';

interface UseGlobalShortcutsOptions {
  /** Whether the global listener is enabled (default: true) */
  enabled?: boolean;

  /** Debug mode - logs matched shortcuts to console */
  debug?: boolean;
}

/**
 * Attach global keyboard shortcut listener
 * Call this once in Layout.tsx or App.tsx
 */
export function useGlobalShortcuts(options: UseGlobalShortcutsOptions = {}): void {
  const { enabled = true, debug = false } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse the event into normalized keys array
      const pressedKeys = parseKeyboardEvent(e);

      // Skip if no meaningful keys pressed (just modifiers)
      if (pressedKeys.length === 0) return;

      // Check if we're in an input element
      const inInput = isInputElement(e.target);

      // Find matching shortcut
      const shortcut = useShortcutsStore.getState().findByKeys(pressedKeys);

      if (!shortcut) {
        if (debug) {
          console.log('[Shortcuts] No match for:', pressedKeys);
        }
        return;
      }

      // Block if in input and shortcut doesn't allow it
      if (inInput && !shortcut.allowInInput) {
        if (debug) {
          console.log('[Shortcuts] Blocked in input:', shortcut.id);
        }
        return;
      }

      // Prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();

      if (debug) {
        console.log('[Shortcuts] Matched:', shortcut.id, pressedKeys);
      }

      // Execute the handler
      try {
        shortcut.handler();
      } catch (error) {
        console.error('[Shortcuts] Handler error for', shortcut.id, error);
      }
    };

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [enabled, debug]);
}

/**
 * Initialize default global shortcuts
 * Call this once at app startup
 */
export function initializeDefaultShortcuts(): void {
  // Default shortcuts are registered via useShortcut in components
  // This function is a placeholder for future static shortcut registration
  // if needed (e.g., shortcuts that don't depend on React state)
}
