/**
 * Keyboard Shortcuts Service
 *
 * Utilities for keyboard shortcut handling:
 * - Platform-aware key detection (Cmd vs Ctrl)
 * - Key combination parsing and matching
 * - Input field detection
 */

// Platform detection
export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

/**
 * Modifier keys normalized across platforms
 * 'mod' = Cmd on Mac, Ctrl on Windows/Linux
 */
export type ModifierKey = 'mod' | 'ctrl' | 'alt' | 'shift' | 'meta';
export type ShortcutContext = 'global' | 'kanban' | 'notes' | 'calendar' | 'diagram' | 'modal';

export interface ShortcutDefinition {
  id: string;
  keys: string[]; // e.g., ['mod', 'k'] or ['c'] or ['g', 't']
  label: string;
  description?: string;
  context?: ShortcutContext;
  allowInInput?: boolean;
  priority?: number; // Higher wins in conflicts
}

/**
 * Parse a keyboard event into normalized key array
 * Returns array like ['mod', 'shift', 'k']
 */
export function parseKeyboardEvent(e: KeyboardEvent): string[] {
  const keys: string[] = [];

  // Modifiers first (consistent order)
  if (e.metaKey || e.ctrlKey) {
    // Use 'mod' for platform-agnostic modifier
    keys.push('mod');
  }
  if (e.altKey) keys.push('alt');
  if (e.shiftKey) keys.push('shift');

  // Main key (lowercase, handle special cases)
  const key = normalizeKey(e.key);
  if (key && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
    keys.push(key);
  }

  return keys;
}

/**
 * Normalize key names to consistent format
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    ' ': 'space',
    Escape: 'escape',
    Enter: 'enter',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Backspace: 'backspace',
    Delete: 'delete',
    Tab: 'tab',
  };

  return keyMap[key] || key.toLowerCase();
}

/**
 * Check if two key arrays match
 */
export function keysMatch(pressed: string[], shortcut: string[]): boolean {
  if (pressed.length !== shortcut.length) return false;

  // Sort both arrays for comparison (modifiers can be in any order)
  const sortedPressed = [...pressed].sort();
  const sortedShortcut = [...shortcut].sort();

  return sortedPressed.every((key, i) => key === sortedShortcut[i]);
}

/**
 * Check if event target is an input element where shortcuts should be blocked
 */
export function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;

  const tagName = target.tagName.toLowerCase();

  // Standard form elements
  if (['input', 'textarea', 'select'].includes(tagName)) {
    return true;
  }

  // Contenteditable elements (including Lexical editor)
  if (target.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check if inside a contenteditable parent (Lexical nests deeply)
  if (target.closest('[contenteditable="true"]')) {
    return true;
  }

  // Rich text editor containers
  if (target.closest('.lexical-editor, .ProseMirror, .tiptap')) {
    return true;
  }

  return false;
}

/**
 * Format shortcut keys for display
 * ['mod', 'shift', 'k'] => '⌘⇧K' (Mac) or 'Ctrl+Shift+K' (Windows)
 */
export function formatShortcut(keys: string[]): string {
  if (isMac) {
    return keys
      .map((key) => {
        switch (key) {
          case 'mod':
            return '⌘';
          case 'ctrl':
            return '⌃';
          case 'alt':
            return '⌥';
          case 'shift':
            return '⇧';
          case 'enter':
            return '↵';
          case 'escape':
            return 'Esc';
          case 'space':
            return 'Space';
          case 'up':
            return '↑';
          case 'down':
            return '↓';
          case 'left':
            return '←';
          case 'right':
            return '→';
          default:
            return key.toUpperCase();
        }
      })
      .join('');
  }

  // Windows/Linux format
  return keys
    .map((key) => {
      switch (key) {
        case 'mod':
          return 'Ctrl';
        case 'ctrl':
          return 'Ctrl';
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        case 'enter':
          return 'Enter';
        case 'escape':
          return 'Esc';
        case 'space':
          return 'Space';
        default:
          return key.toUpperCase();
      }
    })
    .join('+');
}

/**
 * Built-in global shortcuts - can be extended
 * These are the default shortcuts registered at app init
 */
export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'open-command-palette',
    keys: ['mod', 'k'],
    label: 'Open command palette',
    description: 'Search notes, tasks, and run actions',
    context: 'global',
    priority: 100,
  },
  {
    id: 'open-help',
    keys: ['f1'],
    label: 'Open help',
    description: 'Show keyboard shortcuts and documentation',
    context: 'global',
    priority: 50,
  },
  {
    id: 'open-help-alt',
    keys: ['mod', '/'],
    label: 'Open help',
    description: 'Show keyboard shortcuts and documentation',
    context: 'global',
    priority: 50,
  },
  {
    id: 'toggle-project-context',
    keys: ['mod', 'shift', 'p'],
    label: 'Toggle project context',
    description: 'Open project context dropdown',
    context: 'global',
    priority: 50,
  },
];

/**
 * Sequence detection for chained shortcuts like 'g t' (go to tasks)
 * This is a placeholder for future implementation
 */
export interface ShortcutSequence {
  id: string;
  sequence: string[][]; // e.g., [['g'], ['t']] for 'g then t'
  label: string;
  timeout?: number; // ms to wait between keys, default 1000
}
