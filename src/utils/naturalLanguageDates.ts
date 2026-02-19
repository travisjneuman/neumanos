/**
 * Natural Language Date Parsing Utilities
 * Uses chrono-node for intelligent date parsing
 *
 * Supports:
 * - Relative: "today", "tomorrow", "yesterday"
 * - Named: "next Friday", "last Monday", "this weekend"
 * - Offset: "in 3 days", "2 weeks from now", "+5 days"
 * - Specific: "Dec 25", "Christmas", "next month"
 * - Time: "tomorrow at 3pm", "Friday at 9am"
 */

import { en as chrono } from 'chrono-node'; // English locale for bundle optimization
import { format, isToday, isTomorrow, isYesterday, isThisWeek, isThisYear } from 'date-fns';

/**
 * Parse natural language date input into a Date object
 *
 * @param input - Natural language date string (e.g., "tomorrow", "next Friday")
 * @param referenceDate - Reference date for relative parsing (default: now)
 * @returns Parsed Date object or null if unparseable
 *
 * @example
 * parseNaturalLanguageDate("tomorrow") // Date(2025-12-02)
 * parseNaturalLanguageDate("next Friday") // Date(2025-12-06)
 * parseNaturalLanguageDate("in 2 weeks") // Date(2025-12-15)
 * parseNaturalLanguageDate("invalid") // null
 */
export function parseNaturalLanguageDate(
  input: string,
  referenceDate: Date = new Date()
): Date | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    // Use chrono to parse the date
    const parsed = chrono.parseDate(trimmed, referenceDate);

    if (!parsed || isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  } catch (error) {
    // If parsing fails, return null
    return null;
  }
}

/**
 * Format a date for human-readable display
 * Shows relative terms for recent dates (<7 days), otherwise absolute dates
 *
 * @param date - Date to format
 * @returns Human-readable date string
 *
 * @example
 * formatDateForDisplay(tomorrow) // "Tomorrow (Dec 2)"
 * formatDateForDisplay(nextFriday) // "Next Friday (Dec 6)"
 * formatDateForDisplay(farFuture) // "Jan 15, 2026"
 */
export function formatDateForDisplay(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid date';
  }

  // Relative terms for nearby dates
  if (isToday(date)) {
    return `Today (${format(date, 'MMM d')})`;
  }

  if (isTomorrow(date)) {
    return `Tomorrow (${format(date, 'MMM d')})`;
  }

  if (isYesterday(date)) {
    return `Yesterday (${format(date, 'MMM d')})`;
  }

  // Within this week: show day name
  if (isThisWeek(date, { weekStartsOn: 1 })) {
    return `${format(date, 'EEEE')} (${format(date, 'MMM d')})`;
  }

  // Within 7 days: show "Next [Day]"
  const daysUntil = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil > 0 && daysUntil <= 7) {
    return `Next ${format(date, 'EEEE')} (${format(date, 'MMM d')})`;
  }

  // This year: show month and day
  if (isThisYear(date)) {
    return format(date, 'MMM d, yyyy');
  }

  // Other years: show full date
  return format(date, 'MMM d, yyyy');
}

/**
 * Check if a string contains natural language date patterns
 *
 * @param input - String to check
 * @returns True if chrono can parse a date from the input
 *
 * @example
 * isNaturalLanguageDate("tomorrow") // true
 * isNaturalLanguageDate("next Friday") // true
 * isNaturalLanguageDate("random text") // false
 */
export function isNaturalLanguageDate(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  try {
    const parsed = chrono.parse(input);
    return parsed && parsed.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Common natural language date patterns supported
 * Useful for documentation and autocomplete suggestions
 */
export const COMMON_NL_PATTERNS = {
  relative: ['today', 'tomorrow', 'yesterday'],
  named: ['next Friday', 'last Monday', 'this weekend'],
  offset: ['in 3 days', '2 weeks from now', '+5 days', 'in 2 weeks'],
  specific: ['Dec 25', 'Christmas', 'next month'],
  time: ['tomorrow at 3pm', 'Friday at 9am'],
} as const;

/**
 * Get example NL date phrases for UI hints
 */
export function getExamplePhrases(): string[] {
  return [
    'today',
    'tomorrow',
    'next Friday',
    'in 3 days',
    'in 2 weeks',
    'next month',
  ];
}
