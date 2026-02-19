import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GanttState, GanttSettings, GanttViewMode, GanttGroupBy, GanttSortBy, Task } from '../types';

interface GanttStore extends GanttState {
  // Settings Actions
  setViewMode: (mode: GanttViewMode) => void;
  toggleCriticalPath: () => void;
  toggleBaseline: () => void;
  toggleResources: () => void;
  setZoomLevel: (level: number) => void;
  setGroupBy: (groupBy: GanttGroupBy) => void;
  setSortBy: (sortBy: GanttSortBy) => void;

  // Selection Actions
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  clearSelection: () => void;
  toggleTaskSelection: (taskId: string) => void;

  // Critical Path Actions
  calculateCriticalPath: (tasks: Task[]) => void;
  isTaskOnCriticalPath: (taskId: string) => boolean;

  // Date Range Actions
  updateDateRange: (tasks: Task[]) => void;

  // Reset
  resetSettings: () => void;
}

const defaultSettings: GanttSettings = {
  viewMode: 'week',
  showCriticalPath: true,
  showBaseline: false,
  showResources: true,
  zoomLevel: 3,
  groupBy: 'none',
  sortBy: 'start-date',
};

export const useGanttStore = create<GanttStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      selectedTaskIds: [],
      criticalPath: [],
      earliestStart: null,
      latestFinish: null,

      // Settings Actions
      setViewMode: (mode) =>
        set((state) => ({
          settings: { ...state.settings, viewMode: mode },
        })),

      toggleCriticalPath: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            showCriticalPath: !state.settings.showCriticalPath,
          },
        })),

      toggleBaseline: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            showBaseline: !state.settings.showBaseline,
          },
        })),

      toggleResources: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            showResources: !state.settings.showResources,
          },
        })),

      setZoomLevel: (level) =>
        set((state) => ({
          settings: {
            ...state.settings,
            zoomLevel: Math.min(5, Math.max(1, level)),
          },
        })),

      setGroupBy: (groupBy) =>
        set((state) => ({
          settings: { ...state.settings, groupBy },
        })),

      setSortBy: (sortBy) =>
        set((state) => ({
          settings: { ...state.settings, sortBy },
        })),

      // Selection Actions
      selectTask: (taskId) =>
        set((state) => ({
          selectedTaskIds: [...state.selectedTaskIds, taskId],
        })),

      deselectTask: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.filter((id) => id !== taskId),
        })),

      clearSelection: () =>
        set({ selectedTaskIds: [] }),

      toggleTaskSelection: (taskId) => {
        const { selectedTaskIds } = get();
        if (selectedTaskIds.includes(taskId)) {
          get().deselectTask(taskId);
        } else {
          get().selectTask(taskId);
        }
      },

      // Critical Path Calculation (Simplified for MVP)
      calculateCriticalPath: (tasks) => {
        // This is a simplified critical path calculation
        // Full CPM algorithm would be more complex

        // Filter tasks with dates
        const tasksWithDates = tasks.filter(
          (task) => task.startDate && task.dueDate
        );

        if (tasksWithDates.length === 0) {
          set({ criticalPath: [] });
          return;
        }

        // Build dependency graph
        const graph = new Map<string, string[]>();
        const inDegree = new Map<string, number>();

        tasksWithDates.forEach((task) => {
          if (!graph.has(task.id)) {
            graph.set(task.id, []);
          }
          if (!inDegree.has(task.id)) {
            inDegree.set(task.id, 0);
          }

          task.dependencies?.forEach((dep) => {
            const predecessorId = dep.taskId;
            if (!graph.has(predecessorId)) {
              graph.set(predecessorId, []);
            }
            graph.get(predecessorId)?.push(task.id);
            inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
          });
        });

        // Calculate earliest finish times
        const earliestFinish = new Map<string, Date>();
        const queue: string[] = [];

        // Start with tasks that have no dependencies
        tasksWithDates.forEach((task) => {
          if ((inDegree.get(task.id) || 0) === 0) {
            queue.push(task.id);
            earliestFinish.set(task.id, new Date(task.dueDate!));
          }
        });

        while (queue.length > 0) {
          const currentId = queue.shift()!;
          const successors = graph.get(currentId) || [];

          successors.forEach((successorId) => {
            const currentFinish = earliestFinish.get(currentId)!;
            const existingFinish = earliestFinish.get(successorId);

            if (!existingFinish || currentFinish > existingFinish) {
              const successor = tasksWithDates.find((t) => t.id === successorId);
              if (successor) {
                earliestFinish.set(successorId, new Date(successor.dueDate!));
              }
            }

            // Decrease in-degree
            inDegree.set(successorId, (inDegree.get(successorId) || 0) - 1);
            if (inDegree.get(successorId) === 0) {
              queue.push(successorId);
            }
          });
        }

        // For MVP: Mark longest path as critical path
        // In full implementation, would calculate slack and find zero-slack tasks
        const pathLengths = new Map<string, number>();

        const calculatePathLength = (taskId: string, visited = new Set<string>()): number => {
          if (visited.has(taskId)) return 0;
          if (pathLengths.has(taskId)) return pathLengths.get(taskId)!;

          visited.add(taskId);
          const task = tasksWithDates.find((t) => t.id === taskId);
          if (!task || !task.dependencies || task.dependencies.length === 0) {
            pathLengths.set(taskId, 1);
            return 1;
          }

          const maxPredecessorLength = Math.max(
            ...task.dependencies.map((dep) =>
              calculatePathLength(dep.taskId, new Set(visited))
            )
          );

          const length = maxPredecessorLength + 1;
          pathLengths.set(taskId, length);
          return length;
        };

        tasksWithDates.forEach((task) => {
          calculatePathLength(task.id);
        });

        // Find tasks on longest path
        const maxLength = Math.max(...Array.from(pathLengths.values()));
        const criticalTasks = tasksWithDates
          .filter((task) => pathLengths.get(task.id) === maxLength)
          .map((task) => task.id);

        set({ criticalPath: criticalTasks });
      },

      isTaskOnCriticalPath: (taskId) => {
        return get().criticalPath.includes(taskId);
      },

      // Date Range Calculation
      updateDateRange: (tasks) => {
        const tasksWithDates = tasks.filter(
          (task) => task.startDate && task.dueDate
        );

        if (tasksWithDates.length === 0) {
          set({ earliestStart: null, latestFinish: null });
          return;
        }

        const startDates = tasksWithDates.map((task) => new Date(task.startDate!));
        const endDates = tasksWithDates.map((task) => new Date(task.dueDate!));

        const earliestStart = new Date(Math.min(...startDates.map((d) => d.getTime())));
        const latestFinish = new Date(Math.max(...endDates.map((d) => d.getTime())));

        set({
          earliestStart: earliestStart.toISOString(),
          latestFinish: latestFinish.toISOString(),
        });
      },

      // Reset
      resetSettings: () =>
        set({
          settings: defaultSettings,
          selectedTaskIds: [],
        }),
    }),
    {
      name: 'gantt-storage',
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist selectedTaskIds or calculated fields
      }),
    }
  )
);
