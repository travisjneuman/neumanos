import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { createSyncedStorage } from '../lib/syncedStorage';
import { useHabitStore } from './useHabitStore';

// ─── Types ───────────────────────────────────────────────

export type QuestType =
  | 'complete-habits'
  | 'maintain-streak'
  | 'complete-all'
  | 'try-new'
  | 'early-bird'
  | 'consistency'
  | 'perfect-day'
  | 'use-categories';

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  type: QuestType;
  target: number;
  progress: number;
  completedAt?: string;
  claimed: boolean;
  expiresAt: string;
}

// ─── Quest Templates ─────────────────────────────────────

interface QuestTemplate {
  type: QuestType;
  title: (target: number) => string;
  description: (target: number) => string;
  icon: string;
  xpReward: number;
  getTarget: (habitCount: number) => number;
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    type: 'complete-habits',
    title: (n) => `Complete ${n} habits today`,
    description: (n) => `Check off ${n} habits from your list today`,
    icon: '🎯',
    xpReward: 50,
    getTarget: (count) => Math.max(2, Math.min(5, Math.ceil(count * 0.6))),
  },
  {
    type: 'maintain-streak',
    title: () => 'Keep your longest streak alive',
    description: () => 'Complete the habit with your longest active streak',
    icon: '🔥',
    xpReward: 40,
    getTarget: () => 1,
  },
  {
    type: 'early-bird',
    title: () => 'Early bird',
    description: () => 'Complete a habit before noon',
    icon: '🌅',
    xpReward: 60,
    getTarget: () => 1,
  },
  {
    type: 'try-new',
    title: () => 'Rediscover a habit',
    description: () => 'Complete a habit you haven\'t done in 7+ days',
    icon: '🔄',
    xpReward: 70,
    getTarget: () => 1,
  },
  {
    type: 'consistency',
    title: () => 'Consistency streak',
    description: () => 'Have at least one habit with a 3+ day streak',
    icon: '📈',
    xpReward: 45,
    getTarget: () => 1,
  },
  {
    type: 'perfect-day',
    title: () => 'Perfect day',
    description: () => 'Complete every active habit scheduled for today',
    icon: '⭐',
    xpReward: 100,
    getTarget: () => 1,
  },
  {
    type: 'complete-all',
    title: (n) => `Complete ${n} habits in a row`,
    description: (n) => `Check off ${n} habits consecutively today`,
    icon: '🏆',
    xpReward: 55,
    getTarget: (count) => Math.max(2, Math.min(4, Math.ceil(count * 0.5))),
  },
  {
    type: 'use-categories',
    title: (n) => `Use ${n} different categories`,
    description: (n) => `Complete habits from ${n} different categories today`,
    icon: '🎨',
    xpReward: 65,
    getTarget: (count) => Math.max(2, Math.min(4, Math.ceil(count * 0.4))),
  },
];

// ─── Helpers ─────────────────────────────────────────────

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getEndOfDay(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function shouldTrackOnDate(habit: { frequency: string; targetDays?: number[] }, date: Date): boolean {
  const dayOfWeek = date.getDay();
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
      return true;
    default:
      return true;
  }
}

// ─── Store ───────────────────────────────────────────────

interface DailyQuestsStore {
  quests: DailyQuest[];
  totalQuestXp: number;
  questLevel: number;
  lastGeneratedDate: string;

  generateDailyQuests: () => void;
  updateQuestProgress: (type: QuestType, value: number) => void;
  claimReward: (questId: string) => void;
  getActiveQuests: () => DailyQuest[];
  refreshProgress: () => void;
}

export const useDailyQuestsStore = create<DailyQuestsStore>()(
  persist(
    (set, get) => ({
      quests: [],
      totalQuestXp: 0,
      questLevel: 1,
      lastGeneratedDate: '',

      generateDailyQuests: () => {
        const today = getDateKey(new Date());
        if (get().lastGeneratedDate === today) return;

        const habitState = useHabitStore.getState();
        const activeHabits = habitState.habits.filter((h) => !h.archivedAt);
        const habitCount = activeHabits.length;

        if (habitCount === 0) return;

        // Pick 3 random quest templates
        const selectedTemplates = shuffleAndPick(QUEST_TEMPLATES, 3);
        const expiresAt = getEndOfDay();

        const newQuests: DailyQuest[] = selectedTemplates.map((template) => {
          const target = template.getTarget(habitCount);
          return {
            id: nanoid(),
            title: template.title(target),
            description: template.description(target),
            icon: template.icon,
            xpReward: template.xpReward,
            type: template.type,
            target,
            progress: 0,
            claimed: false,
            expiresAt,
          };
        });

        set({
          quests: newQuests,
          lastGeneratedDate: today,
        });

        // Immediately calculate current progress
        get().refreshProgress();
      },

      refreshProgress: () => {
        const habitState = useHabitStore.getState();
        const activeHabits = habitState.habits.filter((h) => !h.archivedAt);
        const today = new Date();
        const todayKey = getDateKey(today);
        const completions = habitState.completions;

        const todayCompletions = completions.filter((c) => c.date === todayKey);
        const completedHabitIds = new Set(todayCompletions.map((c) => c.habitId));

        // Habits scheduled for today
        const scheduledToday = activeHabits.filter((h) => shouldTrackOnDate(h, today));
        const completedToday = scheduledToday.filter((h) => completedHabitIds.has(h.id));

        // Categories completed today
        const completedCategories = new Set(completedToday.map((h) => h.category));

        // Habits not done in 7+ days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const staleHabitsCompleted = completedToday.filter((h) => {
          const habitCompletions = completions
            .filter((c) => c.habitId === h.id && c.date !== todayKey)
            .map((c) => new Date(c.completedAt));
          if (habitCompletions.length === 0) return true; // never done before
          const lastDone = new Date(Math.max(...habitCompletions.map((d) => d.getTime())));
          return lastDone < sevenDaysAgo;
        });

        // Longest streak habit
        const longestStreakHabit = activeHabits.reduce(
          (best, h) => (h.currentStreak > (best?.currentStreak ?? 0) ? h : best),
          activeHabits[0]
        );
        const longestStreakMaintained = longestStreakHabit
          ? completedHabitIds.has(longestStreakHabit.id) ? 1 : 0
          : 0;

        // Any habit with 3+ day streak
        const hasConsistency = activeHabits.some((h) => h.currentStreak >= 3) ? 1 : 0;

        // Early bird: completions before noon
        const earlyBirdCount = todayCompletions.filter((c) => {
          const hour = new Date(c.completedAt).getHours();
          return hour < 12;
        }).length;

        // Perfect day
        const isPerfectDay =
          scheduledToday.length > 0 && completedToday.length >= scheduledToday.length ? 1 : 0;

        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.claimed) return q;

            let progress = 0;
            switch (q.type) {
              case 'complete-habits':
                progress = Math.min(completedToday.length, q.target);
                break;
              case 'maintain-streak':
                progress = longestStreakMaintained;
                break;
              case 'early-bird':
                progress = earlyBirdCount > 0 ? 1 : 0;
                break;
              case 'try-new':
                progress = staleHabitsCompleted.length > 0 ? 1 : 0;
                break;
              case 'consistency':
                progress = hasConsistency;
                break;
              case 'perfect-day':
                progress = isPerfectDay;
                break;
              case 'complete-all':
                progress = Math.min(completedToday.length, q.target);
                break;
              case 'use-categories':
                progress = Math.min(completedCategories.size, q.target);
                break;
            }

            const isNowComplete = progress >= q.target && !q.completedAt;
            return {
              ...q,
              progress,
              completedAt: isNowComplete ? new Date().toISOString() : q.completedAt,
            };
          }),
        }));
      },

      updateQuestProgress: (type, value) => {
        set((state) => ({
          quests: state.quests.map((q) => {
            if (q.type !== type || q.claimed) return q;
            const newProgress = Math.min(value, q.target);
            const isNowComplete = newProgress >= q.target && !q.completedAt;
            return {
              ...q,
              progress: newProgress,
              completedAt: isNowComplete ? new Date().toISOString() : q.completedAt,
            };
          }),
        }));
      },

      claimReward: (questId) => {
        const quest = get().quests.find((q) => q.id === questId);
        if (!quest || quest.claimed || !quest.completedAt) return;

        const newTotalXp = get().totalQuestXp + quest.xpReward;
        const newLevel = Math.floor(newTotalXp / 500) + 1;

        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === questId ? { ...q, claimed: true } : q
          ),
          totalQuestXp: newTotalXp,
          questLevel: newLevel,
        }));
      },

      getActiveQuests: () => {
        const now = new Date().toISOString();
        return get().quests.filter((q) => q.expiresAt > now);
      },
    }),
    {
      name: 'daily-quests-store',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        quests: state.quests,
        totalQuestXp: state.totalQuestXp,
        questLevel: state.questLevel,
        lastGeneratedDate: state.lastGeneratedDate,
      }),
    }
  )
);

// Subscribe to habit store changes to refresh quest progress
if (typeof window !== 'undefined') {
  useHabitStore.subscribe(() => {
    const store = useDailyQuestsStore.getState();
    const today = getDateKey(new Date());

    // Generate quests if needed
    if (store.lastGeneratedDate !== today) {
      store.generateDailyQuests();
    }

    // Refresh progress on every habit change
    if (store.quests.length > 0) {
      store.refreshProgress();
    }
  });

  // Initial generation on load
  setTimeout(() => {
    useDailyQuestsStore.getState().generateDailyQuests();
  }, 1500);
}
