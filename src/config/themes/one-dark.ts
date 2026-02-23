/**
 * One Dark Theme
 * Atom's iconic dark theme with balanced syntax colors
 */

import type { ThemeDefinition } from './types';

export const oneDarkTheme: ThemeDefinition = {
  id: 'one-dark',
  name: 'One Dark',
  description: 'Balanced syntax colors on a clean dark base',
  category: 'tech',
  preview: {
    primary: '#61AFEF',
    secondary: '#C678DD',
    accent: '#98C379',
  },
  light: {
    '--surface-light': '#FAFAFA',
    '--surface-light-elevated': '#F0F0F0',
    '--surface-dark': '#282C34',
    '--surface-dark-elevated': '#2C313A',

    '--text-light-primary': '#282C34',
    '--text-light-secondary': '#4B5263',
    '--text-light-tertiary': '#636D83',
    '--text-dark-primary': '#ABB2BF',
    '--text-dark-secondary': '#9DA5B4',
    '--text-dark-tertiary': '#7F848E',

    '--border-light': '#E0E0E0',
    '--border-dark': 'rgba(97, 175, 239, 0.20)',

    '--accent-blue': '#4078F2',
    '--accent-blue-hover': '#3068E0',
    '--accent-magenta': '#A626A4',
    '--accent-magenta-hover': '#901A90',
    '--accent-cyan': '#0184BC',
    '--accent-cyan-hover': '#0172A5',
    '--accent-green': '#50A14F',
    '--accent-green-hover': '#408D3F',
    '--accent-neon-green': '#98C379',
    '--accent-purple': '#A626A4',
    '--accent-purple-hover': '#901A90',
    '--accent-red': '#E45649',
    '--accent-red-hover': '#D0433A',
    '--accent-yellow': '#C18401',
    '--accent-yellow-hover': '#AD7501',
    '--accent-orange': '#986801',
    '--accent-orange-hover': '#845A01',

    '--accent-primary': '#4078F2',
    '--accent-primary-hover': '#3068E0',
    '--accent-secondary': '#A626A4',
    '--accent-secondary-hover': '#901A90',

    '--status-success': '#50A14F',
    '--status-warning': '#C18401',
    '--status-error': '#E45649',
    '--status-info': '#4078F2',
  },
  dark: {
    '--surface-light': '#FAFAFA',
    '--surface-light-elevated': '#F0F0F0',
    '--surface-dark': '#282C34',
    '--surface-dark-elevated': '#2C313A',

    '--text-light-primary': '#282C34',
    '--text-light-secondary': '#4B5263',
    '--text-light-tertiary': '#636D83',
    '--text-dark-primary': '#ABB2BF',
    '--text-dark-secondary': '#9DA5B4',
    '--text-dark-tertiary': '#7F848E',

    '--border-light': '#E0E0E0',
    '--border-dark': 'rgba(97, 175, 239, 0.15)',

    '--accent-blue': '#61AFEF',
    '--accent-blue-hover': '#79BDF2',
    '--accent-magenta': '#C678DD',
    '--accent-magenta-hover': '#D08FE5',
    '--accent-cyan': '#56B6C2',
    '--accent-cyan-hover': '#6CC4CE',
    '--accent-green': '#98C379',
    '--accent-green-hover': '#A8CF8D',
    '--accent-neon-green': '#98C379',
    '--accent-purple': '#C678DD',
    '--accent-purple-hover': '#D08FE5',
    '--accent-red': '#E06C75',
    '--accent-red-hover': '#E6828A',
    '--accent-yellow': '#E5C07B',
    '--accent-yellow-hover': '#EACC90',
    '--accent-orange': '#D19A66',
    '--accent-orange-hover': '#DAAB7C',

    '--accent-primary': '#61AFEF',
    '--accent-primary-hover': '#79BDF2',
    '--accent-secondary': '#C678DD',
    '--accent-secondary-hover': '#D08FE5',

    '--status-success': '#98C379',
    '--status-warning': '#E5C07B',
    '--status-error': '#E06C75',
    '--status-info': '#61AFEF',
  },
};
