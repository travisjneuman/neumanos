/**
 * Smart Scheduler Service
 *
 * Pure function that generates an optimized daily schedule by matching
 * unscheduled tasks to free time blocks, respecting energy patterns
 * and calendar events.
 */

import type { Task, CalendarEvent } from '../types';
import type { EnergyPattern } from '../stores/useEnergyStore';

// ==================== TYPES ====================

export interface ScheduledBlock {
  taskId: string;
  title: string;
  startTime: string; // "HH:MM" 24-hour format
  endTime: string;   // "HH:MM" 24-hour format
  energyMatch: 'good' | 'ok' | 'poor';
  durationMinutes: number;
}

interface FreeSlot {
  startMinutes: number; // minutes from midnight
  endMinutes: number;
}

// ==================== HELPERS ====================

/** Convert "HH:MM" to minutes from midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes from midnight to "HH:MM" */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Get energy level for a given hour based on patterns */
function getEnergyForHour(hour: number, patterns: EnergyPattern[], dayOfWeek: number): number {
  const pattern = patterns.find((p) => p.dayOfWeek === dayOfWeek);
  if (!pattern) return 5; // Default mid-energy if no data

  if (hour < 12) return pattern.avgMorning || 5;
  if (hour < 17) return pattern.avgAfternoon || 5;
  return pattern.avgEvening || 5;
}

/** Determine energy match quality between task cost and available energy */
function getEnergyMatch(
  taskEnergyCost: number,
  slotEnergy: number
): 'good' | 'ok' | 'poor' {
  // High-energy task in high-energy slot = good
  // Low-energy task in low-energy slot = good
  // Mismatch = poor
  const taskIsHigh = taskEnergyCost >= 4;
  const taskIsLow = taskEnergyCost <= 2;
  const slotIsHigh = slotEnergy >= 7;
  const slotIsLow = slotEnergy <= 4;

  if (taskIsHigh && slotIsHigh) return 'good';
  if (taskIsLow && slotIsLow) return 'good';
  if (taskIsLow && slotIsHigh) return 'ok'; // Wasting high energy on easy work
  if (taskIsHigh && slotIsLow) return 'poor'; // Hard work when tired
  return 'ok';
}

/** Get task duration in minutes from estimatedHours or default */
function getTaskDurationMinutes(task: Task): number {
  if (task.estimatedHours && task.estimatedHours > 0) {
    return Math.round(task.estimatedHours * 60);
  }
  // Default: 30 minutes for tasks without estimates
  return 30;
}

// ==================== MAIN ALGORITHM ====================

/**
 * Generate an optimized schedule for the day.
 *
 * Algorithm:
 * 1. Identify free time blocks (gaps between calendar events)
 * 2. Sort tasks by priority (overdue first, then high>med>low, then due date)
 * 3. Match high-energy tasks to peak energy hours
 * 4. Insert 15-min breaks every 90 minutes of continuous work
 * 5. Return proposed schedule blocks
 */
export function suggestSchedule(
  tasks: Task[],
  events: CalendarEvent[],
  energyPatterns: EnergyPattern[],
  workdayStart: number = 9,
  workdayEnd: number = 17
): ScheduledBlock[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const workStartMinutes = workdayStart * 60;
  const workEndMinutes = workdayEnd * 60;

  // 1. Build occupied time slots from calendar events
  const occupiedSlots: Array<{ start: number; end: number }> = [];
  for (const event of events) {
    if (event.startTime && event.endTime) {
      occupiedSlots.push({
        start: timeToMinutes(event.startTime),
        end: timeToMinutes(event.endTime),
      });
    } else if (event.isAllDay) {
      // All-day events block the entire workday
      occupiedSlots.push({ start: workStartMinutes, end: workEndMinutes });
    }
  }

  // Sort occupied slots by start time
  occupiedSlots.sort((a, b) => a.start - b.start);

  // 2. Find free time blocks within work hours
  const freeSlots: FreeSlot[] = [];
  let cursor = workStartMinutes;

  for (const slot of occupiedSlots) {
    const slotStart = Math.max(slot.start, workStartMinutes);
    const slotEnd = Math.min(slot.end, workEndMinutes);

    if (slotStart > cursor) {
      freeSlots.push({ startMinutes: cursor, endMinutes: slotStart });
    }
    cursor = Math.max(cursor, slotEnd);
  }

  // Add remaining time after last event
  if (cursor < workEndMinutes) {
    freeSlots.push({ startMinutes: cursor, endMinutes: workEndMinutes });
  }

  // 3. Filter and sort tasks
  const schedulableTasks = tasks.filter((t) =>
    t.status !== 'done' && !t.archivedAt
  );

  const todayStr = today.toISOString().split('T')[0];

  schedulableTasks.sort((a, b) => {
    // Overdue tasks first
    const aOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0;
    const bOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    // Then by priority (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPri = priorityOrder[a.priority] ?? 1;
    const bPri = priorityOrder[b.priority] ?? 1;
    if (aPri !== bPri) return aPri - bPri;

    // Then by due date proximity (sooner first)
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    return 0;
  });

  // 4. Assign tasks to free slots with energy matching and breaks
  const result: ScheduledBlock[] = [];
  let continuousWorkMinutes = 0;

  // Separate tasks into high-energy and low-energy buckets
  const highEnergyTasks = schedulableTasks.filter((t) => (t.energyCost ?? 3) >= 4);
  const lowEnergyTasks = schedulableTasks.filter((t) => (t.energyCost ?? 3) <= 2);
  const midEnergyTasks = schedulableTasks.filter((t) => {
    const cost = t.energyCost ?? 3;
    return cost === 3;
  });

  // Reorder: try to place high-energy tasks in high-energy slots
  // Find peak energy hours
  const peakHours: number[] = [];
  const lowHours: number[] = [];
  for (let h = workdayStart; h < workdayEnd; h++) {
    const energy = getEnergyForHour(h, energyPatterns, dayOfWeek);
    if (energy >= 7) peakHours.push(h);
    else if (energy <= 4) lowHours.push(h);
  }

  // Build final ordered task list: interleave based on slot energy
  const usedIds = new Set<string>();

  // Walk through free slots and assign appropriate tasks
  for (const slot of freeSlots) {
    let cursor = slot.startMinutes;
    while (cursor < slot.endMinutes) {
      const currentHour = Math.floor(cursor / 60);
      const slotEnergy = getEnergyForHour(currentHour, energyPatterns, dayOfWeek);

      // Pick best task for this energy level
      let bestTask: Task | undefined;
      if (slotEnergy >= 7) {
        bestTask = highEnergyTasks.find((t) => !usedIds.has(t.id))
          || midEnergyTasks.find((t) => !usedIds.has(t.id))
          || lowEnergyTasks.find((t) => !usedIds.has(t.id));
      } else if (slotEnergy <= 4) {
        bestTask = lowEnergyTasks.find((t) => !usedIds.has(t.id))
          || midEnergyTasks.find((t) => !usedIds.has(t.id))
          || highEnergyTasks.find((t) => !usedIds.has(t.id));
      } else {
        bestTask = midEnergyTasks.find((t) => !usedIds.has(t.id))
          || highEnergyTasks.find((t) => !usedIds.has(t.id))
          || lowEnergyTasks.find((t) => !usedIds.has(t.id));
      }

      if (!bestTask) break;

      const taskDuration = getTaskDurationMinutes(bestTask);
      const available = slot.endMinutes - cursor;

      // Check if we need a break (every 90 minutes of continuous work)
      if (continuousWorkMinutes >= 90) {
        const breakEnd = cursor + 15;
        if (breakEnd > slot.endMinutes) break;
        cursor = breakEnd;
        continuousWorkMinutes = 0;
        continue;
      }

      // How much can we fit?
      const maxBeforeBreak = 90 - continuousWorkMinutes;
      const actualDuration = Math.min(taskDuration, available, maxBeforeBreak);

      if (actualDuration < 15) break; // Don't create blocks shorter than 15 min

      const taskEnergyCost = bestTask.energyCost ?? 3;
      const energyMatch = getEnergyMatch(taskEnergyCost, slotEnergy);

      result.push({
        taskId: bestTask.id,
        title: bestTask.title,
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(cursor + actualDuration),
        energyMatch,
        durationMinutes: actualDuration,
      });

      usedIds.add(bestTask.id);
      continuousWorkMinutes += actualDuration;
      cursor += actualDuration;
    }
  }

  return result;
}
