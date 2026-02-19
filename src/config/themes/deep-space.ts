/**
 * Deep Space Theme
 * Deep navy and cosmic purple with stellar accents
 */

import type { ThemeDefinition } from './types';

export const deepSpaceTheme: ThemeDefinition = {
  id: 'deep-space',
  name: 'Deep Space',
  description: 'Cosmic purples and stellar blues from the void',
  category: 'tech',
  preview: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
  },
  light: {
    '--surface-light': '#F5F3FF',
    '--surface-light-elevated': '#EDE9FE',
    '--surface-dark': '#0C0A1A',
    '--surface-dark-elevated': '#181430',

    '--text-light-primary': '#0C0A1A',
    '--text-light-secondary': '#3D3660',
    '--text-light-tertiary': '#4A4570',
    '--text-dark-primary': '#F5F3FF',
    '--text-dark-secondary': '#C4B5FD',
    '--text-dark-tertiary': '#A78BFA',

    '--border-light': '#DDD6FE',
    '--border-dark': 'rgba(99, 102, 241, 0.20)',

    '--accent-blue': '#6366F1',
    '--accent-blue-hover': '#4F46E5',
    '--accent-magenta': '#EC4899',
    '--accent-magenta-hover': '#DB2777',
    '--accent-cyan': '#06B6D4',
    '--accent-cyan-hover': '#0891B2',
    '--accent-green': '#10B981',
    '--accent-green-hover': '#059669',
    '--accent-neon-green': '#34D399',
    '--accent-purple': '#8B5CF6',
    '--accent-purple-hover': '#7C3AED',
    '--accent-red': '#F43F5E',
    '--accent-red-hover': '#E11D48',
    '--accent-yellow': '#FBBF24',
    '--accent-yellow-hover': '#F59E0B',
    '--accent-orange': '#F97316',
    '--accent-orange-hover': '#EA580C',

    '--accent-primary': '#6366F1',
    '--accent-primary-hover': '#4F46E5',
    '--accent-secondary': '#8B5CF6',
    '--accent-secondary-hover': '#7C3AED',

    '--status-success': '#10B981',
    '--status-warning': '#FBBF24',
    '--status-error': '#F43F5E',
    '--status-info': '#6366F1',
  },
  dark: {
    '--surface-light': '#F5F3FF',
    '--surface-light-elevated': '#EDE9FE',
    '--surface-dark': '#070514',
    '--surface-dark-elevated': '#100E22',

    '--text-light-primary': '#0C0A1A',
    '--text-light-secondary': '#3D3660',
    '--text-light-tertiary': '#5B5580',
    '--text-dark-primary': '#F5F3FF',
    '--text-dark-secondary': '#C4B5FD',
    '--text-dark-tertiary': '#A78BFA',

    '--border-light': '#DDD6FE',
    '--border-dark': 'rgba(139, 92, 246, 0.20)',

    '--accent-blue': '#818CF8',
    '--accent-blue-hover': '#A5B4FC',
    '--accent-magenta': '#F472B6',
    '--accent-magenta-hover': '#F9A8D4',
    '--accent-cyan': '#22D3EE',
    '--accent-cyan-hover': '#67E8F9',
    '--accent-green': '#34D399',
    '--accent-green-hover': '#6EE7B7',
    '--accent-neon-green': '#34D399',
    '--accent-purple': '#A78BFA',
    '--accent-purple-hover': '#C4B5FD',
    '--accent-red': '#FB7185',
    '--accent-red-hover': '#FDA4AF',
    '--accent-yellow': '#FCD34D',
    '--accent-yellow-hover': '#FDE68A',
    '--accent-orange': '#FB923C',
    '--accent-orange-hover': '#FDBA74',

    '--accent-primary': '#818CF8',
    '--accent-primary-hover': '#A5B4FC',
    '--accent-secondary': '#A78BFA',
    '--accent-secondary-hover': '#C4B5FD',

    '--status-success': '#34D399',
    '--status-warning': '#FCD34D',
    '--status-error': '#FB7185',
    '--status-info': '#818CF8',
  },
};
