/**
 * Task Views Store
 *
 * Manages saved filters / custom views for the task management system.
 * Supports built-in views (All Tasks, My Tasks, Due This Week, etc.)
 * and user-created custom views with arbitrary filter combinations.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';
import type { Task, TaskPriority, TaskStatus } from '../types';

// ==================== TYPES ====================

export type TaskFilterField = 'priority' | 'status' | 'tag' | 'assignee' | 'dueDate' | 'whenTag';
export type TaskFilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'contains';

export interface TaskFilter {
  field: TaskFilterField;
  operator: TaskFilterOperator;
  value: string;
}

export interface TaskView {
  id: string;
  name: string;
  icon: string;
  filters: TaskFilter[];
  sortBy: string;
  groupBy?: string;
  isDefault: boolean;
  isBuiltIn: boolean;
}

// ==================== BUILT-IN VIEWS ====================

const BUILT_IN_VIEWS: TaskView[] = [
  {
    id: 'all-tasks',
    name: 'All Tasks',
    icon: '📋',
    filters: [],
    sortBy: 'created',
    isDefault: true,
    isBuiltIn: true,
  },
  {
    id: 'due-this-week',
    name: 'Due This Week',
    icon: '📅',
    filters: [
      { field: 'dueDate', operator: 'lt', value: 'end-of-week' },
      { field: 'dueDate', operator: 'gt', value: 'start-of-week' },
    ],
    sortBy: 'dueDate',
    isDefault: false,
    isBuiltIn: true,
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    icon: '🔴',
    filters: [{ field: 'priority', operator: 'eq', value: 'high' }],
    sortBy: 'dueDate',
    isDefault: false,
    isBuiltIn: true,
  },
  {
    id: 'today',
    name: 'Today',
    icon: '☀️',
    filters: [{ field: 'whenTag', operator: 'eq', value: 'today' }],
    sortBy: 'priority',
    isDefault: false,
    isBuiltIn: true,
  },
  {
    id: 'backlog',
    name: 'Backlog',
    icon: '📥',
    filters: [{ field: 'status', operator: 'eq', value: 'backlog' }],
    sortBy: 'created',
    isDefault: false,
    isBuiltIn: true,
  },
];

// ==================== FILTER LOGIC ====================

function getDateValue(token: string): Date {
  const now = new Date();
  switch (token) {
    case 'start-of-week': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'end-of-week': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day)); // Sunday
      d.setHours(23, 59, 59, 999);
      return d;
    }
    case 'today': {
      const d = new Date(now);
      d.setHours(23, 59, 59, 999);
      return d;
    }
    default:
      return new Date(token);
  }
}

export function applyFilters(tasks: Task[], filters: TaskFilter[]): Task[] {
  if (filters.length === 0) return tasks;

  return tasks.filter((task) => {
    return filters.every((filter) => {
      switch (filter.field) {
        case 'priority':
          return filter.operator === 'eq'
            ? task.priority === filter.value
            : task.priority !== filter.value;
        case 'status':
          return filter.operator === 'eq'
            ? task.status === filter.value
            : task.status !== filter.value;
        case 'tag':
          if (filter.operator === 'contains') {
            return task.tags.includes(filter.value);
          }
          return filter.operator === 'eq'
            ? task.tags.includes(filter.value)
            : !task.tags.includes(filter.value);
        case 'assignee':
          if (filter.operator === 'eq') {
            return (task.assignees || []).includes(filter.value);
          }
          return !(task.assignees || []).includes(filter.value);
        case 'dueDate': {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          const compareDate = getDateValue(filter.value);
          if (filter.operator === 'lt') return taskDate <= compareDate;
          if (filter.operator === 'gt') return taskDate >= compareDate;
          if (filter.operator === 'eq') {
            return taskDate.toDateString() === compareDate.toDateString();
          }
          return true;
        }
        case 'whenTag':
          return filter.operator === 'eq'
            ? task.whenTag === filter.value
            : task.whenTag !== filter.value;
        default:
          return true;
      }
    });
  });
}

export function applySorting(tasks: Task[], sortBy: string): Task[] {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'priority': {
        const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      case 'dueDate': {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      }
      case 'title':
        return a.title.localeCompare(b.title);
      case 'status': {
        const statusOrder: Record<TaskStatus, number> = { backlog: 0, todo: 1, inprogress: 2, review: 3, done: 4 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      case 'created':
      default:
        return new Date(b.created).getTime() - new Date(a.created).getTime();
    }
  });
  return sorted;
}

// ==================== STORE ====================

interface TaskViewsState {
  views: TaskView[];
  activeViewId: string;
  setActiveView: (viewId: string) => void;
  addView: (view: Omit<TaskView, 'id' | 'isBuiltIn'>) => void;
  updateView: (id: string, updates: Partial<Omit<TaskView, 'id' | 'isBuiltIn'>>) => void;
  deleteView: (id: string) => void;
  getActiveView: () => TaskView;
}

export const useTaskViewsStore = create<TaskViewsState>()(
  persist(
    (set, get) => ({
      views: BUILT_IN_VIEWS,
      activeViewId: 'all-tasks',

      setActiveView: (viewId) => {
        set({ activeViewId: viewId });
      },

      addView: (viewData) => {
        const newView: TaskView = {
          ...viewData,
          id: `view-${Date.now()}`,
          isBuiltIn: false,
        };
        set((state) => ({
          views: [...state.views, newView],
          activeViewId: newView.id,
        }));
      },

      updateView: (id, updates) => {
        set((state) => ({
          views: state.views.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        }));
      },

      deleteView: (id) => {
        const view = get().views.find((v) => v.id === id);
        if (view?.isBuiltIn) return; // Cannot delete built-in views
        set((state) => ({
          views: state.views.filter((v) => v.id !== id),
          activeViewId: state.activeViewId === id ? 'all-tasks' : state.activeViewId,
        }));
      },

      getActiveView: () => {
        const { views, activeViewId } = get();
        return views.find((v) => v.id === activeViewId) || views[0];
      },
    }),
    {
      name: 'task-views',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        views: state.views,
        activeViewId: state.activeViewId,
      }),
    }
  )
);
