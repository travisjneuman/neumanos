import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AchievementCategory = 'tasks' | 'notes' | 'time' | 'streaks';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  condition: (stats: UserStats) => boolean;
  unlockedAt?: Date;
  category: AchievementCategory;
  threshold: number; // For progress tracking
}

export interface UserStats {
  tasksCompleted: number;
  notesCreated: number;
  hoursTracked: number;
  currentStreak: number; // Days with activity
  longestStreak: number;
  lastActivityDate?: string; // YYYY-MM-DD
}

interface AchievementsState {
  // User statistics
  stats: UserStats;

  // Unlocked achievement IDs
  unlockedAchievements: string[];

  // Actions
  incrementTasksCompleted: () => void;
  incrementNotesCreated: () => void;
  addHoursTracked: (hours: number) => void;
  updateStreak: () => void;
  checkAchievements: () => Achievement[];
  unlockAchievement: (id: string) => void;
  getUnlockedAchievements: () => Achievement[];
  getProgressToNext: (category: AchievementCategory) => { current: number; next: number; percentage: number } | null;
  resetStats: () => void;
}

/**
 * Built-in achievements
 *
 * Organized by category with progressive milestones
 */
export const ACHIEVEMENTS: Achievement[] = [
  // Task Achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🎯',
    category: 'tasks',
    threshold: 1,
    condition: (stats) => stats.tasksCompleted >= 1,
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Complete 10 tasks',
    icon: '🏁',
    category: 'tasks',
    threshold: 10,
    condition: (stats) => stats.tasksCompleted >= 10,
  },
  {
    id: 'task-master',
    name: 'Task Master',
    description: 'Complete 50 tasks',
    icon: '🏆',
    category: 'tasks',
    threshold: 50,
    condition: (stats) => stats.tasksCompleted >= 50,
  },
  {
    id: 'productivity-pro',
    name: 'Productivity Pro',
    description: 'Complete 100 tasks',
    icon: '💪',
    category: 'tasks',
    threshold: 100,
    condition: (stats) => stats.tasksCompleted >= 100,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Complete 500 tasks',
    icon: '🚀',
    category: 'tasks',
    threshold: 500,
    condition: (stats) => stats.tasksCompleted >= 500,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Complete 1000 tasks',
    icon: '👑',
    category: 'tasks',
    threshold: 1000,
    condition: (stats) => stats.tasksCompleted >= 1000,
  },

  // Note Achievements
  {
    id: 'first-note',
    name: 'First Note',
    description: 'Create your first note',
    icon: '📝',
    category: 'notes',
    threshold: 1,
    condition: (stats) => stats.notesCreated >= 1,
  },
  {
    id: 'note-enthusiast',
    name: 'Note Enthusiast',
    description: 'Create 50 notes',
    icon: '📚',
    category: 'notes',
    threshold: 50,
    condition: (stats) => stats.notesCreated >= 50,
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Create 200 notes',
    icon: '🧠',
    category: 'notes',
    threshold: 200,
    condition: (stats) => stats.notesCreated >= 200,
  },

  // Time Tracking Achievements
  {
    id: 'time-conscious',
    name: 'Time Conscious',
    description: 'Track 1 hour of work',
    icon: '⏱️',
    category: 'time',
    threshold: 1,
    condition: (stats) => stats.hoursTracked >= 1,
  },
  {
    id: 'time-manager',
    name: 'Time Manager',
    description: 'Track 10 hours of work',
    icon: '⏰',
    category: 'time',
    threshold: 10,
    condition: (stats) => stats.hoursTracked >= 10,
  },
  {
    id: 'time-master',
    name: 'Time Master',
    description: 'Track 100 hours of work',
    icon: '🕐',
    category: 'time',
    threshold: 100,
    condition: (stats) => stats.hoursTracked >= 100,
  },

  // Streak Achievements
  {
    id: 'daily-habit',
    name: 'Daily Habit',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streaks',
    threshold: 7,
    condition: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    category: 'streaks',
    threshold: 30,
    condition: (stats) => stats.currentStreak >= 30,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    category: 'streaks',
    threshold: 100,
    condition: (stats) => stats.currentStreak >= 100,
  },
];

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

/**
 * Achievements Store
 *
 * Tracks user statistics and unlocked achievements.
 * Integrates with task/note/time tracking stores.
 */
export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      // Initial state
      stats: {
        tasksCompleted: 0,
        notesCreated: 0,
        hoursTracked: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: undefined,
      },
      unlockedAchievements: [],

      // Increment tasks completed
      incrementTasksCompleted: () => {
        set((state) => {
          const newCount = state.stats.tasksCompleted + 1;
          return {
            stats: {
              ...state.stats,
              tasksCompleted: newCount,
            },
          };
        });

        // Update streak
        get().updateStreak();

        // Check for newly unlocked achievements
        const newlyUnlocked = get().checkAchievements();
        if (newlyUnlocked.length > 0) {
          // Achievement unlocked will be handled by UI
          console.debug('Achievements unlocked:', newlyUnlocked.map(a => a.name));
        }
      },

      // Increment notes created
      incrementNotesCreated: () => {
        set((state) => {
          const newCount = state.stats.notesCreated + 1;
          return {
            stats: {
              ...state.stats,
              notesCreated: newCount,
            },
          };
        });

        // Update streak
        get().updateStreak();

        // Check for newly unlocked achievements
        const newlyUnlocked = get().checkAchievements();
        if (newlyUnlocked.length > 0) {
          console.debug('Achievements unlocked:', newlyUnlocked.map(a => a.name));
        }
      },

      // Add hours tracked
      addHoursTracked: (hours) => {
        set((state) => {
          const newTotal = state.stats.hoursTracked + hours;
          return {
            stats: {
              ...state.stats,
              hoursTracked: newTotal,
            },
          };
        });

        // Update streak
        get().updateStreak();

        // Check for newly unlocked achievements
        const newlyUnlocked = get().checkAchievements();
        if (newlyUnlocked.length > 0) {
          console.debug('Achievements unlocked:', newlyUnlocked.map(a => a.name));
        }
      },

      // Update daily streak
      updateStreak: () => {
        const today = getTodayDate();
        const state = get();
        const lastActivityDate = state.stats.lastActivityDate;

        // First activity ever
        if (!lastActivityDate) {
          set((state) => ({
            stats: {
              ...state.stats,
              currentStreak: 1,
              longestStreak: 1,
              lastActivityDate: today,
            },
          }));
          return;
        }

        // Same day - no streak change
        if (lastActivityDate === today) {
          return;
        }

        // Calculate date difference
        const lastDate = new Date(lastActivityDate);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day - increment streak
          const newStreak = state.stats.currentStreak + 1;
          const longestStreak = Math.max(newStreak, state.stats.longestStreak);

          set((state) => ({
            stats: {
              ...state.stats,
              currentStreak: newStreak,
              longestStreak,
              lastActivityDate: today,
            },
          }));
        } else {
          // Streak broken - reset to 1
          set((state) => ({
            stats: {
              ...state.stats,
              currentStreak: 1,
              lastActivityDate: today,
            },
          }));
        }
      },

      // Check for newly unlocked achievements
      checkAchievements: () => {
        const state = get();
        const stats = state.stats;
        const unlocked = state.unlockedAchievements;

        // Find achievements that meet conditions but aren't unlocked yet
        const newlyUnlocked = ACHIEVEMENTS.filter(
          (achievement) =>
            !unlocked.includes(achievement.id) && achievement.condition(stats)
        );

        // Unlock them
        newlyUnlocked.forEach((achievement) => {
          get().unlockAchievement(achievement.id);
        });

        return newlyUnlocked;
      },

      // Unlock achievement
      unlockAchievement: (id) => {
        set((state) => {
          // Prevent duplicate unlocks
          if (state.unlockedAchievements.includes(id)) {
            return state;
          }

          return {
            unlockedAchievements: [...state.unlockedAchievements, id],
          };
        });

        console.log(`Achievement unlocked: ${id}`);
      },

      // Get all unlocked achievements
      getUnlockedAchievements: () => {
        const unlocked = get().unlockedAchievements;
        return ACHIEVEMENTS.filter((a) => unlocked.includes(a.id));
      },

      // Get progress to next achievement in category
      getProgressToNext: (category) => {
        const state = get();
        const stats = state.stats;
        const unlocked = state.unlockedAchievements;

        // Get all achievements in category, sorted by threshold
        const categoryAchievements = ACHIEVEMENTS.filter(
          (a) => a.category === category
        ).sort((a, b) => a.threshold - b.threshold);

        if (categoryAchievements.length === 0) {
          return null;
        }

        // Find next locked achievement
        const nextAchievement = categoryAchievements.find(
          (a) => !unlocked.includes(a.id)
        );

        if (!nextAchievement) {
          // All unlocked - return max achievement
          const maxAchievement =
            categoryAchievements[categoryAchievements.length - 1];
          let current = 0;

          switch (category) {
            case 'tasks':
              current = stats.tasksCompleted;
              break;
            case 'notes':
              current = stats.notesCreated;
              break;
            case 'time':
              current = stats.hoursTracked;
              break;
            case 'streaks':
              current = stats.currentStreak;
              break;
          }

          return {
            current,
            next: maxAchievement.threshold,
            percentage: 100,
          };
        }

        // Calculate current value and progress
        let current = 0;
        switch (category) {
          case 'tasks':
            current = stats.tasksCompleted;
            break;
          case 'notes':
            current = stats.notesCreated;
            break;
          case 'time':
            current = stats.hoursTracked;
            break;
          case 'streaks':
            current = stats.currentStreak;
            break;
        }

        const percentage = Math.min(
          100,
          Math.floor((current / nextAchievement.threshold) * 100)
        );

        return {
          current,
          next: nextAchievement.threshold,
          percentage,
        };
      },

      // Reset stats (for testing or user request)
      resetStats: () => {
        set({
          stats: {
            tasksCompleted: 0,
            notesCreated: 0,
            hoursTracked: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: undefined,
          },
          unlockedAchievements: [],
        });
      },
    }),
    {
      name: 'achievements-storage',
    }
  )
);
