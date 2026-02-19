/**
 * DependencyPicker Component
 * UI for adding task dependencies with professional types (FS/SS/FF/SF) and lag time
 */

import { useState } from 'react';
import type { Task, DependencyType, TaskDependency } from '../types';

interface DependencyPickerProps {
  currentTask: Task;
  availableTasks: Task[];
  existingDependencies: TaskDependency[];
  onAdd: (dependency: TaskDependency) => void;
}

const DEPENDENCY_TYPES: Array<{ value: DependencyType; label: string; description: string; icon: string }> = [
  {
    value: 'finish-to-start',
    label: 'Finish-to-Start (FS)',
    description: 'This task starts when dependency finishes',
    icon: '⏭️',
  },
  {
    value: 'start-to-start',
    label: 'Start-to-Start (SS)',
    description: 'This task starts when dependency starts',
    icon: '🤝',
  },
  {
    value: 'finish-to-finish',
    label: 'Finish-to-Finish (FF)',
    description: 'This task finishes when dependency finishes',
    icon: '🏁',
  },
  {
    value: 'start-to-finish',
    label: 'Start-to-Finish (SF)',
    description: 'This task finishes when dependency starts (rare)',
    icon: '🔄',
  },
];

export function DependencyPicker({ currentTask, availableTasks, existingDependencies, onAdd }: DependencyPickerProps) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [dependencyType, setDependencyType] = useState<DependencyType>('finish-to-start');
  const [lag, setLag] = useState(0);

  const handleAdd = () => {
    if (!selectedTaskId) return;

    onAdd({
      taskId: selectedTaskId,
      type: dependencyType,
      lag,
    });

    // Reset form
    setSelectedTaskId('');
    setDependencyType('finish-to-start');
    setLag(0);
  };

  // Filter out tasks that already have dependencies
  const existingTaskIds = new Set(existingDependencies.map(d => d.taskId));
  const filteredTasks = availableTasks.filter(t => !existingTaskIds.has(t.id) && t.id !== currentTask.id);

  return (
    <div className="space-y-3">
      {/* Task Selector */}
      <div>
        <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
          Depends On Task
        </label>
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
        >
          <option value="">Select task...</option>
          {filteredTasks.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.status})
            </option>
          ))}
        </select>
      </div>

      {selectedTaskId && (
        <>
          {/* Dependency Type Selector */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Dependency Type
            </label>
            <div className="space-y-2">
              {DEPENDENCY_TYPES.map(type => (
                <label
                  key={type.value}
                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    dependencyType === type.value
                      ? 'bg-accent-blue/10 border-accent-blue dark:bg-accent-blue/20'
                      : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark hover:border-accent-blue/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="dependency-type"
                    value={type.value}
                    checked={dependencyType === type.value}
                    onChange={() => setDependencyType(type.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {type.icon} {type.label}
                    </div>
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Lag Time Input */}
          <div>
            <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Lag Time (days)
            </label>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Positive for delay, negative for lead/overlap
            </p>
            <input
              type="number"
              value={lag}
              onChange={(e) => setLag(parseInt(e.target.value) || 0)}
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
              placeholder="0"
              step="1"
            />
            {lag !== 0 && (
              <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                {lag > 0 ? `+${lag} day delay` : `${lag} day lead (overlap)`}
              </div>
            )}
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add Dependency
          </button>
        </>
      )}
    </div>
  );
}
