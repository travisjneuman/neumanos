/**
 * Theme Registry — Discovery, Injection, and Querying
 *
 * Central registry for all brand themes. Provides:
 * - Theme lookup by ID
 * - Category-grouped listing for the UI
 * - Batched CSS variable injection (single style recalc)
 */

import type { ThemeDefinition, ThemeId, ThemeCategoryInfo } from './types';
import { defaultTheme } from './default';
import { neonNoirTheme } from './neon-noir';
import { sunsetDriftTheme } from './sunset-drift';
import { dualContrastTheme } from './dual-contrast';
import { evergreenTheme } from './evergreen';
import { coastalTheme } from './coastal';
import { heritageTheme } from './heritage';
import { monochromeTheme } from './monochrome';
import { inkWashTheme } from './ink-wash';
import { matrixTheme } from './matrix';
import { deepSpaceTheme } from './deep-space';
import { nordTheme } from './nord';
import { draculaTheme } from './dracula';
import { tokyoNightTheme } from './tokyo-night';
import { catppuccinTheme } from './catppuccin';
import { gruvboxTheme } from './gruvbox';
import { solarizedTheme } from './solarized';
import { rosePineTheme } from './rose-pine';
import { oneDarkTheme } from './one-dark';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const THEME_REGISTRY: Record<ThemeId, ThemeDefinition> = {
  'default': defaultTheme,
  'neon-noir': neonNoirTheme,
  'sunset-drift': sunsetDriftTheme,
  'dual-contrast': dualContrastTheme,
  'evergreen': evergreenTheme,
  'coastal': coastalTheme,
  'heritage': heritageTheme,
  'monochrome': monochromeTheme,
  'ink-wash': inkWashTheme,
  'matrix': matrixTheme,
  'deep-space': deepSpaceTheme,
  'nord': nordTheme,
  'dracula': draculaTheme,
  'tokyo-night': tokyoNightTheme,
  'catppuccin': catppuccinTheme,
  'gruvbox': gruvboxTheme,
  'solarized': solarizedTheme,
  'rose-pine': rosePineTheme,
  'one-dark': oneDarkTheme,
};

export const THEME_CATEGORIES: ThemeCategoryInfo[] = [
  { id: 'vibrant', label: 'Fun & Vibrant', description: 'Bold, expressive palettes' },
  { id: 'professional', label: 'Professional', description: 'Clean, refined palettes' },
  { id: 'minimal', label: 'Minimal', description: 'Stripped-back, focused palettes' },
  { id: 'tech', label: 'Tech', description: 'Developer-inspired palettes' },
];

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEME_REGISTRY[id] ?? THEME_REGISTRY['default'];
}

export function getThemesByCategory(): { category: ThemeCategoryInfo; themes: ThemeDefinition[] }[] {
  return THEME_CATEGORIES.map((cat) => ({
    category: cat,
    themes: Object.values(THEME_REGISTRY).filter(
      (t) => t.category === cat.id
    ),
  }));
}

export function getAllThemeIds(): ThemeId[] {
  return Object.keys(THEME_REGISTRY) as ThemeId[];
}

// ---------------------------------------------------------------------------
// CSS Variable Injection
// ---------------------------------------------------------------------------

const STYLE_ELEMENT_ID = 'neumanos-theme-vars';

/**
 * Inject theme CSS variables as a single <style> block.
 * Triggers one style recalc instead of 31 individual setProperty calls.
 *
 * For the default theme, removes the injected style element entirely
 * so index.css :root values take effect.
 */
export function injectThemeVariables(themeId: ThemeId, isDark: boolean): void {
  const existing = document.getElementById(STYLE_ELEMENT_ID);

  // Default theme: remove overrides, fall back to index.css
  if (themeId === 'default') {
    if (existing) {
      existing.remove();
    }
    return;
  }

  const theme = getTheme(themeId);
  const vars = isDark ? theme.dark : theme.light;

  let style = existing as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }

  const css = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  style.textContent = `:root {\n${css}\n}`;
}

/**
 * Remove all injected theme variables (cleanup).
 */
export function clearThemeVariables(): void {
  const existing = document.getElementById(STYLE_ELEMENT_ID);
  if (existing) {
    existing.remove();
  }
}
