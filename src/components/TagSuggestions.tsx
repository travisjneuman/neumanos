/**
 * TagSuggestions Component
 *
 * Displays suggested tags as chips below tag input
 * Features:
 * - Shows suggestion reason on hover
 * - Click to add tag
 * - Refresh suggestions button
 */

import { Plus, Info } from 'lucide-react';
import type { TagSuggestion } from '../types/notes';
import { getSuggestionReasonLabel } from '../utils/tagSuggestions';
import { useSettingsStore } from '../stores/useSettingsStore';

export interface TagSuggestionsProps {
  /** Array of suggested tags */
  suggestions: TagSuggestion[];
  /** Callback when suggestion is clicked */
  onAddTag: (tag: string) => void;
  /** Optional: Show empty state when no suggestions */
  showEmptyState?: boolean;
}

export function TagSuggestions({ suggestions, onAddTag, showEmptyState = false }: TagSuggestionsProps) {
  const tagColors = useSettingsStore((state) => state.tagColors);

  if (suggestions.length === 0 && !showEmptyState) {
    return null;
  }

  if (suggestions.length === 0 && showEmptyState) {
    return (
      <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary text-center py-2">
        No suggestions available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Info className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
        <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Suggested tags
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const color = tagColors[suggestion.tag];
          return (
            <button
              key={suggestion.tag}
              onClick={() => onAddTag(suggestion.tag)}
              className={`
                group relative inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
                border transition-all
                ${
                  color
                    ? `border-${color}/30 bg-${color}/5 text-${color} hover:bg-${color}/10`
                    : 'border-accent-primary/30 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary/10'
                }
              `}
              title={getSuggestionReasonLabel(suggestion.reason)}
            >
              <Plus className="w-3 h-3" />
              <span>{suggestion.tag}</span>

              {/* Tooltip on hover */}
              <span className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1
                text-xs whitespace-nowrap rounded
                bg-surface-dark text-text-dark-primary
                dark:bg-surface-light dark:text-text-light-primary
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                shadow-lg z-10
              ">
                {getSuggestionReasonLabel(suggestion.reason)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
