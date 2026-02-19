import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { Task, TaskStatus } from '../../types';

interface KanbanColumnProps {
  id: string; // Changed from TaskStatus to support dynamic columns
  title: string;
  color: string;
  wipLimit?: number; // WIP (Work In Progress) limit for this column
  tasks: Task[];
  selectedTaskId?: string;
  columnWidth?: string; // Dynamic column width (e.g., "20%", "calc(33% - 16px)")
  onRegisterRef: (ref: { triggerAdd: () => void }) => void;
  onRegisterCardRef: (taskId: string, ref: { triggerEdit: () => void }) => void;
  onCardClick?: (task: Task, tab?: 'subtasks' | 'checklist' | 'comments' | 'activity') => void; // NEW: Handle card click to open detail panel
  onEditColumn?: (columnId: string) => void; // NEW: Handle edit column button click
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  color,
  wipLimit,
  tasks,
  selectedTaskId,
  columnWidth,
  onRegisterRef,
  onRegisterCardRef,
  onCardClick,
  onEditColumn,
}) => {
  const { addTask } = useKanbanStore();
  const { setNodeRef, isOver } = useDroppable({ id });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Register ref for keyboard shortcut access
  useEffect(() => {
    onRegisterRef({
      triggerAdd: () => setShowAddForm(true),
    });
  }, [onRegisterRef]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      description: '',
      status: id as TaskStatus, // Cast to TaskStatus for backward compatibility
      startDate: null,
      dueDate: null,
      priority: 'medium',
      tags: [],
      projectIds: [],
    });

    setNewTaskTitle('');
    setShowAddForm(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column flex-shrink-0 flex flex-col bg-surface-light-elevated dark:bg-surface-dark rounded-lg ${
        isOver ? 'ring-2 ring-accent-primary bg-accent-primary/10' : ''
      }`}
      style={columnWidth ? { width: columnWidth, minWidth: columnWidth } : { width: '320px', minWidth: '320px' }}
    >
      {/* Column Header */}
      <div className="column-header p-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              {title}
            </h3>
            <span
              className={`text-sm font-medium ${
                wipLimit && tasks.length >= wipLimit
                  ? 'text-status-error dark:text-status-error'
                  : 'text-text-light-secondary dark:text-text-dark-secondary'
              }`}
              title={wipLimit ? `WIP Limit: ${wipLimit}` : undefined}
            >
              ({tasks.length}{wipLimit ? `/${wipLimit}` : ''})
            </span>
          </div>

          {/* Column actions */}
          {onEditColumn && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditColumn(id)}
                className="p-1 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue dark:hover:text-accent-blue transition-colors"
                title="Edit column"
                aria-label="Edit column"
              >
                ✏️
              </button>
              <button
                className="p-1 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary cursor-grab transition-colors"
                title="Drag to reorder"
                aria-label="Drag to reorder column"
              >
                ⋮⋮
              </button>
            </div>
          )}
        </div>

        {/* Add Task Button */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full text-left text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary transition-colors"
          >
            + Add task
          </button>
        ) : (
          <form onSubmit={handleAddTask} className="space-y-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-accent-primary text-white rounded hover:opacity-80"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTaskTitle('');
                }}
                className="px-3 py-1 text-sm bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary rounded hover:opacity-80"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tasks List */}
      <div className="column-tasks flex-1 p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary text-sm">
            {isOver ? 'Drop task here' : 'No tasks'}
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onRegisterRef={(ref) => onRegisterCardRef(task.id, ref)}
              onCardClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
