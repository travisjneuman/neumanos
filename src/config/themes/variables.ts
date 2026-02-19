/**
 * CSS Variable Keys — Single Source of Truth
 *
 * All 31 CSS custom properties used by the theme system.
 * Referenced by theme definitions and injection logic.
 */

export const THEME_VARIABLE_KEYS = [
  // Surface colors
  '--surface-light',
  '--surface-light-elevated',
  '--surface-dark',
  '--surface-dark-elevated',

  // Text colors
  '--text-light-primary',
  '--text-light-secondary',
  '--text-light-tertiary',
  '--text-dark-primary',
  '--text-dark-secondary',
  '--text-dark-tertiary',

  // Border colors
  '--border-light',
  '--border-dark',

  // Accent colors
  '--accent-blue',
  '--accent-blue-hover',
  '--accent-magenta',
  '--accent-magenta-hover',
  '--accent-cyan',
  '--accent-cyan-hover',
  '--accent-green',
  '--accent-green-hover',
  '--accent-neon-green',
  '--accent-purple',
  '--accent-purple-hover',
  '--accent-red',
  '--accent-red-hover',
  '--accent-yellow',
  '--accent-yellow-hover',
  '--accent-orange',
  '--accent-orange-hover',

  // Status colors
  '--status-success',
  '--status-warning',
  '--status-error',
  '--status-info',
] as const;

export type ThemeVariableKey = (typeof THEME_VARIABLE_KEYS)[number];
