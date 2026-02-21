/**
 * Recent Items Store
 *
 * Tracks recently accessed items (notes, tasks, pages, etc.) for quick access
 * in the CommandPalette. Persisted to IndexedDB via syncedStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';
import type { SearchResultType } from '../components/CommandPalette/types';

export interface RecentItem {
  /** Unique identifier (e.g., note-abc123, page-/tasks) */
  id: string;
  /** Display title */
  title: string;
  /** Item type for icon and categorization */
  type: SearchResultType;
  /** Icon emoji */
  icon: string;
  /** Route path to navigate to */
  path: string;
  /** ISO timestamp of last access */
  accessedAt: string;
  /** Optional subtitle for context */
  subtitle?: string;
}

const MAX_RECENT_ITEMS = 10;

interface RecentItemsState {
  items: RecentItem[];

  /** Track an item access (adds to top, deduplicates) */
  trackAccess: (item: Omit<RecentItem, 'accessedAt'>) => void;
  /** Get all recent items sorted by most recent */
  getRecentItems: () => RecentItem[];
  /** Clear all recent items */
  clearRecent: () => void;
}

export const useRecentItemsStore = create<RecentItemsState>()(
  persist(
    (set, get) => ({
      items: [],

      trackAccess: (item) => {
        set((state) => {
          // Remove existing entry for this item
          const filtered = state.items.filter((i) => i.id !== item.id);
          // Add to the front with current timestamp
          const newItem: RecentItem = {
            ...item,
            accessedAt: new Date().toISOString(),
          };
          const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
          return { items: updated };
        });
      },

      getRecentItems: () => {
        return get().items;
      },

      clearRecent: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'recent-items',
      storage: createJSONStorage(() => createSyncedStorage('recent-items')),
      version: 1,
    }
  )
);
