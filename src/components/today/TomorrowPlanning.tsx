/**
 * TomorrowPlanning - Plan Tomorrow's tasks
 *
 * Shows tomorrow's view with tasks and calendar events.
 * Users can move tasks from backlog to tomorrow's list.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
} from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useCalendarStore } from '../../stores/useCalendarStore';

interface TomorrowPlanningProps {
  today: Date;
}

export const TomorrowPlanning: React.FC<TomorrowPlanningProps> = ({ today }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);

  const tasks = useKanbanStore((s) => s.tasks);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const eventsMap = useCalendarStore((s) => s.events);

  const tomorrow = useMemo(() => startOfDay(addDays(today, 1)), [today]);
  const tomorrowKey = format(tomorrow, 'yyyy-M-d');
  const tomorrowEventsKey = format(tomorrow, 'yyyy-M-d');

  // Tasks due tomorrow
  const tomorrowTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueKey = format(new Date(task.dueDate), 'yyyy-M-d');
      return dueKey === tomorrowKey;
    });
  }, [tasks, tomorrowKey]);

  // Tomorrow's events
  const tomorrowEvents = useMemo(() => {
    return eventsMap[tomorrowEventsKey] || [];
  }, [eventsMap, tomorrowEventsKey]);

  // Backlog tasks (no due date or in backlog status, not done)
  const backlogTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          t.status !== 'done' &&
          (t.status === 'backlog' || !t.dueDate) &&
          !t.archivedAt
      )
      .slice(0, 20); // Limit to 20 for performance
  }, [tasks]);

  const handleMoveTomorrow = useCallback(
    (taskId: string) => {
      updateTask(taskId, {
        dueDate: format(tomorrow, 'yyyy-MM-dd'),
        status: 'todo',
      });
    },
    [updateTask, tomorrow]
  );

  const handleRemoveFromTomorrow = useCallback(
    (taskId: string) => {
      updateTask(taskId, { dueDate: null });
    },
    [updateTask]
  );

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-accent-blue" />
          <span className="font-semibold text-text-light-primary dark:text-text-dark-primary text-sm">
            Plan Tomorrow
          </span>
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {format(tomorrow, 'EEE, MMM d')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tomorrowTasks.length > 0 && (
            <span className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded">
              {tomorrowTasks.length} tasks
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Tomorrow's events */}
          {tomorrowEvents.length > 0 && (
            <div>
              <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Events
              </div>
              <div className="space-y-1">
                {tomorrowEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-accent-blue/5 text-sm"
                  >
                    {event.startTime && (
                      <span className="text-xs text-accent-blue font-mono">
                        {event.startTime}
                      </span>
                    )}
                    <span className="text-text-light-primary dark:text-text-dark-primary truncate">
                      {event.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's tasks */}
          <div>
            <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1.5">
              Planned Tasks
            </div>
            {tomorrowTasks.length === 0 ? (
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary py-2">
                No tasks planned yet. Add from your backlog below.
              </p>
            ) : (
              <div className="space-y-1">
                {tomorrowTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated group"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.priority === 'high'
                          ? 'bg-accent-red'
                          : task.priority === 'medium'
                          ? 'bg-accent-yellow'
                          : 'bg-accent-green'
                      }`}
                    />
                    <span className="flex-1 text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                      {task.title}
                    </span>
                    <button
                      onClick={() => handleRemoveFromTomorrow(task.id)}
                      className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary opacity-0 group-hover:opacity-100 hover:text-accent-red transition-all"
                      title="Remove from tomorrow"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add from backlog */}
          <div>
            <button
              onClick={() => setShowBacklog(!showBacklog)}
              className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add from backlog
              {showBacklog ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showBacklog && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border-t border-border-light dark:border-border-dark pt-2">
                {backlogTasks.length === 0 ? (
                  <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary py-1">
                    No backlog tasks available
                  </p>
                ) : (
                  backlogTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated group"
                    >
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === 'high'
                            ? 'bg-accent-red'
                            : task.priority === 'medium'
                            ? 'bg-accent-yellow'
                            : 'bg-accent-green'
                        }`}
                      />
                      <span className="flex-1 text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <Clock className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
                      )}
                      <button
                        onClick={() => handleMoveTomorrow(task.id)}
                        className="flex-shrink-0 text-xs text-accent-primary opacity-0 group-hover:opacity-100 hover:text-accent-primary-hover transition-all px-1.5 py-0.5 rounded bg-accent-primary/10"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
