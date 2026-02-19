/**
 * Sunset Drift Theme (inspired by Retro 70s)
 * Warm oranges, ambers, and earthy tones — vibrant and saturated
 */

import type { ThemeDefinition } from './types';

export const sunsetDriftTheme: ThemeDefinition = {
  id: 'sunset-drift',
  name: 'Sunset Drift',
  description: 'Warm amber and terracotta with retro warmth',
  category: 'vibrant',
  preview: {
    primary: '#F56B15',
    secondary: '#E8A820',
    accent: '#D94520',
  },
  light: {
    '--surface-light': '#FFFBF5',
    '--surface-light-elevated': '#FFF3E0',
    '--surface-dark': '#1C1410',
    '--surface-dark-elevated': '#2A1F18',

    '--text-light-primary': '#2C1810',
    '--text-light-secondary': '#6B4830',
    '--text-light-tertiary': '#8C6A50',
    '--text-dark-primary': '#FFF5E8',
    '--text-dark-secondary': '#D4B896',
    '--text-dark-tertiary': '#A88A6C',

    '--border-light': '#F0D8B8',
    '--border-dark': 'rgba(245, 107, 21, 0.20)',

    '--accent-blue': '#5B8FD4',
    '--accent-blue-hover': '#4A7EC3',
    '--accent-magenta': '#E8508A',
    '--accent-magenta-hover': '#D44078',
    '--accent-cyan': '#5BBFD4',
    '--accent-cyan-hover': '#4AAEC3',
    '--accent-green': '#6BAF5B',
    '--accent-green-hover': '#5A9E4A',
    '--accent-neon-green': '#8FD45B',
    '--accent-purple': '#8F5BD4',
    '--accent-purple-hover': '#7E4AC3',
    '--accent-red': '#D94520',
    '--accent-red-hover': '#C83D1A',
    '--accent-yellow': '#E8A820',
    '--accent-yellow-hover': '#D49818',
    '--accent-orange': '#F56B15',
    '--accent-orange-hover': '#E06010',

    '--accent-primary': '#F56B15',
    '--accent-primary-hover': '#E06010',
    '--accent-secondary': '#E8A820',
    '--accent-secondary-hover': '#D49818',

    '--status-success': '#6BAF5B',
    '--status-warning': '#E8A820',
    '--status-error': '#D94520',
    '--status-info': '#5B8FD4',
  },
  dark: {
    '--surface-light': '#FFFBF5',
    '--surface-light-elevated': '#FFF3E0',
    '--surface-dark': '#110D09',
    '--surface-dark-elevated': '#1E1610',

    '--text-light-primary': '#2C1810',
    '--text-light-secondary': '#6B4830',
    '--text-light-tertiary': '#8C6A50',
    '--text-dark-primary': '#FFF5E8',
    '--text-dark-secondary': '#D4B896',
    '--text-dark-tertiary': '#C0A080',

    '--border-light': '#F0D8B8',
    '--border-dark': 'rgba(245, 107, 21, 0.20)',

    '--accent-blue': '#6B9FE4',
    '--accent-blue-hover': '#5A8ED3',
    '--accent-magenta': '#F57098',
    '--accent-magenta-hover': '#FF80A8',
    '--accent-cyan': '#6BCFE4',
    '--accent-cyan-hover': '#5ABED3',
    '--accent-green': '#7BBF6B',
    '--accent-green-hover': '#6AAE5A',
    '--accent-neon-green': '#9FE46B',
    '--accent-purple': '#9F6BE4',
    '--accent-purple-hover': '#8E5AD3',
    '--accent-red': '#E05530',
    '--accent-red-hover': '#F06540',
    '--accent-yellow': '#F0B830',
    '--accent-yellow-hover': '#FFC840',
    '--accent-orange': '#FF9530',
    '--accent-orange-hover': '#FFA540',

    '--accent-primary': '#FF9530',
    '--accent-primary-hover': '#FFA540',
    '--accent-secondary': '#F0B830',
    '--accent-secondary-hover': '#F8C840',

    '--status-success': '#7BBF6B',
    '--status-warning': '#F0B830',
    '--status-error': '#E05530',
    '--status-info': '#6B9FE4',
  },
};
