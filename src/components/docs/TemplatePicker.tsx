/**
 * TemplatePicker Component
 *
 * Modal for selecting document templates when creating new documents.
 * Shows template categories and previews.
 */

import { useState } from 'react';
import {
  FileText,
  BarChart2,
  Users,
  Target,
  Code,
  Lightbulb,
  Mail,
  Calendar,
  Search,
  X,
} from 'lucide-react';
import {
  DOCUMENT_TEMPLATES,
  getTemplateCategories,
  type DocumentTemplate,
} from './documentTemplates';

interface TemplatePickerProps {
  /** Called when a template is selected */
  onSelect: (template: DocumentTemplate) => void;
  /** Called when the picker is closed */
  onClose: () => void;
}

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  BarChart2,
  Users,
  Target,
  Code,
  Lightbulb,
  Mail,
  Calendar,
  Search,
};

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentTemplate['category'] | 'all'>('all');
  const categories = getTemplateCategories();

  const filteredTemplates =
    selectedCategory === 'all'
      ? DOCUMENT_TEMPLATES
      : DOCUMENT_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-surface-light dark:bg-surface-dark-elevated rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Choose a Template
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-light-tertiary dark:text-text-dark-tertiary hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors"
            aria-label="Close template picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-border-light dark:border-border-dark overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-accent-primary text-white'
                : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark-elevated'
            }`}
          >
            All ({DOCUMENT_TEMPLATES.length})
          </button>
          {categories.map(({ category, label, count }) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark-elevated'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const IconComponent = ICON_MAP[template.icon] || FileText;

              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  className="flex flex-col items-start p-4 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent-primary dark:hover:border-accent-primary hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {template.name}
                    </h3>
                  </div>
                  <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary line-clamp-2">
                    {template.description}
                  </p>
                  <span className="mt-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary capitalize bg-surface-light-alt dark:bg-surface-dark-elevated px-2 py-0.5 rounded">
                    {template.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark">
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary text-center">
            Select a template to get started, or choose "Blank Document" for an empty page
          </p>
        </div>
      </div>
    </div>
  );
}

export default TemplatePicker;
