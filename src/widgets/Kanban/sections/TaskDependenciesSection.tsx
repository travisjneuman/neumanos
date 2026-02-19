/**
 * TaskDependenciesSection
 *
 * Extracted section component for task dependencies.
 * Features:
 * - Display current dependencies with overdue warnings
 * - Show tasks blocked by current task
 * - Add new dependencies via DependencyPicker
 * - Remove dependencies
 * - Navigate to dependent/blocker tasks
 */

import React from 'react';
import { DependencyPicker } from '../../../components/DependencyPicker';
import type { Task, DependencyType, TaskDependency } from '../../../types';

// Helper functions for dependency display
const getDependencyLabel = (type: DependencyType): string => {
  const labels = {
    'finish-to-start': 'FS',
    'start-to-start': 'SS',
    'finish-to-finish': 'FF',
    'start-to-finish': 'SF',
  };
  return labels[type];
};

const getDependencyIcon = (type: DependencyType): string => {
  const icons = {
    'finish-to-start': '⏭️',
    'start-to-start': '🤝',
    'finish-to-finish': '🏁',
    'start-to-finish': '🔄',
  };
  return icons[type];
};

interface TaskDependenciesSectionProps {
  task: Task;
  tasks: Task[];
  availableTasks: Task[];
  blockedTasks: Task[];
  onAddDependency: (dependency: TaskDependency) => void;
  onRemoveDependency: (dependencyId: string) => void;
  onCardClick?: (task: Task) => void;
}

export const TaskDependenciesSection: React.FC<TaskDependenciesSectionProps> = ({
  task,
  tasks,
  availableTasks,
  blockedTasks,
  onAddDependency,
  onRemoveDependency,
  onCardClick,
}) => {
  return (
    <div>
      <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
        Dependencies
      </label>

      {/* Current Dependencies */}
      {task?.dependencies && task.dependencies.length > 0 ? (
        <div className="space-y-2 mb-4">
          {task.dependencies.map((dep) => {
            const blockerTask = tasks.find(t => t.id === dep.taskId);
            if (!blockerTask) return null;

            // Check if blocker is overdue
            const isOverdue = blockerTask.status !== 'done' &&
              blockerTask.dueDate &&
              new Date(blockerTask.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

            const daysOverdue = isOverdue && blockerTask.dueDate
              ? Math.floor((new Date().getTime() - new Date(blockerTask.dueDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            return (
              <div
                key={dep.taskId}
                className="flex items-center gap-2 p-2 bg-status-warning-bg dark:bg-status-warning-bg-dark rounded-lg border border-status-warning dark:border-status-warning hover:border-status-warning-hover dark:hover:border-status-warning-hover transition-colors group cursor-pointer"
                onClick={() => {
                  if (onCardClick) {
                    onCardClick(blockerTask);
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getDependencyIcon(dep.type)}</span>
                    <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {blockerTask.title}
                    </div>
                    {/* Overdue blocker warning */}
                    {isOverdue && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark">
                        ⚠️ {daysOverdue}d overdue
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary ml-6">
                    {getDependencyLabel(dep.type)} • {blockerTask.status}
                    {dep.lag !== 0 && (
                      <span className="ml-2">
                        {dep.lag > 0 ? `+${dep.lag}` : dep.lag} day{Math.abs(dep.lag) !== 1 ? 's' : ''}
                        {dep.lag > 0 ? ' delay' : ' lead'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation when removing
                    onRemoveDependency(dep.taskId);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-light-secondary hover:text-status-error transition-opacity"
                  title="Remove dependency"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary py-1 mb-3">
          🔓 No dependencies
        </div>
      )}

      {/* Blocked By (Tasks that depend on this one) */}
      {blockedTasks.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            🔒 Blocks These Tasks
          </div>
          <div className="space-y-1">
            {blockedTasks.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center gap-2 p-2 bg-accent-blue/10 dark:bg-accent-blue/20 rounded-lg border border-accent-blue/30 dark:border-accent-blue/30 cursor-pointer hover:border-accent-blue transition-colors"
                onClick={() => {
                  if (onCardClick) {
                    onCardClick(blocked);
                  }
                }}
              >
                <div className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                  {blocked.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Dependency */}
      <div className="border-t border-border-light dark:border-border-dark pt-3 mt-3">
        <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
          Add Dependency
        </div>
        <DependencyPicker
          currentTask={task}
          availableTasks={availableTasks}
          existingDependencies={task.dependencies || []}
          onAdd={onAddDependency}
        />
      </div>
    </div>
  );
};

export default TaskDependenciesSection;
