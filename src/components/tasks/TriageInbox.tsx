import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { Task, TaskPriority } from '../../types';

interface TriageInboxProps {
  onTaskClick: (task: Task) => void;
}

/**
 * TriageInbox — Linear-style task triage
 *
 * Shows backlog tasks that haven't been categorized.
 * Keyboard-first: j/k navigate, 1-4 priority, Enter accept, s snooze.
 */
export const TriageInbox: React.FC<TriageInboxProps> = ({ onTaskClick }) => {
  const { tasks, updateTask, moveTask } = useKanbanStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get tasks to triage: backlog tasks not snoozed
  const triageTasks = useMemo(() => {
    const now = new Date().toISOString();
    return tasks.filter((t) => {
      if (t.status !== 'backlog') return false;
      if (t.snoozedUntil && t.snoozedUntil > now) return false;
      return true;
    });
  }, [tasks]);

  const currentTask = triageTasks[currentIndex] || null;
  const remaining = triageTasks.length;

  // Keep index in bounds
  useEffect(() => {
    if (currentIndex >= triageTasks.length && triageTasks.length > 0) {
      setCurrentIndex(triageTasks.length - 1);
    }
  }, [triageTasks.length, currentIndex]);

  const handleSetPriority = useCallback((priority: TaskPriority) => {
    if (!currentTask) return;
    updateTask(currentTask.id, { priority });
  }, [currentTask, updateTask]);

  const handleAccept = useCallback(() => {
    if (!currentTask) return;
    moveTask(currentTask.id, 'todo');
    // Index auto-adjusts through useMemo recalculation
  }, [currentTask, moveTask]);

  const handleSnooze = useCallback(() => {
    if (!currentTask) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    updateTask(currentTask.id, { snoozedUntil: tomorrow.toISOString() });
  }, [currentTask, updateTask]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, triageTasks.length - 1));
  }, [triageTasks.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.key) {
        case 'j':
          e.preventDefault();
          handleNext();
          break;
        case 'k':
          e.preventDefault();
          handlePrev();
          break;
        case '1':
          e.preventDefault();
          handleSetPriority('low');
          break;
        case '2':
          e.preventDefault();
          handleSetPriority('medium');
          break;
        case '3':
          e.preventDefault();
          handleSetPriority('high');
          break;
        case 'Enter':
          e.preventDefault();
          handleAccept();
          break;
        case 's':
          e.preventDefault();
          handleSnooze();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSetPriority, handleAccept, handleSnooze]);

  if (remaining === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          Inbox Zero
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          All backlog tasks have been triaged. Nice work.
        </p>
      </div>
    );
  }

  const priorityColors: Record<TaskPriority, string> = {
    low: 'bg-status-info/10 text-status-info border-status-info/30',
    medium: 'bg-status-warning/10 text-status-warning-text dark:text-status-warning-text-dark border-status-warning/30',
    high: 'bg-status-error/10 text-status-error border-status-error/30',
  };

  return (
    <div className="triage-inbox max-w-2xl mx-auto">
      {/* Counter */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide">
          Triage Inbox
        </h3>
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-accent-blue/10 text-accent-blue">
          {remaining} {remaining === 1 ? 'item' : 'items'} to triage
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1 rounded-full bg-surface-light-elevated dark:bg-surface-dark-elevated overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-blue transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / remaining) * 100}%` }}
          />
        </div>
        <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1 text-right">
          {currentIndex + 1} of {remaining}
        </div>
      </div>

      {/* Current Task Card */}
      {currentTask && (
        <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
          {/* Card Number */}
          {currentTask.cardNumber && (
            <span className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
              KAN-{currentTask.cardNumber}
            </span>
          )}

          {/* Title */}
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mt-1 mb-3">
            {currentTask.title}
          </h2>

          {/* Description */}
          {currentTask.description && (
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4 whitespace-pre-wrap">
              {currentTask.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <span className={`text-xs px-2 py-1 rounded border ${priorityColors[currentTask.priority]}`}>
              {currentTask.priority}
            </span>
            {currentTask.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue">
                #{tag}
              </span>
            ))}
            {currentTask.dueDate && (
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Due: {new Date(currentTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Created: {new Date(currentTask.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap border-t border-border-light dark:border-border-dark pt-4">
            {/* Priority shortcuts */}
            <div className="flex items-center gap-1 mr-4">
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary mr-1">Priority:</span>
              {(['low', 'medium', 'high'] as const).map((p, i) => (
                <button
                  key={p}
                  onClick={() => handleSetPriority(p)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    currentTask.priority === p
                      ? priorityColors[p] + ' font-semibold'
                      : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-blue'
                  }`}
                >
                  <kbd className="font-mono mr-1">{i + 1}</kbd>{p}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <button
              onClick={handleSnooze}
              className="px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-colors"
              title="Snooze for 24h (s)"
            >
              <kbd className="font-mono text-xs mr-1">s</kbd> Snooze
            </button>
            <button
              onClick={() => onTaskClick(currentTask)}
              className="px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-colors"
              title="View details"
            >
              Details
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 text-sm font-medium rounded bg-accent-blue text-white hover:bg-accent-blue-hover transition-colors"
              title="Accept & move to Todo (Enter)"
            >
              <kbd className="font-mono text-xs mr-1">↵</kbd> Accept
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <kbd className="font-mono text-xs mr-1">k</kbd> Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex >= remaining - 1}
          className="px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <kbd className="font-mono text-xs ml-1">j</kbd>
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="mt-6 text-center text-xs text-text-light-secondary dark:text-text-dark-secondary">
        <kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark font-mono">j/k</kbd> navigate
        {' '}<kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark font-mono">1-3</kbd> priority
        {' '}<kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark font-mono">Enter</kbd> accept
        {' '}<kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark font-mono">s</kbd> snooze
      </div>
    </div>
  );
};
