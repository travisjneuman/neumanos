import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';
import { useKanbanStore } from './useKanbanStore';
import { useHabitStore } from './useHabitStore';
import { useTimeTrackingStore } from './useTimeTrackingStore';
import { useEnergyStore } from './useEnergyStore';

// ==================== TYPES ====================

export interface DailyKarmaRecord {
  date: string; // YYYY-MM-DD
  score: number; // 0-100
  breakdown: {
    tasks: number;
    habits: number;
    timeTracked: number;
    energy: number;
  };
}

interface ProductivityState {
  dailyScores: DailyKarmaRecord[];
  cumulativeKarma: number;

  // Computed getters
  getDailyKarma: (date: Date) => DailyKarmaRecord;
  getTodayKarma: () => DailyKarmaRecord;
  getLevel: () => number;
  getStreak: () => number;
  getWeeklyTrend: () => { delta: number; percentage: number };
  getLast7Days: () => DailyKarmaRecord[];

  // Actions
  refreshToday: () => void;
}

// ==================== HELPERS ====================

function getDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function computeKarmaForDate(date: Date): DailyKarmaRecord {
  const dateStr = getDateStr(date);
  const dateKey = getDateKey(date);

  // Tasks: percentage of tasks due today that are completed (35%)
  const kanbanState = useKanbanStore.getState();
  const todayTasks = kanbanState.tasks.filter((task) => {
    if (!task.dueDate) return false;
    const d = new Date(task.dueDate);
    return getDateStr(d) === dateStr;
  });
  const completedTasks = todayTasks.filter((t) => t.status === 'done').length;
  const taskScore = todayTasks.length > 0
    ? Math.round((completedTasks / todayTasks.length) * 100)
    : 0;

  // Habits: percentage of today's trackable habits completed (35%)
  const habitState = useHabitStore.getState();
  const activeHabits = habitState.habits.filter((h) => !h.archivedAt);
  const completedHabits = activeHabits.filter((h) =>
    habitState.completions.some((c) => c.habitId === h.id && c.date === dateKey)
  ).length;
  const habitScore = activeHabits.length > 0
    ? Math.round((completedHabits / activeHabits.length) * 100)
    : 0;

  // Time tracked: capped at 100% for 4+ hours tracked (20%)
  const ttState = useTimeTrackingStore.getState();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  const dayEntries = ttState.entries.filter((entry) => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= dayStart && entryDate <= dayEnd;
  });
  const totalSeconds = dayEntries.reduce((sum, e) => sum + e.duration, 0);
  const hoursTracked = totalSeconds / 3600;
  const timeScore = Math.min(100, Math.round((hoursTracked / 4) * 100));

  // Energy: did you log energy today? (10%)
  const energyState = useEnergyStore.getState();
  const energyLogs = energyState.logs.filter((log) => log.date === dateStr);
  const energyScore = energyLogs.length > 0 ? 100 : 0;

  // Weighted score
  const score = Math.round(
    taskScore * 0.35 +
    habitScore * 0.35 +
    timeScore * 0.20 +
    energyScore * 0.10
  );

  return {
    date: dateStr,
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      tasks: taskScore,
      habits: habitScore,
      timeTracked: timeScore,
      energy: energyScore,
    },
  };
}

// ==================== STORE ====================

export const useProductivityStore = create<ProductivityState>()(
  persist(
    (set, get) => ({
      dailyScores: [],
      cumulativeKarma: 0,

      getDailyKarma: (date: Date) => {
        const dateStr = getDateStr(date);
        const cached = get().dailyScores.find((s) => s.date === dateStr);
        if (cached) return cached;
        return computeKarmaForDate(date);
      },

      getTodayKarma: () => {
        return computeKarmaForDate(new Date());
      },

      getLevel: () => {
        return Math.floor(get().cumulativeKarma / 500) + 1;
      },

      getStreak: () => {
        const { dailyScores } = get();
        if (dailyScores.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(today);

        // Check if today qualifies (if score recorded)
        const todayStr = getDateStr(today);
        const todayRecord = dailyScores.find((s) => s.date === todayStr);
        if (todayRecord && todayRecord.score >= 50) {
          streak++;
        }

        // Go backwards from yesterday
        checkDate.setDate(checkDate.getDate() - 1);

        while (true) {
          const dateStr = getDateStr(checkDate);
          const record = dailyScores.find((s) => s.date === dateStr);

          if (record && record.score >= 50) {
            streak++;
          } else {
            break;
          }

          checkDate.setDate(checkDate.getDate() - 1);

          if (streak > 3650) break; // Safety limit
        }

        return streak;
      },

      getWeeklyTrend: () => {
        const { dailyScores } = get();
        const today = new Date();

        // This week's scores (last 7 days)
        let thisWeekTotal = 0;
        let thisWeekCount = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = getDateStr(d);
          const record = dailyScores.find((s) => s.date === dateStr);
          if (record) {
            thisWeekTotal += record.score;
            thisWeekCount++;
          }
        }

        // Last week's scores (7-13 days ago)
        let lastWeekTotal = 0;
        let lastWeekCount = 0;
        for (let i = 7; i < 14; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = getDateStr(d);
          const record = dailyScores.find((s) => s.date === dateStr);
          if (record) {
            lastWeekTotal += record.score;
            lastWeekCount++;
          }
        }

        const thisWeekAvg = thisWeekCount > 0 ? thisWeekTotal / thisWeekCount : 0;
        const lastWeekAvg = lastWeekCount > 0 ? lastWeekTotal / lastWeekCount : 0;

        const delta = thisWeekAvg - lastWeekAvg;
        const percentage = lastWeekAvg > 0
          ? Math.round((delta / lastWeekAvg) * 100)
          : thisWeekAvg > 0 ? 100 : 0;

        return { delta: Math.round(delta), percentage };
      },

      getLast7Days: () => {
        const results: DailyKarmaRecord[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = getDateStr(d);
          const cached = get().dailyScores.find((s) => s.date === dateStr);
          results.push(cached ?? computeKarmaForDate(d));
        }

        return results;
      },

      refreshToday: () => {
        const todayRecord = computeKarmaForDate(new Date());
        const dateStr = todayRecord.date;

        set((state) => {
          const existing = state.dailyScores.find((s) => s.date === dateStr);
          const oldScore = existing?.score ?? 0;
          const scoreDiff = todayRecord.score - oldScore;

          const updatedScores = existing
            ? state.dailyScores.map((s) => s.date === dateStr ? todayRecord : s)
            : [...state.dailyScores, todayRecord];

          // Keep only last 90 days
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 90);
          const cutoffStr = getDateStr(cutoff);
          const trimmed = updatedScores.filter((s) => s.date >= cutoffStr);

          return {
            dailyScores: trimmed,
            cumulativeKarma: Math.max(0, state.cumulativeKarma + scoreDiff),
          };
        });
      },
    }),
    {
      name: 'productivity-karma',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        dailyScores: state.dailyScores,
        cumulativeKarma: state.cumulativeKarma,
      }),
    }
  )
);
