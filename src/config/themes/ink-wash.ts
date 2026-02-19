/**
 * Ink Wash Theme (inspired by Executive)
 * Muted grays, subtle navy, and understated elegance
 * Each accent has a distinct slate-tinted hue for differentiation
 */

import type { ThemeDefinition } from './types';

export const inkWashTheme: ThemeDefinition = {
  id: 'ink-wash',
  name: 'Ink Wash',
  description: 'Subtle navy and muted grays with quiet refinement',
  category: 'minimal',
  preview: {
    primary: '#334155',
    secondary: '#64748B',
    accent: '#1E293B',
  },
  light: {
    '--surface-light': '#F8FAFC',
    '--surface-light-elevated': '#F1F5F9',
    '--surface-dark': '#0F172A',
    '--surface-dark-elevated': '#1E293B',

    '--text-light-primary': '#0F172A',
    '--text-light-secondary': '#475569',
    '--text-light-tertiary': '#64748B',
    '--text-dark-primary': '#F1F5F9',
    '--text-dark-secondary': '#CBD5E1',
    '--text-dark-tertiary': '#94A3B8',

    '--border-light': '#E2E8F0',
    '--border-dark': 'rgba(148, 163, 184, 0.20)',

    '--accent-blue': '#3B82F6',
    '--accent-blue-hover': '#2563EB',
    '--accent-magenta': '#8B6B8A',
    '--accent-magenta-hover': '#7A5A7A',
    '--accent-cyan': '#5B8A9B',
    '--accent-cyan-hover': '#4A7A8B',
    '--accent-green': '#22C55E',
    '--accent-green-hover': '#16A34A',
    '--accent-neon-green': '#4ADE80',
    '--accent-purple': '#6366F1',
    '--accent-purple-hover': '#4F46E5',
    '--accent-red': '#EF4444',
    '--accent-red-hover': '#DC2626',
    '--accent-yellow': '#9B8A5B',
    '--accent-yellow-hover': '#8A7A4A',
    '--accent-orange': '#9B7A5B',
    '--accent-orange-hover': '#8A6A4A',

    '--accent-primary': '#2C3E50',
    '--accent-primary-hover': '#1A2A3A',
    '--accent-secondary': '#5B8A9B',
    '--accent-secondary-hover': '#4A7A8B',

    '--status-success': '#22C55E',
    '--status-warning': '#B8960B',
    '--status-error': '#EF4444',
    '--status-info': '#3B82F6',
  },
  dark: {
    '--surface-light': '#F8FAFC',
    '--surface-light-elevated': '#F1F5F9',
    '--surface-dark': '#0B1120',
    '--surface-dark-elevated': '#152033',

    '--text-light-primary': '#0F172A',
    '--text-light-secondary': '#475569',
    '--text-light-tertiary': '#64748B',
    '--text-dark-primary': '#F1F5F9',
    '--text-dark-secondary': '#CBD5E1',
    '--text-dark-tertiary': '#94A3B8',

    '--border-light': '#E2E8F0',
    '--border-dark': 'rgba(148, 163, 184, 0.25)',

    '--accent-blue': '#60A5FA',
    '--accent-blue-hover': '#93C5FD',
    '--accent-magenta': '#A888A6',
    '--accent-magenta-hover': '#C0A0BE',
    '--accent-cyan': '#7AAABB',
    '--accent-cyan-hover': '#90BBCC',
    '--accent-green': '#4ADE80',
    '--accent-green-hover': '#86EFAC',
    '--accent-neon-green': '#4ADE80',
    '--accent-purple': '#818CF8',
    '--accent-purple-hover': '#A5B4FC',
    '--accent-red': '#F87171',
    '--accent-red-hover': '#FCA5A5',
    '--accent-yellow': '#BBA87A',
    '--accent-yellow-hover': '#D0C090',
    '--accent-orange': '#BB9A7A',
    '--accent-orange-hover': '#D0B090',

    '--accent-primary': '#7BA8B8',
    '--accent-primary-hover': '#8BB8C8',
    '--accent-secondary': '#9BA8A0',
    '--accent-secondary-hover': '#ABB8B0',

    '--status-success': '#4ADE80',
    '--status-warning': '#DAB520',
    '--status-error': '#F87171',
    '--status-info': '#60A5FA',
  },
};
