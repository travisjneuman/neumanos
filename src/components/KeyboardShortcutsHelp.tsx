import React from 'react';
import { Modal } from './Modal';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Keyboard Shortcuts Help Modal
 * Shows all available keyboard shortcuts organized by category
 */
export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    {
      category: 'Global',
      items: [
        { keys: ['Ctrl+K'], description: 'Open Synapse (command palette)' },
        { keys: ['F1'], description: 'Open help & support' },
        { keys: ['Ctrl+/'], description: 'Open help' },
        { keys: ['Ctrl+B'], description: 'Toggle sidebar' },
        { keys: ['Ctrl+Shift+A'], description: 'Toggle AI Terminal' },
        { keys: ['Ctrl+Shift+P'], description: 'Toggle project context' },
        { keys: ['Esc'], description: 'Close modal / clear selection' },
      ],
    },
    {
      category: 'Navigation (Ctrl+Number)',
      items: [
        { keys: ['Ctrl+1'], description: 'Dashboard' },
        { keys: ['Ctrl+2'], description: 'Today' },
        { keys: ['Ctrl+3'], description: 'Notes' },
        { keys: ['Ctrl+4'], description: 'Tasks' },
        { keys: ['Ctrl+5'], description: 'Schedule' },
        { keys: ['Ctrl+6'], description: 'Create (Docs)' },
        { keys: ['Ctrl+7'], description: 'Link Library' },
        { keys: ['Ctrl+8'], description: 'Settings' },
      ],
    },
    {
      category: 'Go To (G then key)',
      items: [
        { keys: ['G', 'D'], description: 'Go to Dashboard' },
        { keys: ['G', 'T'], description: 'Go to Tasks' },
        { keys: ['G', 'N'], description: 'Go to Notes' },
        { keys: ['G', 'H'], description: 'Go to Habits' },
        { keys: ['G', 'C'], description: 'Go to Calendar' },
        { keys: ['G', 'S'], description: 'Go to Settings' },
        { keys: ['G', 'O'], description: 'Go to Today' },
        { keys: ['G', 'L'], description: 'Go to Links' },
        { keys: ['G', 'F'], description: 'Go to Focus' },
      ],
    },
    {
      category: 'Quick Create',
      items: [
        { keys: ['C'], description: 'Quick add task' },
        { keys: ['Ctrl+N'], description: 'New note' },
        { keys: ['Ctrl+T'], description: 'New task' },
        { keys: ['Ctrl+E'], description: 'New event (go to calendar)' },
        { keys: ['Ctrl+Shift+T'], description: 'Smart Templates' },
      ],
    },
    {
      category: 'Kanban Board',
      items: [
        { keys: ['J'], description: 'Move down to next task' },
        { keys: ['K'], description: 'Move up to previous task' },
        { keys: ['H'], description: 'Move left to previous column' },
        { keys: ['L'], description: 'Move right to next column' },
        { keys: ['N'], description: 'Create new task in current column' },
        { keys: ['E'], description: 'Edit selected task' },
        { keys: ['D'], description: 'Delete selected task' },
      ],
    },
    {
      category: 'Notes Editor',
      items: [
        { keys: ['Ctrl+D'], description: 'Create daily note' },
        { keys: ['Ctrl+Shift+E'], description: 'Export notes' },
        { keys: ['Ctrl+B'], description: 'Bold text' },
        { keys: ['Ctrl+I'], description: 'Italic text' },
        { keys: ['Ctrl+U'], description: 'Underline text' },
        { keys: ['/'], description: 'Open slash commands' },
        { keys: ['[['], description: 'Insert wiki link' },
      ],
    },
    {
      category: 'Synapse (Command Palette)',
      items: [
        { keys: ['>'], description: 'Enter command mode' },
        { keys: ['?'], description: 'Enter help mode' },
        { keys: ['/'], description: 'Enter navigation mode' },
        { keys: ['tag:name'], description: 'Filter by tag' },
        { keys: ['date:today'], description: 'Filter by date' },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h4 className="text-sm font-semibold text-accent-blue mb-2 uppercase tracking-wide">
              {section.category}
            </h4>
            <div className="space-y-1">
              {section.items.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 border-b border-border-light dark:border-border-dark last:border-0"
                >
                  <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                    {shortcut.description}
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 text-xs font-mono font-semibold bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-button border border-border-light dark:border-border-dark shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-border-light dark:border-border-dark">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Tip: Single-key shortcuts (C, G, J, K, H, L) only work when not typing in an input field. On Mac, use Cmd instead of Ctrl.
          </p>
        </div>
      </div>
    </Modal>
  );
};
