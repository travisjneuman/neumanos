import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Habit, HabitCompletion, HabitAchievement, HabitCategory, HabitDifficulty } from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';
import { useProjectContextStore, matchesProjectFilter } from './useProjectContextStore';
import { toast } from './useToastStore';

// Achievement milestone definitions
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];
const TOTAL_MILESTONES = [10, 50, 100, 500, 1000];

// XP system constants
const DIFFICULTY_XP: Record<HabitDifficulty, number> = {
  trivial: 5,
  easy: 10,
  medium: 20,
  hard: 40,
};

// Streak multiplier: every 7-day streak gives +0.1x bonus (max 3x)
function getStreakMultiplier(streak: number): number {
  return Math.min(1 + Math.floor(streak / 7) * 0.1, 3);
}

// Calculate XP for a completion
function calculateXp(difficulty: HabitDifficulty, currentStreak: number): number {
  const base = DIFFICULTY_XP[difficulty];
  const multiplier = getStreakMultiplier(currentStreak);
  return Math.round(base * multiplier);
}

// Level from total XP (each level requires progressively more XP)
export function getLevelFromXp(totalXp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level++;
  }
  return { level, currentXp: remaining, nextLevelXp: level * 100 };
}

// Helper to get date key in YYYY-M-D format (non-padded per project convention)
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}


// Check if a habit should be tracked on a given date
function shouldTrackOnDate(habit: Habit, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'specific-days':
      return habit.targetDays?.includes(dayOfWeek) ?? false;
    case 'times-per-week':
      // For times-per-week, always allow tracking (user chooses when)
      return true;
    default:
      return true;
  }
}

// Calculate streak for a habit
function calculateStreakForHabit(
  habit: Habit,
  completions: HabitCompletion[]
): number {
  const habitCompletions = completions
    .filter((c) => c.habitId === habit.id)
    .map((c) => c.date)
    .sort()
    .reverse();

  if (habitCompletions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from today and go backwards
  const checkDate = new Date(today);
  const completionSet = new Set(habitCompletions);

  // For times-per-week, we need different logic
  if (habit.frequency === 'times-per-week') {
    // Calculate weekly streaks
    let weeksStreak = 0;
    const currentWeekStart = getWeekStart(today);

    while (true) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Count completions this week
      let weekCompletions = 0;
      for (let d = new Date(currentWeekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        if (completionSet.has(getDateKey(d))) {
          weekCompletions++;
        }
      }

      // If this is the current week, it's in progress
      if (currentWeekStart.getTime() === getWeekStart(today).getTime()) {
        // Current week - count if we've met the target so far
        if (weekCompletions >= (habit.timesPerWeek ?? 1)) {
          weeksStreak++;
        }
      } else {
        // Past week - must have met target
        if (weekCompletions >= (habit.timesPerWeek ?? 1)) {
          weeksStreak++;
        } else {
          break;
        }
      }

      // Move to previous week
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);

      // Safety limit
      if (weeksStreak > 520) break; // ~10 years
    }

    return weeksStreak;
  }

  // For daily/weekdays/weekends/specific-days
  while (true) {
    const dateKey = getDateKey(checkDate);

    if (shouldTrackOnDate(habit, checkDate)) {
      if (completionSet.has(dateKey)) {
        streak++;
      } else {
        // If today and not completed, don't break streak yet
        if (checkDate.getTime() === today.getTime()) {
          // Skip today - check yesterday
        } else {
          break;
        }
      }
    }

    // Move to previous day
    checkDate.setDate(checkDate.getDate() - 1);

    // Safety limit - max 10 years of history
    if (streak > 3650) break;
  }

  return streak;
}

// Get start of week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface HabitStore {
  // State
  habits: Habit[];
  completions: HabitCompletion[];
  achievements: HabitAchievement[];

  // Habit CRUD
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'totalCompletions' | 'totalXp' | 'order'>) => string;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  reorderHabits: (orderedIds: string[]) => void;

  // Completions
  toggleCompletion: (habitId: string, date: string, notes?: string) => void;
  isCompletedOnDate: (habitId: string, date: string) => boolean;
  getCompletionsForDate: (date: string) => HabitCompletion[];
  getCompletionsForHabit: (habitId: string) => HabitCompletion[];

  // Streak calculations
  recalculateStreak: (habitId: string) => void;
  recalculateAllStreaks: () => void;

  // Achievements
  checkAndUnlockAchievements: (habitId: string) => HabitAchievement[];

  // Project context filtering
  getFilteredHabits: () => Habit[];
  getActiveHabits: () => Habit[];

  // Stats
  getTodayProgress: () => { completed: number; total: number };
  getWeekProgress: (habitId: string) => boolean[];
  getCompletionRate: (habitId: string, days: number) => number;
  getCompletionHistory: (habitId: string, days: number) => Array<{ date: string; completed: boolean }>;

  // XP & Rewards
  getTotalXp: () => number;

  // Dependencies
  isHabitUnlocked: (habitId: string, dateKey: string) => boolean;
  getBlockingHabits: (habitId: string, dateKey: string) => string[];
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      // Initial state
      habits: [],
      completions: [],
      achievements: [],

      // Add a new habit
      addHabit: (habitData) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const habits = get().habits;

        const newHabit: Habit = {
          ...habitData,
          id,
          category: habitData.category ?? 'uncategorized',
          difficulty: habitData.difficulty ?? 'easy',
          createdAt: now,
          currentStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
          totalXp: 0,
          order: habits.length,
        };

        set((state) => ({
          habits: [...state.habits, newHabit],
        }));

        return id;
      },

      // Update an existing habit
      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      // Permanently delete a habit and its completions
      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: state.completions.filter((c) => c.habitId !== id),
          achievements: state.achievements.filter((a) => a.habitId !== id),
        }));
      },

      // Soft-delete (archive) a habit
      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archivedAt: new Date().toISOString() } : h
          ),
        }));
      },

      // Restore an archived habit
      restoreHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archivedAt: undefined } : h
          ),
        }));
      },

      // Reorder habits (for drag-drop)
      reorderHabits: (orderedIds) => {
        set((state) => ({
          habits: state.habits.map((h) => ({
            ...h,
            order: orderedIds.indexOf(h.id),
          })),
        }));
      },

      // Toggle completion for a habit on a date
      toggleCompletion: (habitId, date, notes) => {
        const state = get();
        const existing = state.completions.find(
          (c) => c.habitId === habitId && c.date === date
        );

        if (existing) {
          // Remove completion
          set((s) => ({
            completions: s.completions.filter((c) => c.id !== existing.id),
          }));

          // Recalculate streak and totals
          const habit = state.habits.find((h) => h.id === habitId);
          if (habit) {
            const newTotal = habit.totalCompletions - 1;
            const newStreak = calculateStreakForHabit(
              habit,
              state.completions.filter((c) => c.id !== existing.id)
            );
            // Remove XP that was earned for this completion
            const xpLost = calculateXp(habit.difficulty, habit.currentStreak);

            set((s) => ({
              habits: s.habits.map((h) =>
                h.id === habitId
                  ? {
                      ...h,
                      currentStreak: newStreak,
                      totalCompletions: newTotal,
                      totalXp: Math.max(0, (h.totalXp ?? 0) - xpLost),
                    }
                  : h
              ),
            }));
          }
        } else {
          // Add completion
          const completion: HabitCompletion = {
            id: nanoid(),
            habitId,
            date,
            completedAt: new Date().toISOString(),
            notes,
          };

          set((s) => ({
            completions: [...s.completions, completion],
          }));

          // Recalculate streak and totals
          const habit = state.habits.find((h) => h.id === habitId);
          if (habit) {
            const newCompletions = [...state.completions, completion];
            const newStreak = calculateStreakForHabit(habit, newCompletions);
            const newTotal = habit.totalCompletions + 1;
            const newLongest = Math.max(habit.longestStreak, newStreak);
            const xpEarned = calculateXp(habit.difficulty, newStreak);

            set((s) => ({
              habits: s.habits.map((h) =>
                h.id === habitId
                  ? {
                      ...h,
                      currentStreak: newStreak,
                      longestStreak: newLongest,
                      totalCompletions: newTotal,
                      totalXp: (h.totalXp ?? 0) + xpEarned,
                    }
                  : h
              ),
            }));

            // Toast XP earned
            if (xpEarned > 0) {
              const multiplier = getStreakMultiplier(newStreak);
              const bonusText = multiplier > 1 ? ` (${multiplier.toFixed(1)}x streak bonus)` : '';
              toast.success(`+${xpEarned} XP${bonusText}`, habit.title);
            }

            // Check for new achievements
            const newAchievements = get().checkAndUnlockAchievements(habitId);
            if (newAchievements.length > 0) {
              newAchievements.forEach((achievement) => {
                const label =
                  achievement.type === 'streak'
                    ? `${achievement.value}-day streak!`
                    : `${achievement.value} completions!`;
                toast.success(`Achievement Unlocked: ${label}`, habit.title);
              });
            }

            // Toast for streak milestones
            if (newStreak > 0 && STREAK_MILESTONES.includes(newStreak)) {
              toast.success(
                `${newStreak}-day streak!`,
                `Keep going with "${habit.title}"!`
              );
            }
          }
        }
      },

      // Check if habit is completed on a date
      isCompletedOnDate: (habitId, date) => {
        return get().completions.some(
          (c) => c.habitId === habitId && c.date === date
        );
      },

      // Get all completions for a date
      getCompletionsForDate: (date) => {
        return get().completions.filter((c) => c.date === date);
      },

      // Get all completions for a habit
      getCompletionsForHabit: (habitId) => {
        return get().completions.filter((c) => c.habitId === habitId);
      },

      // Recalculate streak for a specific habit
      recalculateStreak: (habitId) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return;

        const newStreak = calculateStreakForHabit(habit, state.completions);

        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  currentStreak: newStreak,
                  longestStreak: Math.max(h.longestStreak, newStreak),
                }
              : h
          ),
        }));
      },

      // Recalculate all streaks (useful on app load)
      recalculateAllStreaks: () => {
        const state = get();
        const updatedHabits = state.habits.map((habit) => {
          const newStreak = calculateStreakForHabit(habit, state.completions);
          return {
            ...habit,
            currentStreak: newStreak,
            longestStreak: Math.max(habit.longestStreak, newStreak),
          };
        });

        set({ habits: updatedHabits });
      },

      // Check and unlock achievements for a habit
      checkAndUnlockAchievements: (habitId) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return [];

        const existingAchievements = state.achievements.filter(
          (a) => a.habitId === habitId
        );
        const newAchievements: HabitAchievement[] = [];

        // Check streak milestones
        for (const milestone of STREAK_MILESTONES) {
          if (
            habit.currentStreak >= milestone &&
            !existingAchievements.some(
              (a) => a.type === 'streak' && a.value === milestone
            )
          ) {
            newAchievements.push({
              id: nanoid(),
              type: 'streak',
              habitId,
              value: milestone,
              unlockedAt: new Date().toISOString(),
            });
          }
        }

        // Check total completion milestones
        for (const milestone of TOTAL_MILESTONES) {
          if (
            habit.totalCompletions >= milestone &&
            !existingAchievements.some(
              (a) => a.type === 'total' && a.value === milestone
            )
          ) {
            newAchievements.push({
              id: nanoid(),
              type: 'total',
              habitId,
              value: milestone,
              unlockedAt: new Date().toISOString(),
            });
          }
        }

        if (newAchievements.length > 0) {
          set((s) => ({
            achievements: [...s.achievements, ...newAchievements],
          }));
        }

        return newAchievements;
      },

      // Get habits filtered by project context
      getFilteredHabits: () => {
        const state = get();
        const activeProjectIds =
          useProjectContextStore.getState().activeProjectIds;

        // Filter non-archived habits using centralized project filter utility
        return state.habits.filter(
          (h) =>
            !h.archivedAt &&
            matchesProjectFilter(h.projectIds, activeProjectIds)
        );
      },

      // Get all active (non-archived) habits
      getActiveHabits: () => {
        return get().habits.filter((h) => !h.archivedAt);
      },

      // Get today's progress
      getTodayProgress: () => {
        const state = get();
        const today = new Date();
        const dateKey = getDateKey(today);

        const activeHabits = state.habits.filter(
          (h) => !h.archivedAt && shouldTrackOnDate(h, today)
        );
        const completedToday = activeHabits.filter((h) =>
          state.completions.some(
            (c) => c.habitId === h.id && c.date === dateKey
          )
        );

        return {
          completed: completedToday.length,
          total: activeHabits.length,
        };
      },

      // Get week progress for a habit (array of 7 booleans, Mon-Sun)
      getWeekProgress: (habitId) => {
        const state = get();
        const today = new Date();
        const weekStart = getWeekStart(today);
        const progress: boolean[] = [];

        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          const dateKey = getDateKey(date);

          progress.push(
            state.completions.some(
              (c) => c.habitId === habitId && c.date === dateKey
            )
          );
        }

        return progress;
      },

      // Get completion rate for a habit over N days
      getCompletionRate: (habitId, days) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return 0;

        let tracked = 0;
        let completed = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          if (shouldTrackOnDate(habit, date)) {
            tracked++;
            const dateKey = getDateKey(date);
            if (state.completions.some((c) => c.habitId === habitId && c.date === dateKey)) {
              completed++;
            }
          }
        }

        return tracked === 0 ? 0 : Math.round((completed / tracked) * 100);
      },

      // Get completion history for a habit (for heatmap/charts)
      getCompletionHistory: (habitId, days) => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const history: Array<{ date: string; completed: boolean }> = [];

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = getDateKey(date);
          history.push({
            date: dateKey,
            completed: state.completions.some((c) => c.habitId === habitId && c.date === dateKey),
          });
        }

        return history;
      },

      // Get total XP across all habits
      getTotalXp: () => {
        return get().habits.reduce((sum, h) => sum + (h.totalXp ?? 0), 0);
      },

      // Check if a habit is unlocked (all required habits completed today)
      isHabitUnlocked: (habitId, dateKey) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit || !habit.requiredHabitIds || habit.requiredHabitIds.length === 0) {
          return true;
        }
        return habit.requiredHabitIds.every((reqId) =>
          state.completions.some((c) => c.habitId === reqId && c.date === dateKey)
        );
      },

      // Get names of blocking habits that haven't been completed today
      getBlockingHabits: (habitId, dateKey) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit || !habit.requiredHabitIds || habit.requiredHabitIds.length === 0) {
          return [];
        }
        return habit.requiredHabitIds
          .filter((reqId) => !state.completions.some((c) => c.habitId === reqId && c.date === dateKey))
          .map((reqId) => state.habits.find((h) => h.id === reqId)?.title ?? 'Unknown')
          .filter(Boolean);
      },
    }),
    {
      name: 'habit-store',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        habits: state.habits,
        completions: state.completions,
        achievements: state.achievements,
      }),
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        let habits = (state.habits ?? []) as Array<Record<string, unknown>>;

        if (version < 2) {
          habits = habits.map((h) => ({
            ...h,
            category: h.category ?? 'uncategorized',
          }));
        }
        if (version < 3) {
          habits = habits.map((h) => ({
            ...h,
            difficulty: h.difficulty ?? 'easy',
            totalXp: h.totalXp ?? 0,
          }));
        }

        return { ...state, habits };
      },
    }
  )
);

// Recalculate streaks on store hydration
if (typeof window !== 'undefined') {
  // Wait for store to hydrate, then recalculate
  setTimeout(() => {
    useHabitStore.getState().recalculateAllStreaks();
  }, 1000);
}
