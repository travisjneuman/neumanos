/**
 * Smart Template Picker
 *
 * Modal for browsing and executing smart templates.
 * Triggered by Ctrl+Shift+T globally.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Play, Plus, Zap, ChevronRight } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useSmartTemplateStore } from '../stores/useSmartTemplateStore';
import type { SmartTemplate, TemplateVariable } from '../stores/useSmartTemplateStore';
import { executeTemplate } from '../services/templateExecutor';

interface SmartTemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBuilder?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  workflow: 'Workflows',
  meeting: 'Meetings',
  planning: 'Planning',
  custom: 'Custom',
};

const CATEGORY_ICONS: Record<string, string> = {
  workflow: '⚡',
  meeting: '👥',
  planning: '📊',
  custom: '🛠️',
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  'create-note': 'Note',
  'create-task': 'Task',
  'create-event': 'Event',
  'create-doc': 'Document',
  'start-timer': 'Timer',
};

export const SmartTemplatePicker: React.FC<SmartTemplatePickerProps> = ({
  isOpen,
  onClose,
  onOpenBuilder,
}) => {
  const templates = useSmartTemplateStore((s) => s.templates);
  const [query, setQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    created: string[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEscapeKey({
    enabled: isOpen,
    onEscape: () => {
      if (executionResult) {
        setExecutionResult(null);
        setSelectedTemplate(null);
      } else if (selectedTemplate) {
        setSelectedTemplate(null);
      } else {
        onClose();
      }
    },
    priority: 60,
  });

  // Focus search input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedTemplate(null);
      setVariableValues({});
      setExecutionResult(null);
    }
  }, [isOpen]);

  // Initialize variable defaults when a template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const defaults: Record<string, string> = {};
      selectedTemplate.variables.forEach((v) => {
        if (v.key === 'date' || v.type === 'date') {
          defaults[v.key] = new Date().toISOString().split('T')[0];
        } else {
          defaults[v.key] = v.defaultValue || '';
        }
      });
      setVariableValues(defaults);
    }
  }, [selectedTemplate]);

  const filteredTemplates = useMemo(() => {
    if (!query.trim()) return templates;
    const lower = query.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower)
    );
  }, [templates, query]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, SmartTemplate[]> = {};
    for (const t of filteredTemplates) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    return groups;
  }, [filteredTemplates]);

  const handleExecute = useCallback(() => {
    if (!selectedTemplate) return;
    const result = executeTemplate(selectedTemplate, variableValues);
    setExecutionResult(result);
  }, [selectedTemplate, variableValues]);

  const handleVariableChange = useCallback(
    (key: string, value: string) => {
      setVariableValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-surface-dark-elevated border border-border-dark rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-dark">
          <Zap className="w-5 h-5 text-accent-yellow" />
          <h2 className="text-sm font-semibold text-text-dark-primary flex-1">
            Smart Templates
          </h2>
          <span className="text-xs text-text-dark-secondary px-2 py-0.5 rounded bg-surface-dark border border-border-dark">
            Ctrl+Shift+T
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-dark transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {executionResult ? (
          // Execution result view
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">
              {executionResult.success ? '✅' : '❌'}
            </div>
            <h3 className="text-lg font-semibold text-text-dark-primary mb-2">
              {executionResult.success
                ? 'Template Executed'
                : 'Execution Failed'}
            </h3>
            {executionResult.created.length > 0 && (
              <div className="mt-3 text-left">
                <p className="text-xs text-text-dark-secondary mb-2">
                  Created {executionResult.created.length} items:
                </p>
                <ul className="space-y-1">
                  {executionResult.created.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-text-dark-primary flex items-center gap-2 px-3 py-1.5 rounded bg-surface-dark"
                    >
                      <ChevronRight className="w-3 h-3 text-accent-green" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : selectedTemplate ? (
          // Variable fill-in form
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{selectedTemplate.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-text-dark-primary">
                  {selectedTemplate.name}
                </h3>
                <p className="text-xs text-text-dark-secondary">
                  {selectedTemplate.description}
                </p>
              </div>
            </div>

            {/* Variables form */}
            {selectedTemplate.variables.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-xs font-medium text-text-dark-secondary uppercase tracking-wider">
                  Fill in variables
                </p>
                {selectedTemplate.variables.map((v) => (
                  <VariableInput
                    key={v.key}
                    variable={v}
                    value={variableValues[v.key] || ''}
                    onChange={(val) => handleVariableChange(v.key, val)}
                  />
                ))}
              </div>
            )}

            {/* Actions preview */}
            <div className="mb-4">
              <p className="text-xs font-medium text-text-dark-secondary uppercase tracking-wider mb-2">
                Will create ({selectedTemplate.actions.length} items)
              </p>
              <div className="space-y-1">
                {selectedTemplate.actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-dark text-sm text-text-dark-primary"
                  >
                    <span className="text-xs px-1.5 py-0.5 rounded bg-surface-dark-elevated text-text-dark-secondary font-mono">
                      {ACTION_TYPE_LABELS[action.type] || action.type}
                    </span>
                    <span className="truncate">
                      {(action.data.title as string) ||
                        (action.data.description as string) ||
                        'Item'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Execute / Back buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-border-dark text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-dark transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleExecute}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Execute
              </button>
            </div>
          </div>
        ) : (
          // Template list
          <>
            {/* Search */}
            <div className="px-4 py-2 border-b border-border-dark">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dark-secondary" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-dark border border-border-dark rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary/50 focus:outline-none focus:border-accent-blue/50"
                />
              </div>
            </div>

            {/* Template list */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category} className="mb-3">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <span className="text-sm">
                      {CATEGORY_ICONS[category] || '📁'}
                    </span>
                    <span className="text-xs font-semibold text-text-dark-secondary uppercase tracking-wider">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                  </div>
                  {categoryTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-dark transition-colors text-left group"
                    >
                      <span className="text-xl flex-shrink-0">
                        {template.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-dark-primary">
                          {template.name}
                        </div>
                        <div className="text-xs text-text-dark-secondary truncate">
                          {template.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-text-dark-secondary">
                          {template.actions.length} actions
                        </span>
                        {template.usageCount > 0 && (
                          <span className="text-xs text-text-dark-secondary/60">
                            {template.usageCount}x
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-text-dark-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-sm text-text-dark-secondary">
                  No templates found
                </div>
              )}
            </div>

            {/* Footer */}
            {onOpenBuilder && (
              <div className="px-4 py-3 border-t border-border-dark">
                <button
                  onClick={onOpenBuilder}
                  className="flex items-center gap-2 text-xs text-text-dark-secondary hover:text-accent-blue transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create custom template
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

// ==================== Variable Input Component ====================

interface VariableInputProps {
  variable: TemplateVariable;
  value: string;
  onChange: (value: string) => void;
}

const VariableInput: React.FC<VariableInputProps> = ({
  variable,
  value,
  onChange,
}) => {
  return (
    <div>
      <label className="block text-xs font-medium text-text-dark-secondary mb-1">
        {variable.label}
      </label>
      {variable.type === 'select' && variable.options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-surface-dark border border-border-dark rounded-lg text-text-dark-primary focus:outline-none focus:border-accent-blue/50"
        >
          {variable.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : variable.type === 'date' ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-surface-dark border border-border-dark rounded-lg text-text-dark-primary focus:outline-none focus:border-accent-blue/50"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={variable.defaultValue || ''}
          className="w-full px-3 py-2 text-sm bg-surface-dark border border-border-dark rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary/50 focus:outline-none focus:border-accent-blue/50"
        />
      )}
    </div>
  );
};
