/**
 * Solarized Light Theme
 * Ethan Schoonover's precision-crafted color scheme
 */

import type { ThemeDefinition } from './types';

export const solarizedTheme: ThemeDefinition = {
  id: 'solarized',
  name: 'Solarized Light',
  description: 'Precision-crafted warm hues with balanced contrast',
  category: 'professional',
  preview: {
    primary: '#268BD2',
    secondary: '#859900',
    accent: '#DC322F',
  },
  light: {
    '--surface-light': '#FDF6E3',
    '--surface-light-elevated': '#EEE8D5',
    '--surface-dark': '#002B36',
    '--surface-dark-elevated': '#073642',

    '--text-light-primary': '#073642',
    '--text-light-secondary': '#586E75',
    '--text-light-tertiary': '#657B83',
    '--text-dark-primary': '#FDF6E3',
    '--text-dark-secondary': '#EEE8D5',
    '--text-dark-tertiary': '#93A1A1',

    '--border-light': '#EEE8D5',
    '--border-dark': 'rgba(38, 139, 210, 0.20)',

    '--accent-blue': '#268BD2',
    '--accent-blue-hover': '#1A7BBF',
    '--accent-magenta': '#D33682',
    '--accent-magenta-hover': '#BF2670',
    '--accent-cyan': '#2AA198',
    '--accent-cyan-hover': '#1E8F86',
    '--accent-green': '#859900',
    '--accent-green-hover': '#728500',
    '--accent-neon-green': '#859900',
    '--accent-purple': '#6C71C4',
    '--accent-purple-hover': '#585DB0',
    '--accent-red': '#DC322F',
    '--accent-red-hover': '#C82420',
    '--accent-yellow': '#B58900',
    '--accent-yellow-hover': '#A07800',
    '--accent-orange': '#CB4B16',
    '--accent-orange-hover': '#B53E10',

    '--accent-primary': '#268BD2',
    '--accent-primary-hover': '#1A7BBF',
    '--accent-secondary': '#859900',
    '--accent-secondary-hover': '#728500',

    '--status-success': '#859900',
    '--status-warning': '#B58900',
    '--status-error': '#DC322F',
    '--status-info': '#268BD2',
  },
  dark: {
    '--surface-light': '#FDF6E3',
    '--surface-light-elevated': '#EEE8D5',
    '--surface-dark': '#002B36',
    '--surface-dark-elevated': '#073642',

    '--text-light-primary': '#073642',
    '--text-light-secondary': '#586E75',
    '--text-light-tertiary': '#657B83',
    '--text-dark-primary': '#FDF6E3',
    '--text-dark-secondary': '#EEE8D5',
    '--text-dark-tertiary': '#93A1A1',

    '--border-light': '#EEE8D5',
    '--border-dark': 'rgba(38, 139, 210, 0.15)',

    '--accent-blue': '#268BD2',
    '--accent-blue-hover': '#3A9BE0',
    '--accent-magenta': '#D33682',
    '--accent-magenta-hover': '#E04A95',
    '--accent-cyan': '#2AA198',
    '--accent-cyan-hover': '#38B0A8',
    '--accent-green': '#859900',
    '--accent-green-hover': '#96AA18',
    '--accent-neon-green': '#859900',
    '--accent-purple': '#6C71C4',
    '--accent-purple-hover': '#7E83D0',
    '--accent-red': '#DC322F',
    '--accent-red-hover': '#E5504D',
    '--accent-yellow': '#B58900',
    '--accent-yellow-hover': '#C89C18',
    '--accent-orange': '#CB4B16',
    '--accent-orange-hover': '#D86030',

    '--accent-primary': '#268BD2',
    '--accent-primary-hover': '#3A9BE0',
    '--accent-secondary': '#859900',
    '--accent-secondary-hover': '#96AA18',

    '--status-success': '#859900',
    '--status-warning': '#B58900',
    '--status-error': '#DC322F',
    '--status-info': '#268BD2',
  },
};
