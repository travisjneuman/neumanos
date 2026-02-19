/**
 * Neon Noir Theme (inspired by Miami Vice)
 * Neon magenta and cyan on deep dark backgrounds
 */

import type { ThemeDefinition } from './types';

export const neonNoirTheme: ThemeDefinition = {
  id: 'neon-noir',
  name: 'Neon Noir',
  description: 'Electric neon accents on deep noir backgrounds',
  category: 'vibrant',
  preview: {
    primary: '#FF2D95',
    secondary: '#00F0FF',
    accent: '#B026FF',
  },
  light: {
    '--surface-light': '#FFF5F9',
    '--surface-light-elevated': '#FFE8F1',
    '--surface-dark': '#1A0A12',
    '--surface-dark-elevated': '#2D1422',

    '--text-light-primary': '#1A0A12',
    '--text-light-secondary': '#6B3A52',
    '--text-light-tertiary': '#6B3A52',
    '--text-dark-primary': '#FFFFFF',
    '--text-dark-secondary': '#E0B8CC',
    '--text-dark-tertiary': '#B88A9E',

    '--border-light': '#F5D0E0',
    '--border-dark': 'rgba(255, 45, 149, 0.20)',

    '--accent-blue': '#3B82F6',
    '--accent-blue-hover': '#2563EB',
    '--accent-magenta': '#FF2D95',
    '--accent-magenta-hover': '#E0237F',
    '--accent-cyan': '#00F0FF',
    '--accent-cyan-hover': '#00D4E0',
    '--accent-green': '#00FF88',
    '--accent-green-hover': '#00E077',
    '--accent-neon-green': '#39FF14',
    '--accent-purple': '#B026FF',
    '--accent-purple-hover': '#9A1FE0',
    '--accent-red': '#FF3366',
    '--accent-red-hover': '#E02D5A',
    '--accent-yellow': '#FFD700',
    '--accent-yellow-hover': '#E0BF00',
    '--accent-orange': '#FF6B2D',
    '--accent-orange-hover': '#E05F28',

    '--accent-primary': '#FF2D95',
    '--accent-primary-hover': '#E0237F',
    '--accent-secondary': '#00F0FF',
    '--accent-secondary-hover': '#00D4E0',

    '--status-success': '#00FF88',
    '--status-warning': '#FFD700',
    '--status-error': '#FF3366',
    '--status-info': '#00F0FF',
  },
  dark: {
    '--surface-light': '#FFF5F9',
    '--surface-light-elevated': '#FFE8F1',
    '--surface-dark': '#0A0510',
    '--surface-dark-elevated': '#150A1A',

    '--text-light-primary': '#1A0A12',
    '--text-light-secondary': '#6B3A52',
    '--text-light-tertiary': '#8C5A72',
    '--text-dark-primary': '#FFFFFF',
    '--text-dark-secondary': '#E0B8CC',
    '--text-dark-tertiary': '#B88A9E',

    '--border-light': '#F5D0E0',
    '--border-dark': 'rgba(255, 45, 149, 0.20)',

    '--accent-blue': '#4D8DF7',
    '--accent-blue-hover': '#3A7AE8',
    '--accent-magenta': '#FF2D95',
    '--accent-magenta-hover': '#FF4DA8',
    '--accent-cyan': '#00F0FF',
    '--accent-cyan-hover': '#33F3FF',
    '--accent-green': '#00FF88',
    '--accent-green-hover': '#33FF9F',
    '--accent-neon-green': '#39FF14',
    '--accent-purple': '#B026FF',
    '--accent-purple-hover': '#C04FFF',
    '--accent-red': '#FF3366',
    '--accent-red-hover': '#FF5580',
    '--accent-yellow': '#FFD700',
    '--accent-yellow-hover': '#FFDF33',
    '--accent-orange': '#FF6B2D',
    '--accent-orange-hover': '#FF8555',

    '--accent-primary': '#FF2D95',
    '--accent-primary-hover': '#FF4DA8',
    '--accent-secondary': '#00F0FF',
    '--accent-secondary-hover': '#33F3FF',

    '--status-success': '#00FF88',
    '--status-warning': '#FFD700',
    '--status-error': '#FF3366',
    '--status-info': '#00F0FF',
  },
};
