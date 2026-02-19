/**
 * GanttTimeline Component
 * Main SVG timeline canvas with task bars and grid
 * Phase 7: Enhanced with dependent task shift confirmation
 */

import { useRef, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { Task, TaskStatus, ProjectBaseline } from '../../types';
import { TimelineScale } from './TimelineScale';
import { TaskBar } from './TaskBar';
import { DependencyLine } from './DependencyLine';
import { ExportDialog } from './ExportDialog';
import { DependentShiftDialog } from './DependentShiftDialog';
import { ROW_HEIGHT, dateToX, type ZoomLevel } from './utils';
import { getBaselineTask } from '../../utils/baseline';
import { useKanbanStore } from '../../stores/useKanbanStore';

interface TaskShift {
  taskId: string;
  newStartDate: string | null;
  newDueDate: string | null;
  reason: string;
}

interface GanttTimelineProps {
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  zoom: ZoomLevel;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  criticalTaskIds?: string[]; // Phase 1.3: Critical path
  baseline?: ProjectBaseline | null; // Phase 1.4: Baseline comparison
}

export function GanttTimeline({
  tasks,
  startDate,
  endDate,
  zoom,
  onTaskUpdate,
  onTaskClick,
  criticalTaskIds = [],
  baseline = null,
}: GanttTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Phase 7: Dependent shift confirmation state
  const [pendingShifts, setPendingShifts] = useState<TaskShift[]>([]);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const applyDependentShifts = useKanbanStore((state) => state.applyDependentShifts);

  // Calculate timeline width based on date range
  const timelineWidth = dateToX(endDate, startDate, zoom);

  // Update container width on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Group tasks by status (swimlanes)
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const statuses: TaskStatus[] = ['backlog', 'todo', 'inprogress', 'review', 'done'];
  const swimlanes = statuses.map((status) => ({
    status,
    tasks: groupedTasks[status] || [],
  }));

  // Calculate today marker position
  const todayX = dateToX(new Date(), startDate, zoom);
  const isTodayVisible = todayX >= 0 && todayX <= timelineWidth;

  // Create task lookup map for dependency rendering
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  // Create task position map (task ID -> row index)
  const taskRowMap = new Map<string, number>();
  swimlanes.forEach((swimlane, swimlaneIndex) => {
    swimlane.tasks.forEach((task) => {
      taskRowMap.set(task.id, swimlaneIndex);
    });
  });

  // Status labels
  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case 'backlog':
        return 'Backlog';
      case 'todo':
        return 'To Do';
      case 'inprogress':
        return 'In Progress';
      case 'review':
        return 'In Review';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  // Helper: Convert subtasks to full Task objects with hierarchy
  interface TaskWithHierarchy extends Task {
    level: number;
    parentId?: string;
    hasSubtasks: boolean;
  }

  const buildTaskHierarchy = (tasks: Task[]): TaskWithHierarchy[] => {
    const result: TaskWithHierarchy[] = [];

    tasks.forEach((task) => {
      // Add parent task
      result.push({
        ...task,
        level: 0,
        hasSubtasks: !!task.subtasks && task.subtasks.length > 0,
      });

      // Add subtasks if parent is expanded
      if (task.subtasks && task.subtasks.length > 0 && expandedTaskIds.has(task.id)) {
        task.subtasks.forEach((subtask) => {
          // Convert Subtask to Task-like object
          const subtaskAsTask: TaskWithHierarchy = {
            id: subtask.id,
            title: subtask.title,
            description: subtask.description || '',
            status: subtask.completed ? 'done' : 'todo',
            created: subtask.createdAt,
            startDate: null,
            dueDate: subtask.dueDate || null,
            priority: subtask.priority || 'medium',
            tags: [],
            order: subtask.order,
            level: 1,
            parentId: subtask.parentTaskId,
            hasSubtasks: false,
            progress: subtask.completed ? 100 : 0,
            projectIds: [],
          };
          result.push(subtaskAsTask);
        });
      }
    });

    return result;
  };

  // Toggle expand/collapse for task
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Phase 7: Handle dependent shift confirmation
  const handleDependentShift = (shifts: TaskShift[]) => {
    setPendingShifts(shifts);
    setIsShiftDialogOpen(true);
  };

  const handleShiftConfirm = () => {
    applyDependentShifts(pendingShifts);
    setIsShiftDialogOpen(false);
    setPendingShifts([]);
  };

  const handleShiftCancel = () => {
    setIsShiftDialogOpen(false);
    setPendingShifts([]);
  };

  // Calculate summary bar dates for parent tasks
  const calculateSummaryDates = (task: Task): { start: Date | null; end: Date | null } => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return {
        start: task.startDate ? new Date(task.startDate) : null,
        end: task.dueDate ? new Date(task.dueDate) : null,
      };
    }

    // Get all subtask dates
    const subtaskDates = task.subtasks
      .filter((st) => st.dueDate)
      .map((st) => new Date(st.dueDate!));

    if (subtaskDates.length === 0) {
      return {
        start: task.startDate ? new Date(task.startDate) : null,
        end: task.dueDate ? new Date(task.dueDate) : null,
      };
    }

    // Min and max dates
    const minDate = new Date(Math.min(...subtaskDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...subtaskDates.map((d) => d.getTime())));

    return { start: minDate, end: maxDate };
  };

  return (
    <>
      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        tasks={tasks}
        timelineElement={timelineRef.current}
        dateRange={{ start: startDate, end: endDate }}
        projectName="Project Timeline"
      />

      {/* Phase 7: Dependent Shift Confirmation Dialog */}
      <DependentShiftDialog
        isOpen={isShiftDialogOpen}
        shifts={pendingShifts}
        tasks={tasks}
        onConfirm={handleShiftConfirm}
        onCancel={handleShiftCancel}
      />

      <div ref={containerRef} className="relative w-full overflow-auto">
        {/* Toolbar */}
        <div className="sticky top-0 z-30 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-4 py-2 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-accent-primary text-white dark:text-dark-background rounded-lg hover:bg-accent-primary-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div ref={timelineRef} style={{ width: Math.max(timelineWidth, containerWidth), minHeight: 400 }}>
          {/* Timeline Scale */}
          <TimelineScale
            startDate={startDate}
            endDate={endDate}
            zoom={zoom}
            width={Math.max(timelineWidth, containerWidth)}
          />

        {/* Dependency arrows (SVG overlay) */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: Math.max(timelineWidth, containerWidth), height: swimlanes.length * ROW_HEIGHT, marginTop: 0 }}
        >
          {tasks.flatMap((task) => {
            if (!task.dependencies || task.dependencies.length === 0) return [];

            return task.dependencies.map((dep) => {
              const sourceTask = taskMap.get(dep.taskId); // The task this one depends on (blocker)
              const targetTask = task; // Current task (blocked)
              const sourceRowIndex = taskRowMap.get(dep.taskId);
              const targetRowIndex = taskRowMap.get(task.id);

              if (!sourceTask || sourceRowIndex === undefined || targetRowIndex === undefined) {
                return null;
              }

              // Only render if both tasks have dates
              if (!sourceTask.dueDate || !targetTask.startDate) {
                return null;
              }

              return (
                <DependencyLine
                  key={`${task.id}-${dep.taskId}`}
                  sourceTask={sourceTask}
                  targetTask={targetTask}
                  dependencyType={dep.type}
                  lag={dep.lag}
                  sourceRowIndex={sourceRowIndex}
                  targetRowIndex={targetRowIndex}
                  timelineStart={startDate}
                  zoom={zoom}
                />
              );
            });
          })}
        </svg>

        {/* Swimlanes */}
        <div className="relative" style={{ marginTop: 0 }}>
          {swimlanes.map((swimlane) => {
            // Build hierarchy for this swimlane
            const hierarchyTasks = buildTaskHierarchy(swimlane.tasks);

            return (
              <div
                key={swimlane.status}
                className="relative border-b border-border-light dark:border-border-dark"
                style={{ minHeight: ROW_HEIGHT }}
              >
                {/* Swimlane label */}
                <div
                  className="sticky left-0 z-10 flex items-center px-3 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark"
                  style={{ width: 150, minHeight: ROW_HEIGHT }}
                >
                  <span className="text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                    {getStatusLabel(swimlane.status)} ({swimlane.tasks.length})
                  </span>
                </div>

                {/* Task bars with hierarchy */}
                <div className="absolute inset-0" style={{ left: 150 }}>
                  {hierarchyTasks
                    .filter((task) => task.startDate || task.dueDate || task.hasSubtasks) // Show tasks with dates or parents with subtasks
                    .map((task, index) => {
                      // For parent tasks with collapsed subtasks, show summary bar
                      const summaryDates = task.hasSubtasks && !expandedTaskIds.has(task.id)
                        ? calculateSummaryDates(task)
                        : { start: task.startDate ? new Date(task.startDate) : null, end: task.dueDate ? new Date(task.dueDate) : null };

                      // Use summary dates if available
                      const displayTask = task.hasSubtasks && !expandedTaskIds.has(task.id)
                        ? {
                            ...task,
                            startDate: summaryDates.start?.toISOString().split('T')[0] || task.startDate,
                            dueDate: summaryDates.end?.toISOString().split('T')[0] || task.dueDate,
                          }
                        : task;

                      return (
                        <TaskBar
                          key={task.id}
                          task={displayTask}
                          startDate={startDate}
                          zoom={zoom}
                          rowY={index * 40} // Stack vertically
                          onUpdate={onTaskUpdate}
                          onClick={onTaskClick}
                          isCritical={criticalTaskIds.includes(task.id)}
                          baselineTask={getBaselineTask(baseline, task.id)}
                          isSubtask={task.level > 0}
                          isParent={task.hasSubtasks}
                          isExpanded={expandedTaskIds.has(task.id)}
                          onToggleExpand={() => toggleTaskExpansion(task.id)}
                          indentLevel={task.level}
                          allTasks={tasks}
                          onDependentShift={handleDependentShift}
                        />
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today marker */}
        {isTodayVisible && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent-primary pointer-events-none z-20"
            style={{ left: 150 + todayX }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-accent-primary rounded-full" />
            <div className="absolute -top-6 -left-6 text-xs font-semibold text-accent-primary whitespace-nowrap">
              Today
            </div>
          </div>
        )}

        {/* Empty state */}
        {tasks.filter((t) => t.startDate || t.dueDate).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-text-light-tertiary dark:text-text-dark-tertiary">
              <p className="text-sm">No tasks with dates to display</p>
              <p className="text-xs mt-1">Add start or due dates to your tasks to see them on the timeline</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
