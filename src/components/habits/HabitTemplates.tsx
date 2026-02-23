import { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { HABIT_TEMPLATE_PACKS } from '../../data/habitTemplates';
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

// Flatten packs into a single list for backward compatibility
export const HABIT_TEMPLATES: HabitTemplate[] = HABIT_TEMPLATE_PACKS.flatMap((p) => p.templates);

interface HabitTemplatePickerProps {
  onSelect: (template: HabitTemplate) => void;
  onSelectPack?: (templates: HabitTemplate[]) => void;
  onClose: () => void;
}

export function HabitTemplatePicker({ onSelect, onSelectPack, onClose }: HabitTemplatePickerProps) {
  const [expandedPack, setExpandedPack] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
            Habit Templates
          </h2>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary mb-4">
            Pick a single habit or use a full pack to create multiple habits at once.
          </p>

          <div className="space-y-3">
            {HABIT_TEMPLATE_PACKS.map((pack) => {
              const isExpanded = expandedPack === pack.name;
              return (
                <div
                  key={pack.name}
                  className="rounded-lg border border-border-light dark:border-border-dark overflow-hidden"
                >
                  {/* Pack header */}
                  <button
                    onClick={() => setExpandedPack(isExpanded ? null : pack.name)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent-primary/5 transition-colors text-left"
                  >
                    <span className="text-xl">{pack.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {pack.name}
                      </div>
                      <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                        {pack.description} ({pack.templates.length} habits)
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border-light dark:border-border-dark">
                      {/* Use entire pack button */}
                      {onSelectPack && (
                        <button
                          onClick={() => onSelectPack(pack.templates)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-primary hover:bg-accent-primary/5 transition-colors border-b border-border-light dark:border-border-dark"
                        >
                          <Layers className="w-4 h-4" />
                          Use All {pack.templates.length} Habits
                        </button>
                      )}

                      {/* Individual templates */}
                      {pack.templates.map((template) => (
                        <button
                          key={template.title}
                          onClick={() => onSelect(template)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-accent-primary/5 transition-all text-left border-b last:border-b-0 border-border-light dark:border-border-dark"
                        >
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                            style={{ backgroundColor: `${template.color}20` }}
                          >
                            {template.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
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
                  )}
                </div>
              );
            })}
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
