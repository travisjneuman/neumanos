/**
 * Theme System Type Definitions
 *
 * 2-layer architecture:
 * - Brand Theme: which color palette (e.g., "Neon Noir", "Coastal")
 * - Color Mode: light/dark/system — controls Tailwind's `dark` class
 */

export type ThemeId =
  | 'default'
  | 'neon-noir'
  | 'sunset-drift'
  | 'dual-contrast'
  | 'evergreen'
  | 'coastal'
  | 'heritage'
  | 'monochrome'
  | 'ink-wash'
  | 'matrix'
  | 'deep-space';

export type ColorMode = 'light' | 'dark' | 'system';

export type ThemeCategory = 'vibrant' | 'professional' | 'minimal' | 'tech';

/**
 * All CSS variable values for one mode (light or dark) of a theme.
 * Keys are CSS variable names without the `--` prefix convention —
 * they include the full `--variable-name` form for direct injection.
 */
export interface ThemeVariables {
  // Surface colors
  '--surface-light': string;
  '--surface-light-elevated': string;
  '--surface-dark': string;
  '--surface-dark-elevated': string;

  // Text colors
  '--text-light-primary': string;
  '--text-light-secondary': string;
  '--text-light-tertiary': string;
  '--text-dark-primary': string;
  '--text-dark-secondary': string;
  '--text-dark-tertiary': string;

  // Border colors
  '--border-light': string;
  '--border-dark': string;

  // Accent colors
  '--accent-blue': string;
  '--accent-blue-hover': string;
  '--accent-magenta': string;
  '--accent-magenta-hover': string;
  '--accent-cyan': string;
  '--accent-cyan-hover': string;
  '--accent-green': string;
  '--accent-green-hover': string;
  '--accent-neon-green': string;
  '--accent-purple': string;
  '--accent-purple-hover': string;
  '--accent-red': string;
  '--accent-red-hover': string;
  '--accent-yellow': string;
  '--accent-yellow-hover': string;
  '--accent-orange': string;
  '--accent-orange-hover': string;

  // Semantic accent roles (each theme maps these to its identity colors)
  '--accent-primary': string;
  '--accent-primary-hover': string;
  '--accent-secondary': string;
  '--accent-secondary-hover': string;

  // Status colors
  '--status-success': string;
  '--status-warning': string;
  '--status-error': string;
  '--status-info': string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  category: ThemeCategory | null; // null for default
  /** Accent color used for preview swatches in the theme picker */
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
  light: ThemeVariables;
  dark: ThemeVariables;
}

export interface ThemeCategoryInfo {
  id: ThemeCategory;
  label: string;
  description: string;
}
