/**
 * TemplatePicker Component
 * Dropdown for selecting task templates in recurring tasks
 *
 * Features:
 * - Shows all available templates
 * - "None" option to clear selection
 * - Preview template content on hover (optional)
 */

import type { TaskTemplate } from '../types';

interface TemplatePickerProps {
  value?: string; // Selected template ID
  onChange: (templateId?: string) => void;
  templates: TaskTemplate[];
}

export function TemplatePicker({ value, onChange, templates }: TemplatePickerProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
        Template
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
      >
        <option value="">None</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
      {value && (
        <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Template will be applied to each new task instance
        </p>
      )}
    </div>
  );
}
