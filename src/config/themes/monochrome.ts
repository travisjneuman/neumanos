/**
 * Monochrome Theme (inspired by Country Club)
 * Crisp black and white with minimal accent colors
 */

import type { ThemeDefinition } from './types';

export const monochromeTheme: ThemeDefinition = {
  id: 'monochrome',
  name: 'Monochrome',
  description: 'Crisp black and white with subtle accents',
  category: 'minimal',
  preview: {
    primary: '#171717',
    secondary: '#737373',
    accent: '#404040',
  },
  light: {
    '--surface-light': '#FFFFFF',
    '--surface-light-elevated': '#F5F5F5',
    '--surface-dark': '#0A0A0A',
    '--surface-dark-elevated': '#171717',

    '--text-light-primary': '#0A0A0A',
    '--text-light-secondary': '#525252',
    '--text-light-tertiary': '#737373',
    '--text-dark-primary': '#FAFAFA',
    '--text-dark-secondary': '#D4D4D4',
    '--text-dark-tertiary': '#A3A3A3',

    '--border-light': '#E5E5E5',
    '--border-dark': 'rgba(255, 255, 255, 0.18)',

    '--accent-blue': '#525252',
    '--accent-blue-hover': '#404040',
    '--accent-magenta': '#8B8B8B',
    '--accent-magenta-hover': '#737373',
    '--accent-cyan': '#525252',
    '--accent-cyan-hover': '#404040',
    '--accent-green': '#22C55E',
    '--accent-green-hover': '#16A34A',
    '--accent-neon-green': '#4ADE80',
    '--accent-purple': '#525252',
    '--accent-purple-hover': '#404040',
    '--accent-red': '#DC2626',
    '--accent-red-hover': '#B91C1C',
    '--accent-yellow': '#B8860B',
    '--accent-yellow-hover': '#A07608',
    '--accent-orange': '#737373',
    '--accent-orange-hover': '#606060',

    '--accent-primary': '#404040',
    '--accent-primary-hover': '#333333',
    '--accent-secondary': '#808080',
    '--accent-secondary-hover': '#6B6B6B',

    '--status-success': '#22C55E',
    '--status-warning': '#B8860B',
    '--status-error': '#DC2626',
    '--status-info': '#4A4A4A',
  },
  dark: {
    '--surface-light': '#FFFFFF',
    '--surface-light-elevated': '#F5F5F5',
    '--surface-dark': '#0A0A0A',
    '--surface-dark-elevated': '#141414',

    '--text-light-primary': '#0A0A0A',
    '--text-light-secondary': '#525252',
    '--text-light-tertiary': '#737373',
    '--text-dark-primary': '#FAFAFA',
    '--text-dark-secondary': '#D4D4D4',
    '--text-dark-tertiary': '#A3A3A3',

    '--border-light': '#E5E5E5',
    '--border-dark': 'rgba(255, 255, 255, 0.25)',

    '--accent-blue': '#A3A3A3',
    '--accent-blue-hover': '#D4D4D4',
    '--accent-magenta': '#C0C0C0',
    '--accent-magenta-hover': '#E5E5E5',
    '--accent-cyan': '#A3A3A3',
    '--accent-cyan-hover': '#D4D4D4',
    '--accent-green': '#4ADE80',
    '--accent-green-hover': '#86EFAC',
    '--accent-neon-green': '#4ADE80',
    '--accent-purple': '#A3A3A3',
    '--accent-purple-hover': '#D4D4D4',
    '--accent-red': '#F87171',
    '--accent-red-hover': '#FCA5A5',
    '--accent-yellow': '#DAA520',
    '--accent-yellow-hover': '#F0C040',
    '--accent-orange': '#A3A3A3',
    '--accent-orange-hover': '#D4D4D4',

    '--accent-primary': '#D4D4D4',
    '--accent-primary-hover': '#E5E5E5',
    '--accent-secondary': '#A0A0A0',
    '--accent-secondary-hover': '#B0B0B0',

    '--status-success': '#4ADE80',
    '--status-warning': '#DAA520',
    '--status-error': '#F87171',
    '--status-info': '#A0A0A0',
  },
};
