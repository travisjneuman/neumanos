/**
 * Heritage Theme (inspired by Scottish Links)
 * Deep earth tones, heather purples, and highland warmth
 * Accents boosted ~25% saturation for visual clarity
 */

import type { ThemeDefinition } from './types';

export const heritageTheme: ThemeDefinition = {
  id: 'heritage',
  name: 'Heritage',
  description: 'Deep earth tones with heather purple accents',
  category: 'professional',
  preview: {
    primary: '#6B4C8A',
    secondary: '#8B6B4A',
    accent: '#4A6B5A',
  },
  light: {
    '--surface-light': '#FAF8FC',
    '--surface-light-elevated': '#F0ECF4',
    '--surface-dark': '#14101A',
    '--surface-dark-elevated': '#201A28',

    '--text-light-primary': '#14101A',
    '--text-light-secondary': '#4A3D5A',
    '--text-light-tertiary': '#6B5E7A',
    '--text-dark-primary': '#F5F0FA',
    '--text-dark-secondary': '#C8B8D8',
    '--text-dark-tertiary': '#9A8AAC',

    '--border-light': '#DDD0E8',
    '--border-dark': 'rgba(107, 76, 138, 0.20)',

    '--accent-blue': '#4A85C8',
    '--accent-blue-hover': '#3A75B8',
    '--accent-magenta': '#C4608A',
    '--accent-magenta-hover': '#B0507A',
    '--accent-cyan': '#3AAFB8',
    '--accent-cyan-hover': '#2A9FA8',
    '--accent-green': '#3A8B5A',
    '--accent-green-hover': '#2D7A4C',
    '--accent-neon-green': '#5AAF6B',
    '--accent-purple': '#7B4CA0',
    '--accent-purple-hover': '#6B3C90',
    '--accent-red': '#C04848',
    '--accent-red-hover': '#A83E3E',
    '--accent-yellow': '#C89830',
    '--accent-yellow-hover': '#B08828',
    '--accent-orange': '#B87830',
    '--accent-orange-hover': '#A06828',

    '--accent-primary': '#7B4CA0',
    '--accent-primary-hover': '#6D3E90',
    '--accent-secondary': '#3A8B5A',
    '--accent-secondary-hover': '#2E7548',

    '--status-success': '#3A8B5A',
    '--status-warning': '#C89830',
    '--status-error': '#C04848',
    '--status-info': '#4A85C8',
  },
  dark: {
    '--surface-light': '#FAF8FC',
    '--surface-light-elevated': '#F0ECF4',
    '--surface-dark': '#0E0A14',
    '--surface-dark-elevated': '#18121E',

    '--text-light-primary': '#14101A',
    '--text-light-secondary': '#4A3D5A',
    '--text-light-tertiary': '#6B5E7A',
    '--text-dark-primary': '#F5F0FA',
    '--text-dark-secondary': '#C8B8D8',
    '--text-dark-tertiary': '#B0A0C0',

    '--border-light': '#DDD0E8',
    '--border-dark': 'rgba(107, 76, 138, 0.20)',

    '--accent-blue': '#6AA5E8',
    '--accent-blue-hover': '#7AB5F0',
    '--accent-magenta': '#D87AA5',
    '--accent-magenta-hover': '#E88AB5',
    '--accent-cyan': '#50C9D0',
    '--accent-cyan-hover': '#60D9E0',
    '--accent-green': '#50AB70',
    '--accent-green-hover': '#60BB80',
    '--accent-neon-green': '#7ACF8B',
    '--accent-purple': '#9B6CC0',
    '--accent-purple-hover': '#AB7CD0',
    '--accent-red': '#D86868',
    '--accent-red-hover': '#E87878',
    '--accent-yellow': '#E0B840',
    '--accent-yellow-hover': '#F0C850',
    '--accent-orange': '#D09850',
    '--accent-orange-hover': '#E0A860',

    '--accent-primary': '#9B6CC0',
    '--accent-primary-hover': '#AB7CD0',
    '--accent-secondary': '#50AB70',
    '--accent-secondary-hover': '#60BB80',

    '--status-success': '#50AB70',
    '--status-warning': '#E0B840',
    '--status-error': '#D86868',
    '--status-info': '#6AA5E8',
  },
};
