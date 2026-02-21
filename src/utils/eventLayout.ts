/**
 * Event Layout Utility
 * Calculates side-by-side positioning for overlapping calendar events
 * (Google Calendar-style stacking)
 */

import type { CalendarEvent } from '../types';

interface LayoutInfo {
  /** Column index (0-based) within the overlap group */
  column: number;
  /** Total number of columns in this overlap group */
  totalColumns: number;
}

/** Parse "HH:MM" time string to minutes since midnight */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate layout positions for overlapping timed events.
 * Returns a Map from event.id to its layout info (column index, total columns).
 *
 * Algorithm:
 * 1. Sort events by start time
 * 2. Use a greedy column-packing approach
 * 3. Events that overlap share columns side-by-side
 */
export function calculateEventLayout(events: CalendarEvent[]): Map<string, LayoutInfo> {
  const result = new Map<string, LayoutInfo>();

  // Filter to only timed events with valid start/end
  const timedEvents = events.filter(
    (e) => !e.isAllDay && e.startTime && e.endTime
  );

  if (timedEvents.length === 0) return result;

  // Sort by start time, then by longer duration first (for better visual layout)
  const sorted = [...timedEvents].sort((a, b) => {
    const startA = timeToMinutes(a.startTime!);
    const startB = timeToMinutes(b.startTime!);
    if (startA !== startB) return startA - startB;
    // Longer events first
    const durationA = timeToMinutes(a.endTime!) - startA;
    const durationB = timeToMinutes(b.endTime!) - startB;
    return durationB - durationA;
  });

  // Build overlap groups using a sweep-line approach
  // Each group is a set of events that all overlap transitively
  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [];
  let groupEnd = 0;

  for (const event of sorted) {
    const start = timeToMinutes(event.startTime!);
    const end = timeToMinutes(event.endTime!);

    if (currentGroup.length === 0 || start < groupEnd) {
      // Event overlaps with current group
      currentGroup.push(event);
      groupEnd = Math.max(groupEnd, end);
    } else {
      // No overlap, start new group
      groups.push(currentGroup);
      currentGroup = [event];
      groupEnd = end;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // For each overlap group, assign columns
  for (const group of groups) {
    if (group.length === 1) {
      // Single event, full width
      result.set(group[0].id, { column: 0, totalColumns: 1 });
      continue;
    }

    // Greedy column assignment: for each event, find the first column
    // where it doesn't overlap with any already-assigned event
    const columns: CalendarEvent[][] = [];

    for (const event of group) {
      const eventStart = timeToMinutes(event.startTime!);
      const eventEnd = timeToMinutes(event.endTime!);
      let placed = false;

      for (let col = 0; col < columns.length; col++) {
        // Check if this event overlaps with any event in this column
        const canPlace = columns[col].every((existing) => {
          const existStart = timeToMinutes(existing.startTime!);
          const existEnd = timeToMinutes(existing.endTime!);
          return eventStart >= existEnd || eventEnd <= existStart;
        });

        if (canPlace) {
          columns[col].push(event);
          result.set(event.id, { column: col, totalColumns: 0 }); // totalColumns set later
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Need a new column
        columns.push([event]);
        result.set(event.id, { column: columns.length - 1, totalColumns: 0 });
      }
    }

    // Now set totalColumns for all events in this group
    const totalCols = columns.length;
    for (const event of group) {
      const layout = result.get(event.id)!;
      layout.totalColumns = totalCols;
    }
  }

  return result;
}
