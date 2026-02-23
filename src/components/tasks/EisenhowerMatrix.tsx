import React, { useMemo } from 'react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { Task } from '../../types';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type Quadrant = 'do-first' | 'schedule' | 'delegate' | 'eliminate';

function classifyTask(task: Task): Quadrant {
  // Important = high priority
  const isImportant = task.priority === 'high';

  // Urgent = due within 48 hours
  let isUrgent = false;
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    isUrgent = hoursUntilDue <= 48;
  }

  if (isImportant && isUrgent) return 'do-first';
  if (isImportant && !isUrgent) return 'schedule';
  if (!isImportant && isUrgent) return 'delegate';
  return 'eliminate';
}

const QUADRANT_CONFIG: Record<Quadrant, { title: string; subtitle: string; color: string; bgColor: string; borderColor: string }> = {
  'do-first': {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    color: 'text-status-error',
    bgColor: 'bg-status-error/5 dark:bg-status-error/10',
    borderColor: 'border-status-error/30',
  },
  'schedule': {
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/5 dark:bg-accent-blue/10',
    borderColor: 'border-accent-blue/30',
  },
  'delegate': {
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    color: 'text-status-warning-text dark:text-status-warning-text-dark',
    bgColor: 'bg-status-warning/5 dark:bg-status-warning/10',
    borderColor: 'border-status-warning/30',
  },
  'eliminate': {
    title: 'Eliminate',
    subtitle: 'Neither',
    color: 'text-text-light-secondary dark:text-text-dark-secondary',
    bgColor: 'bg-surface-light-elevated/50 dark:bg-surface-dark-elevated/50',
    borderColor: 'border-border-light dark:border-border-dark',
  },
};

const QuadrantCell: React.FC<{
  quadrant: Quadrant;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDrop: (taskId: string, quadrant: Quadrant) => void;
}> = ({ quadrant, tasks, onTaskClick, onDrop }) => {
  const config = QUADRANT_CONFIG[quadrant];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onDrop(taskId, quadrant);
  };

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 min-h-[200px] flex flex-col`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mb-3">
        <h3 className={`font-semibold text-sm ${config.color}`}>
          {config.title}
        </h3>
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          {config.subtitle}
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px]">
        {tasks.length === 0 && (
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary italic text-center py-4">
            No tasks
          </p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', task.id);
            }}
            onClick={() => onTaskClick(task)}
            className="p-2 rounded bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark cursor-pointer hover:shadow-md transition-shadow text-sm"
          >
            <div className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
              {task.title}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {task.dueDate && (
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                task.priority === 'high' ? 'bg-status-error/10 text-status-error' :
                task.priority === 'medium' ? 'bg-status-warning/10 text-status-warning-text dark:text-status-warning-text-dark' :
                'bg-status-info/10 text-status-info'
              }`}>
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary text-right">
        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
      </div>
    </div>
  );
};

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ tasks, onTaskClick }) => {
  const { updateTask } = useKanbanStore();

  // Only show non-done tasks
  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks]);

  const quadrants = useMemo(() => {
    const result: Record<Quadrant, Task[]> = {
      'do-first': [],
      'schedule': [],
      'delegate': [],
      'eliminate': [],
    };
    activeTasks.forEach((task) => {
      const q = classifyTask(task);
      result[q].push(task);
    });
    return result;
  }, [activeTasks]);

  const handleDrop = (taskId: string, quadrant: Quadrant) => {
    // Update task priority/urgency based on target quadrant
    const updates: Partial<Task> = {};

    switch (quadrant) {
      case 'do-first':
        updates.priority = 'high';
        // Set due date to today if no due date
        if (!updates.dueDate) {
          updates.dueDate = new Date().toISOString().split('T')[0];
        }
        break;
      case 'schedule':
        updates.priority = 'high';
        // Remove urgency by pushing due date out
        break;
      case 'delegate':
        updates.priority = 'medium';
        if (!updates.dueDate) {
          updates.dueDate = new Date().toISOString().split('T')[0];
        }
        break;
      case 'eliminate':
        updates.priority = 'low';
        break;
    }

    updateTask(taskId, updates);
  };

  return (
    <div className="eisenhower-matrix">
      {/* Axis Labels */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide">
          Urgent
        </span>
        <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          ---
        </span>
        <span className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide">
          Not Urgent
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Row 1: Important */}
        <QuadrantCell quadrant="do-first" tasks={quadrants['do-first']} onTaskClick={onTaskClick} onDrop={handleDrop} />
        <QuadrantCell quadrant="schedule" tasks={quadrants['schedule']} onTaskClick={onTaskClick} onDrop={handleDrop} />

        {/* Row 2: Not Important */}
        <QuadrantCell quadrant="delegate" tasks={quadrants['delegate']} onTaskClick={onTaskClick} onDrop={handleDrop} />
        <QuadrantCell quadrant="eliminate" tasks={quadrants['eliminate']} onTaskClick={onTaskClick} onDrop={handleDrop} />
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide">
          Important
        </span>
        <span className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide">
          Not Important
        </span>
      </div>
    </div>
  );
};
