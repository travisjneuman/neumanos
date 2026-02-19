/**
 * Evergreen Theme (inspired by Augusta)
 * Rich greens, warm golds, and classic refinement
 * Boosted magenta/blue/cyan for visual vibrancy
 */

import type { ThemeDefinition } from './types';

export const evergreenTheme: ThemeDefinition = {
  id: 'evergreen',
  name: 'Evergreen',
  description: 'Rich forest greens with warm gold accents',
  category: 'professional',
  preview: {
    primary: '#166534',
    secondary: '#CA8A04',
    accent: '#15803D',
  },
  light: {
    '--surface-light': '#FAFDF7',
    '--surface-light-elevated': '#F0F5EC',
    '--surface-dark': '#0A140A',
    '--surface-dark-elevated': '#142014',

    '--text-light-primary': '#0A140A',
    '--text-light-secondary': '#2D4A2D',
    '--text-light-tertiary': '#4A6B4A',
    '--text-dark-primary': '#F5FAF0',
    '--text-dark-secondary': '#B8D4A8',
    '--text-dark-tertiary': '#8AAF78',

    '--border-light': '#D4E8C8',
    '--border-dark': 'rgba(22, 101, 52, 0.20)',

    '--accent-blue': '#3580E0',
    '--accent-blue-hover': '#2870D0',
    '--accent-magenta': '#C84898',
    '--accent-magenta-hover': '#B03A88',
    '--accent-cyan': '#10B0A0',
    '--accent-cyan-hover': '#0A9888',
    '--accent-green': '#166534',
    '--accent-green-hover': '#14532D',
    '--accent-neon-green': '#4ADE80',
    '--accent-purple': '#7E57C2',
    '--accent-purple-hover': '#6D4AAE',
    '--accent-red': '#C62828',
    '--accent-red-hover': '#B22222',
    '--accent-yellow': '#CA8A04',
    '--accent-yellow-hover': '#B47B03',
    '--accent-orange': '#C2710C',
    '--accent-orange-hover': '#AE650A',

    '--accent-primary': '#166534',
    '--accent-primary-hover': '#14532D',
    '--accent-secondary': '#CA8A04',
    '--accent-secondary-hover': '#B47B03',

    '--status-success': '#166534',
    '--status-warning': '#CA8A04',
    '--status-error': '#C62828',
    '--status-info': '#3580E0',
  },
  dark: {
    '--surface-light': '#FAFDF7',
    '--surface-light-elevated': '#F0F5EC',
    '--surface-dark': '#060E06',
    '--surface-dark-elevated': '#0E1A0E',

    '--text-light-primary': '#0A140A',
    '--text-light-secondary': '#2D4A2D',
    '--text-light-tertiary': '#4A6B4A',
    '--text-dark-primary': '#F5FAF0',
    '--text-dark-secondary': '#B8D4A8',
    '--text-dark-tertiary': '#8AAF78',

    '--border-light': '#D4E8C8',
    '--border-dark': 'rgba(22, 101, 52, 0.20)',

    '--accent-blue': '#60A0E8',
    '--accent-blue-hover': '#4A90D8',
    '--accent-magenta': '#D868A8',
    '--accent-magenta-hover': '#E878B8',
    '--accent-cyan': '#40E8D0',
    '--accent-cyan-hover': '#50F0E0',
    '--accent-green': '#22C55E',
    '--accent-green-hover': '#4ADE80',
    '--accent-neon-green': '#4ADE80',
    '--accent-purple': '#9575CD',
    '--accent-purple-hover': '#AB8FDD',
    '--accent-red': '#E04040',
    '--accent-red-hover': '#E86060',
    '--accent-yellow': '#E0A020',
    '--accent-yellow-hover': '#F0B040',
    '--accent-orange': '#D48020',
    '--accent-orange-hover': '#E49030',

    '--accent-primary': '#22C55E',
    '--accent-primary-hover': '#4ADE80',
    '--accent-secondary': '#E0A020',
    '--accent-secondary-hover': '#F0B040',

    '--status-success': '#22C55E',
    '--status-warning': '#E0A020',
    '--status-error': '#E04040',
    '--status-info': '#60A0E8',
  },
};
