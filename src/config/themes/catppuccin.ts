/**
 * Catppuccin Mocha Theme
 * Warm pastel colors on a dark chocolate base
 */

import type { ThemeDefinition } from './types';

export const catppuccinTheme: ThemeDefinition = {
  id: 'catppuccin',
  name: 'Catppuccin Mocha',
  description: 'Warm pastels on a dark chocolate base',
  category: 'tech',
  preview: {
    primary: '#CBA6F7',
    secondary: '#F38BA8',
    accent: '#A6E3A1',
  },
  light: {
    '--surface-light': '#EFF1F5',
    '--surface-light-elevated': '#E6E9EF',
    '--surface-dark': '#1E1E2E',
    '--surface-dark-elevated': '#313244',

    '--text-light-primary': '#4C4F69',
    '--text-light-secondary': '#5C5F77',
    '--text-light-tertiary': '#6C6F85',
    '--text-dark-primary': '#CDD6F4',
    '--text-dark-secondary': '#BAC2DE',
    '--text-dark-tertiary': '#A6ADC8',

    '--border-light': '#DCE0E8',
    '--border-dark': 'rgba(203, 166, 247, 0.20)',

    '--accent-blue': '#8CAAEE',
    '--accent-blue-hover': '#7A98DD',
    '--accent-magenta': '#F4B8E4',
    '--accent-magenta-hover': '#E8A0D4',
    '--accent-cyan': '#99D1DB',
    '--accent-cyan-hover': '#85C0CB',
    '--accent-green': '#A6D189',
    '--accent-green-hover': '#94BF77',
    '--accent-neon-green': '#A6E3A1',
    '--accent-purple': '#CBA6F7',
    '--accent-purple-hover': '#B990E8',
    '--accent-red': '#E78284',
    '--accent-red-hover': '#D67072',
    '--accent-yellow': '#E5C890',
    '--accent-yellow-hover': '#D5B87E',
    '--accent-orange': '#EF9F76',
    '--accent-orange-hover': '#DE8D64',

    '--accent-primary': '#CBA6F7',
    '--accent-primary-hover': '#B990E8',
    '--accent-secondary': '#F38BA8',
    '--accent-secondary-hover': '#E07998',

    '--status-success': '#A6D189',
    '--status-warning': '#E5C890',
    '--status-error': '#E78284',
    '--status-info': '#8CAAEE',
  },
  dark: {
    '--surface-light': '#EFF1F5',
    '--surface-light-elevated': '#E6E9EF',
    '--surface-dark': '#1E1E2E',
    '--surface-dark-elevated': '#313244',

    '--text-light-primary': '#4C4F69',
    '--text-light-secondary': '#5C5F77',
    '--text-light-tertiary': '#6C6F85',
    '--text-dark-primary': '#CDD6F4',
    '--text-dark-secondary': '#BAC2DE',
    '--text-dark-tertiary': '#A6ADC8',

    '--border-light': '#DCE0E8',
    '--border-dark': 'rgba(203, 166, 247, 0.15)',

    '--accent-blue': '#89B4FA',
    '--accent-blue-hover': '#9DC2FB',
    '--accent-magenta': '#F5C2E7',
    '--accent-magenta-hover': '#F8D2EE',
    '--accent-cyan': '#94E2D5',
    '--accent-cyan-hover': '#A8E9DE',
    '--accent-green': '#A6E3A1',
    '--accent-green-hover': '#B8E9B4',
    '--accent-neon-green': '#A6E3A1',
    '--accent-purple': '#CBA6F7',
    '--accent-purple-hover': '#D6B8F9',
    '--accent-red': '#F38BA8',
    '--accent-red-hover': '#F6A0B8',
    '--accent-yellow': '#F9E2AF',
    '--accent-yellow-hover': '#FBE9C2',
    '--accent-orange': '#FAB387',
    '--accent-orange-hover': '#FBC29D',

    '--accent-primary': '#CBA6F7',
    '--accent-primary-hover': '#D6B8F9',
    '--accent-secondary': '#F38BA8',
    '--accent-secondary-hover': '#F6A0B8',

    '--status-success': '#A6E3A1',
    '--status-warning': '#F9E2AF',
    '--status-error': '#F38BA8',
    '--status-info': '#89B4FA',
  },
};
