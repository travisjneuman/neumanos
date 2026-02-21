/**
 * Daily Planning Store
 *
 * Manages per-date planning data for the Today page:
 * - Daily goals/intentions (1-3 per day)
 * - Task timeboxing (duration estimates)
 * - End-of-day reviews (reflection + metrics snapshot)
 * - Available hours configuration
 *
 * All data keyed by date string (YYYY-M-D format, non-padded for store compatibility).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';

// ==================== TYPES ====================

/** Preset duration options in minutes */
export type TimeboxPreset = 15 | 30 | 60 | 120;

/** A single daily goal/intention */
export interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO date
  completedAt?: string; // ISO date
}

/** Timebox assignment for a task on a specific date */
export interface TaskTimebox {
  taskId: string;
  durationMinutes: number; // Estimated duration in minutes
  scheduledTime?: string; // Optional "HH:MM" for timeline placement
}

/** End-of-day review entry */
export interface DailyReview {
  reflectionNotes: string;
  mood?: 'great' | 'good' | 'okay' | 'rough';
  completedAt: string; // ISO date when review was written
  // Snapshot metrics (captured at review time)
  tasksCompleted: number;
  tasksDue: number;
  hoursTracked: number;
  goalsCompleted: number;
  goalsDue: number;
}

/** All planning data for a single date */
export interface DayPlan {
  goals: DailyGoal[];
  timeboxes: TaskTimebox[];
  review?: DailyReview;
  availableHours: number; // How many hours available for work (default: 8)
}

// ==================== STORE INTERFACE ====================

interface DailyPlanningState {
  /** Date-keyed planning data (key format: "YYYY-M-D") */
  plans: Record<string, DayPlan>;
}

interface DailyPlanningActions {
  // Plan access
  getPlan: (dateKey: string) => DayPlan;

  // Goals
  addGoal: (dateKey: string, text: string) => void;
  updateGoal: (dateKey: string, goalId: string, text: string) => void;
  toggleGoal: (dateKey: string, goalId: string) => void;
  removeGoal: (dateKey: string, goalId: string) => void;

  // Timeboxing
  setTimebox: (dateKey: string, taskId: string, durationMinutes: number) => void;
  removeTimebox: (dateKey: string, taskId: string) => void;
  getTimebox: (dateKey: string, taskId: string) => TaskTimebox | undefined;
  getTotalPlannedMinutes: (dateKey: string) => number;

  // Available hours
  setAvailableHours: (dateKey: string, hours: number) => void;

  // Reviews
  saveReview: (dateKey: string, review: DailyReview) => void;
  getReview: (dateKey: string) => DailyReview | undefined;
}

type DailyPlanningStore = DailyPlanningState & DailyPlanningActions;

// ==================== DEFAULT VALUES ====================

const createDefaultPlan = (): DayPlan => ({
  goals: [],
  timeboxes: [],
  availableHours: 8,
});

// ==================== STORE ====================

export const useDailyPlanningStore = create<DailyPlanningStore>()(
  persist(
    (set, get) => ({
      plans: {},

      getPlan: (dateKey) => {
        return get().plans[dateKey] || createDefaultPlan();
      },

      // ==================== GOAL ACTIONS ====================

      addGoal: (dateKey, text) => {
        const plan = get().getPlan(dateKey);
        if (plan.goals.length >= 3) return; // Max 3 goals

        const newGoal: DailyGoal = {
          id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              goals: [...plan.goals, newGoal],
            },
          },
        }));
      },

      updateGoal: (dateKey, goalId, text) => {
        const plan = get().getPlan(dateKey);
        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              goals: plan.goals.map((g) =>
                g.id === goalId ? { ...g, text } : g
              ),
            },
          },
        }));
      },

      toggleGoal: (dateKey, goalId) => {
        const plan = get().getPlan(dateKey);
        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              goals: plan.goals.map((g) =>
                g.id === goalId
                  ? {
                      ...g,
                      completed: !g.completed,
                      completedAt: !g.completed ? new Date().toISOString() : undefined,
                    }
                  : g
              ),
            },
          },
        }));
      },

      removeGoal: (dateKey, goalId) => {
        const plan = get().getPlan(dateKey);
        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              goals: plan.goals.filter((g) => g.id !== goalId),
            },
          },
        }));
      },

      // ==================== TIMEBOX ACTIONS ====================

      setTimebox: (dateKey, taskId, durationMinutes) => {
        const plan = get().getPlan(dateKey);
        const existing = plan.timeboxes.findIndex((t) => t.taskId === taskId);

        const newTimebox: TaskTimebox = { taskId, durationMinutes };
        const updatedTimeboxes =
          existing >= 0
            ? plan.timeboxes.map((t, i) => (i === existing ? newTimebox : t))
            : [...plan.timeboxes, newTimebox];

        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              timeboxes: updatedTimeboxes,
            },
          },
        }));
      },

      removeTimebox: (dateKey, taskId) => {
        const plan = get().getPlan(dateKey);
        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              timeboxes: plan.timeboxes.filter((t) => t.taskId !== taskId),
            },
          },
        }));
      },

      getTimebox: (dateKey, taskId) => {
        const plan = get().getPlan(dateKey);
        return plan.timeboxes.find((t) => t.taskId === taskId);
      },

      getTotalPlannedMinutes: (dateKey) => {
        const plan = get().getPlan(dateKey);
        return plan.timeboxes.reduce((sum, t) => sum + t.durationMinutes, 0);
      },

      // ==================== AVAILABLE HOURS ====================

      setAvailableHours: (dateKey, hours) => {
        const plan = get().getPlan(dateKey);
        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              availableHours: Math.max(0, Math.min(24, hours)),
            },
          },
        }));
      },

      // ==================== REVIEW ACTIONS ====================

      saveReview: (dateKey, review) => {
        const plan = get().getPlan(dateKey);
        set((state) => ({
          plans: {
            ...state.plans,
            [dateKey]: {
              ...plan,
              review,
            },
          },
        }));
      },

      getReview: (dateKey) => {
        return get().plans[dateKey]?.review;
      },
    }),
    {
      name: 'daily-planning',
      storage: createJSONStorage(() => createSyncedStorage()),
    }
  )
);
