import type { HabitFrequency, HabitCategory } from '../../types';

export interface HabitTemplate {
  title: string;
  description: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  category: HabitCategory;
  timesPerWeek?: number;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    title: 'Morning Routine',
    description: 'Complete your morning routine (stretch, hydrate, plan)',
    icon: '☀️',
    color: '#f97316',
    frequency: 'daily',
    category: 'productivity',
  },
  {
    title: 'Exercise',
    description: 'Get at least 30 minutes of physical activity',
    icon: '💪',
    color: '#22c55e',
    frequency: 'times-per-week',
    category: 'fitness',
    timesPerWeek: 4,
  },
  {
    title: 'Read 30 Minutes',
    description: 'Read a book or article for 30 minutes',
    icon: '📚',
    color: '#8b5cf6',
    frequency: 'daily',
    category: 'learning',
  },
  {
    title: 'Meditate',
    description: 'Practice mindfulness or meditation',
    icon: '🧘',
    color: '#06b6d4',
    frequency: 'daily',
    category: 'mindfulness',
  },
  {
    title: 'Drink Water',
    description: 'Drink at least 8 glasses of water',
    icon: '💧',
    color: '#3b82f6',
    frequency: 'daily',
    category: 'health',
  },
  {
    title: 'Journal',
    description: 'Write in your journal — reflections, gratitude, or goals',
    icon: '✍️',
    color: '#ec4899',
    frequency: 'daily',
    category: 'mindfulness',
  },
  {
    title: 'No Social Media',
    description: 'Avoid social media for the entire day',
    icon: '📵',
    color: '#ef4444',
    frequency: 'weekdays',
    category: 'productivity',
  },
];

interface HabitTemplatePickerProps {
  onSelect: (template: HabitTemplate) => void;
  onClose: () => void;
}

export function HabitTemplatePicker({ onSelect, onClose }: HabitTemplatePickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
            Habit Templates
          </h2>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary mb-4">
            Start with a pre-built template or create from scratch.
          </p>

          <div className="space-y-2">
            {HABIT_TEMPLATES.map((template) => (
              <button
                key={template.title}
                onClick={() => onSelect(template)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border-light dark:border-border-dark hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all text-left"
              >
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${template.color}20` }}
                >
                  {template.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {template.title}
                  </div>
                  <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary truncate">
                    {template.description}
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light-alt dark:bg-surface-dark text-text-light-tertiary dark:text-text-dark-tertiary capitalize shrink-0">
                  {template.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
