/**
 * WeeklyPlanning - Week-at-a-glance planning view
 *
 * Shows the current week's tasks and events by day.
 * Users can see workload distribution and reassign tasks across days.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';

interface WeeklyPlanningProps {
  today: Date;
}

/** Format minutes to a short string */
const formatMin = (mins: number): string => {
  if (mins === 0) return '';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
};

interface DaySummary {
  date: Date;
  dateKey: string;
  dayLabel: string;
  isToday: boolean;
  isPast: boolean;
  taskCount: number;
  completedCount: number;
  eventCount: number;
  plannedMinutes: number;
  tasks: Array<{ id: string; title: string; status: string; priority: 'low' | 'medium' | 'high' }>;
}

export const WeeklyPlanning: React.FC<WeeklyPlanningProps> = ({ today }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const tasks = useKanbanStore((s) => s.tasks);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const eventsMap = useCalendarStore((s) => s.events);
  const getTotalPlannedMinutes = useDailyPlanningStore((s) => s.getTotalPlannedMinutes);

  const weekStart = useMemo(
    () => addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7),
    [today, weekOffset]
  );

  const days: DaySummary[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateKey = format(date, 'yyyy-M-d');
      const dayStart = startOfDay(date);

      const dayTasks = tasks.filter((task) => {
        if (!task.dueDate) return false;
        return format(new Date(task.dueDate), 'yyyy-M-d') === dateKey;
      });

      const dayEvents = eventsMap[dateKey] || [];

      return {
        date,
        dateKey,
        dayLabel: format(date, 'EEE'),
        isToday: isToday(date),
        isPast: isBefore(dayStart, startOfDay(today)) && !isToday(date),
        taskCount: dayTasks.length,
        completedCount: dayTasks.filter((t) => t.status === 'done').length,
        eventCount: dayEvents.length,
        plannedMinutes: getTotalPlannedMinutes(dateKey),
        tasks: dayTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
        })),
      };
    });
  }, [weekStart, tasks, eventsMap, today, getTotalPlannedMinutes]);

  const totalTasks = useMemo(() => days.reduce((s, d) => s + d.taskCount, 0), [days]);
  const totalCompleted = useMemo(() => days.reduce((s, d) => s + d.completedCount, 0), [days]);

  const handleMoveTask = useCallback(
    (taskId: string, _targetDateKey: string, targetDate: Date) => {
      updateTask(taskId, { dueDate: format(targetDate, 'yyyy-MM-dd') });
    },
    [updateTask]
  );

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    if (format(weekStart, 'MMM') === format(end, 'MMM')) {
      return `${format(weekStart, 'MMM d')} - ${format(end, 'd')}`;
    }
    return `${format(weekStart, 'MMM d')} - ${format(end, 'MMM d')}`;
  }, [weekStart]);

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent-secondary" />
          <span className="font-semibold text-text-light-primary dark:text-text-dark-primary text-sm">
            Weekly Plan
          </span>
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {totalCompleted}/{totalTasks} tasks
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {weekLabel}
              </span>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-xs text-accent-primary hover:text-accent-primary-hover"
                >
                  This week
                </button>
              )}
            </div>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            </button>
          </div>

          {/* Day grid */}
          <div className="space-y-1">
            {days.map((day) => (
              <div key={day.dateKey}>
                <button
                  onClick={() =>
                    setExpandedDay(expandedDay === day.dateKey ? null : day.dateKey)
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    day.isToday
                      ? 'bg-accent-primary/5 border border-accent-primary/20'
                      : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                  } ${day.isPast ? 'opacity-60' : ''}`}
                >
                  {/* Day name + date */}
                  <div className="w-16 flex-shrink-0">
                    <span
                      className={`text-xs font-medium ${
                        day.isToday
                          ? 'text-accent-primary'
                          : 'text-text-light-secondary dark:text-text-dark-secondary'
                      }`}
                    >
                      {day.dayLabel}
                    </span>
                    <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary ml-1">
                      {format(day.date, 'd')}
                    </span>
                  </div>

                  {/* Task progress bar */}
                  <div className="flex-1 h-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full overflow-hidden">
                    {day.taskCount > 0 && (
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          day.completedCount === day.taskCount
                            ? 'bg-accent-green'
                            : 'bg-accent-primary'
                        }`}
                        style={{
                          width: `${(day.completedCount / day.taskCount) * 100}%`,
                        }}
                      />
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0">
                    {day.taskCount > 0 && (
                      <span>
                        {day.completedCount}/{day.taskCount}
                      </span>
                    )}
                    {day.eventCount > 0 && (
                      <span className="text-accent-blue">{day.eventCount}e</span>
                    )}
                    {day.plannedMinutes > 0 && (
                      <span className="text-accent-secondary">
                        {formatMin(day.plannedMinutes)}
                      </span>
                    )}
                  </div>

                  {day.taskCount > 0 && (
                    <ChevronRight
                      className={`w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary transition-transform ${
                        expandedDay === day.dateKey ? 'rotate-90' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Expanded day tasks */}
                {expandedDay === day.dateKey && day.tasks.length > 0 && (
                  <div className="ml-6 mt-1 mb-2 space-y-0.5">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 px-2 py-1 rounded text-xs group"
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
                        <span
                          className={`flex-1 truncate ${
                            task.status === 'done'
                              ? 'line-through text-text-light-tertiary dark:text-text-dark-tertiary'
                              : 'text-text-light-primary dark:text-text-dark-primary'
                          }`}
                        >
                          {task.title}
                        </span>
                        {/* Quick move buttons: prev/next day */}
                        {!day.isPast && task.status !== 'done' && (
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {days.map((target) => {
                              if (
                                target.dateKey === day.dateKey ||
                                target.isPast
                              )
                                return null;
                              return (
                                <button
                                  key={target.dateKey}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveTask(
                                      task.id,
                                      target.dateKey,
                                      target.date
                                    );
                                  }}
                                  className="px-1 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-accent-primary/10 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-primary transition-colors"
                                  title={`Move to ${format(target.date, 'EEE')}`}
                                >
                                  {target.dayLabel.charAt(0)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
