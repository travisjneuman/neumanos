import type { TimeOfDay } from '../stores/useRoutineStore';
import type { HabitCategory, HabitFrequency } from '../types';

export interface RoutineTemplateHabit {
  title: string;
  description: string;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
}

export interface RoutineTemplate {
  name: string;
  description: string;
  icon: string;
  timeOfDay: TimeOfDay;
  estimatedMinutes: number;
  habits: RoutineTemplateHabit[];
}

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    name: 'Morning Routine',
    description: 'Start your day with intention and energy',
    icon: '🌅',
    timeOfDay: 'morning',
    estimatedMinutes: 25,
    habits: [
      {
        title: 'Wake Up Early',
        description: 'Get out of bed at your target time',
        icon: '⏰',
        color: '#f97316',
        category: 'health',
        frequency: 'daily',
      },
      {
        title: 'Hydrate',
        description: 'Drink a full glass of water',
        icon: '💧',
        color: '#06b6d4',
        category: 'health',
        frequency: 'daily',
      },
      {
        title: 'Meditate',
        description: '5-10 minutes of mindful breathing',
        icon: '🧘',
        color: '#8b5cf6',
        category: 'mindfulness',
        frequency: 'daily',
      },
      {
        title: 'Exercise',
        description: '15 minutes of movement to energize your body',
        icon: '🏃',
        color: '#22c55e',
        category: 'fitness',
        frequency: 'daily',
      },
      {
        title: 'Journal',
        description: 'Write down intentions and gratitude',
        icon: '✍️',
        color: '#ec4899',
        category: 'mindfulness',
        frequency: 'daily',
      },
    ],
  },
  {
    name: 'Evening Routine',
    description: 'Wind down and prepare for restful sleep',
    icon: '🌙',
    timeOfDay: 'evening',
    estimatedMinutes: 20,
    habits: [
      {
        title: 'Plan Tomorrow',
        description: 'Review tasks and set priorities for the next day',
        icon: '📋',
        color: '#3b82f6',
        category: 'productivity',
        frequency: 'daily',
      },
      {
        title: 'Read',
        description: 'Read for at least 15 minutes',
        icon: '📖',
        color: '#8b5cf6',
        category: 'learning',
        frequency: 'daily',
      },
      {
        title: 'Gratitude',
        description: 'Write 3 things you are grateful for today',
        icon: '🙏',
        color: '#eab308',
        category: 'mindfulness',
        frequency: 'daily',
      },
      {
        title: 'Sleep Prep',
        description: 'Screens off, prepare for bed',
        icon: '😴',
        color: '#6366f1',
        category: 'health',
        frequency: 'daily',
      },
    ],
  },
  {
    name: 'Work Focus',
    description: 'Deep work session for maximum productivity',
    icon: '💼',
    timeOfDay: 'morning',
    estimatedMinutes: 90,
    habits: [
      {
        title: 'Clear Inbox',
        description: 'Process and triage messages to inbox zero',
        icon: '📧',
        color: '#06b6d4',
        category: 'productivity',
        frequency: 'weekdays',
      },
      {
        title: 'Top 3 Tasks',
        description: 'Identify and commit to 3 most important tasks',
        icon: '🎯',
        color: '#ef4444',
        category: 'productivity',
        frequency: 'weekdays',
      },
      {
        title: 'Deep Work',
        description: '60 minutes of focused, uninterrupted work',
        icon: '🔥',
        color: '#f97316',
        category: 'productivity',
        frequency: 'weekdays',
      },
      {
        title: 'Break',
        description: 'Take a proper 10-minute break away from desk',
        icon: '☕',
        color: '#22c55e',
        category: 'health',
        frequency: 'weekdays',
      },
    ],
  },
  {
    name: 'Fitness',
    description: 'Complete workout with proper warm-up and recovery',
    icon: '🏋️',
    timeOfDay: 'anytime',
    estimatedMinutes: 45,
    habits: [
      {
        title: 'Warm Up',
        description: '5-10 minutes of dynamic stretching',
        icon: '🔥',
        color: '#f97316',
        category: 'fitness',
        frequency: 'daily',
      },
      {
        title: 'Main Workout',
        description: '25-30 minutes of your planned exercise',
        icon: '💪',
        color: '#ef4444',
        category: 'fitness',
        frequency: 'daily',
      },
      {
        title: 'Cool Down',
        description: '5 minutes of light movement to lower heart rate',
        icon: '🧊',
        color: '#06b6d4',
        category: 'fitness',
        frequency: 'daily',
      },
      {
        title: 'Stretch',
        description: '5-10 minutes of static stretching for recovery',
        icon: '🤸',
        color: '#22c55e',
        category: 'fitness',
        frequency: 'daily',
      },
    ],
  },
];
