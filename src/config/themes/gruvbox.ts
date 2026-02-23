/**
 * Gruvbox Dark Theme
 * Retro groove color scheme with warm tones
 */

import type { ThemeDefinition } from './types';

export const gruvboxTheme: ThemeDefinition = {
  id: 'gruvbox',
  name: 'Gruvbox Dark',
  description: 'Retro groove with warm earthy tones',
  category: 'vibrant',
  preview: {
    primary: '#FABD2F',
    secondary: '#B8BB26',
    accent: '#FB4934',
  },
  light: {
    '--surface-light': '#FBF1C7',
    '--surface-light-elevated': '#EBDBB2',
    '--surface-dark': '#282828',
    '--surface-dark-elevated': '#3C3836',

    '--text-light-primary': '#282828',
    '--text-light-secondary': '#504945',
    '--text-light-tertiary': '#665C54',
    '--text-dark-primary': '#EBDBB2',
    '--text-dark-secondary': '#D5C4A1',
    '--text-dark-tertiary': '#BDAE93',

    '--border-light': '#D5C4A1',
    '--border-dark': 'rgba(250, 189, 47, 0.20)',

    '--accent-blue': '#458588',
    '--accent-blue-hover': '#376E70',
    '--accent-magenta': '#D3869B',
    '--accent-magenta-hover': '#C07089',
    '--accent-cyan': '#689D6A',
    '--accent-cyan-hover': '#568754',
    '--accent-green': '#B8BB26',
    '--accent-green-hover': '#A5A720',
    '--accent-neon-green': '#B8BB26',
    '--accent-purple': '#D3869B',
    '--accent-purple-hover': '#C07089',
    '--accent-red': '#CC241D',
    '--accent-red-hover': '#B01A14',
    '--accent-yellow': '#FABD2F',
    '--accent-yellow-hover': '#E0A820',
    '--accent-orange': '#FE8019',
    '--accent-orange-hover': '#E56E10',

    '--accent-primary': '#FABD2F',
    '--accent-primary-hover': '#E0A820',
    '--accent-secondary': '#B8BB26',
    '--accent-secondary-hover': '#A5A720',

    '--status-success': '#B8BB26',
    '--status-warning': '#FABD2F',
    '--status-error': '#CC241D',
    '--status-info': '#458588',
  },
  dark: {
    '--surface-light': '#FBF1C7',
    '--surface-light-elevated': '#EBDBB2',
    '--surface-dark': '#282828',
    '--surface-dark-elevated': '#3C3836',

    '--text-light-primary': '#282828',
    '--text-light-secondary': '#504945',
    '--text-light-tertiary': '#665C54',
    '--text-dark-primary': '#EBDBB2',
    '--text-dark-secondary': '#D5C4A1',
    '--text-dark-tertiary': '#BDAE93',

    '--border-light': '#D5C4A1',
    '--border-dark': 'rgba(250, 189, 47, 0.15)',

    '--accent-blue': '#83A598',
    '--accent-blue-hover': '#96B5AA',
    '--accent-magenta': '#D3869B',
    '--accent-magenta-hover': '#DD9BAC',
    '--accent-cyan': '#8EC07C',
    '--accent-cyan-hover': '#A0CC90',
    '--accent-green': '#B8BB26',
    '--accent-green-hover': '#C8CB44',
    '--accent-neon-green': '#B8BB26',
    '--accent-purple': '#D3869B',
    '--accent-purple-hover': '#DD9BAC',
    '--accent-red': '#FB4934',
    '--accent-red-hover': '#FC6652',
    '--accent-yellow': '#FABD2F',
    '--accent-yellow-hover': '#FBCA52',
    '--accent-orange': '#FE8019',
    '--accent-orange-hover': '#FE9640',

    '--accent-primary': '#FABD2F',
    '--accent-primary-hover': '#FBCA52',
    '--accent-secondary': '#B8BB26',
    '--accent-secondary-hover': '#C8CB44',

    '--status-success': '#B8BB26',
    '--status-warning': '#FABD2F',
    '--status-error': '#FB4934',
    '--status-info': '#83A598',
  },
};
