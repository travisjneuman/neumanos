/**
 * Dracula Theme
 * Dark purple hues with vibrant neon accents
 */

import type { ThemeDefinition } from './types';

export const draculaTheme: ThemeDefinition = {
  id: 'dracula',
  name: 'Dracula',
  description: 'Dark purple with vibrant neon accents',
  category: 'tech',
  preview: {
    primary: '#BD93F9',
    secondary: '#FF79C6',
    accent: '#50FA7B',
  },
  light: {
    '--surface-light': '#F8F8F2',
    '--surface-light-elevated': '#EEEEE8',
    '--surface-dark': '#282A36',
    '--surface-dark-elevated': '#343746',

    '--text-light-primary': '#282A36',
    '--text-light-secondary': '#44475A',
    '--text-light-tertiary': '#5A5D70',
    '--text-dark-primary': '#F8F8F2',
    '--text-dark-secondary': '#CCC9E0',
    '--text-dark-tertiary': '#A0A0B8',

    '--border-light': '#DDD9F2',
    '--border-dark': 'rgba(189, 147, 249, 0.20)',

    '--accent-blue': '#8BE9FD',
    '--accent-blue-hover': '#6CE0F8',
    '--accent-magenta': '#FF79C6',
    '--accent-magenta-hover': '#FF55B6',
    '--accent-cyan': '#8BE9FD',
    '--accent-cyan-hover': '#6CE0F8',
    '--accent-green': '#50FA7B',
    '--accent-green-hover': '#35F065',
    '--accent-neon-green': '#50FA7B',
    '--accent-purple': '#BD93F9',
    '--accent-purple-hover': '#AB7BF5',
    '--accent-red': '#FF5555',
    '--accent-red-hover': '#E03E3E',
    '--accent-yellow': '#F1FA8C',
    '--accent-yellow-hover': '#E6F070',
    '--accent-orange': '#FFB86C',
    '--accent-orange-hover': '#FFA54C',

    '--accent-primary': '#BD93F9',
    '--accent-primary-hover': '#AB7BF5',
    '--accent-secondary': '#FF79C6',
    '--accent-secondary-hover': '#FF55B6',

    '--status-success': '#50FA7B',
    '--status-warning': '#F1FA8C',
    '--status-error': '#FF5555',
    '--status-info': '#8BE9FD',
  },
  dark: {
    '--surface-light': '#F8F8F2',
    '--surface-light-elevated': '#EEEEE8',
    '--surface-dark': '#282A36',
    '--surface-dark-elevated': '#343746',

    '--text-light-primary': '#282A36',
    '--text-light-secondary': '#44475A',
    '--text-light-tertiary': '#5A5D70',
    '--text-dark-primary': '#F8F8F2',
    '--text-dark-secondary': '#CCC9E0',
    '--text-dark-tertiary': '#A0A0B8',

    '--border-light': '#DDD9F2',
    '--border-dark': 'rgba(189, 147, 249, 0.15)',

    '--accent-blue': '#8BE9FD',
    '--accent-blue-hover': '#A6EFF9',
    '--accent-magenta': '#FF79C6',
    '--accent-magenta-hover': '#FF92D0',
    '--accent-cyan': '#8BE9FD',
    '--accent-cyan-hover': '#A6EFF9',
    '--accent-green': '#50FA7B',
    '--accent-green-hover': '#72FB96',
    '--accent-neon-green': '#50FA7B',
    '--accent-purple': '#BD93F9',
    '--accent-purple-hover': '#CDA8FB',
    '--accent-red': '#FF5555',
    '--accent-red-hover': '#FF7777',
    '--accent-yellow': '#F1FA8C',
    '--accent-yellow-hover': '#F5FBA8',
    '--accent-orange': '#FFB86C',
    '--accent-orange-hover': '#FFC78A',

    '--accent-primary': '#BD93F9',
    '--accent-primary-hover': '#CDA8FB',
    '--accent-secondary': '#FF79C6',
    '--accent-secondary-hover': '#FF92D0',

    '--status-success': '#50FA7B',
    '--status-warning': '#F1FA8C',
    '--status-error': '#FF5555',
    '--status-info': '#8BE9FD',
  },
};
