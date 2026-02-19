/**
 * Sidebar Navigation Order Store
 *
 * Manages the custom order of navigation items in the sidebar.
 * Users can drag-drop to reorder items, and the order persists across sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarNavStore {
  navOrder: string[]; // Array of paths in custom order
  setNavOrder: (order: string[]) => void;
  resetToDefault: () => void;
}

// Dashboard (/) is fixed at top and not part of drag-drop order
// Updated for Phase 5 sidebar restructuring:
// - /habits removed (now a tab under /tasks)
// - /docs renamed to /create
const DEFAULT_NAV_ORDER = ['/schedule', '/notes', '/tasks', '/create'];

export const useSidebarNavStore = create<SidebarNavStore>()(
  persist(
    (set) => ({
      navOrder: DEFAULT_NAV_ORDER,
      setNavOrder: (order) => set({ navOrder: order }),
      resetToDefault: () => set({ navOrder: DEFAULT_NAV_ORDER }),
    }),
    {
      name: 'sidebar-nav-order',
      version: 4, // Incremented for Phase 5: /habits removed, /docs -> /create
      migrate: (persisted, version) => {
        const state = persisted as { navOrder?: string[] };
        if (version < 4) {
          // Migrate from old structure:
          // - Remove /habits (now a tab under /tasks)
          // - Replace /docs with /create
          let order = state.navOrder || DEFAULT_NAV_ORDER;
          order = order.filter((path) => path !== '/habits');
          order = order.map((path) => (path === '/docs' ? '/create' : path));
          // Ensure /create exists
          if (!order.includes('/create')) {
            order.push('/create');
          }
          return { ...state, navOrder: order };
        }
        return persisted;
      },
    }
  )
);
