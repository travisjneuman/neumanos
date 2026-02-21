/**
 * Event Color Categories
 * Predefined color categories for calendar events (Google Calendar parity)
 */

import type { EventColorCategory, EventColorCategoryConfig } from '../types';

export const EVENT_COLOR_CATEGORIES: EventColorCategoryConfig[] = [
  {
    id: 'default',
    label: 'Default',
    bgClass: 'bg-accent-primary',
    textClass: 'text-white',
    borderClass: 'border-accent-primary',
    hex: '#8b5cf6',
  },
  {
    id: 'work',
    label: 'Work',
    bgClass: 'bg-blue-600',
    textClass: 'text-white',
    borderClass: 'border-blue-600',
    hex: '#2563eb',
  },
  {
    id: 'personal',
    label: 'Personal',
    bgClass: 'bg-emerald-600',
    textClass: 'text-white',
    borderClass: 'border-emerald-600',
    hex: '#059669',
  },
  {
    id: 'health',
    label: 'Health',
    bgClass: 'bg-rose-600',
    textClass: 'text-white',
    borderClass: 'border-rose-600',
    hex: '#e11d48',
  },
  {
    id: 'social',
    label: 'Social',
    bgClass: 'bg-purple-600',
    textClass: 'text-white',
    borderClass: 'border-purple-600',
    hex: '#9333ea',
  },
  {
    id: 'travel',
    label: 'Travel',
    bgClass: 'bg-amber-600',
    textClass: 'text-white',
    borderClass: 'border-amber-600',
    hex: '#d97706',
  },
  {
    id: 'finance',
    label: 'Finance',
    bgClass: 'bg-teal-600',
    textClass: 'text-white',
    borderClass: 'border-teal-600',
    hex: '#0d9488',
  },
  {
    id: 'education',
    label: 'Education',
    bgClass: 'bg-indigo-600',
    textClass: 'text-white',
    borderClass: 'border-indigo-600',
    hex: '#4f46e5',
  },
];

/** Look up a color category config by ID */
export function getColorCategory(id?: EventColorCategory): EventColorCategoryConfig {
  if (!id || id === 'default') return EVENT_COLOR_CATEGORIES[0];
  return EVENT_COLOR_CATEGORIES.find((c) => c.id === id) ?? EVENT_COLOR_CATEGORIES[0];
}

/** Get the inline background color style for an event */
export function getEventColorStyle(category?: EventColorCategory): React.CSSProperties {
  const config = getColorCategory(category);
  return { backgroundColor: config.hex };
}
