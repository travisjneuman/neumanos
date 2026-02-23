/**
 * AI Quick Actions
 * Floating action button that provides contextual AI actions for notes and tasks.
 * Uses the AI terminal's provider router to execute actions.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useTerminalStore } from '../stores/useTerminalStore';
import type { AIContext } from '../stores/useTerminalStore';

interface AIQuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

const NOTE_ACTIONS: AIQuickAction[] = [
  { id: 'summarize', label: 'Summarize', icon: '📋', prompt: 'Summarize the following note concisely:\n\n' },
  { id: 'expand', label: 'Expand', icon: '📝', prompt: 'Expand on the following note with more detail:\n\n' },
  { id: 'fix-grammar', label: 'Fix Grammar', icon: '✏️', prompt: 'Fix the grammar and improve clarity of the following text:\n\n' },
  { id: 'translate', label: 'Translate', icon: '🌐', prompt: 'Translate the following text to English (or if already in English, to Spanish):\n\n' },
  { id: 'outline', label: 'Generate Outline', icon: '📑', prompt: 'Generate a structured outline from the following note:\n\n' },
];

const TASK_ACTIONS: AIQuickAction[] = [
  { id: 'subtasks', label: 'Break into Subtasks', icon: '📊', prompt: 'Break this task into smaller, actionable subtasks:\n\n' },
  { id: 'estimate', label: 'Estimate Time', icon: '⏱️', prompt: 'Estimate the time needed for this task and explain your reasoning:\n\n' },
  { id: 'description', label: 'Write Description', icon: '📝', prompt: 'Write a detailed description for this task:\n\n' },
];

interface AIQuickActionsProps {
  context: AIContext;
  onActionResult?: (result: string) => void;
}

export const AIQuickActions: React.FC<AIQuickActionsProps> = ({ context, onActionResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const setActiveContext = useTerminalStore((s) => s.setActiveContext);
  const addMessage = useTerminalStore((s) => s.addMessage);
  const setOpen = useTerminalStore((s) => s.setOpen);

  const actions = context.type === 'note' ? NOTE_ACTIONS : TASK_ACTIONS;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setResult(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleAction = useCallback(
    (action: AIQuickAction) => {
      // Set context in terminal store and send to AI terminal
      setActiveContext(context);
      const fullPrompt = action.prompt + `Title: ${context.title}\n\n${context.content}`;

      // Add as user message and open terminal
      addMessage({ role: 'user', content: fullPrompt });
      setOpen(true);
      setIsOpen(false);
      setResult(null);
    },
    [context, setActiveContext, addMessage, setOpen]
  );

  return (
    <div className="relative" ref={popoverRef}>
      {/* Floating Action Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setResult(null);
        }}
        className={`
          p-2 rounded-full shadow-lg transition-all duration-200
          ${isOpen
            ? 'bg-accent-primary text-white scale-110'
            : 'bg-gradient-to-r from-accent-blue to-accent-primary text-white hover:scale-105 hover:shadow-xl'
          }
        `}
        title="AI Quick Actions"
        aria-label="AI Quick Actions"
      >
        {isOpen ? <X size={16} /> : <Sparkles size={16} />}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-surface-dark rounded-lg shadow-2xl border border-border-dark overflow-hidden z-50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border-dark bg-surface-dark-elevated">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-accent-primary" />
              <span className="text-xs font-medium text-text-dark-primary">
                AI Actions for {context.type === 'note' ? 'Note' : 'Task'}
              </span>
            </div>
            <p className="text-[10px] text-text-dark-tertiary mt-0.5 truncate">
              {context.title}
            </p>
          </div>

          {/* Actions List */}
          <div className="py-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={isLoading}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors
                  hover:bg-surface-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span className="text-base flex-shrink-0">{action.icon}</span>
                <span className="text-text-dark-primary">{action.label}</span>
                {isLoading && (
                  <span className="ml-auto text-xs text-accent-primary animate-pulse">...</span>
                )}
              </button>
            ))}
          </div>

          {/* Result Preview */}
          {result && (
            <div className="px-3 py-2 border-t border-border-dark bg-surface-dark-elevated">
              <p className="text-xs text-text-dark-secondary line-clamp-4">{result}</p>
              <button
                onClick={() => {
                  onActionResult?.(result);
                  setResult(null);
                  setIsOpen(false);
                }}
                className="mt-1.5 text-xs text-accent-blue hover:underline"
              >
                Apply result
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
