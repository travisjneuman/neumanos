/**
 * Presentation Templates
 *
 * Slide layout templates and theme presets for presentations.
 */

import type { Slide, SlideElement, SlideTheme } from '../../types';

// Slide layout types (matches Slide.layout type in types/index.ts)
export type SlideLayout = 'blank' | 'title' | 'content' | 'two-column' | 'section';

// Theme preset definitions
export interface ThemePreset {
  id: string;
  name: string;
  theme: SlideTheme;
  previewColors: string[]; // For theme picker preview
}

// Default slide dimensions
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

/**
 * Create a slide from a layout template
 */
export function createSlideFromLayout(
  layout: SlideLayout,
  order: number,
  theme: SlideTheme
): Slide {
  const id = crypto.randomUUID();
  const baseSlide: Slide = {
    id,
    order,
    background: { type: 'color', color: theme.colors.background },
    elements: [],
    layout,
  };

  switch (layout) {
    case 'title':
      return {
        ...baseSlide,
        elements: [
          createTextElement({
            x: SLIDE_WIDTH / 2 - 600,
            y: SLIDE_HEIGHT / 2 - 100,
            width: 1200,
            height: 120,
            content: 'Presentation Title',
            fontSize: 72,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
          }),
          createTextElement({
            x: SLIDE_WIDTH / 2 - 400,
            y: SLIDE_HEIGHT / 2 + 60,
            width: 800,
            height: 60,
            content: 'Subtitle or author name',
            fontSize: 32,
            fontWeight: 'normal',
            textAlign: 'center',
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
          }),
        ],
      };

    case 'content':
      return {
        ...baseSlide,
        elements: [
          createTextElement({
            x: 100,
            y: 80,
            width: SLIDE_WIDTH - 200,
            height: 80,
            content: 'Slide Title',
            fontSize: 48,
            fontWeight: 'bold',
            textAlign: 'left',
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
          }),
          createTextElement({
            x: 100,
            y: 200,
            width: SLIDE_WIDTH - 200,
            height: SLIDE_HEIGHT - 280,
            content: '• First point\n• Second point\n• Third point',
            fontSize: 28,
            fontWeight: 'normal',
            textAlign: 'left',
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
          }),
        ],
      };

    case 'two-column':
      return {
        ...baseSlide,
        elements: [
          createTextElement({
            x: 100,
            y: 80,
            width: SLIDE_WIDTH - 200,
            height: 80,
            content: 'Slide Title',
            fontSize: 48,
            fontWeight: 'bold',
            textAlign: 'left',
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
          }),
          createTextElement({
            x: 100,
            y: 200,
            width: (SLIDE_WIDTH - 250) / 2,
            height: SLIDE_HEIGHT - 280,
            content: '• Left column point 1\n• Left column point 2',
            fontSize: 24,
            fontWeight: 'normal',
            textAlign: 'left',
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
          }),
          createTextElement({
            x: SLIDE_WIDTH / 2 + 25,
            y: 200,
            width: (SLIDE_WIDTH - 250) / 2,
            height: SLIDE_HEIGHT - 280,
            content: '• Right column point 1\n• Right column point 2',
            fontSize: 24,
            fontWeight: 'normal',
            textAlign: 'left',
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
          }),
        ],
      };

    case 'section':
      return {
        ...baseSlide,
        elements: [
          createTextElement({
            x: SLIDE_WIDTH / 2 - 500,
            y: SLIDE_HEIGHT / 2 - 60,
            width: 1000,
            height: 120,
            content: 'Section Title',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
          }),
        ],
      };

    case 'blank':
    default:
      return baseSlide;
  }
}

/**
 * Helper to create text element
 */
function createTextElement(config: {
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  fontFamily: string;
}): SlideElement {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    x: config.x,
    y: config.y,
    width: config.width,
    height: config.height,
    text: {
      content: config.content,
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      fontStyle: 'normal',
      textAlign: config.textAlign,
      color: config.color,
    },
  };
}

/**
 * Theme presets
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    theme: {
      id: 'default',
      name: 'Default',
      colors: {
        primary: '#1F2937',
        secondary: '#4B5563',
        accent: '#3B82F6',
        background: '#FFFFFF',
        text: '#374151',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
    },
    previewColors: ['#1F2937', '#3B82F6', '#FFFFFF'],
  },
  {
    id: 'dark',
    name: 'Dark',
    theme: {
      id: 'dark',
      name: 'Dark',
      colors: {
        primary: '#F9FAFB',
        secondary: '#D1D5DB',
        accent: '#60A5FA',
        background: '#111827',
        text: '#E5E7EB',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
    },
    previewColors: ['#111827', '#60A5FA', '#F9FAFB'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    theme: {
      id: 'ocean',
      name: 'Ocean',
      colors: {
        primary: '#0369A1',
        secondary: '#0284C7',
        accent: '#06B6D4',
        background: '#F0F9FF',
        text: '#0C4A6E',
      },
      fonts: {
        heading: 'Georgia',
        body: 'Arial',
      },
    },
    previewColors: ['#0369A1', '#06B6D4', '#F0F9FF'],
  },
  {
    id: 'forest',
    name: 'Forest',
    theme: {
      id: 'forest',
      name: 'Forest',
      colors: {
        primary: '#166534',
        secondary: '#15803D',
        accent: '#22C55E',
        background: '#F0FDF4',
        text: '#14532D',
      },
      fonts: {
        heading: 'Georgia',
        body: 'Arial',
      },
    },
    previewColors: ['#166534', '#22C55E', '#F0FDF4'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    theme: {
      id: 'sunset',
      name: 'Sunset',
      colors: {
        primary: '#C2410C',
        secondary: '#EA580C',
        accent: '#F97316',
        background: '#FFF7ED',
        text: '#7C2D12',
      },
      fonts: {
        heading: 'Arial',
        body: 'Arial',
      },
    },
    previewColors: ['#C2410C', '#F97316', '#FFF7ED'],
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    theme: {
      id: 'purple',
      name: 'Purple Haze',
      colors: {
        primary: '#6D28D9',
        secondary: '#7C3AED',
        accent: '#A78BFA',
        background: '#FAF5FF',
        text: '#4C1D95',
      },
      fonts: {
        heading: 'Helvetica',
        body: 'Helvetica',
      },
    },
    previewColors: ['#6D28D9', '#A78BFA', '#FAF5FF'],
  },
  {
    id: 'rose',
    name: 'Rose',
    theme: {
      id: 'rose',
      name: 'Rose',
      colors: {
        primary: '#BE185D',
        secondary: '#DB2777',
        accent: '#EC4899',
        background: '#FDF2F8',
        text: '#831843',
      },
      fonts: {
        heading: 'Georgia',
        body: 'Arial',
      },
    },
    previewColors: ['#BE185D', '#EC4899', '#FDF2F8'],
  },
  {
    id: 'corporate',
    name: 'Corporate',
    theme: {
      id: 'corporate',
      name: 'Corporate',
      colors: {
        primary: '#1E3A5F',
        secondary: '#2563EB',
        accent: '#3B82F6',
        background: '#FFFFFF',
        text: '#1E3A5F',
      },
      fonts: {
        heading: 'Arial',
        body: 'Arial',
      },
    },
    previewColors: ['#1E3A5F', '#3B82F6', '#FFFFFF'],
  },
];

/**
 * Get layout display name
 */
export function getLayoutDisplayName(layout: SlideLayout): string {
  switch (layout) {
    case 'title':
      return 'Title Slide';
    case 'content':
      return 'Content';
    case 'two-column':
      return 'Two Columns';
    case 'section':
      return 'Section Header';
    case 'blank':
    default:
      return 'Blank';
  }
}

/**
 * Get all available layouts
 */
export const SLIDE_LAYOUTS: SlideLayout[] = [
  'blank',
  'title',
  'content',
  'two-column',
  'section',
];
