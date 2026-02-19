/**
 * Smart Date Suggestion Utility
 * Provides context-aware date suggestions for natural language input
 */

import { addDays, addWeeks, addMonths, startOfDay, format } from 'date-fns';

export type SuggestionCategory = 'relative' | 'named' | 'offset';

export interface DateSuggestion {
  label: string;        // Display label: "Tomorrow"
  nlText: string;       // Natural language text for parsing: "tomorrow"
  date: Date;           // Computed date
  category: SuggestionCategory;
}

export interface SuggestionContext {
  currentValue?: string;      // Current input value
  recentDates?: string[];     // Recently used dates (YYYY-MM-DD)
  taskType?: 'quick' | 'detailed'; // UI context
}

/**
 * Get smart date suggestions based on context
 * Returns 8 core suggestions (or 5 for quick mode)
 *
 * @param context - Optional context for filtering/prioritizing suggestions
 * @returns Array of date suggestions
 */
export function getSmartDateSuggestions(context?: SuggestionContext): DateSuggestion[] {
  const now = new Date();
  const isQuickMode = context?.taskType === 'quick';

  // Core suggestions (always show)
  const coreSuggestions: DateSuggestion[] = [
    {
      label: 'Today',
      nlText: 'today',
      date: startOfDay(now),
      category: 'relative',
    },
    {
      label: 'Tomorrow',
      nlText: 'tomorrow',
      date: startOfDay(addDays(now, 1)),
      category: 'relative',
    },
    {
      label: 'In 3 days',
      nlText: 'in 3 days',
      date: startOfDay(addDays(now, 3)),
      category: 'offset',
    },
    {
      label: 'Next week',
      nlText: 'next week',
      date: startOfDay(addWeeks(now, 1)),
      category: 'offset',
    },
    {
      label: 'In 2 weeks',
      nlText: 'in 2 weeks',
      date: startOfDay(addWeeks(now, 2)),
      category: 'offset',
    },
  ];

  // Additional suggestions (not shown in quick mode)
  const additionalSuggestions: DateSuggestion[] = [
    {
      label: 'Next month',
      nlText: 'next month',
      date: startOfDay(addMonths(now, 1)),
      category: 'offset',
    },
    {
      label: 'In 3 months',
      nlText: 'in 3 months',
      date: startOfDay(addMonths(now, 3)),
      category: 'offset',
    },
    {
      label: 'Custom',
      nlText: '',
      date: now,
      category: 'relative',
    },
  ];

  // Return based on mode
  if (isQuickMode) {
    return coreSuggestions;
  }

  return [...coreSuggestions, ...additionalSuggestions];
}

/**
 * Filter suggestions based on input text
 * Uses simple matching: exact, prefix, or fuzzy match
 *
 * @param suggestions - All available suggestions
 * @param input - Current input text
 * @returns Filtered and prioritized suggestions
 */
export function filterSuggestions(
  suggestions: DateSuggestion[],
  input: string
): DateSuggestion[] {
  if (!input || !input.trim()) {
    return suggestions; // Show all if no input
  }

  const searchTerm = input.toLowerCase().trim();

  // Score suggestions based on match quality
  const scored = suggestions.map(suggestion => {
    const label = suggestion.label.toLowerCase();
    const nlText = suggestion.nlText.toLowerCase();

    let score = 0;

    // Exact match (highest priority)
    if (label === searchTerm || nlText === searchTerm) {
      score = 100;
    }
    // Starts with input (second priority)
    else if (label.startsWith(searchTerm) || nlText.startsWith(searchTerm)) {
      score = 50;
    }
    // Contains input (third priority)
    else if (label.includes(searchTerm) || nlText.includes(searchTerm)) {
      score = 25;
    }
    // Fuzzy match: all characters present in order
    else if (fuzzyMatch(label, searchTerm) || fuzzyMatch(nlText, searchTerm)) {
      score = 10;
    }

    return { suggestion, score };
  });

  // Filter out non-matches and sort by score
  const filtered = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.suggestion);

  // Always return at least 3 suggestions (fallback to core)
  if (filtered.length < 3) {
    const core = suggestions.slice(0, 5);
    return core;
  }

  return filtered;
}

/**
 * Simple fuzzy matching: all characters in searchTerm appear in text in order
 */
function fuzzyMatch(text: string, searchTerm: string): boolean {
  let searchIndex = 0;
  for (let i = 0; i < text.length && searchIndex < searchTerm.length; i++) {
    if (text[i] === searchTerm[searchIndex]) {
      searchIndex++;
    }
  }
  return searchIndex === searchTerm.length;
}

/**
 * Format a date suggestion for display in autocomplete
 * Shows date in parentheses for context
 *
 * @param suggestion - Date suggestion
 * @returns Formatted display string
 */
export function formatSuggestionDisplay(suggestion: DateSuggestion): string {
  if (suggestion.label === 'Custom') {
    return 'Custom date...';
  }

  const dateStr = format(suggestion.date, 'MMM d');
  return `${suggestion.label} (${dateStr})`;
}

/**
 * Get cached suggestions (memoized for performance)
 * Cache invalidated at midnight (suggestions depend on "today")
 */
let cachedSuggestions: DateSuggestion[] | null = null;
let cacheDate: string | null = null;

export function getCachedSuggestions(context?: SuggestionContext): DateSuggestion[] {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Invalidate cache if date changed (new day)
  if (cacheDate !== today) {
    cachedSuggestions = null;
    cacheDate = today;
  }

  // Return cached or compute fresh
  if (!cachedSuggestions) {
    cachedSuggestions = getSmartDateSuggestions(context);
  }

  return cachedSuggestions;
}
