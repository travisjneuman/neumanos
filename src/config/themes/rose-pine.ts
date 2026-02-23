/**
 * Rose Pine Theme
 * All natural pine with soft rosewood highlights
 */

import type { ThemeDefinition } from './types';

export const rosePineTheme: ThemeDefinition = {
  id: 'rose-pine',
  name: 'Rose Pine',
  description: 'Soft rosewood highlights on natural pine',
  category: 'minimal',
  preview: {
    primary: '#C4A7E7',
    secondary: '#EBBCBA',
    accent: '#F6C177',
  },
  light: {
    '--surface-light': '#FAF4ED',
    '--surface-light-elevated': '#F2E9DE',
    '--surface-dark': '#191724',
    '--surface-dark-elevated': '#1F1D2E',

    '--text-light-primary': '#191724',
    '--text-light-secondary': '#3E3A50',
    '--text-light-tertiary': '#575279',
    '--text-dark-primary': '#E0DEF4',
    '--text-dark-secondary': '#C4A7E7',
    '--text-dark-tertiary': '#908CAA',

    '--border-light': '#E8DED4',
    '--border-dark': 'rgba(196, 167, 231, 0.20)',

    '--accent-blue': '#9CCFD8',
    '--accent-blue-hover': '#88BFC8',
    '--accent-magenta': '#EB6F92',
    '--accent-magenta-hover': '#D85C80',
    '--accent-cyan': '#9CCFD8',
    '--accent-cyan-hover': '#88BFC8',
    '--accent-green': '#31748F',
    '--accent-green-hover': '#26627A',
    '--accent-neon-green': '#9CCFD8',
    '--accent-purple': '#C4A7E7',
    '--accent-purple-hover': '#B295D8',
    '--accent-red': '#EB6F92',
    '--accent-red-hover': '#D85C80',
    '--accent-yellow': '#F6C177',
    '--accent-yellow-hover': '#E4AF65',
    '--accent-orange': '#F6C177',
    '--accent-orange-hover': '#E4AF65',

    '--accent-primary': '#C4A7E7',
    '--accent-primary-hover': '#B295D8',
    '--accent-secondary': '#EBBCBA',
    '--accent-secondary-hover': '#D9AAA8',

    '--status-success': '#31748F',
    '--status-warning': '#F6C177',
    '--status-error': '#EB6F92',
    '--status-info': '#9CCFD8',
  },
  dark: {
    '--surface-light': '#FAF4ED',
    '--surface-light-elevated': '#F2E9DE',
    '--surface-dark': '#191724',
    '--surface-dark-elevated': '#1F1D2E',

    '--text-light-primary': '#191724',
    '--text-light-secondary': '#3E3A50',
    '--text-light-tertiary': '#575279',
    '--text-dark-primary': '#E0DEF4',
    '--text-dark-secondary': '#C4A7E7',
    '--text-dark-tertiary': '#908CAA',

    '--border-light': '#E8DED4',
    '--border-dark': 'rgba(196, 167, 231, 0.15)',

    '--accent-blue': '#9CCFD8',
    '--accent-blue-hover': '#AED8E0',
    '--accent-magenta': '#EB6F92',
    '--accent-magenta-hover': '#EF88A5',
    '--accent-cyan': '#9CCFD8',
    '--accent-cyan-hover': '#AED8E0',
    '--accent-green': '#31748F',
    '--accent-green-hover': '#4088A0',
    '--accent-neon-green': '#9CCFD8',
    '--accent-purple': '#C4A7E7',
    '--accent-purple-hover': '#D0B8EC',
    '--accent-red': '#EB6F92',
    '--accent-red-hover': '#EF88A5',
    '--accent-yellow': '#F6C177',
    '--accent-yellow-hover': '#F8CD90',
    '--accent-orange': '#F6C177',
    '--accent-orange-hover': '#F8CD90',

    '--accent-primary': '#C4A7E7',
    '--accent-primary-hover': '#D0B8EC',
    '--accent-secondary': '#EBBCBA',
    '--accent-secondary-hover': '#F0CECE',

    '--status-success': '#31748F',
    '--status-warning': '#F6C177',
    '--status-error': '#EB6F92',
    '--status-info': '#9CCFD8',
  },
};
