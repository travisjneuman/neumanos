/**
 * React Grid Layout Configuration
 * Defines default layouts, breakpoints, and grid settings
 */

import type { Layouts } from 'react-grid-layout';
import { indexedDBService } from '../services/indexedDB';

// Default layouts for different breakpoints
export const defaultLayouts: Layouts = {
  lg: [
    { i: 'calendar', x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 6 },
    { i: 'kanban', x: 0, y: 8, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'weathermap', x: 0, y: 14, w: 12, h: 5, minW: 6, minH: 4 },
  ],
  md: [
    { i: 'calendar', x: 0, y: 0, w: 10, h: 8, minW: 5, minH: 6 },
    { i: 'kanban', x: 0, y: 8, w: 10, h: 6, minW: 5, minH: 4 },
    { i: 'weathermap', x: 0, y: 14, w: 10, h: 5, minW: 5, minH: 4 },
  ],
  sm: [
    { i: 'calendar', x: 0, y: 0, w: 6, h: 8, minW: 6, minH: 6 },
    { i: 'kanban', x: 0, y: 8, w: 6, h: 6, minW: 6, minH: 4 },
    { i: 'weathermap', x: 0, y: 14, w: 6, h: 5, minW: 6, minH: 4 },
  ],
  xs: [
    { i: 'calendar', x: 0, y: 0, w: 4, h: 4, minW: 4, minH: 3, static: true },
    { i: 'kanban', x: 0, y: 4, w: 4, h: 4, minW: 4, minH: 3, static: true },
    { i: 'weathermap', x: 0, y: 8, w: 4, h: 4, minW: 4, minH: 3, static: true },
  ],
  xxs: [
    { i: 'calendar', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3, static: true },
    { i: 'kanban', x: 0, y: 4, w: 2, h: 4, minW: 2, minH: 3, static: true },
    { i: 'weathermap', x: 0, y: 8, w: 2, h: 4, minW: 2, minH: 3, static: true },
  ],
};

// Grid configuration
export const gridProps = {
  className: 'layout',
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  rowHeight: 100, // Increased to 100px for better content visibility and less scrolling
  isDraggable: true,
  isResizable: true,
  compactType: 'vertical' as const,
  preventCollision: false,
  margin: [16, 16] as [number, number],
  containerPadding: [16, 16] as [number, number],
};

// Layout presets
export const layoutPresets: Record<string, Layouts> = {
  default: defaultLayouts,

  // Focus mode - Kanban takes center stage
  focus: {
    lg: [
      { i: 'kanban', x: 0, y: 0, w: 12, h: 12, minW: 8, minH: 10 },
      { i: 'calendar', x: 0, y: 12, w: 6, h: 6, minW: 4, minH: 5 },
      { i: 'weather', x: 6, y: 12, w: 3, h: 6, minW: 2, minH: 4 },
      { i: 'map', x: 9, y: 12, w: 3, h: 6, minW: 2, minH: 4 },
    ],
  },

  // Planning mode - Calendar dominates
  planning: {
    lg: [
      { i: 'calendar', x: 0, y: 0, w: 12, h: 10, minW: 8, minH: 8 },
      { i: 'kanban', x: 0, y: 10, w: 12, h: 8, minW: 8, minH: 6 },
      { i: 'weather', x: 0, y: 18, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'map', x: 6, y: 18, w: 6, h: 4, minW: 3, minH: 3 },
    ],
  },

  // Compact mode - Everything smaller but still usable
  compact: {
    lg: [
      { i: 'calendar', x: 0, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
      { i: 'kanban', x: 6, y: 0, w: 6, h: 6, minW: 4, minH: 5 },
      { i: 'weather', x: 0, y: 6, w: 3, h: 4, minW: 2, minH: 3 },
      { i: 'map', x: 3, y: 6, w: 3, h: 4, minW: 2, minH: 3 },
    ],
  },

  // Side by side - Calendar and Kanban split screen
  sideBySide: {
    lg: [
      { i: 'calendar', x: 0, y: 0, w: 6, h: 12, minW: 5, minH: 8 },
      { i: 'kanban', x: 6, y: 0, w: 6, h: 12, minW: 5, minH: 8 },
      { i: 'weather', x: 0, y: 12, w: 6, h: 5, minW: 3, minH: 4 },
      { i: 'map', x: 6, y: 12, w: 6, h: 5, minW: 3, minH: 4 },
    ],
  },
};

// Utility: Save layouts to IndexedDB
export const saveLayoutsToLocalStorage = async (layouts: Layouts): Promise<void> => {
  await indexedDBService.setItem('dashboard-layouts', JSON.stringify({ state: layouts }));
};

// Utility: Load layouts from IndexedDB
export const loadLayoutsFromLocalStorage = async (): Promise<Layouts | null> => {
  const dataStr = await indexedDBService.getItem('dashboard-layouts');
  if (!dataStr) return null;
  try {
    const data = JSON.parse(dataStr as string) as { state?: Layouts };
    return data?.state || null;
  } catch {
    return null;
  }
};

// Utility: Reset layouts to default
export const resetLayouts = async (): Promise<Layouts> => {
  await indexedDBService.setItem('dashboard-layouts', JSON.stringify({ state: defaultLayouts }));
  return defaultLayouts;
};
