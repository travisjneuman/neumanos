import React, { useMemo, useRef, useEffect } from 'react';
import type { Note } from '../../types/notes';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

interface AutocompleteDropdownProps {
  query: string;
  notes: Note[];
  position: { top: number; left: number } | null;
  onSelect: (title: string) => void;
  onCancel: () => void;
  currentFolderId?: string | null;
  getFolderPath?: (folderId: string | null) => string;
}

interface SearchResult {
  note: Note;
  score: number;
  folderPath: string;
}

/**
 * Fuzzy match algorithm
 * Returns match status and relevance score
 */
function fuzzyMatch(query: string, title: string): { matches: boolean; score: number } {
  if (!query) return { matches: true, score: 0 };

  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();

  // Exact match (highest score)
  if (titleLower === queryLower) {
    return { matches: true, score: 100 };
  }

  // Starts with query (high score)
  if (titleLower.startsWith(queryLower)) {
    return { matches: true, score: 90 };
  }

  // Contains query as whole word (medium-high score)
  if (titleLower.includes(` ${queryLower}`) || titleLower.includes(`-${queryLower}`)) {
    return { matches: true, score: 70 };
  }

  // Contains query (medium score)
  if (titleLower.includes(queryLower)) {
    return { matches: true, score: 60 };
  }

  // Fuzzy match (all characters in order) - low score
  let queryIndex = 0;
  for (let i = 0; i < titleLower.length && queryIndex < queryLower.length; i++) {
    if (titleLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  if (queryIndex === queryLower.length) {
    return { matches: true, score: 40 };
  }

  return { matches: false, score: 0 };
}

/**
 * Highlight matching characters in title
 */
function highlightMatches(title: string, query: string): React.JSX.Element {
  if (!query) return <span>{title}</span>;

  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();

  // Find start of match
  const matchIndex = titleLower.indexOf(queryLower);

  if (matchIndex !== -1) {
    // Direct substring match - highlight the substring
    const before = title.slice(0, matchIndex);
    const match = title.slice(matchIndex, matchIndex + query.length);
    const after = title.slice(matchIndex + query.length);

    return (
      <span>
        {before}
        <span className="font-semibold text-accent-blue">{match}</span>
        {after}
      </span>
    );
  }

  // Fuzzy match - highlight individual characters
  const chars: React.JSX.Element[] = [];
  let queryIndex = 0;

  for (let i = 0; i < title.length; i++) {
    const isMatch = queryIndex < query.length && titleLower[i] === queryLower[queryIndex];
    if (isMatch) queryIndex++;

    chars.push(
      <span
        key={i}
        className={isMatch ? 'font-semibold text-accent-blue' : ''}
      >
        {title[i]}
      </span>
    );
  }

  return <>{chars}</>;
}

/**
 * AutocompleteDropdown Component
 *
 * Displays filtered note results with fuzzy search.
 *
 * Features:
 * - Fuzzy search with relevance scoring
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Click selection
 * - Highlight matching characters
 * - Show folder paths
 * - Empty state
 * - Max 10 results
 */
export default function AutocompleteDropdown({
  query,
  notes,
  position,
  onSelect,
  onCancel,
  currentFolderId,
  getFolderPath = () => 'Root',
}: AutocompleteDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter and sort notes based on query
  const results = useMemo(() => {
    const searchResults: SearchResult[] = [];

    notes.forEach((note) => {
      // Match against title
      let { matches, score } = fuzzyMatch(query, note.title);

      // Also match against aliases if title didn't match
      if (!matches && note.aliases) {
        for (const alias of note.aliases) {
          const aliasResult = fuzzyMatch(query, alias);
          if (aliasResult.matches) {
            matches = true;
            // Slightly lower score for alias matches vs title matches
            score = Math.max(score, aliasResult.score - 5);
            break;
          }
        }
      }

      if (!matches) return;

      let finalScore = score;

      // Boost: same folder as current note
      if (currentFolderId && note.folderId === currentFolderId) {
        finalScore += 10;
      }

      // Boost: recently accessed (last 7 days)
      if (note.updatedAt) {
        const daysSinceUpdate = (Date.now() - new Date(note.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) {
          finalScore += Math.max(0, 5 - daysSinceUpdate);
        }
      }

      searchResults.push({
        note,
        score: finalScore,
        folderPath: getFolderPath(note.folderId),
      });
    });

    // Sort by score (highest first), then alphabetically
    searchResults.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.note.title.localeCompare(b.note.title);
    });

    // Limit to top 10
    return searchResults.slice(0, 10);
  }, [query, notes, currentFolderId, getFolderPath]);

  // Keyboard navigation
  const { selectedIndex, setSelectedIndex } = useKeyboardNavigation(
    results.length,
    (index) => {
      if (results[index]) {
        onSelect(results[index].note.title);
      }
    },
    onCancel,
    true
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = dropdownRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!position) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] w-80 max-h-64 overflow-y-auto bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {results.length === 0 ? (
        // Empty state
        <div className="p-4 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
          {query ? 'No matching notes found' : 'Start typing to search notes'}
        </div>
      ) : (
        // Results list
        <div className="py-1">
          {results.map((result, index) => (
            <button
              key={result.note.id}
              onClick={() => onSelect(result.note.title)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-accent-blue/10 dark:bg-accent-blue/20'
                  : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
            >
              <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                {highlightMatches(result.note.title, query)}
              </div>
              <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary truncate mt-0.5">
                {result.folderPath}
              </div>
            </button>
          ))}
          {results.length === 10 && (
            <div className="px-3 py-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary text-center border-t border-border-light dark:border-border-dark">
              Showing top 10 results
            </div>
          )}
        </div>
      )}

      {/* Footer hint */}
      <div className="px-3 py-1.5 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary text-center border-t border-border-light dark:border-border-dark">
        ↑↓ to navigate • Enter to select • Esc to cancel
      </div>
    </div>
  );
}
