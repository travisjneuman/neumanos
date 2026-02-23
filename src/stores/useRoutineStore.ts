import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { createSyncedStorage } from '../lib/syncedStorage';
import { useHabitStore } from './useHabitStore';

// ─── Types ──────────────────────────────────────────────

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Routine {
  id: string;
  name: string;
  description: string;
  icon: string;
  habitIds: string[];
  timeOfDay: TimeOfDay;
  estimatedMinutes: number;
  createdAt: string;
}

interface RoutineProgress {
  completed: number;
  total: number;
  percentage: number;
}

// ─── Store ──────────────────────────────────────────────

interface RoutineStore {
  routines: Routine[];

  createRoutine: (data: Omit<Routine, 'id' | 'createdAt'>) => string;
  updateRoutine: (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => void;
  deleteRoutine: (id: string) => void;
  reorderHabits: (routineId: string, habitIds: string[]) => void;
  getRoutineProgress: (routineId: string) => RoutineProgress;
}

// Helper to get date key in YYYY-M-D format (non-padded per project convention)
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: [],

      createRoutine: (data) => {
        const id = nanoid();
        const routine: Routine = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ routines: [...s.routines, routine] }));
        return id;
      },

      updateRoutine: (id, updates) => {
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      deleteRoutine: (id) => {
        set((s) => ({
          routines: s.routines.filter((r) => r.id !== id),
        }));
      },

      reorderHabits: (routineId, habitIds) => {
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === routineId ? { ...r, habitIds } : r
          ),
        }));
      },

      getRoutineProgress: (routineId) => {
        const routine = get().routines.find((r) => r.id === routineId);
        if (!routine || routine.habitIds.length === 0) {
          return { completed: 0, total: 0, percentage: 0 };
        }

        const habitStore = useHabitStore.getState();
        const todayKey = getDateKey(new Date());
        const total = routine.habitIds.length;
        let completed = 0;

        for (const habitId of routine.habitIds) {
          if (habitStore.isCompletedOnDate(habitId, todayKey)) {
            completed++;
          }
        }

        return {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },
    }),
    {
      name: 'routine-store',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        routines: state.routines,
      }),
    }
  )
);
