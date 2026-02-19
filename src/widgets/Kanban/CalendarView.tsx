import React, { useState, useMemo } from 'react';
import { MonthlyCalendarGrid } from '../../components/shared/MonthlyCalendarGrid';
import { useKanbanStore } from '../../stores/useKanbanStore';
import type { Task, KanbanColumn, TaskStatus } from '../../types';

interface CalendarViewProps {
  tasks: Task[]; // Filtered tasks from parent
  columns: KanbanColumn[];
  onTaskClick: (task: Task) => void;
  onAddTask?: (dueDate: string) => void;
}

/**
 * CalendarView - Month calendar view for Kanban widget
 * Shows tasks on their due dates, respects current filters
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  columns,
  onTaskClick,
  onAddTask,
}) => {
  const { addTask } = useKanbanStore();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Group tasks by due date (YYYY-M-D format)
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    tasks.forEach(task => {
      if (task.dueDate) {
        // Task dueDate is already in YYYY-M-D or YYYY-MM-DD format
        // Normalize to YYYY-M-D to match MonthlyCalendarGrid dateKey
        const parts = task.dueDate.split('-');
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const dateKey = `${year}-${month}-${day}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Count tasks without due dates
  const tasksWithoutDueDate = useMemo(() => {
    return tasks.filter(task => !task.dueDate).length;
  }, [tasks]);

  // Get column color for task
  const getColumnColor = (task: Task) => {
    const column = columns.find(col => col.id === task.status);
    return column?.color || 'bg-text-light-secondary dark:bg-text-dark-secondary';
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-status-error text-white';
      case 'medium':
        return 'bg-accent-blue text-white';
      case 'low':
        return 'bg-text-light-secondary dark:bg-text-dark-secondary text-white';
      default:
        return 'bg-text-light-secondary dark:bg-text-dark-secondary text-white';
    }
  };

  // Handle day click - add task with pre-filled due date
  const handleDayClick = (dateKey: string) => {
    // Convert YYYY-M-D to YYYY-MM-DD for task dueDate
    const parts = dateKey.split('-');
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    const dueDate = `${year}-${month}-${day}`;

    if (onAddTask) {
      onAddTask(dueDate);
    } else {
      // Default: create task in first column with pre-filled due date
      const firstColumn = columns[0];
      addTask({
        title: 'New Task',
        description: '',
        status: (firstColumn?.id || 'todo') as TaskStatus,
        priority: 'medium',
        tags: [],
        startDate: null,
        dueDate,
        assignees: [],
        projectIds: [],
      });
    }
  };

  // Handle month navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Render day content
  const renderDayContent = (data: { day: number; dateKey: string; isToday: boolean; isCurrentMonth: boolean }) => {
    const dayTasks = tasksByDate[data.dateKey] || [];

    return (
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {dayTasks.slice(0, 3).map(task => (
          <button
            key={task.id}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
            className={`text-xs px-1.5 py-0.5 rounded text-left truncate transition-all hover:scale-105 hover:shadow-sm ${
              getColumnColor(task)
            } text-white`}
            title={`${task.title} (${task.priority})`}
          >
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
              <span className="truncate">{task.title}</span>
            </div>
          </button>
        ))}
        {dayTasks.length > 3 && (
          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary px-1">
            +{dayTasks.length - 3} more
          </div>
        )}
      </div>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1.5 text-sm font-medium bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
            title="Previous Month"
          >
            ← Prev
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors"
            title="Go to Today"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1.5 text-sm font-medium bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
            title="Next Month"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Tasks without due dates notice */}
      {tasksWithoutDueDate > 0 && (
        <div className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            {tasksWithoutDueDate} task{tasksWithoutDueDate === 1 ? '' : 's'} without due date (hidden in calendar view)
          </span>
        </div>
      )}

      {/* Calendar Grid */}
      <MonthlyCalendarGrid
        year={currentYear}
        month={currentMonth}
        renderDayContent={renderDayContent}
        onDayClick={handleDayClick}
      />

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
          <p className="text-sm">No tasks to display. Create a task to get started!</p>
        </div>
      )}
    </div>
  );
};
