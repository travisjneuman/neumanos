/**
 * Unified Activity Store
 *
 * Tracks activity events across all modules for the Activity Feed
 * and Personal Analytics Dashboard. Persisted to IndexedDB via syncedStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';
import { v4 as uuidv4 } from 'uuid';

export type ModuleType = 'notes' | 'tasks' | 'calendar' | 'docs' | 'time-tracking' | 'habits' | 'links' | 'ai' | 'forms' | 'diagrams';
export type ActivityEventType = 'created' | 'updated' | 'deleted' | 'completed' | 'viewed';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  module: ModuleType;
  entityId: string;
  entityTitle: string;
  entityIcon?: string;
  metadata?: Record<string, unknown>;
  projectId?: string;
  timestamp: string; // ISO date
}

export interface ActivityFilter {
  module?: ModuleType;
  type?: ActivityEventType;
  startDate?: string;
  endDate?: string;
  projectId?: string;
  limit?: number;
}

const MAX_EVENTS = 10_000;
const MAX_AGE_DAYS = 90;

interface ActivityStore {
  events: ActivityEvent[];

  logActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  getActivities: (filter?: ActivityFilter) => ActivityEvent[];
  getActivitiesByModule: (module: ModuleType) => ActivityEvent[];
  getDailyActivityCounts: (days: number) => Record<string, number>;
  clearOlderThan: (days: number) => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      events: [],

      logActivity: (event) => {
        const now = new Date();
        const newEvent: ActivityEvent = {
          ...event,
          id: uuidv4(),
          timestamp: now.toISOString(),
        };

        // Auto-prune cutoff
        const cutoff = new Date(now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

        set((state) => {
          const pruned = state.events.filter((e) => e.timestamp >= cutoff);
          return {
            events: [newEvent, ...pruned].slice(0, MAX_EVENTS),
          };
        });
      },

      getActivities: (filter) => {
        let result = get().events;

        if (filter?.module) {
          result = result.filter((e) => e.module === filter.module);
        }
        if (filter?.type) {
          result = result.filter((e) => e.type === filter.type);
        }
        if (filter?.startDate) {
          result = result.filter((e) => e.timestamp >= filter.startDate!);
        }
        if (filter?.endDate) {
          result = result.filter((e) => e.timestamp <= filter.endDate!);
        }
        if (filter?.projectId) {
          result = result.filter((e) => e.projectId === filter.projectId);
        }
        if (filter?.limit) {
          result = result.slice(0, filter.limit);
        }

        return result;
      },

      getActivitiesByModule: (module) => {
        return get().events.filter((e) => e.module === module);
      },

      getDailyActivityCounts: (days) => {
        const counts: Record<string, number> = {};
        const now = new Date();

        // Initialize all days with 0
        for (let i = 0; i < days; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split('T')[0];
          counts[key] = 0;
        }

        // Count events
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString();

        for (const event of get().events) {
          if (event.timestamp < cutoffStr) break; // events are newest-first
          const dateKey = event.timestamp.split('T')[0];
          if (dateKey in counts) {
            counts[dateKey]++;
          }
        }

        return counts;
      },

      clearOlderThan: (days) => {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        set((state) => ({
          events: state.events.filter((e) => e.timestamp >= cutoff),
        }));
      },
    }),
    {
      name: 'activity-log',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1,
      partialize: (state) => ({ events: state.events }),
    }
  )
);
