import React, { useState } from 'react';
import { useTaskViewsStore, type TaskFilter, type TaskFilterField, type TaskFilterOperator } from '../../stores/useTaskViewsStore';
import { Plus, Trash2, Check, X } from 'lucide-react';

/**
 * TaskViewSidebar — sidebar for switching between saved views/filters.
 */
export const TaskViewSidebar: React.FC = () => {
  const { views, activeViewId, setActiveView, addView, deleteView } = useTaskViewsStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📌');
  const [newFilters, setNewFilters] = useState<TaskFilter[]>([]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    addView({
      name: newName.trim(),
      icon: newIcon,
      filters: newFilters,
      sortBy: 'created',
      isDefault: false,
    });
    setIsCreating(false);
    setNewName('');
    setNewIcon('📌');
    setNewFilters([]);
  };

  const handleAddFilter = () => {
    setNewFilters([...newFilters, { field: 'priority', operator: 'eq', value: 'high' }]);
  };

  const handleUpdateFilter = (index: number, updates: Partial<TaskFilter>) => {
    setNewFilters(newFilters.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const handleRemoveFilter = (index: number) => {
    setNewFilters(newFilters.filter((_, i) => i !== index));
  };

  return (
    <div className="task-view-sidebar w-full">
      <div className="space-y-1">
        {views.map((view) => (
          <div key={view.id} className="group flex items-center">
            <button
              onClick={() => setActiveView(view.id)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                activeViewId === view.id
                  ? 'bg-accent-blue/10 text-accent-blue font-medium'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
            >
              <span>{view.icon}</span>
              <span className="truncate">{view.name}</span>
              {view.filters.length > 0 && (
                <span className="ml-auto text-xs opacity-60">
                  {view.filters.length}
                </span>
              )}
            </button>
            {!view.isBuiltIn && (
              <button
                onClick={() => deleteView(view.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-light-secondary dark:text-text-dark-secondary hover:text-status-error transition-all"
                title="Delete view"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create New View */}
      {isCreating ? (
        <div className="mt-3 p-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark-elevated space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-10 px-2 py-1 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-center"
              maxLength={2}
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="View name..."
              className="flex-1 px-2 py-1 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
          </div>

          {/* Filters */}
          {newFilters.map((filter, i) => (
            <FilterRow
              key={i}
              filter={filter}
              onChange={(updates) => handleUpdateFilter(i, updates)}
              onRemove={() => handleRemoveFilter(i)}
            />
          ))}

          <button
            onClick={handleAddFilter}
            className="w-full text-xs text-accent-blue hover:text-accent-blue-hover py-1"
          >
            + Add Filter
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-accent-blue text-white rounded hover:bg-accent-blue-hover transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3 inline mr-1" /> Save
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-xs rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark"
            >
              <X className="w-3 h-3 inline" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New View
        </button>
      )}
    </div>
  );
};

// ==================== FILTER ROW ====================

const FilterRow: React.FC<{
  filter: TaskFilter;
  onChange: (updates: Partial<TaskFilter>) => void;
  onRemove: () => void;
}> = ({ filter, onChange, onRemove }) => {
  const fieldOptions: { value: TaskFilterField; label: string }[] = [
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'tag', label: 'Tag' },
    { value: 'whenTag', label: 'When' },
    { value: 'dueDate', label: 'Due Date' },
  ];

  const operatorOptions: { value: TaskFilterOperator; label: string }[] = [
    { value: 'eq', label: 'is' },
    { value: 'neq', label: 'is not' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'contains', label: 'contains' },
  ];

  return (
    <div className="flex items-center gap-1">
      <select
        value={filter.field}
        onChange={(e) => onChange({ field: e.target.value as TaskFilterField })}
        className="px-1.5 py-1 text-xs border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
      >
        {fieldOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        value={filter.operator}
        onChange={(e) => onChange({ operator: e.target.value as TaskFilterOperator })}
        className="px-1.5 py-1 text-xs border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
      >
        {operatorOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={filter.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="flex-1 px-1.5 py-1 text-xs border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
        placeholder="Value..."
      />
      <button onClick={onRemove} className="p-0.5 text-text-light-secondary dark:text-text-dark-secondary hover:text-status-error">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
