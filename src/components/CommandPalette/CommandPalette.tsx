/**
 * Synapse - Neural Search Interface
 *
 * Quick-access search and navigation for NeumanOS, accessible via Ctrl+K (Win/Linux) or Cmd+K (Mac).
 * Named after synapses - the connection points in the brain where signals fire rapidly.
 * Provides instant access to notes, tasks, events, settings, and web search.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, ExternalLink, ArrowRight, Settings } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { searchAll, groupResultsByType, getTypeLabel, detectMode, stripModePrefix, searchCommands, getQuickCreateResult, getRecentCommandResults } from './searchRegistry';
import { SEARCH_ENGINES } from './types';
import type { SearchResult, CommandPaletteMode } from './types';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { CommandPaletteSettings } from './CommandPaletteSettings';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback to open the support modal with a specific tab */
  onOpenSupportModal?: (tab: 'report' | 'help' | 'docs') => void;
  /** Callback to open other modals by ID (about, privacy, onboarding, etc.) */
  onOpenModal?: (modalId: string) => void;
}

/**
 * Type icons mapping
 */
const TYPE_ICONS: Record<string, string> = {
  page: '🏠',
  note: '📝',
  task: '✅',
  event: '📅',
  bookmark: '🔗',
  diagram: '📊',
  form: '📋',
  'time-entry': '⏱️',
  external: '🌐',
  action: '🔲',
  faq: '❓',
  help: '💡',
  widget: '🧩',
  setting: '⚙️',
  automation: '⚡',
  template: '📋',
  project: '📁',
  shortcut: '⌨️',
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenSupportModal, onOpenModal }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Get preferred search engine from settings (default to Google)
  const preferredSearchEngine = useSettingsStore(
    (state) => state.commandPalette?.preferredSearchEngine ?? 'google'
  );
  const isDarkMode = useThemeStore((state) => state.mode === 'dark');

  // Handle escape key - close settings first, then palette
  useEscapeKey({
    enabled: isOpen,
    onEscape: () => {
      if (showSettings) {
        setShowSettings(false);
      } else {
        onClose();
      }
    },
    priority: 10000,
  });

  // Detect mode from query
  const mode: CommandPaletteMode = useMemo(() => detectMode(query), [query]);

  // Search results with memoization - handles different modes
  const results = useMemo(() => {
    if (!isOpen) return [];

    // Command mode: show only commands
    if (mode === 'command') {
      const commandQuery = stripModePrefix(query);
      return searchCommands(commandQuery, navigate, onOpenModal);
    }

    // Help mode: filter to FAQ/help results only
    if (mode === 'help') {
      const helpQuery = stripModePrefix(query);
      const allResults = searchAll(helpQuery, navigate, preferredSearchEngine, onOpenSupportModal, onOpenModal);
      return allResults.filter(r => r.type === 'faq' || r.type === 'help' || r.type === 'shortcut');
    }

    // Navigation mode: filter to pages only
    if (mode === 'navigation') {
      const navQuery = stripModePrefix(query);
      const allResults = searchAll(navQuery, navigate, preferredSearchEngine, onOpenSupportModal, onOpenModal);
      return allResults.filter(r => r.type === 'page');
    }

    // Default search mode
    const searchResults = searchAll(query, navigate, preferredSearchEngine, onOpenSupportModal, onOpenModal);

    // If query is empty, show recent commands at the top
    if (!query.trim()) {
      const recentCommands = getRecentCommandResults(navigate, onOpenModal);
      if (recentCommands.length > 0) {
        // Put recent commands first, then regular results
        return [...recentCommands, ...searchResults];
      }
    }

    // If no results and query is non-empty, add quick create option
    if (searchResults.length === 0 && query.trim()) {
      const quickCreate = getQuickCreateResult(query);
      if (quickCreate) {
        return [quickCreate];
      }
    }

    // If few results (< 3), add quick create as option
    if (searchResults.length < 3 && query.trim()) {
      const quickCreate = getQuickCreateResult(query);
      if (quickCreate) {
        return [...searchResults, quickCreate];
      }
    }

    return searchResults;
  }, [query, isOpen, navigate, preferredSearchEngine, onOpenSupportModal, onOpenModal, mode]);

  // Group results by type
  const groupedResults = useMemo(() => {
    return groupResultsByType(results);
  }, [results]);

  // Flatten grouped results for keyboard navigation
  const flatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    groupedResults.forEach((items) => {
      flat.push(...items);
    });
    return flat;
  }, [groupedResults]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setShowSettings(false);
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selected item in view
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            flatResults[selectedIndex].action();
            onClose();
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : flatResults.length - 1
            );
          } else {
            setSelectedIndex((prev) =>
              prev < flatResults.length - 1 ? prev + 1 : 0
            );
          }
          break;
      }
    },
    [flatResults, selectedIndex, onClose]
  );

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      result.action();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  // Render result item
  const renderResultItem = (result: SearchResult, index: number) => {
    const isSelected = index === selectedIndex;
    const isExternal = result.type === 'external';

    return (
      <button
        key={result.id}
        ref={isSelected ? selectedItemRef : undefined}
        onClick={() => handleResultClick(result)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`
          w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
          ${isSelected
            ? 'bg-accent-blue/20 dark:bg-accent-blue/30'
            : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
          }
        `}
        role="option"
        aria-selected={isSelected}
      >
        {/* Icon */}
        <span className="text-xl flex-shrink-0 w-8 text-center">
          {typeof result.icon === 'string' ? result.icon : TYPE_ICONS[result.type]}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
              {result.title}
            </span>
            {isExternal && (
              <ExternalLink className="w-3.5 h-3.5 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
            )}
          </div>
          {result.subtitle && (
            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary truncate block">
              {result.subtitle}
            </span>
          )}
        </div>

        {/* Action indicator */}
        {isSelected && (
          <ArrowRight className="w-4 h-4 text-accent-blue flex-shrink-0" />
        )}
      </button>
    );
  };

  // Track current flat index for rendering
  let currentFlatIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Synapse search"
    >
      {/* Backdrop - clicks here close the modal */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden"
        style={{ maxHeight: '70vh' }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light dark:border-border-dark">
          <Search className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'command' ? 'Type a command...' :
              mode === 'help' ? 'Search help topics...' :
              mode === 'navigation' ? 'Go to page...' :
              'Search your brain... (> for commands, ? for help)'
            }
            className="flex-1 bg-transparent text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary outline-none text-base"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={flatResults.length > 0}
            aria-controls="command-palette-results"
            aria-activedescendant={
              flatResults[selectedIndex]
                ? `result-${flatResults[selectedIndex].id}`
                : undefined
            }
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            aria-label="Close Synapse"
          >
            <X className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="command-palette-results"
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(70vh - 60px)' }}
          role="listbox"
        >
          {flatResults.length === 0 && query.trim() === '' && (
            <div className="px-4 py-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
              {mode === 'command' ? (
                <>
                  <p className="text-sm">Type a command name (e.g., "dark mode", "new note")</p>
                  <p className="text-xs mt-2 opacity-70">
                    Available: toggle theme, new note/task, start/stop timer, export
                  </p>
                </>
              ) : mode === 'help' ? (
                <>
                  <p className="text-sm">Search help topics and FAQs</p>
                  <p className="text-xs mt-2 opacity-70">
                    Find answers about features, shortcuts, and more
                  </p>
                </>
              ) : mode === 'navigation' ? (
                <>
                  <p className="text-sm">Type a page name to navigate</p>
                  <p className="text-xs mt-2 opacity-70">
                    Dashboard, Notes, Tasks, Schedule, Settings...
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm">Type to search notes, tasks, events, bookmarks...</p>
                  <p className="text-xs mt-2 opacity-70">
                    Prefix with <kbd className="px-1 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated text-xs">&gt;</kbd> for commands,{' '}
                    <kbd className="px-1 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated text-xs">?</kbd> for help,{' '}
                    <kbd className="px-1 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated text-xs">/</kbd> for navigation
                  </p>
                </>
              )}
            </div>
          )}

          {flatResults.length === 0 && query.trim() !== '' && (
            <div className="px-4 py-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-2 opacity-70">Try a different search term or search the web</p>
            </div>
          )}

          {/* Grouped Results */}
          {Array.from(groupedResults.entries()).map(([type, items]) => {
            const startIndex = currentFlatIndex;
            currentFlatIndex += items.length;

            return (
              <div key={type} className="py-1">
                {/* Category Header */}
                <div className="px-4 py-1.5 text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wider bg-surface-light dark:bg-surface-dark sticky top-0">
                  {getTypeLabel(type)}
                </div>

                {/* Results in category */}
                {items.map((result, idx) => renderResultItem(result, startIndex + idx))}
              </div>
            );
          })}
        </div>

        {/* Footer with keyboard hints and settings */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs text-text-light-secondary dark:text-text-dark-secondary">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated">Esc</kbd> Close
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-70">Web:</span>
            {(() => {
              const engine = SEARCH_ENGINES.find((e) => e.id === preferredSearchEngine);
              return engine ? (
                <span className="flex items-center gap-1.5 font-medium">
                  <img
                    src={(isDarkMode && engine.faviconUrlDark) ? engine.faviconUrlDark : engine.faviconUrl}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {engine.name}
                </span>
              ) : (
                <span className="font-medium">Google</span>
              );
            })()}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors ml-1"
              aria-label="Synapse Settings"
              title="Synapse Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Modal Overlay */}
        <CommandPaletteSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
