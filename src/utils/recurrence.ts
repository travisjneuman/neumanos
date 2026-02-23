/**
 * Recurrence Utility Functions
 *
 * Generates recurring event instances based on recurrence rules
 * Supports daily, weekly, monthly, yearly frequencies
 */

import type { CalendarEvent } from '../types';
import { format, addDays, addWeeks, addMonths, addYears, parseISO, isBefore, isAfter } from 'date-fns';
import { getStandardDateKey } from './dateUtils';

/**
 * Convert standard date key (YYYY-M-D) to ISO 8601 format (YYYY-MM-DD)
 * parseISO requires zero-padded months and days
 */
function toISODateString(dateKey: string): string {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return dateKey; // Return as-is if invalid
  }
  const [year, month, day] = parts;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface RecurrenceInstance {
  date: string; // YYYY-MM-DD
  event: CalendarEvent;
}

/**
 * Generate recurring event instances for a date range
 */
export const generateRecurringInstances = (
  event: CalendarEvent,
  baseDate: string, // YYYY-MM-DD
  startDate: Date,
  endDate: Date
): RecurrenceInstance[] => {
  if (!event.recurrence) return [];

  const instances: RecurrenceInstance[] = [];
  const { frequency, interval, daysOfWeek, dayOfMonth, endType, endCount, endDate: recEndDate } = event.recurrence;

  let currentDate = parseISO(toISODateString(baseDate));
  let occurrenceCount = 0; // Count of actual occurrences generated (for endType='after')
  let iterationCount = 0; // Safety counter for infinite loop protection

  // Determine max occurrences for endType='after'
  const maxOccurrences = endType === 'after' && endCount ? endCount : Number.MAX_SAFE_INTEGER;
  // Safety limit: max 10000 iterations to prevent infinite loops
  const maxIterations = 10000;

  while (occurrenceCount < maxOccurrences && iterationCount < maxIterations) {
    iterationCount++;

    // Validate date before using it
    if (isNaN(currentDate.getTime())) {
      console.warn('Invalid date encountered in recurrence generation, skipping');
      break;
    }

    // Check if current date is within view range
    const isInViewRange = !isBefore(currentDate, startDate) && !isAfter(currentDate, endDate);

    if (isInViewRange) {
      // For weekly: check if current day matches daysOfWeek
      if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
        const dayOfWeek = currentDate.getDay();
        if (daysOfWeek.includes(dayOfWeek)) {
          const instanceDate = getStandardDateKey(currentDate);  // Use standard format YYYY-M-D
          instances.push({
            date: instanceDate,
            event: {
              ...event,
              recurrenceId: event.id,
              id: `${event.id}-${instanceDate}`,
            },
          });
        }
      } else {
        // For other frequencies, include every occurrence
        const instanceDate = getStandardDateKey(currentDate);  // Use standard format YYYY-M-D
        instances.push({
          date: instanceDate,
          event: {
            ...event,
            recurrenceId: event.id,
            id: `${event.id}-${instanceDate}`,
          },
        });
      }
    }

    // For endType='after', count ALL occurrences (not just those in view range)
    // This ensures endCount works correctly regardless of view range
    const shouldCountOccurrence = frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0
      ? daysOfWeek.includes(currentDate.getDay())
      : true;

    if (shouldCountOccurrence) {
      occurrenceCount++;
    }

    // Move to next occurrence
    switch (frequency) {
      case 'daily':
        currentDate = addDays(currentDate, interval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, interval);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, interval);
        // If dayOfMonth specified, set to that day (avoid mutation)
        if (dayOfMonth) {
          const maxDayInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          const targetDay = Math.min(dayOfMonth, maxDayInMonth);
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), targetDay);
        }
        break;
      case 'yearly':
        currentDate = addYears(currentDate, interval);
        break;
    }

    // Check end conditions
    if (endType === 'until' && recEndDate) {
      const endDateParsed = parseISO(toISODateString(recEndDate));
      if (isAfter(currentDate, endDateParsed)) {
        break;
      }
    }

    if (endType === 'after' && occurrenceCount >= (endCount || 0)) {
      break;
    }

    // Safety: stop if we've moved far beyond the view range
    if (isAfter(currentDate, addYears(endDate, 10))) {
      break;
    }
  }

  return instances;
};

/**
 * Get all instances of a recurring event for display in calendar
 */
export const getEventInstances = (
  event: CalendarEvent,
  baseDate: string,
  viewStartDate: Date,
  viewEndDate: Date
): Map<string, CalendarEvent[]> => {
  const instancesMap = new Map<string, CalendarEvent[]>();

  if (!event.recurrence) {
    // Non-recurring event
    const existingEvents = instancesMap.get(baseDate) || [];
    instancesMap.set(baseDate, [...existingEvents, event]);
    return instancesMap;
  }

  // Generate recurring instances
  const instances = generateRecurringInstances(event, baseDate, viewStartDate, viewEndDate);

  instances.forEach(({ date, event: instanceEvent }) => {
    const existingEvents = instancesMap.get(date) || [];
    instancesMap.set(date, [...existingEvents, instanceEvent]);
  });

  return instancesMap;
};

/**
 * Check if a date has a specific day of week
 */
export const isDayOfWeek = (date: Date, dayOfWeek: number): boolean => {
  return date.getDay() === dayOfWeek;
};

/**
 * Expand multi-day event across date range
 */
export const expandMultiDayEvent = (
  event: CalendarEvent,
  startDateKey: string
): Map<string, CalendarEvent> => {
  const result = new Map<string, CalendarEvent>();

  if (!event.endDate || event.endDate === startDateKey) {
    // Single-day event
    result.set(startDateKey, event);
    return result;
  }

  // Multi-day event: create instance for each day
  const startDate = parseISO(toISODateString(startDateKey));
  const endDate = parseISO(toISODateString(event.endDate));

  // Validate dates before processing
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.warn('Invalid date in multi-day event expansion, skipping', { startDateKey, endDate: event.endDate });
    return result;
  }

  let currentDate = startDate;
  let dayIndex = 0;

  while (!isAfter(currentDate, endDate)) {
    // Validate current date before using it
    if (isNaN(currentDate.getTime())) {
      console.warn('Invalid date encountered in multi-day expansion, stopping');
      break;
    }

    const dateKey = getStandardDateKey(currentDate);  // Use standard format YYYY-M-D
    const isFirst = dayIndex === 0;
    const isLast = getStandardDateKey(currentDate) === event.endDate;

    result.set(dateKey, {
      ...event,
      id: `${event.id}-day${dayIndex}`,
      _isMultiDayPart: true,
      _isMultiDayFirst: isFirst,
      _isMultiDayLast: isLast,
    } as CalendarEvent);

    currentDate = addDays(currentDate, 1);
    dayIndex++;
  }

  return result;
};

/**
 * Get human-readable recurrence description
 */
export const getRecurrenceDescription = (recurrence?: CalendarEvent['recurrence']): string => {
  if (!recurrence) return 'Does not repeat';

  const { frequency, interval, daysOfWeek, dayOfMonth, endType, endCount, endDate } = recurrence;

  let desc = '';

  // Frequency
  if (interval === 1) {
    desc = frequency === 'daily' ? 'Daily' : frequency === 'weekly' ? 'Weekly' : frequency === 'monthly' ? 'Monthly' : 'Yearly';
  } else {
    desc = `Every ${interval} ${frequency === 'daily' ? 'days' : frequency === 'weekly' ? 'weeks' : frequency === 'monthly' ? 'months' : 'years'}`;
  }

  // Weekly: specific days
  if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabels = daysOfWeek.map(d => dayNames[d]).join(', ');
    desc += ` on ${dayLabels}`;
  }

  // Monthly: specific day
  if (frequency === 'monthly' && dayOfMonth) {
    const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
    desc += ` on the ${dayOfMonth}${suffix}`;
  }

  // End condition
  if (endType === 'never') {
    // No end
  } else if (endType === 'after' && endCount) {
    desc += `, ${endCount} times`;
  } else if (endType === 'until' && endDate) {
    desc += `, until ${format(parseISO(toISODateString(endDate)), 'MMM d, yyyy')}`;
  }

  return desc;
};
