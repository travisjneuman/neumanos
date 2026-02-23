/**
 * Nord Theme
 * Cool, arctic blues inspired by the Nord color palette
 */

import type { ThemeDefinition } from './types';

export const nordTheme: ThemeDefinition = {
  id: 'nord',
  name: 'Nord',
  description: 'Cool arctic blues and soft snowstorm whites',
  category: 'professional',
  preview: {
    primary: '#88C0D0',
    secondary: '#A3BE8C',
    accent: '#81A1C1',
  },
  light: {
    '--surface-light': '#ECEFF4',
    '--surface-light-elevated': '#E5E9F0',
    '--surface-dark': '#2E3440',
    '--surface-dark-elevated': '#3B4252',

    '--text-light-primary': '#2E3440',
    '--text-light-secondary': '#4C566A',
    '--text-light-tertiary': '#616E88',
    '--text-dark-primary': '#ECEFF4',
    '--text-dark-secondary': '#D8DEE9',
    '--text-dark-tertiary': '#C0C8D8',

    '--border-light': '#D8DEE9',
    '--border-dark': 'rgba(136, 192, 208, 0.20)',

    '--accent-blue': '#5E81AC',
    '--accent-blue-hover': '#4C6E96',
    '--accent-magenta': '#B48EAD',
    '--accent-magenta-hover': '#A07A99',
    '--accent-cyan': '#88C0D0',
    '--accent-cyan-hover': '#76AEC0',
    '--accent-green': '#A3BE8C',
    '--accent-green-hover': '#8FAA78',
    '--accent-neon-green': '#A3BE8C',
    '--accent-purple': '#B48EAD',
    '--accent-purple-hover': '#A07A99',
    '--accent-red': '#BF616A',
    '--accent-red-hover': '#AB4D56',
    '--accent-yellow': '#EBCB8B',
    '--accent-yellow-hover': '#D4B577',
    '--accent-orange': '#D08770',
    '--accent-orange-hover': '#BC735C',

    '--accent-primary': '#88C0D0',
    '--accent-primary-hover': '#76AEC0',
    '--accent-secondary': '#A3BE8C',
    '--accent-secondary-hover': '#8FAA78',

    '--status-success': '#A3BE8C',
    '--status-warning': '#EBCB8B',
    '--status-error': '#BF616A',
    '--status-info': '#5E81AC',
  },
  dark: {
    '--surface-light': '#ECEFF4',
    '--surface-light-elevated': '#E5E9F0',
    '--surface-dark': '#2E3440',
    '--surface-dark-elevated': '#3B4252',

    '--text-light-primary': '#2E3440',
    '--text-light-secondary': '#4C566A',
    '--text-light-tertiary': '#616E88',
    '--text-dark-primary': '#ECEFF4',
    '--text-dark-secondary': '#D8DEE9',
    '--text-dark-tertiary': '#C0C8D8',

    '--border-light': '#D8DEE9',
    '--border-dark': 'rgba(136, 192, 208, 0.15)',

    '--accent-blue': '#81A1C1',
    '--accent-blue-hover': '#95B3CF',
    '--accent-magenta': '#B48EAD',
    '--accent-magenta-hover': '#C4A0BD',
    '--accent-cyan': '#88C0D0',
    '--accent-cyan-hover': '#9CD0DE',
    '--accent-green': '#A3BE8C',
    '--accent-green-hover': '#B5CE9E',
    '--accent-neon-green': '#A3BE8C',
    '--accent-purple': '#B48EAD',
    '--accent-purple-hover': '#C4A0BD',
    '--accent-red': '#BF616A',
    '--accent-red-hover': '#CF737C',
    '--accent-yellow': '#EBCB8B',
    '--accent-yellow-hover': '#F0D59D',
    '--accent-orange': '#D08770',
    '--accent-orange-hover': '#DA9B86',

    '--accent-primary': '#88C0D0',
    '--accent-primary-hover': '#9CD0DE',
    '--accent-secondary': '#A3BE8C',
    '--accent-secondary-hover': '#B5CE9E',

    '--status-success': '#A3BE8C',
    '--status-warning': '#EBCB8B',
    '--status-error': '#BF616A',
    '--status-info': '#81A1C1',
  },
};
