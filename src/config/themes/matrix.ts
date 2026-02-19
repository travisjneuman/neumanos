/**
 * Matrix Theme
 * Green-on-black terminal aesthetic with phosphor glow
 */

import type { ThemeDefinition } from './types';

export const matrixTheme: ThemeDefinition = {
  id: 'matrix',
  name: 'Matrix',
  description: 'Terminal green on black — digital rain aesthetic',
  category: 'tech',
  preview: {
    primary: '#00FF41',
    secondary: '#008F11',
    accent: '#003B00',
  },
  light: {
    '--surface-light': '#F0FFF0',
    '--surface-light-elevated': '#E0F5E0',
    '--surface-dark': '#001400',
    '--surface-dark-elevated': '#002200',

    '--text-light-primary': '#001400',
    '--text-light-secondary': '#1A4A1A',
    '--text-light-tertiary': '#2A5A2A',
    '--text-dark-primary': '#00FF41',
    '--text-dark-secondary': '#00CC33',
    '--text-dark-tertiary': '#009922',

    '--border-light': '#B8E8B8',
    '--border-dark': 'rgba(0, 255, 65, 0.20)',

    '--accent-blue': '#00AA44',
    '--accent-blue-hover': '#009938',
    '--accent-magenta': '#00DD55',
    '--accent-magenta-hover': '#00CC44',
    '--accent-cyan': '#00BB33',
    '--accent-cyan-hover': '#00AA28',
    '--accent-green': '#00FF41',
    '--accent-green-hover': '#00DD38',
    '--accent-neon-green': '#00FF41',
    '--accent-purple': '#00CC55',
    '--accent-purple-hover': '#00BB44',
    '--accent-red': '#FF3333',
    '--accent-red-hover': '#E02D2D',
    '--accent-yellow': '#88FF00',
    '--accent-yellow-hover': '#77E000',
    '--accent-orange': '#44DD00',
    '--accent-orange-hover': '#33CC00',

    '--accent-primary': '#00AA44',
    '--accent-primary-hover': '#009938',
    '--accent-secondary': '#00FF41',
    '--accent-secondary-hover': '#00DD38',

    '--status-success': '#00FF41',
    '--status-warning': '#88FF00',
    '--status-error': '#FF3333',
    '--status-info': '#00BB33',
  },
  dark: {
    '--surface-light': '#F0FFF0',
    '--surface-light-elevated': '#E0F5E0',
    '--surface-dark': '#000A00',
    '--surface-dark-elevated': '#001400',

    '--text-light-primary': '#001400',
    '--text-light-secondary': '#1A4A1A',
    '--text-light-tertiary': '#336B33',
    '--text-dark-primary': '#00FF41',
    '--text-dark-secondary': '#00CC33',
    '--text-dark-tertiary': '#009922',

    '--border-light': '#B8E8B8',
    '--border-dark': 'rgba(0, 255, 65, 0.18)',

    '--accent-blue': '#00CC44',
    '--accent-blue-hover': '#00FF55',
    '--accent-magenta': '#00FF66',
    '--accent-magenta-hover': '#33FF88',
    '--accent-cyan': '#00DD44',
    '--accent-cyan-hover': '#00FF55',
    '--accent-green': '#00FF41',
    '--accent-green-hover': '#33FF66',
    '--accent-neon-green': '#00FF41',
    '--accent-purple': '#00EE55',
    '--accent-purple-hover': '#33FF77',
    '--accent-red': '#FF4444',
    '--accent-red-hover': '#FF6666',
    '--accent-yellow': '#99FF22',
    '--accent-yellow-hover': '#AAFF44',
    '--accent-orange': '#55EE11',
    '--accent-orange-hover': '#66FF22',

    '--accent-primary': '#00CC44',
    '--accent-primary-hover': '#00FF55',
    '--accent-secondary': '#00FF41',
    '--accent-secondary-hover': '#33FF66',

    '--status-success': '#00FF41',
    '--status-warning': '#99FF22',
    '--status-error': '#FF4444',
    '--status-info': '#00DD44',
  },
};
