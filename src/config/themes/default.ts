/**
 * Default Theme — NeumanOS Original
 *
 * These values match the :root declarations in index.css.
 * When this theme is active, the injected <style> is removed
 * and the CSS falls back to index.css defaults.
 *
 * Light and dark modes share most values, but dark mode uses
 * lightened accent colors for WCAG AA contrast on dark surfaces.
 */

import type { ThemeDefinition } from './types';

const sharedVariables = {
  '--surface-light': '#FFFFFF',
  '--surface-light-elevated': '#F3F4F6',
  '--surface-dark': '#000000',
  '--surface-dark-elevated': '#1A1A1A',

  '--text-light-primary': '#000000',
  '--text-light-secondary': '#4B5563',
  '--text-light-tertiary': '#6B7280',
  '--text-dark-primary': '#FFFFFF',
  '--text-dark-secondary': '#D1D5DB',
  '--text-dark-tertiary': '#9CA3AF',

  '--border-light': '#E2E8F0',

  '--accent-blue': '#3B82F6',
  '--accent-blue-hover': '#2563EB',
  '--accent-green': '#10B981',
  '--accent-green-hover': '#059669',
  '--accent-neon-green': '#39FF14',
  '--accent-purple': '#A855F7',
  '--accent-purple-hover': '#9333EA',
  '--accent-red': '#EF4444',
  '--accent-red-hover': '#DC2626',
  '--accent-yellow': '#F59E0B',
  '--accent-yellow-hover': '#D97706',
  '--accent-orange': '#F97316',
  '--accent-orange-hover': '#EA580C',

  '--status-success': '#10B981',
  '--status-warning': '#F59E0B',
  '--status-error': '#EF4444',
  '--status-info': '#3B82F6',
} as const;

export const defaultTheme: ThemeDefinition = {
  id: 'default',
  name: 'Default',
  description: 'The original NeumanOS palette — magenta and cyan accents',
  category: null,
  preview: {
    primary: '#E91E8C',
    secondary: '#00C9FF',
    accent: '#A855F7',
  },
  light: {
    ...sharedVariables,
    '--border-dark': 'rgba(255, 255, 255, 0.1)',

    '--accent-magenta': '#E91E8C',
    '--accent-magenta-hover': '#D11A7C',
    '--accent-cyan': '#00C9FF',
    '--accent-cyan-hover': '#00B3E6',

    '--accent-primary': '#E91E8C',
    '--accent-primary-hover': '#D11A7C',
    '--accent-secondary': '#00C9FF',
    '--accent-secondary-hover': '#00B3E6',
  },
  dark: {
    ...sharedVariables,
    '--border-dark': 'rgba(255, 255, 255, 0.15)',

    // Lightened for WCAG AA contrast on dark surfaces (~5.2:1)
    '--accent-magenta': '#F74EAE',
    '--accent-magenta-hover': '#F97EC6',
    '--accent-cyan': '#33D6FF',
    '--accent-cyan-hover': '#66E2FF',

    '--accent-primary': '#F74EAE',
    '--accent-primary-hover': '#F97EC6',
    '--accent-secondary': '#33D6FF',
    '--accent-secondary-hover': '#66E2FF',
  },
};
