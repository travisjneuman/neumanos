/**
 * RolloverModal - Auto-rollover for incomplete tasks from yesterday
 *
 * Shown at start of day (or during morning ritual) when yesterday
 * has incomplete tasks. Lets user move, reschedule, or drop each task.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { RolloverDecision } from '../../stores/useDailyPlanningStore';

interface RolloverModalProps {
  dateKey?: string;
  onComplete: () => void;
  onDismiss: () => void;
}

const DECISION_OPTIONS: Array<{ value: RolloverDecision; icon: React.ReactNode; label: string; desc: string; color: string }> = [
  { value: 'move', icon: <ArrowRight className="w-4 h-4" />, label: 'Move to today', desc: 'Add to today\'s plan', color: 'text-accent-blue' },
  { value: 'reschedule', icon: <CalendarClock className="w-4 h-4" />, label: 'Keep in backlog', desc: 'Remove due date', color: 'text-accent-yellow' },
  { value: 'drop', icon: <Trash2 className="w-4 h-4" />, label: 'Drop', desc: 'Send to backlog', color: 'text-accent-red' },
];

export const RolloverModal: React.FC<RolloverModalProps> = ({
  onComplete,
  onDismiss,
}) => {
  const tasks = useKanbanStore((s) => s.tasks);
  const updateTask = useKanbanStore((s) => s.updateTask);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Incomplete tasks from yesterday (or any past date)
  const incompleteTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate || task.status === 'done' || task.archivedAt) return false;
      const dueDate = new Date(task.dueDate);
      // Task is overdue if due before today
      return dueDate < today;
    });
  }, [tasks, today]);

  const [decisions, setDecisions] = useState<Record<string, RolloverDecision>>(() => {
    // Default all to 'move'
    const initial: Record<string, RolloverDecision> = {};
    incompleteTasks.forEach((t) => { initial[t.id] = 'move'; });
    return initial;
  });

  const setDecision = useCallback((taskId: string, decision: RolloverDecision) => {
    setDecisions((prev) => ({ ...prev, [taskId]: decision }));
  }, []);

  // Select all with same decision
  const setAll = useCallback((decision: RolloverDecision) => {
    setDecisions((prev) => {
      const next = { ...prev };
      incompleteTasks.forEach((t) => { next[t.id] = decision; });
      return next;
    });
  }, [incompleteTasks]);

  const handleApply = useCallback(() => {
    const todayDate = format(today, 'yyyy-MM-dd');

    incompleteTasks.forEach((task) => {
      const decision = decisions[task.id] || 'move';
      if (decision === 'move') {
        updateTask(task.id, { dueDate: todayDate });
      } else if (decision === 'reschedule' || decision === 'drop') {
        updateTask(task.id, { dueDate: null, status: 'backlog' });
      }
    });

    onComplete();
  }, [incompleteTasks, decisions, today, updateTask, onComplete]);

  if (incompleteTasks.length === 0) {
    // No rollover needed
    onComplete();
    return null;
  }

  const moveCount = incompleteTasks.filter((t) => decisions[t.id] === 'move').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent-yellow" />
            <h2 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Incomplete Tasks
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
            You have {incompleteTasks.length} incomplete task{incompleteTasks.length !== 1 ? 's' : ''} from previous days.
          </p>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">Quick:</span>
            <button
              onClick={() => setAll('move')}
              className="text-xs px-2 py-0.5 rounded bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
            >
              Move all to today
            </button>
            <button
              onClick={() => setAll('drop')}
              className="text-xs px-2 py-0.5 rounded bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors"
            >
              Drop all
            </button>
          </div>

          {/* Task list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {incompleteTasks.map((task) => {
              const current = decisions[task.id] || 'move';
              return (
                <div
                  key={task.id}
                  className="px-3 py-2.5 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-accent-red' :
                      task.priority === 'medium' ? 'bg-accent-yellow' : 'bg-accent-green'
                    }`} />
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate flex-1">
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0">
                        due {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {DECISION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDecision(task.id, opt.value)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          current === opt.value
                            ? `${opt.color} bg-surface-light dark:bg-surface-dark border border-current/20`
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-secondary dark:hover:text-text-dark-secondary'
                        }`}
                        title={opt.desc}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-sm rounded-lg text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors"
          >
            <Check className="w-4 h-4" />
            Apply
            {moveCount > 0 && (
              <span className="text-xs opacity-75">({moveCount} to today)</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
