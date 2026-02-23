/**
 * Smart Template Builder
 *
 * Modal for creating and editing custom smart templates.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  CheckSquare,
  Calendar,
  File,
  Timer,
  Save,
} from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useSmartTemplateStore } from '../stores/useSmartTemplateStore';
import type {
  SmartTemplate,
  TemplateAction,
  TemplateActionType,
  TemplateVariable,
} from '../stores/useSmartTemplateStore';
import { v4 as uuidv4 } from 'uuid';

interface SmartTemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate?: SmartTemplate | null;
}

const ICON_OPTIONS = [
  '⚡', '📋', '📅', '🏃', '📊', '🎯', '💡', '🔧',
  '📝', '🚀', '💻', '📈', '🎨', '🔬', '☀️', '🌙',
];

const ACTION_TYPES: { type: TemplateActionType; label: string; icon: React.ReactNode }[] = [
  { type: 'create-note', label: 'Create Note', icon: <FileText className="w-4 h-4" /> },
  { type: 'create-task', label: 'Create Task', icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'create-event', label: 'Create Event', icon: <Calendar className="w-4 h-4" /> },
  { type: 'create-doc', label: 'Create Document', icon: <File className="w-4 h-4" /> },
  { type: 'start-timer', label: 'Start Timer', icon: <Timer className="w-4 h-4" /> },
];

const CATEGORY_OPTIONS = [
  { value: 'workflow', label: 'Workflow' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'planning', label: 'Planning' },
  { value: 'custom', label: 'Custom' },
];

function createEmptyAction(type: TemplateActionType): TemplateAction {
  const id = uuidv4();
  switch (type) {
    case 'create-note':
      return { id, type, data: { title: '', content: '', tags: [] } };
    case 'create-task':
      return { id, type, data: { title: '', description: '', priority: 'medium', tags: [] } };
    case 'create-event':
      return { id, type, data: { title: '', duration: 60 } };
    case 'create-doc':
      return { id, type, data: { title: '', type: 'doc' } };
    case 'start-timer':
      return { id, type, data: { description: '' } };
  }
}

export const SmartTemplateBuilder: React.FC<SmartTemplateBuilderProps> = ({
  isOpen,
  onClose,
  editingTemplate,
}) => {
  const { createTemplate, updateTemplate } = useSmartTemplateStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [category, setCategory] = useState<'workflow' | 'meeting' | 'planning' | 'custom'>('custom');
  const [actions, setActions] = useState<TemplateAction[]>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEscapeKey({ enabled: isOpen, onEscape: onClose, priority: 60 });

  // Load editing template data
  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setDescription(editingTemplate.description);
      setIcon(editingTemplate.icon);
      setCategory(editingTemplate.category);
      setActions([...editingTemplate.actions]);
      setVariables([...editingTemplate.variables]);
    } else {
      setName('');
      setDescription('');
      setIcon('⚡');
      setCategory('custom');
      setActions([]);
      setVariables([]);
    }
  }, [editingTemplate, isOpen]);

  const handleAddAction = useCallback((type: TemplateActionType) => {
    setActions((prev) => [...prev, createEmptyAction(type)]);
  }, []);

  const handleRemoveAction = useCallback((id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleUpdateAction = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, data: { ...a.data, ...data } } : a))
      );
    },
    []
  );

  const handleAddVariable = useCallback(() => {
    setVariables((prev) => [
      ...prev,
      { key: `var${prev.length + 1}`, label: '', type: 'text' },
    ]);
  }, []);

  const handleRemoveVariable = useCallback((index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateVariable = useCallback(
    (index: number, updates: Partial<TemplateVariable>) => {
      setVariables((prev) =>
        prev.map((v, i) => (i === index ? { ...v, ...updates } : v))
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, {
        name,
        description,
        icon,
        category,
        actions,
        variables,
      });
    } else {
      createTemplate({
        name,
        description,
        icon,
        category,
        actions,
        variables,
        isBuiltIn: false,
      });
    }
    onClose();
  }, [name, description, icon, category, actions, variables, editingTemplate, createTemplate, updateTemplate, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl bg-surface-dark-elevated border border-border-dark rounded-xl shadow-2xl mb-12">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-dark">
          <h2 className="text-sm font-semibold text-text-dark-primary flex-1">
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-dark transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            {/* Icon picker */}
            <div className="relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-12 h-12 rounded-lg bg-surface-dark border border-border-dark flex items-center justify-center text-2xl hover:border-accent-blue/50 transition-colors"
              >
                {icon}
              </button>
              {showIconPicker && (
                <div className="absolute top-14 left-0 z-10 grid grid-cols-8 gap-1 p-2 bg-surface-dark-elevated border border-border-dark rounded-lg shadow-xl">
                  {ICON_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setIcon(emoji);
                        setShowIconPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-dark transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                className="w-full px-3 py-2 text-sm bg-surface-dark border border-border-dark rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary/50 focus:outline-none focus:border-accent-blue/50"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-1.5 text-xs bg-surface-dark border border-border-dark rounded-lg text-text-dark-primary placeholder:text-text-dark-secondary/50 focus:outline-none focus:border-accent-blue/50"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-text-dark-secondary mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full px-3 py-2 text-sm bg-surface-dark border border-border-dark rounded-lg text-text-dark-primary focus:outline-none focus:border-accent-blue/50"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-dark-secondary uppercase tracking-wider">
                Actions ({actions.length})
              </label>
            </div>

            <div className="space-y-2 mb-2">
              {actions.map((action) => (
                <ActionEditor
                  key={action.id}
                  action={action}
                  onUpdate={(data) => handleUpdateAction(action.id, data)}
                  onRemove={() => handleRemoveAction(action.id)}
                />
              ))}
            </div>

            {/* Add action buttons */}
            <div className="flex flex-wrap gap-1.5">
              {ACTION_TYPES.map((at) => (
                <button
                  key={at.type}
                  onClick={() => handleAddAction(at.type)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border-dark text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-dark transition-colors"
                >
                  {at.icon}
                  {at.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-dark-secondary uppercase tracking-wider">
                Variables ({variables.length})
              </label>
              <button
                onClick={handleAddVariable}
                className="flex items-center gap-1 text-xs text-accent-blue hover:text-accent-blue/80 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            <div className="space-y-2">
              {variables.map((variable, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-surface-dark rounded-lg border border-border-dark"
                >
                  <input
                    value={variable.key}
                    onChange={(e) =>
                      handleUpdateVariable(index, { key: e.target.value })
                    }
                    placeholder="key"
                    className="w-20 px-2 py-1 text-xs font-mono bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
                  />
                  <input
                    value={variable.label}
                    onChange={(e) =>
                      handleUpdateVariable(index, { label: e.target.value })
                    }
                    placeholder="Label"
                    className="flex-1 px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
                  />
                  <select
                    value={variable.type}
                    onChange={(e) =>
                      handleUpdateVariable(index, {
                        type: e.target.value as 'text' | 'date' | 'select',
                      })
                    }
                    className="px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                  </select>
                  <button
                    onClick={() => handleRemoveVariable(index)}
                    className="p-1 text-text-dark-secondary hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-dark-secondary/60 mt-1">
              Use {'{{key}}'} in action fields to reference variables.
            </p>
          </div>

          {/* Preview */}
          {actions.length > 0 && (
            <div className="p-3 bg-surface-dark rounded-lg border border-border-dark">
              <p className="text-xs font-medium text-text-dark-secondary mb-2">
                Preview
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="text-sm font-medium text-text-dark-primary">
                    {name || 'Untitled Template'}
                  </p>
                  <p className="text-xs text-text-dark-secondary">
                    {actions.length} action{actions.length !== 1 ? 's' : ''} &middot;{' '}
                    {variables.length} variable{variables.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border-dark text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || actions.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editingTemplate ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

// ==================== Action Editor Component ====================

interface ActionEditorProps {
  action: TemplateAction;
  onUpdate: (data: Record<string, unknown>) => void;
  onRemove: () => void;
}

const ActionEditor: React.FC<ActionEditorProps> = ({
  action,
  onUpdate,
  onRemove,
}) => {
  const typeInfo = ACTION_TYPES.find((t) => t.type === action.type);

  return (
    <div className="px-3 py-2.5 bg-surface-dark rounded-lg border border-border-dark">
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-3.5 h-3.5 text-text-dark-secondary/40" />
        <span className="text-xs font-medium text-text-dark-secondary flex items-center gap-1.5">
          {typeInfo?.icon}
          {typeInfo?.label}
        </span>
        <div className="flex-1" />
        <button
          onClick={onRemove}
          className="p-1 text-text-dark-secondary hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {action.type === 'create-note' && (
        <div className="space-y-1.5">
          <input
            value={(action.data.title as string) || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Title"
            className="w-full px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
          />
          <textarea
            value={(action.data.content as string) || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Content (supports {{variables}})"
            rows={3}
            className="w-full px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none resize-none"
          />
          <input
            value={((action.data.tags as string[]) || []).join(', ')}
            onChange={(e) =>
              onUpdate({
                tags: e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Tags (comma-separated)"
            className="w-full px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
          />
        </div>
      )}

      {action.type === 'create-task' && (
        <div className="space-y-1.5">
          <input
            value={(action.data.title as string) || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Task title"
            className="w-full px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
          />
          <input
            value={(action.data.description as string) || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Description"
            className="w-full px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              value={(action.data.priority as string) || 'medium'}
              onChange={(e) => onUpdate({ priority: e.target.value })}
              className="px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              value={((action.data.tags as string[]) || []).join(', ')}
              onChange={(e) =>
                onUpdate({
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Tags (comma-separated)"
              className="flex-1 px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      {action.type === 'create-event' && (
        <div className="flex gap-2">
          <input
            value={(action.data.title as string) || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Event title"
            className="flex-1 px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={(action.data.duration as number) || 60}
              onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 60 })}
              className="w-16 px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
              min={15}
              step={15}
            />
            <span className="text-xs text-text-dark-secondary">min</span>
          </div>
        </div>
      )}

      {action.type === 'create-doc' && (
        <div className="flex gap-2">
          <input
            value={(action.data.title as string) || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Document title"
            className="flex-1 px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
          />
          <select
            value={(action.data.type as string) || 'doc'}
            onChange={(e) => onUpdate({ type: e.target.value })}
            className="px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
          >
            <option value="doc">Document</option>
            <option value="sheet">Spreadsheet</option>
          </select>
        </div>
      )}

      {action.type === 'start-timer' && (
        <input
          value={(action.data.description as string) || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Timer description"
          className="w-full px-2 py-1 text-xs bg-surface-dark-elevated border border-border-dark rounded text-text-dark-primary focus:outline-none"
        />
      )}
    </div>
  );
};
