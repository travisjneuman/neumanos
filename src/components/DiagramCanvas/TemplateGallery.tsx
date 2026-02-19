/**
 * Template Gallery Component
 * Modal for selecting diagram templates
 */

import { useState } from 'react';
import { X, FileText, GitBranch, Network, Users, MapPin, Workflow } from 'lucide-react';
import type { DiagramTemplate } from '../../types/diagrams';
import { diagramTemplates } from '../../data/diagram-templates';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DiagramTemplate) => void;
}

const categoryIcons = {
  flowchart: Workflow,
  orgchart: Users,
  system: Network,
  'user-flow': MapPin,
  mindmap: GitBranch,
  other: FileText,
};

const categoryLabels = {
  flowchart: 'Flowcharts',
  orgchart: 'Org Charts',
  system: 'System Design',
  'user-flow': 'User Flows',
  mindmap: 'Mind Maps',
  other: 'Other',
};

export function TemplateGallery({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<DiagramTemplate['category'] | 'all'>('all');

  if (!isOpen) return null;

  const categories: Array<DiagramTemplate['category'] | 'all'> = [
    'all',
    'flowchart',
    'orgchart',
    'system',
    'user-flow',
    'mindmap',
  ];

  const filteredTemplates =
    selectedCategory === 'all'
      ? diagramTemplates
      : diagramTemplates.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: DiagramTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Choose a Template
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark rounded-lg transition-colors"
            aria-label="Close template gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-6 py-4 border-b border-border-light dark:border-border-dark overflow-x-auto">
          {categories.map((category) => {
            const Icon = category === 'all' ? FileText : categoryIcons[category as DiagramTemplate['category']];
            const label = category === 'all' ? 'All Templates' : categoryLabels[category as DiagramTemplate['category']];

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap
                  ${
                    selectedCategory === category
                      ? 'bg-primary-light dark:bg-primary-dark text-white'
                      : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-text-light-tertiary dark:text-text-dark-tertiary">
              <p>No templates available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const CategoryIcon = categoryIcons[template.category];

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="group relative bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-border-dark rounded-lg p-4 text-left hover:border-accent-primary hover:shadow-lg transition-all"
                  >
                    {/* Preview Area */}
                    <div className="aspect-video bg-surface-light dark:bg-surface-dark rounded-lg mb-3 flex items-center justify-center border border-border-light dark:border-border-dark">
                      {template.thumbnail ? (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-text-light-tertiary dark:text-text-dark-tertiary">
                          <CategoryIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className="flex items-start gap-2">
                      <CategoryIcon className="w-5 h-5 text-primary-light dark:text-primary-dark shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    {/* Element Count Badge */}
                    <div className="absolute top-2 right-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full px-2 py-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      {template.elements.length} element{template.elements.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Select a template to get started quickly
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-hover-light dark:bg-surface-hover-dark hover:bg-border-light dark:hover:bg-border-dark rounded-lg transition-colors text-text-light-primary dark:text-text-dark-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
