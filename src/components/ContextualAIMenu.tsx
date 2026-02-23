/**
 * Contextual AI Actions Menu
 *
 * A dropdown menu that provides context-specific AI actions for different modules.
 * For Notes: summarize, extract action items, improve writing, generate outline
 * For Tasks: break into subtasks, estimate time, write description
 * For Calendar: draft meeting agenda, suggest preparation
 *
 * Each action sends context + instruction to the AI Terminal.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useTerminalStore } from '../stores/useTerminalStore';

export type AIContextType = 'note' | 'task' | 'calendar';

interface AIAction {
  id: string;
  label: string;
  icon: string;
  instruction: string;
}

const NOTE_ACTIONS: AIAction[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    icon: '📋',
    instruction: 'Please summarize the following note concisely, highlighting the key points:',
  },
  {
    id: 'extract-actions',
    label: 'Extract action items',
    icon: '✅',
    instruction: 'Extract all action items and to-do tasks from this note. Format as a numbered list:',
  },
  {
    id: 'improve-writing',
    label: 'Improve writing',
    icon: '✏️',
    instruction: 'Improve the writing quality of this note. Fix grammar, improve clarity, and enhance readability while preserving the original meaning:',
  },
  {
    id: 'generate-outline',
    label: 'Generate outline',
    icon: '📑',
    instruction: 'Generate a structured outline based on the content of this note:',
  },
];

const TASK_ACTIONS: AIAction[] = [
  {
    id: 'break-subtasks',
    label: 'Break into subtasks',
    icon: '📊',
    instruction: 'Break this task into smaller, actionable subtasks. List each subtask with a brief description:',
  },
  {
    id: 'estimate-time',
    label: 'Estimate time',
    icon: '⏱️',
    instruction: 'Estimate the time needed to complete this task. Consider complexity and provide a range (optimistic, realistic, pessimistic):',
  },
  {
    id: 'write-description',
    label: 'Write description',
    icon: '📝',
    instruction: 'Write a detailed description for this task, including acceptance criteria and implementation notes:',
  },
];

const CALENDAR_ACTIONS: AIAction[] = [
  {
    id: 'draft-agenda',
    label: 'Draft meeting agenda',
    icon: '📋',
    instruction: 'Draft a meeting agenda for this event. Include discussion topics, time allocations, and action items to cover:',
  },
  {
    id: 'suggest-prep',
    label: 'Suggest preparation',
    icon: '📚',
    instruction: 'Suggest preparation steps for this event. What should be ready before the meeting?',
  },
];

function getActionsForType(type: AIContextType): AIAction[] {
  switch (type) {
    case 'note':
      return NOTE_ACTIONS;
    case 'task':
      return TASK_ACTIONS;
    case 'calendar':
      return CALENDAR_ACTIONS;
  }
}

interface ContextualAIMenuProps {
  contextType: AIContextType;
  contextTitle: string;
  contextContent: string;
  contextId: string;
  className?: string;
  buttonClassName?: string;
  iconSize?: number;
}

export const ContextualAIMenu: React.FC<ContextualAIMenuProps> = ({
  contextType,
  contextTitle,
  contextContent,
  contextId,
  className = '',
  buttonClassName = '',
  iconSize = 14,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const setActiveContext = useTerminalStore((s) => s.setActiveContext);
  const setOpen = useTerminalStore((s) => s.setOpen);
  const addMessage = useTerminalStore((s) => s.addMessage);
  const activeConversationId = useTerminalStore((s) => s.activeConversationId);
  const createConversation = useTerminalStore((s) => s.createConversation);

  const actions = getActionsForType(contextType);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleAction = useCallback(
    (action: AIAction) => {
      // Set context in the terminal store
      setActiveContext({
        type: contextType === 'calendar' ? 'cross-module' : contextType,
        id: contextId,
        title: contextTitle,
        content: contextContent,
      });

      // Open the AI terminal
      setOpen(true);

      // Auto-create conversation if none active
      if (!activeConversationId) {
        createConversation(`${action.label}: ${contextTitle.substring(0, 30)}`);
      }

      // Send the instruction as a user message
      const userMessage = `${action.instruction}\n\n---\n**${contextTitle}**\n${contextContent.slice(0, 2000)}`;
      addMessage({
        role: 'user',
        content: userMessage,
      });

      setIsOpen(false);
    },
    [contextType, contextId, contextTitle, contextContent, setActiveContext, setOpen, addMessage, activeConversationId, createConversation]
  );

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded transition-all hover:bg-accent-primary/10 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary ${buttonClassName}`}
        title="AI Actions"
        aria-label="Open AI actions menu"
      >
        <Sparkles size={iconSize} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-border-light dark:border-border-dark">
            <span className="text-[10px] font-medium text-text-light-secondary dark:text-text-dark-tertiary uppercase tracking-wider">
              AI Actions
            </span>
          </div>
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-colors text-text-light-primary dark:text-text-dark-primary"
            >
              <span className="text-base flex-shrink-0">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
