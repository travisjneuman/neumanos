import React, { useState } from 'react';
import type { Subtask, TaskPriority } from '../../../types';

interface SubtasksTabContentProps {
  subtasks: Subtask[] | undefined;
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
  onAdd: (subtask: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;
    completed: boolean;
  }) => void;
}

/**
 * Subtasks Tab Content
 * Displays subtask list with progress bar and add form.
 */
export const SubtasksTabContent: React.FC<SubtasksTabContentProps> = ({
  subtasks,
  onToggle,
  onDelete,
  onAdd,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;

    onAdd({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      completed: false,
    });

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
  };

  const completedCount = subtasks?.filter(st => st.completed).length ?? 0;
  const totalCount = subtasks?.length ?? 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {subtasks && subtasks.length > 0 && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-text-light-primary dark:text-text-dark-primary">Progress</span>
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {completedCount} of {totalCount}
            </span>
          </div>
          <div className="w-full bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full h-2">
            <div
              className="bg-accent-blue h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask List */}
      {subtasks && subtasks.length > 0 ? (
        <div className="space-y-2">
          {[...subtasks].sort((a, b) => a.order - b.order).map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-start gap-3 p-3 bg-surface-light dark:bg-surface-dark rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggle(subtask.id)}
                className="mt-1 cursor-pointer"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  subtask.completed
                    ? 'text-text-light-secondary dark:text-text-dark-secondary line-through'
                    : 'text-text-light-primary dark:text-text-dark-primary'
                }`}>
                  {subtask.title}
                </div>
                {subtask.description && (
                  <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                    {subtask.description}
                  </div>
                )}
                {/* Metadata */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {subtask.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      subtask.priority === 'high'
                        ? 'bg-accent-red text-white'
                        : subtask.priority === 'medium'
                        ? 'bg-accent-yellow text-white'
                        : 'bg-accent-blue text-white'
                    }`}>
                      {subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1)}
                    </span>
                  )}
                  {subtask.dueDate && (
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary">
                      📅 {new Date(subtask.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => onDelete(subtask.id)}
                className="text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-red transition-colors"
                title="Delete subtask"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            📝 No subtasks yet
          </p>
        </div>
      )}

      {/* Add Subtask Form */}
      {showAddForm ? (
        <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-lg space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Subtask title"
            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="flex-1 px-4 py-2 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Subtask
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-lg hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-4 py-2 text-sm bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
        >
          + Add Subtask
        </button>
      )}
    </div>
  );
};
