/**
 * Date Formatting Utilities
 *
 * Provides date/time formatting that respects user preferences
 * from the settings store (date format, time format, week start day).
 */

import { format as dateFnsFormat } from 'date-fns';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { DateFormat, WeekStartDay } from '../stores/useSettingsStore';

/**
 * Get the date format string for date-fns based on user preference
 */
function getDateFormatString(dateFormat: DateFormat): string {
  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return 'MM/dd/yyyy';
    case 'DD/MM/YYYY':
      return 'dd/MM/yyyy';
    case 'YYYY-MM-DD':
      return 'yyyy-MM-dd';
  }
}

/**
 * Format a date using the user's preferred date format
 */
export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const dateFormat = useSettingsStore.getState().dateFormat;
  return dateFnsFormat(d, getDateFormatString(dateFormat));
}

/**
 * Format a date with a custom pattern, but replace date tokens
 * with the user's preferred format
 */
export function formatDateCustom(date: Date | string | number, pattern: string): string {
  const d = date instanceof Date ? date : new Date(date);
  return dateFnsFormat(d, pattern);
}

/**
 * Format time using the user's preferred time format (12h or 24h)
 */
export function formatTimePreferred(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const timeFormat = useSettingsStore.getState().timeFormat;

  if (timeFormat === '24h') {
    return dateFnsFormat(d, 'HH:mm');
  }
  return dateFnsFormat(d, 'h:mm a');
}

/**
 * Format a date and time together using user preferences
 */
export function formatDateTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const dateFormat = useSettingsStore.getState().dateFormat;
  const timeFormat = useSettingsStore.getState().timeFormat;

  const dateStr = dateFnsFormat(d, getDateFormatString(dateFormat));
  const timeStr = timeFormat === '24h'
    ? dateFnsFormat(d, 'HH:mm')
    : dateFnsFormat(d, 'h:mm a');

  return `${dateStr} ${timeStr}`;
}

/**
 * Get the week start day (0 = Sunday, 1 = Monday)
 */
export function getWeekStartDay(): WeekStartDay {
  return useSettingsStore.getState().weekStartDay;
}

/**
 * Format a relative date (Today, Yesterday, Tomorrow, or formatted date)
 */
export function formatRelativeDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  if (isTomorrow) return 'Tomorrow';

  return formatDate(d);
}
