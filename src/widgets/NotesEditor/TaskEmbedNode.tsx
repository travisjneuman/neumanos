/**
 * Task Embed Node for Lexical Editor
 * DecoratorNode that renders an inline task card from the Kanban store
 */

import React, { useCallback } from 'react';
import { DecoratorNode } from 'lexical';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useNavigate } from 'react-router-dom';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
} from 'lexical';

export type SerializedTaskEmbedNode = Spread<
  { taskId: string },
  SerializedLexicalNode
>;

export class TaskEmbedNode extends DecoratorNode<React.ReactElement> {
  __taskId: string;

  static getType(): string {
    return 'task-embed';
  }

  static clone(node: TaskEmbedNode): TaskEmbedNode {
    return new TaskEmbedNode(node.__taskId, node.__key);
  }

  static importJSON(serializedNode: SerializedTaskEmbedNode): TaskEmbedNode {
    return new TaskEmbedNode(serializedNode.taskId);
  }

  exportJSON(): SerializedTaskEmbedNode {
    return {
      taskId: this.__taskId,
      type: 'task-embed',
      version: 1,
    };
  }

  constructor(taskId: string, key?: NodeKey) {
    super(key);
    this.__taskId = taskId;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'inline-block align-middle';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  decorate(): React.ReactElement {
    return <TaskEmbedComponent taskId={this.__taskId} nodeKey={this.__key} />;
  }
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  todo: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  inprogress: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  review: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  done: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

const TaskEmbedComponent = React.memo(function TaskEmbedComponent({
  taskId,
  nodeKey: _nodeKey,
}: {
  taskId: string;
  nodeKey: NodeKey;
}) {
  const task = useKanbanStore((state) => state.tasks.find((t) => t.id === taskId));
  const updateTask = useKanbanStore((state) => state.updateTask);
  const navigate = useNavigate();

  const toggleComplete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!task) return;
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      updateTask(task.id, { status: newStatus });
    },
    [task, updateTask]
  );

  const handleNavigate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate('/tasks');
    },
    [navigate]
  );

  if (!task) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
        Task not found
      </span>
    );
  }

  const isDone = task.status === 'done';
  const statusLabel = task.status === 'inprogress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1);

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated hover:border-accent-blue/50 transition-colors cursor-default text-sm my-0.5">
      <button
        onClick={toggleComplete}
        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          isDone
            ? 'bg-accent-green border-accent-green text-white'
            : 'border-border-light dark:border-border-dark hover:border-accent-blue'
        }`}
        title={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {isDone && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      <span
        onClick={handleNavigate}
        className={`hover:underline cursor-pointer ${
          isDone ? 'line-through opacity-60' : ''
        } text-text-light-primary dark:text-text-dark-primary`}
        title="Go to Tasks"
      >
        {task.title}
      </span>

      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>
        {task.priority}
      </span>

      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[task.status] || ''}`}>
        {statusLabel}
      </span>
    </span>
  );
});

export function $createTaskEmbedNode(taskId: string): TaskEmbedNode {
  return new TaskEmbedNode(taskId);
}

export function $isTaskEmbedNode(
  node: LexicalNode | null | undefined
): node is TaskEmbedNode {
  return node instanceof TaskEmbedNode;
}
