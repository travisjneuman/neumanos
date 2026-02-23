import type { HabitFrequency, HabitCategory } from '../types';

export interface HabitTemplatePack {
  name: string;
  description: string;
  icon: string;
  templates: Array<{
    title: string;
    description: string;
    icon: string;
    color: string;
    frequency: HabitFrequency;
    category: HabitCategory;
    timesPerWeek?: number;
  }>;
}

export const HABIT_TEMPLATE_PACKS: HabitTemplatePack[] = [
  {
    name: 'Morning Routine',
    description: 'Start your day with intention and energy',
    icon: '🌅',
    templates: [
      { title: 'Wake Early', description: 'Wake up before 7 AM', icon: '⏰', color: '#f97316', frequency: 'weekdays', category: 'productivity' },
      { title: 'Exercise', description: '30 minutes of physical activity', icon: '💪', color: '#22c55e', frequency: 'daily', category: 'fitness' },
      { title: 'Meditate', description: '10 minutes of mindfulness', icon: '🧘', color: '#06b6d4', frequency: 'daily', category: 'mindfulness' },
      { title: 'Journal', description: 'Write morning reflections', icon: '✍️', color: '#ec4899', frequency: 'daily', category: 'mindfulness' },
    ],
  },
  {
    name: 'Health & Fitness',
    description: 'Build a healthier lifestyle',
    icon: '🏋️',
    templates: [
      { title: 'Drink 8 Glasses Water', description: 'Stay hydrated throughout the day', icon: '💧', color: '#3b82f6', frequency: 'daily', category: 'health' },
      { title: '10K Steps', description: 'Walk at least 10,000 steps', icon: '🚶', color: '#22c55e', frequency: 'daily', category: 'fitness' },
      { title: 'Healthy Meal', description: 'Eat a balanced, nutritious meal', icon: '🥗', color: '#84cc16', frequency: 'daily', category: 'nutrition' },
      { title: 'Stretch', description: '15 minutes of stretching or yoga', icon: '🤸', color: '#8b5cf6', frequency: 'daily', category: 'fitness' },
    ],
  },
  {
    name: 'Learning',
    description: 'Continuous growth and skill development',
    icon: '📚',
    templates: [
      { title: 'Read 30 Minutes', description: 'Read a book or long-form article', icon: '📖', color: '#8b5cf6', frequency: 'daily', category: 'learning' },
      { title: 'Practice Skill', description: 'Deliberate practice on a skill', icon: '🎯', color: '#f97316', frequency: 'times-per-week', category: 'learning', timesPerWeek: 5 },
      { title: 'Review Notes', description: 'Review and organize your notes', icon: '📝', color: '#06b6d4', frequency: 'times-per-week', category: 'learning', timesPerWeek: 3 },
    ],
  },
  {
    name: 'Productivity',
    description: 'Maximize your effectiveness',
    icon: '⚡',
    templates: [
      { title: 'Plan Tomorrow', description: 'Review today and plan tomorrow evening', icon: '📋', color: '#3b82f6', frequency: 'weekdays', category: 'productivity' },
      { title: 'Deep Work 2h', description: '2 hours of focused, uninterrupted work', icon: '🧠', color: '#ef4444', frequency: 'weekdays', category: 'productivity' },
      { title: 'Weekly Review', description: 'Review progress and adjust goals', icon: '📊', color: '#8b5cf6', frequency: 'times-per-week', category: 'productivity', timesPerWeek: 1 },
      { title: 'Inbox Zero', description: 'Process all emails to zero', icon: '📧', color: '#22c55e', frequency: 'weekdays', category: 'productivity' },
    ],
  },
  {
    name: 'Mindfulness',
    description: 'Cultivate presence and well-being',
    icon: '🧘',
    templates: [
      { title: 'Meditate', description: 'Seated meditation practice', icon: '🧘', color: '#06b6d4', frequency: 'daily', category: 'mindfulness' },
      { title: 'Gratitude Journal', description: 'Write 3 things you are grateful for', icon: '🙏', color: '#eab308', frequency: 'daily', category: 'mindfulness' },
      { title: 'Digital Detox 1h', description: 'One hour without screens', icon: '📵', color: '#ef4444', frequency: 'daily', category: 'mindfulness' },
      { title: 'Nature Walk', description: 'Spend time outdoors in nature', icon: '🌿', color: '#22c55e', frequency: 'times-per-week', category: 'mindfulness', timesPerWeek: 3 },
    ],
  },
];
