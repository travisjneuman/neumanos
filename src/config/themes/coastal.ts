/**
 * Coastal Theme (inspired by Links)
 * Sky blues, sandy tans, and ocean-inspired tones
 */

import type { ThemeDefinition } from './types';

export const coastalTheme: ThemeDefinition = {
  id: 'coastal',
  name: 'Coastal',
  description: 'Ocean blues and sandy warmth from the shore',
  category: 'professional',
  preview: {
    primary: '#0284C7',
    secondary: '#D4A76A',
    accent: '#0369A1',
  },
  light: {
    '--surface-light': '#F8FBFF',
    '--surface-light-elevated': '#EBF4FC',
    '--surface-dark': '#0A1420',
    '--surface-dark-elevated': '#142230',

    '--text-light-primary': '#0A1420',
    '--text-light-secondary': '#2D4A6B',
    '--text-light-tertiary': '#3D5A78',
    '--text-dark-primary': '#F0F8FF',
    '--text-dark-secondary': '#A8C8E0',
    '--text-dark-tertiary': '#7AA0C0',

    '--border-light': '#C8DDF0',
    '--border-dark': 'rgba(2, 132, 199, 0.20)',

    '--accent-blue': '#0284C7',
    '--accent-blue-hover': '#0369A1',
    '--accent-magenta': '#C06888',
    '--accent-magenta-hover': '#A85878',
    '--accent-cyan': '#06B6D4',
    '--accent-cyan-hover': '#0891B2',
    '--accent-green': '#0D9488',
    '--accent-green-hover': '#0A7A70',
    '--accent-neon-green': '#34D399',
    '--accent-purple': '#7C8CC4',
    '--accent-purple-hover': '#6B7BB3',
    '--accent-red': '#DC6860',
    '--accent-red-hover': '#C85C55',
    '--accent-yellow': '#D4A76A',
    '--accent-yellow-hover': '#C09860',
    '--accent-orange': '#D48B5A',
    '--accent-orange-hover': '#C07E50',

    '--accent-primary': '#0284C7',
    '--accent-primary-hover': '#0369A1',
    '--accent-secondary': '#D4A76A',
    '--accent-secondary-hover': '#C09860',

    '--status-success': '#0D9488',
    '--status-warning': '#D4A76A',
    '--status-error': '#DC6860',
    '--status-info': '#0284C7',
  },
  dark: {
    '--surface-light': '#F8FBFF',
    '--surface-light-elevated': '#EBF4FC',
    '--surface-dark': '#060E18',
    '--surface-dark-elevated': '#0E1A28',

    '--text-light-primary': '#0A1420',
    '--text-light-secondary': '#2D4A6B',
    '--text-light-tertiary': '#4A6B8C',
    '--text-dark-primary': '#F0F8FF',
    '--text-dark-secondary': '#A8C8E0',
    '--text-dark-tertiary': '#8AB0D0',

    '--border-light': '#C8DDF0',
    '--border-dark': 'rgba(2, 132, 199, 0.20)',

    '--accent-blue': '#38BDF8',
    '--accent-blue-hover': '#7DD3FC',
    '--accent-magenta': '#D07898',
    '--accent-magenta-hover': '#E088A8',
    '--accent-cyan': '#22D3EE',
    '--accent-cyan-hover': '#67E8F9',
    '--accent-green': '#2DD4BF',
    '--accent-green-hover': '#5EEAD4',
    '--accent-neon-green': '#34D399',
    '--accent-purple': '#93A3E0',
    '--accent-purple-hover': '#A3B3F0',
    '--accent-red': '#F08078',
    '--accent-red-hover': '#F09088',
    '--accent-yellow': '#E4B77A',
    '--accent-yellow-hover': '#F0C88A',
    '--accent-orange': '#E49B6A',
    '--accent-orange-hover': '#F0AB7A',

    '--accent-primary': '#38BDF8',
    '--accent-primary-hover': '#7DD3FC',
    '--accent-secondary': '#E4B77A',
    '--accent-secondary-hover': '#F0C88A',

    '--status-success': '#2DD4BF',
    '--status-warning': '#E4B77A',
    '--status-error': '#F08078',
    '--status-info': '#38BDF8',
  },
};
