/**
 * Weekly Retrospective Data Service
 *
 * Pure functions that aggregate data from all stores for a given week.
 * Reads from habit, time tracking, kanban, and calendar stores
 * to produce a typed RetroData object with week-over-week comparisons.
 */

import { useHabitStore } from '../stores/useHabitStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import { timeTrackingDb } from '../db/timeTrackingDb';
import type { TimeEntry } from '../types';

// ─── Types ──────────────────────────────────────────────────

export interface TaskMetrics {
  completed: number;
  created: number;
  overdue: number;
  completionRate: number; // percentage 0-100
}

export interface TimeMetrics {
  totalSeconds: number;
  hoursByProject: Array<{ projectName: string; seconds: number }>;
  dailyAverageSeconds: number;
  mostProductiveDay: string | null; // e.g. "Monday"
}

export interface HabitMetrics {
  overallCompletionRate: number; // percentage 0-100
  streaksGained: number;
  streaksLost: number;
  bestHabit: string | null;
  worstHabit: string | null;
}

export interface CalendarMetrics {
  totalEvents: number;
  meetingsCount: number;
}

export interface WeekComparison {
  tasks: { completedDelta: number; rateDelta: number };
  time: { totalSecondsDelta: number };
  habits: { rateDelta: number };
  calendar: { eventsDelta: number };
}

export interface RetroData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  tasks: TaskMetrics;
  time: TimeMetrics;
  habits: HabitMetrics;
  calendar: CalendarMetrics;
  comparison: WeekComparison | null;
}

// ─── Helpers ────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Date key format used by habit store: YYYY-M-D (non-padded) */
function getHabitDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Date key format used by calendar store: YYYY-M-D (non-padded) */
function getCalendarDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

// ─── Task Metrics ───────────────────────────────────────────

function getTaskMetrics(weekStart: Date, weekEnd: Date): TaskMetrics {
  const tasks = useKanbanStore.getState().tasks;

  let completed = 0;
  let created = 0;
  let overdue = 0;
  let total = 0;

  for (const task of tasks) {
    const createdDate = new Date(task.created);
    if (createdDate >= weekStart && createdDate <= weekEnd) {
      created++;
    }

    // Count tasks that were completed this week
    if (task.status === 'done' && task.lastCompletedAt) {
      const completedDate = new Date(task.lastCompletedAt);
      if (completedDate >= weekStart && completedDate <= weekEnd) {
        completed++;
      }
    }

    // Count overdue tasks as of week end
    if (task.dueDate && task.status !== 'done') {
      const dueDate = new Date(task.dueDate);
      if (dueDate <= weekEnd) {
        overdue++;
      }
    }

    // Total active tasks during this week
    if (createdDate <= weekEnd) {
      total++;
    }
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, created, overdue, completionRate };
}

// ─── Time Metrics ───────────────────────────────────────────

async function getTimeMetrics(weekStart: Date, weekEnd: Date): Promise<TimeMetrics> {
  const store = useTimeTrackingStore_getState();
  let entries: TimeEntry[];

  try {
    entries = await timeTrackingDb.getEntriesByDateRange(weekStart, weekEnd);
  } catch {
    // Fallback to in-memory entries
    entries = store.entries.filter((e) => {
      const d = new Date(e.startTime);
      return d >= weekStart && d <= weekEnd;
    });
  }

  const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0);

  // Hours by project (top 3)
  const projectMap = new Map<string, number>();
  for (const entry of entries) {
    const key = entry.projectId || 'no-project';
    projectMap.set(key, (projectMap.get(key) || 0) + entry.duration);
  }

  const projects = store.projects;
  const hoursByProject = Array.from(projectMap.entries())
    .map(([id, seconds]) => ({
      projectName: projects.find((p) => p.id === id)?.name || 'No Project',
      seconds,
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 3);

  // Daily averages and most productive day
  const dayTotals = new Map<number, number>(); // dayOfWeek -> seconds
  for (const entry of entries) {
    const day = new Date(entry.startTime).getDay();
    dayTotals.set(day, (dayTotals.get(day) || 0) + entry.duration);
  }

  const daysWithData = dayTotals.size || 1;
  const dailyAverageSeconds = Math.round(totalSeconds / daysWithData);

  let mostProductiveDay: string | null = null;
  let maxDaySeconds = 0;
  for (const [day, secs] of dayTotals) {
    if (secs > maxDaySeconds) {
      maxDaySeconds = secs;
      mostProductiveDay = DAY_NAMES[day];
    }
  }

  return { totalSeconds, hoursByProject, dailyAverageSeconds, mostProductiveDay };
}

/** Helper to access time tracking store state without importing the store at module level */
function useTimeTrackingStore_getState() {
  // Dynamic require to avoid circular imports
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useTimeTrackingStore } = require('../stores/useTimeTrackingStore') as {
    useTimeTrackingStore: { getState: () => { entries: TimeEntry[]; projects: Array<{ id: string; name: string }> } };
  };
  return useTimeTrackingStore.getState();
}

// ─── Habit Metrics ──────────────────────────────────────────

function getHabitMetrics(weekStart: Date, weekEnd: Date): HabitMetrics {
  const { habits, completions } = useHabitStore.getState();
  const activeHabits = habits.filter((h) => !h.archivedAt);

  if (activeHabits.length === 0) {
    return { overallCompletionRate: 0, streaksGained: 0, streaksLost: 0, bestHabit: null, worstHabit: null };
  }

  // Build set of date keys for this week
  const weekDateKeys: string[] = [];
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    weekDateKeys.push(getHabitDateKey(new Date(d)));
  }

  // Per-habit completion rates for the week
  const habitRates: Array<{ title: string; rate: number; streak: number }> = [];
  let totalTracked = 0;
  let totalCompleted = 0;

  for (const habit of activeHabits) {
    let tracked = 0;
    let completed = 0;

    for (const dateKey of weekDateKeys) {
      tracked++;
      if (completions.some((c) => c.habitId === habit.id && c.date === dateKey)) {
        completed++;
      }
    }

    totalTracked += tracked;
    totalCompleted += completed;

    const rate = tracked > 0 ? Math.round((completed / tracked) * 100) : 0;
    habitRates.push({ title: habit.title, rate, streak: habit.currentStreak });
  }

  const overallCompletionRate = totalTracked > 0 ? Math.round((totalCompleted / totalTracked) * 100) : 0;

  // Streaks: count habits with streak > 7 as "gained", streak === 0 as "lost"
  const streaksGained = activeHabits.filter((h) => h.currentStreak >= 7).length;
  const streaksLost = activeHabits.filter((h) => h.currentStreak === 0 && h.totalCompletions > 0).length;

  // Best and worst
  habitRates.sort((a, b) => b.rate - a.rate);
  const bestHabit = habitRates[0]?.title || null;
  const worstHabit = habitRates.length > 1 ? habitRates[habitRates.length - 1]?.title || null : null;

  return { overallCompletionRate, streaksGained, streaksLost, bestHabit, worstHabit };
}

// ─── Calendar Metrics ───────────────────────────────────────

function getCalendarMetrics(weekStart: Date, weekEnd: Date): CalendarMetrics {
  const { events } = useCalendarStore.getState();

  let totalEvents = 0;
  let meetingsCount = 0;

  // Iterate through each day of the week
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dateKey = getCalendarDateKey(new Date(d));
    const dayEvents = events[dateKey] || [];
    totalEvents += dayEvents.length;

    // Count meetings (events with start/end times, not all-day)
    meetingsCount += dayEvents.filter((e) => e.startTime && !e.isAllDay).length;
  }

  return { totalEvents, meetingsCount };
}

// ─── Main Generator ─────────────────────────────────────────

export async function generateRetrospectiveData(weekStartInput: Date): Promise<RetroData> {
  const weekStart = getWeekStart(weekStartInput);
  const weekEnd = getWeekEnd(weekStart);
  const weekLabel = formatWeekLabel(weekStart, weekEnd);

  // Gather metrics for current week
  const tasks = getTaskMetrics(weekStart, weekEnd);
  const time = await getTimeMetrics(weekStart, weekEnd);
  const habits = getHabitMetrics(weekStart, weekEnd);
  const calendar = getCalendarMetrics(weekStart, weekEnd);

  // Gather previous week metrics for comparison
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = getWeekEnd(prevWeekStart);

  const prevTasks = getTaskMetrics(prevWeekStart, prevWeekEnd);
  const prevTime = await getTimeMetrics(prevWeekStart, prevWeekEnd);
  const prevHabits = getHabitMetrics(prevWeekStart, prevWeekEnd);
  const prevCalendar = getCalendarMetrics(prevWeekStart, prevWeekEnd);

  const comparison: WeekComparison = {
    tasks: {
      completedDelta: tasks.completed - prevTasks.completed,
      rateDelta: tasks.completionRate - prevTasks.completionRate,
    },
    time: {
      totalSecondsDelta: time.totalSeconds - prevTime.totalSeconds,
    },
    habits: {
      rateDelta: habits.overallCompletionRate - prevHabits.overallCompletionRate,
    },
    calendar: {
      eventsDelta: calendar.totalEvents - prevCalendar.totalEvents,
    },
  };

  return {
    weekStart,
    weekEnd,
    weekLabel,
    tasks,
    time,
    habits,
    calendar,
    comparison,
  };
}
