/**
 * Synapse Settings Modal
 *
 * A settings overlay that appears on top of Synapse (the neural search interface),
 * allowing users to configure preferences without leaving the search context.
 * Renders as a portal at the document level for proper sizing.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { SEARCH_ENGINES } from './types';

interface SynapseSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteSettings: React.FC<SynapseSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const commandPaletteSettings = useSettingsStore((state) => state.commandPalette);
  const setCommandPaletteSettings = useSettingsStore((state) => state.setCommandPaletteSettings);
  const isDarkMode = useThemeStore((state) => state.mode === 'dark');

  const preferredSearchEngine = commandPaletteSettings?.preferredSearchEngine ?? 'google';

  const handleSearchEngineChange = (engineId: string) => {
    setCommandPaletteSettings({
      ...commandPaletteSettings,
      preferredSearchEngine: engineId,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Synapse Settings"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Synapse Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Search Engine Selection */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              Preferred Search Engine
            </label>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
              This engine will be used when you search the web from Synapse.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SEARCH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => handleSearchEngineChange(engine.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${preferredSearchEngine === engine.id
                      ? 'bg-accent-blue/20 border-2 border-accent-blue dark:bg-accent-blue/30'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated border-2 border-transparent hover:border-border-light dark:hover:border-border-dark'
                    }
                  `}
                >
                  <img
                    src={(isDarkMode && engine.faviconUrlDark) ? engine.faviconUrlDark : engine.faviconUrl}
                    alt=""
                    className="w-5 h-5 flex-shrink-0"
                    onError={(e) => {
                      // Fallback to a generic globe icon if favicon fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                    {engine.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="pt-4 border-t border-border-light dark:border-border-dark">
            <h3 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              <div className="flex justify-between items-center">
                <span>Open Synapse</span>
                <kbd className="px-2 py-1 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated font-mono text-xs">
                  Ctrl+K / ⌘K
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Navigate results</span>
                <kbd className="px-2 py-1 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated font-mono text-xs">
                  ↑ ↓
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Select result</span>
                <kbd className="px-2 py-1 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated font-mono text-xs">
                  Enter
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Close</span>
                <kbd className="px-2 py-1 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated font-mono text-xs">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPaletteSettings;
