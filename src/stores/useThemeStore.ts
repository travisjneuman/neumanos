import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeState, ThemeMode, ColorMode } from '../types';
import { injectThemeVariables, getTheme } from '../config/themes/registry';
import type { ThemeId } from '../config/themes/types';
import { indexedDBService } from '../services/indexedDB';

// ---------------------------------------------------------------------------
// System preference detection
// ---------------------------------------------------------------------------

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let systemPreferenceCleanup: (() => void) | null = null;

function setupSystemPreferenceListener(onChange: (isDark: boolean) => void): void {
  cleanupSystemPreferenceListener();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => onChange(e.matches);
  mq.addEventListener('change', handler);
  systemPreferenceCleanup = () => mq.removeEventListener('change', handler);
}

function cleanupSystemPreferenceListener(): void {
  if (systemPreferenceCleanup) {
    systemPreferenceCleanup();
    systemPreferenceCleanup = null;
  }
}

// ---------------------------------------------------------------------------
// DOM application
// ---------------------------------------------------------------------------

/**
 * Resolve the effective ThemeMode from a ColorMode preference.
 */
function resolveMode(colorMode: ColorMode): ThemeMode {
  if (colorMode === 'system') {
    return getSystemPrefersDark() ? 'dark' : 'light';
  }
  return colorMode;
}

/**
 * Apply theme to DOM: set dark class, inject CSS variables, handle transition.
 */
function applyTheme(mode: ThemeMode, brandTheme: string, withTransition = true): void {
  const html = document.documentElement;
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');

  if (withTransition) {
    html.classList.add('theme-transitioning');
  }

  requestAnimationFrame(() => {
    // Apply dark/light class
    if (mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Update color-scheme meta for native browser elements
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', mode === 'dark' ? 'dark light' : 'light dark');
    }

    // Inject brand theme CSS variables (single style recalc)
    injectThemeVariables(brandTheme as ThemeId, mode === 'dark');

    if (withTransition) {
      setTimeout(() => {
        html.classList.remove('theme-transitioning');
      }, 150);
    }
  });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      brandTheme: 'evergreen',
      colorMode: 'dark',

      backupPreferences: {
        hasBackupFolder: false,
        backupFolderPath: null,
        autoSaveEnabled: false,
        saveInterval: 30000,
        versionsToKeep: 7,
        customFileName: 'NeumanOS',
        reminderPreference: 'every-session',
        nextReminderDate: null,
      },

      toggleTheme: () =>
        set((state) => {
          const newMode: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
          applyTheme(newMode, state.brandTheme, true);
          cleanupSystemPreferenceListener();
          return { mode: newMode, colorMode: newMode };
        }),

      setBrandTheme: (themeId: string) => {
        // Validate theme exists
        const theme = getTheme(themeId as ThemeId);
        if (!theme) return;

        const { mode } = get();
        applyTheme(mode, themeId, true);
        set({ brandTheme: themeId });
      },

      setColorMode: (colorMode: ColorMode) => {
        const { brandTheme } = get();
        const effectiveMode = resolveMode(colorMode);

        applyTheme(effectiveMode, brandTheme, true);

        // Set up or tear down system preference listener
        if (colorMode === 'system') {
          setupSystemPreferenceListener((isDark) => {
            const currentState = get();
            const newMode: ThemeMode = isDark ? 'dark' : 'light';
            applyTheme(newMode, currentState.brandTheme, true);
            set({ mode: newMode });
          });
        } else {
          cleanupSystemPreferenceListener();
        }

        set({ mode: effectiveMode, colorMode });
      },

      updateBackupPreferences: (preferences) =>
        set((state) => ({
          backupPreferences: {
            ...state.backupPreferences,
            ...preferences,
          },
        })),
    }),
    {
      name: 'theme-storage',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0 || version === 1) {
          return {
            ...state,
            brandTheme: 'evergreen',
            colorMode: (state.mode as string) || 'dark',
          };
        }
        if (version === 2) {
          // Migrate all users from 'default' to 'evergreen'
          return {
            ...state,
            brandTheme: state.brandTheme === 'default' ? 'evergreen' : state.brandTheme,
          };
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const effectiveMode = resolveMode(state.colorMode);
          // Sync mode in case system preference changed while away
          if (effectiveMode !== state.mode) {
            state.mode = effectiveMode;
          }
          applyTheme(effectiveMode, state.brandTheme, false);

          // Set up system listener if needed
          if (state.colorMode === 'system') {
            setupSystemPreferenceListener((isDark) => {
              const currentState = useThemeStore.getState();
              const newMode: ThemeMode = isDark ? 'dark' : 'light';
              applyTheme(newMode, currentState.brandTheme, true);
              useThemeStore.setState({ mode: newMode });
            });
          }
        }
      },
    }
  )
);

// ---------------------------------------------------------------------------
// IndexedDB sync — mirror theme preferences so .brain exports include them
// ---------------------------------------------------------------------------

const THEME_PREFS_KEY = 'theme-preferences';

function syncThemeToIndexedDB(brandTheme: string, colorMode: string): void {
  indexedDBService
    .setItem(THEME_PREFS_KEY, JSON.stringify({ brandTheme, colorMode }))
    .catch(() => {
      // Silent — localStorage is primary, IndexedDB is secondary for exports
    });
}

// Sync on every state change (debounce not needed — changes are infrequent)
useThemeStore.subscribe((state, prevState) => {
  if (state.brandTheme !== prevState.brandTheme || state.colorMode !== prevState.colorMode) {
    syncThemeToIndexedDB(state.brandTheme, state.colorMode);
  }
});

// Initial sync on load
syncThemeToIndexedDB(
  useThemeStore.getState().brandTheme,
  useThemeStore.getState().colorMode,
);

/**
 * Restore theme preferences from a .brain import.
 * Called by brainBackup.ts after importing data.
 */
export function restoreThemeFromBackup(data: { brandTheme?: string; colorMode?: string }): void {
  if (data.brandTheme) {
    useThemeStore.getState().setBrandTheme(data.brandTheme);
  }
  if (data.colorMode) {
    useThemeStore.getState().setColorMode(data.colorMode as ColorMode);
  }
}
