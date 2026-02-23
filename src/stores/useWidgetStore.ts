/**
 * Dashboard Widget Store
 *
 * Manages widget state: enabled widgets, order, and settings
 * Persists to localStorage for user preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// === Custom Widget Types ===

export type DataSourceType = 'rss' | 'json-api' | 'markdown' | 'store-query';

export interface DataSourceConfig {
  type: DataSourceType;
  url?: string;
  jsonPath?: string;
  markdown?: string;
  storeQuery?: {
    store: 'notes' | 'tasks' | 'events' | 'time-entries';
    filter?: string;
    limit?: number;
  };
}

export type LayoutType = 'number' | 'list' | 'chart' | 'markdown';

export interface LayoutConfig {
  type: LayoutType;
  title?: string;
  maxItems?: number;
  chartType?: 'bar' | 'line' | 'pie';
}

export interface CustomWidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  dataSource: DataSourceConfig;
  layout: LayoutConfig;
  refreshIntervalMinutes: number;
  createdAt: string;
}

/** Per-widget configuration options stored in the widget store */
export interface WidgetSettings {
  refreshRate?: number; // Minutes between auto-refresh (0 = manual only)
  // Widget-specific settings
  username?: string; // GitHub widget
  subreddit?: string; // Reddit widget
  category?: string; // Unsplash widget
  duration?: number; // Pomodoro widget (minutes)
  coins?: string[]; // Crypto widget - tracked coins
  sources?: string[]; // News widget - selected sources
  maxItems?: number; // Feed widgets - number of items to show
  location?: string; // Weather widget
  timezones?: string[]; // World clock widget
  baseCurrency?: string; // Currency widget
  targetCurrencies?: string[]; // Currency widget
  packageNames?: string[]; // NPM stats widget
  gridSize?: number; // Pixel art widget
  accentColor?: string; // Custom accent/border color (hex)
  events?: Array<{ id: string; name: string; date: string }>; // Countdown widget
  repoUrl?: string; // Repo stats widget
  tabs?: Array<{ name: string; url: string }>; // Tab manager widget
  streamers?: string[]; // Twitch widget
  channels?: string[]; // YouTube widget
}

export interface WidgetState {
  // Enabled widget IDs in display order
  enabledWidgets: string[];

  // Widget-specific settings
  widgetSettings: Record<string, WidgetSettings>;

  // Widget sizes (1x, 2x, or 3x width)
  widgetSizes: Record<string, 1 | 2 | 3>;

  // Custom widgets
  customWidgets: CustomWidgetConfig[];

  // Actions
  enableWidget: (widgetId: string) => void;
  disableWidget: (widgetId: string) => void;
  reorderWidgets: (newOrder: string[]) => void;
  updateWidgetSettings: (widgetId: string, settings: Partial<WidgetSettings>) => void;
  setWidgetSize: (widgetId: string, size: 1 | 2 | 3) => void;
  isWidgetEnabled: (widgetId: string) => boolean;
  getWidgetSettings: (widgetId: string) => WidgetSettings;

  // Custom widget actions
  createCustomWidget: (config: Omit<CustomWidgetConfig, 'id' | 'createdAt'>) => string;
  updateCustomWidget: (id: string, updates: Partial<CustomWidgetConfig>) => void;
  deleteCustomWidget: (id: string) => void;
}

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      // Default enabled widgets (core widgets + weathermap only)
      // API widgets (quote, crypto, hackernews, etc.) available in Widget Manager but disabled by default
      // Phase 5: Removed 'myday' - users should use the dedicated Today page instead
      enabledWidgets: ['weathermap', 'taskssummary', 'tasksquickadd', 'upcomingevents', 'recentnotes'],

      // Default widget sizes (2-column grid)
      // WeatherMap: 3x (renders as 2 columns = full row width, locked)
      // Tasks widgets: 1x each (side-by-side in 2 columns)
      // Other core widgets: 1x (1 column = 50% = 2 widgets per row side-by-side)
      widgetSizes: {
        weathermap: 3,
        taskssummary: 1,
        tasksquickadd: 1,
        upcomingevents: 1,
        recentnotes: 1,
      },

      // Custom widgets
      customWidgets: [],

      // Default settings
      widgetSettings: {
        quote: { refreshRate: 60 }, // 1 hour
        crypto: { refreshRate: 1 }, // 1 minute
        hackernews: { refreshRate: 15 }, // 15 minutes
        facts: { refreshRate: 60 },
        github: { refreshRate: 60, username: '' },
        weather: { refreshRate: 60 },
        joke: { refreshRate: 30 },
        unsplash: { refreshRate: 60, category: 'nature' },
        pomodoro: { duration: 25 }, // 25 minutes
        reddit: { refreshRate: 15, subreddit: 'programming' },
        devto: { refreshRate: 30 },
        wordofday: { refreshRate: 1440 }, // Once per day
        currency: { refreshRate: 60 },
        worldclock: {},
        ipinfo: { refreshRate: 60 },
        qrcode: {},
        colorpalette: {},
        weathermap: { refreshRate: 60 },
      },

      enableWidget: (widgetId) => {
        set((state) => {
          if (!state.enabledWidgets.includes(widgetId)) {
            return {
              enabledWidgets: [...state.enabledWidgets, widgetId],
              widgetSizes: { ...state.widgetSizes, [widgetId]: state.widgetSizes[widgetId] || 1 },
            };
          }
          return state;
        });
      },

      disableWidget: (widgetId) => {
        set((state) => {
          const { [widgetId]: _, ...remainingSizes } = state.widgetSizes;
          return {
            enabledWidgets: state.enabledWidgets.filter((id) => id !== widgetId),
            widgetSizes: remainingSizes,
          };
        });
      },

      reorderWidgets: (newOrder) => {
        set({ enabledWidgets: newOrder });
      },

      updateWidgetSettings: (widgetId, settings) => {
        set((state) => ({
          widgetSettings: {
            ...state.widgetSettings,
            [widgetId]: {
              ...state.widgetSettings[widgetId],
              ...settings,
            },
          },
        }));
      },

      setWidgetSize: (widgetId, size) => {
        set((state) => ({
          widgetSizes: {
            ...state.widgetSizes,
            [widgetId]: size,
          },
        }));
      },

      isWidgetEnabled: (widgetId) => {
        return get().enabledWidgets.includes(widgetId);
      },

      getWidgetSettings: (widgetId) => {
        return get().widgetSettings[widgetId] || {};
      },

      createCustomWidget: (config) => {
        const id = `custom-${crypto.randomUUID()}`;
        const widget: CustomWidgetConfig = {
          ...config,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customWidgets: [...state.customWidgets, widget],
        }));
        // Enable the widget on the dashboard
        get().enableWidget(id);
        return id;
      },

      updateCustomWidget: (id, updates) => {
        set((state) => ({
          customWidgets: state.customWidgets.map((w) =>
            w.id === id ? { ...w, ...updates, id: w.id, createdAt: w.createdAt } : w
          ),
        }));
      },

      deleteCustomWidget: (id) => {
        get().disableWidget(id);
        set((state) => ({
          customWidgets: state.customWidgets.filter((w) => w.id !== id),
        }));
      },
    }),
    {
      name: 'dashboard-widgets',
      version: 6, // Increment this when you need to trigger migrations
      migrate: (persistedState: any, version: number) => {
        const state = persistedState as WidgetState;

        // Migration for version 0 -> 1: Add weathermap to enabled widgets if missing
        if (version === 0) {
          if (!state.enabledWidgets.includes('weathermap')) {
            state.enabledWidgets.push('weathermap');
          }
          if (!state.widgetSettings.weathermap) {
            state.widgetSettings.weathermap = { refreshRate: 60 };
          }
        }

        // Migration for version 1 -> 2: Add widgetSizes if missing, set weathermap to 2x
        if (version < 2) {
          if (!state.widgetSizes) {
            state.widgetSizes = {};
          }
          // Set weathermap to 2x width by default
          if (!state.widgetSizes.weathermap) {
            state.widgetSizes.weathermap = 2;
          }
        }

        // Internal migration v2 -> v3: Update widget defaults (2-column grid)
        if (version < 3) {
          // Update weathermap to 3x (full row in 2-column grid)
          state.widgetSizes.weathermap = 3;

          // Set core widgets to 1x width (50% = half row in 2-column grid)
          const coreWidgets = ['tasksummary', 'upcomingevents', 'recentnotes', 'quickadd'];
          coreWidgets.forEach((widgetId) => {
            if (!state.widgetSizes[widgetId]) {
              state.widgetSizes[widgetId] = 1;
            }
          });

          // Note: API widgets (quote, crypto, hackernews) are now disabled by default
          // but remain available in Widget Manager. This migration doesn't force-remove
          // them if user already has them enabled - existing preferences are preserved.
        }

        // Migration for version 3 -> 4: Merge tasksummary + quickadd into tasksquickadd
        if (version < 4) {
          // Replace tasksummary and quickadd with tasksquickadd
          const hasTaskSummary = state.enabledWidgets.includes('tasksummary');
          const hasQuickAdd = state.enabledWidgets.includes('quickadd');

          if (hasTaskSummary || hasQuickAdd) {
            // Remove old widgets
            state.enabledWidgets = state.enabledWidgets.filter(
              (id) => id !== 'tasksummary' && id !== 'quickadd'
            );

            // Add new combined widget at position 1 (after weathermap at position 0)
            if (!state.enabledWidgets.includes('tasksquickadd')) {
              state.enabledWidgets.splice(1, 0, 'tasksquickadd');
            }

            // Set size to 3x (full row)
            state.widgetSizes.tasksquickadd = 3;

            // Clean up old widget sizes
            delete state.widgetSizes.tasksummary;
            delete state.widgetSizes.quickadd;
          }
        }

        // Migration for version 4 -> 5: Remove myday widget (Phase 5 cleanup)
        // Users should use the dedicated Today page instead
        if (version < 5) {
          // Remove myday from enabled widgets
          state.enabledWidgets = state.enabledWidgets.filter((id) => id !== 'myday');

          // Clean up myday widget size
          delete state.widgetSizes.myday;
        }

        // Migration for version 5 -> 6: Add customWidgets array
        if (version < 6) {
          if (!state.customWidgets) {
            (state as any).customWidgets = [];
          }
        }

        return persistedState;
      },
    }
  )
);
