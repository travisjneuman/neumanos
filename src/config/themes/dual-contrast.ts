/**
 * Dual Contrast Theme (inspired by Batman vs Superman)
 * Bold red and blue contrast with strong dark surfaces
 */

import type { ThemeDefinition } from './types';

export const dualContrastTheme: ThemeDefinition = {
  id: 'dual-contrast',
  name: 'Dual Contrast',
  description: 'Bold crimson and royal blue in high contrast',
  category: 'vibrant',
  preview: {
    primary: '#DC2626',
    secondary: '#2563EB',
    accent: '#7C3AED',
  },
  light: {
    '--surface-light': '#FAFAFA',
    '--surface-light-elevated': '#F0F0F5',
    '--surface-dark': '#0D0D14',
    '--surface-dark-elevated': '#1A1A24',

    '--text-light-primary': '#0D0D14',
    '--text-light-secondary': '#3D3D50',
    '--text-light-tertiary': '#5C5C70',
    '--text-dark-primary': '#FAFAFA',
    '--text-dark-secondary': '#C8C8D4',
    '--text-dark-tertiary': '#9898AC',

    '--border-light': '#D8D8E4',
    '--border-dark': 'rgba(255, 255, 255, 0.20)',

    '--accent-blue': '#2563EB',
    '--accent-blue-hover': '#1D4FD7',
    '--accent-magenta': '#DC2626',
    '--accent-magenta-hover': '#C42020',
    '--accent-cyan': '#0EA5E9',
    '--accent-cyan-hover': '#0B8BC7',
    '--accent-green': '#16A34A',
    '--accent-green-hover': '#128C3F',
    '--accent-neon-green': '#22C55E',
    '--accent-purple': '#7C3AED',
    '--accent-purple-hover': '#6D32D4',
    '--accent-red': '#DC2626',
    '--accent-red-hover': '#C42020',
    '--accent-yellow': '#EAB308',
    '--accent-yellow-hover': '#D4A007',
    '--accent-orange': '#EA580C',
    '--accent-orange-hover': '#D44E0A',

    '--accent-primary': '#DC2626',
    '--accent-primary-hover': '#C42020',
    '--accent-secondary': '#2563EB',
    '--accent-secondary-hover': '#1D4FD7',

    '--status-success': '#16A34A',
    '--status-warning': '#EAB308',
    '--status-error': '#DC2626',
    '--status-info': '#2563EB',
  },
  dark: {
    '--surface-light': '#FAFAFA',
    '--surface-light-elevated': '#F0F0F5',
    '--surface-dark': '#080810',
    '--surface-dark-elevated': '#12121C',

    '--text-light-primary': '#0D0D14',
    '--text-light-secondary': '#3D3D50',
    '--text-light-tertiary': '#5C5C70',
    '--text-dark-primary': '#FAFAFA',
    '--text-dark-secondary': '#C8C8D4',
    '--text-dark-tertiary': '#9898AC',

    '--border-light': '#D8D8E4',
    '--border-dark': 'rgba(120, 120, 180, 0.20)',

    '--accent-blue': '#3B82F6',
    '--accent-blue-hover': '#60A5FA',
    '--accent-magenta': '#EF4444',
    '--accent-magenta-hover': '#F87171',
    '--accent-cyan': '#38BDF8',
    '--accent-cyan-hover': '#7DD3FC',
    '--accent-green': '#22C55E',
    '--accent-green-hover': '#4ADE80',
    '--accent-neon-green': '#4ADE80',
    '--accent-purple': '#8B5CF6',
    '--accent-purple-hover': '#A78BFA',
    '--accent-red': '#EF4444',
    '--accent-red-hover': '#F87171',
    '--accent-yellow': '#FACC15',
    '--accent-yellow-hover': '#FDE047',
    '--accent-orange': '#F97316',
    '--accent-orange-hover': '#FB923C',

    '--accent-primary': '#EF4444',
    '--accent-primary-hover': '#F87171',
    '--accent-secondary': '#3B82F6',
    '--accent-secondary-hover': '#60A5FA',

    '--status-success': '#22C55E',
    '--status-warning': '#FACC15',
    '--status-error': '#EF4444',
    '--status-info': '#3B82F6',
  },
};
