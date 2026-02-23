/**
 * Tokyo Night Theme
 * Deep indigo with neon city accents
 */

import type { ThemeDefinition } from './types';

export const tokyoNightTheme: ThemeDefinition = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  description: 'Deep indigo with neon city accents',
  category: 'tech',
  preview: {
    primary: '#7AA2F7',
    secondary: '#BB9AF7',
    accent: '#9ECE6A',
  },
  light: {
    '--surface-light': '#F0F0F8',
    '--surface-light-elevated': '#E4E4F0',
    '--surface-dark': '#1A1B26',
    '--surface-dark-elevated': '#24283B',

    '--text-light-primary': '#1A1B26',
    '--text-light-secondary': '#3B3D52',
    '--text-light-tertiary': '#565A75',
    '--text-dark-primary': '#C0CAF5',
    '--text-dark-secondary': '#A9B1D6',
    '--text-dark-tertiary': '#787C99',

    '--border-light': '#D5D6E8',
    '--border-dark': 'rgba(122, 162, 247, 0.20)',

    '--accent-blue': '#7AA2F7',
    '--accent-blue-hover': '#6190E8',
    '--accent-magenta': '#FF007C',
    '--accent-magenta-hover': '#E00070',
    '--accent-cyan': '#7DCFFF',
    '--accent-cyan-hover': '#64C0F0',
    '--accent-green': '#9ECE6A',
    '--accent-green-hover': '#89B957',
    '--accent-neon-green': '#9ECE6A',
    '--accent-purple': '#BB9AF7',
    '--accent-purple-hover': '#A982E8',
    '--accent-red': '#F7768E',
    '--accent-red-hover': '#E0607A',
    '--accent-yellow': '#E0AF68',
    '--accent-yellow-hover': '#D09E55',
    '--accent-orange': '#FF9E64',
    '--accent-orange-hover': '#E88C52',

    '--accent-primary': '#7AA2F7',
    '--accent-primary-hover': '#6190E8',
    '--accent-secondary': '#BB9AF7',
    '--accent-secondary-hover': '#A982E8',

    '--status-success': '#9ECE6A',
    '--status-warning': '#E0AF68',
    '--status-error': '#F7768E',
    '--status-info': '#7DCFFF',
  },
  dark: {
    '--surface-light': '#F0F0F8',
    '--surface-light-elevated': '#E4E4F0',
    '--surface-dark': '#1A1B26',
    '--surface-dark-elevated': '#24283B',

    '--text-light-primary': '#1A1B26',
    '--text-light-secondary': '#3B3D52',
    '--text-light-tertiary': '#565A75',
    '--text-dark-primary': '#C0CAF5',
    '--text-dark-secondary': '#A9B1D6',
    '--text-dark-tertiary': '#787C99',

    '--border-light': '#D5D6E8',
    '--border-dark': 'rgba(122, 162, 247, 0.15)',

    '--accent-blue': '#7AA2F7',
    '--accent-blue-hover': '#8FB4F8',
    '--accent-magenta': '#FF007C',
    '--accent-magenta-hover': '#FF3396',
    '--accent-cyan': '#7DCFFF',
    '--accent-cyan-hover': '#95D9FF',
    '--accent-green': '#9ECE6A',
    '--accent-green-hover': '#B0D880',
    '--accent-neon-green': '#9ECE6A',
    '--accent-purple': '#BB9AF7',
    '--accent-purple-hover': '#CCAEF9',
    '--accent-red': '#F7768E',
    '--accent-red-hover': '#F990A4',
    '--accent-yellow': '#E0AF68',
    '--accent-yellow-hover': '#E8BF80',
    '--accent-orange': '#FF9E64',
    '--accent-orange-hover': '#FFB080',

    '--accent-primary': '#7AA2F7',
    '--accent-primary-hover': '#8FB4F8',
    '--accent-secondary': '#BB9AF7',
    '--accent-secondary-hover': '#CCAEF9',

    '--status-success': '#9ECE6A',
    '--status-warning': '#E0AF68',
    '--status-error': '#F7768E',
    '--status-info': '#7DCFFF',
  },
};
