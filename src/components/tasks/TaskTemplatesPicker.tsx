import React, { useState } from 'react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { TaskPriority } from '../../types';

interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultPriority: TaskPriority;
  defaultTags: string[];
  subtasks: string[];
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'bug-report',
    name: 'Bug Report',
    icon: '🐛',
    description: 'Track and resolve a bug with structured subtasks',
    defaultPriority: 'high',
    defaultTags: ['bug'],
    subtasks: ['Reproduce the issue', 'Investigate root cause', 'Implement fix', 'Write tests', 'Deploy fix'],
  },
  {
    id: 'feature-request',
    name: 'Feature Request',
    icon: '✨',
    description: 'Plan and implement a new feature end-to-end',
    defaultPriority: 'medium',
    defaultTags: ['feature'],
    subtasks: ['Design & spec', 'Implement core functionality', 'Write tests', 'Update documentation', 'Code review'],
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    icon: '🏃',
    description: 'Organize a sprint planning session',
    defaultPriority: 'high',
    defaultTags: ['planning'],
    subtasks: ['Review backlog', 'Estimate stories', 'Assign tasks', 'Set sprint goals', 'Create sprint board'],
  },
  {
    id: 'code-review',
    name: 'Code Review',
    icon: '🔍',
    description: 'Structured code review process',
    defaultPriority: 'medium',
    defaultTags: ['review'],
    subtasks: ['Read PR description', 'Check code changes', 'Run tests locally', 'Leave review comments', 'Approve or request changes'],
  },
  {
    id: 'deployment',
    name: 'Deployment',
    icon: '🚀',
    description: 'Deploy to production checklist',
    defaultPriority: 'high',
    defaultTags: ['deploy'],
    subtasks: ['Run full test suite', 'Review staging environment', 'Create deployment tag', 'Deploy to production', 'Verify in production', 'Monitor metrics'],
  },
  {
    id: 'research',
    name: 'Research Spike',
    icon: '🔬',
    description: 'Time-boxed investigation of a technical question',
    defaultPriority: 'medium',
    defaultTags: ['research'],
    subtasks: ['Define research question', 'Gather sources', 'Evaluate options', 'Write findings summary', 'Present recommendations'],
  },
];

interface TaskTemplatesPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskTemplatesPicker: React.FC<TaskTemplatesPickerProps> = ({ isOpen, onClose }) => {
  const { addTask, addSubtask } = useKanbanStore();
  const [taskTitle, setTaskTitle] = useState('');

  if (!isOpen) return null;

  const handleCreateFromTemplate = (template: TaskTemplate) => {
    const title = taskTitle.trim() || template.name;

    // Create the parent task
    addTask({
      title,
      description: template.description,
      status: 'todo',
      priority: template.defaultPriority,
      tags: template.defaultTags,
      startDate: null,
      dueDate: null,
      projectIds: [],
    });

    // Get the created task (latest in store)
    const tasks = useKanbanStore.getState().tasks;
    const newTask = tasks[tasks.length - 1];

    if (newTask) {
      // Add subtasks
      template.subtasks.forEach((subtaskTitle) => {
        addSubtask(newTask.id, {
          title: subtaskTitle,
          completed: false,
        });
      });
    }

    setTaskTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Create from Template
          </h2>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
            Start with a pre-built task structure
          </p>
        </div>

        {/* Optional custom title */}
        <div className="p-4 border-b border-border-light dark:border-border-dark">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Custom task title (optional)..."
            className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        {/* Templates grid */}
        <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
          {TASK_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleCreateFromTemplate(template)}
              className="w-full text-left p-4 rounded-lg border border-border-light dark:border-border-dark hover:border-accent-blue hover:bg-accent-blue/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {template.name}
                  </h3>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      template.defaultPriority === 'high'
                        ? 'bg-status-error/10 text-status-error'
                        : 'bg-status-warning/10 text-status-warning-text dark:text-status-warning-text-dark'
                    }`}>
                      {template.defaultPriority}
                    </span>
                    {template.defaultTags.map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-accent-blue/10 text-accent-blue">
                        #{tag}
                      </span>
                    ))}
                    <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary ml-auto">
                      {template.subtasks.length} subtasks
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm rounded-lg border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
