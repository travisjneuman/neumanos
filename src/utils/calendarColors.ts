/**
 * Calendar Color Utility
 * Returns the display color for an event based on its calendar assignment
 */

import type { CalendarEvent, UserCalendar } from '../types';
import { useCalendarStore } from '../stores/useCalendarStore';
import { getColorCategory } from './eventColors';

/**
 * Get the display color for a calendar event.
 * Priority: calendar color > color category > default
 */
export function getEventDisplayColor(event: CalendarEvent, calendars?: UserCalendar[]): string {
  // If event belongs to a calendar, use that calendar's color
  if (event.calendarId) {
    const cals = calendars ?? useCalendarStore.getState().calendars;
    const cal = cals.find(c => c.id === event.calendarId);
    if (cal) return cal.color;
  }

  // Fall back to color category
  return getColorCategory(event.colorCategory).hex;
}
