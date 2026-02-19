/**
 * TaskBar Component
 * Draggable/resizable task bar for Gantt timeline
 * Phase 7: Enhanced with dependent task shift propagation
 */

import { useState, useRef, useEffect } from 'react';
import type { Task, TaskPriority, BaselineTask } from '../../types';
import { TASK_BAR_HEIGHT, type ZoomLevel, dateToX, xToDate, calculateBarWidth, isValidDateRange, snapToGrid } from './utils';
import { calculateVarianceDays, getVarianceStatus } from '../../utils/baseline';
import { calculateDependentShifts } from '../../services/taskDependencyShift';

interface TaskShift {
  taskId: string;
  newStartDate: string | null;
  newDueDate: string | null;
  reason: string;
}

interface TaskBarProps {
  task: Task;
  startDate: Date;
  zoom: ZoomLevel;
  rowY: number;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onClick: (task: Task) => void;
  isCritical?: boolean; // Phase 1.3: Critical path indicator
  baselineTask?: BaselineTask; // Phase 1.4: Baseline comparison
  isSubtask?: boolean; // P2: Is this a subtask
  isParent?: boolean; // P2: Is this a parent task with subtasks
  isExpanded?: boolean; // P2: Is the parent task expanded
  onToggleExpand?: () => void; // P2: Toggle expand/collapse
  indentLevel?: number; // P2: Indentation level (0 = root, 1 = child, etc.)
  allTasks?: Task[]; // Phase 7: All tasks for dependency shift calculation
  onDependentShift?: (shifts: TaskShift[]) => void; // Phase 7: Callback for dependent shifts
}

export function TaskBar({
  task,
  startDate,
  zoom,
  rowY,
  onUpdate,
  onClick,
  isCritical = false,
  baselineTask,
  isParent = false,
  isExpanded = false,
  onToggleExpand,
  indentLevel = 0,
  allTasks = [],
  onDependentShift,
}: TaskBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    startDate: new Date(),
    dueDate: new Date(),
    originalStartDate: null as string | null,
    originalDueDate: null as string | null
  });

  // Get task dates (use defaults if missing)
  const taskStartDate = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date();
  const taskDueDate = task.dueDate ? new Date(task.dueDate) : task.startDate ? new Date(task.startDate) : new Date();

  // Calculate bar position and width
  const indentOffset = indentLevel * 20; // 20px per level
  const x = dateToX(taskStartDate, startDate, zoom) + indentOffset;
  const width = calculateBarWidth(taskStartDate, taskDueDate, zoom);
  const y = rowY + (60 - TASK_BAR_HEIGHT) / 2; // Center in row

  // Priority colors
  const getPriorityColor = (priority: TaskPriority | undefined) => {
    switch (priority) {
      case 'high':
        return 'bg-accent-red text-white';
      case 'medium':
        return 'bg-accent-primary text-white';
      case 'low':
        return 'bg-accent-blue text-white';
      default:
        return 'bg-text-light-tertiary dark:bg-text-dark-tertiary text-white';
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (isResizing) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      startDate: taskStartDate,
      dueDate: taskDueDate,
      originalStartDate: task.startDate,
      originalDueDate: task.dueDate,
    });
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      startDate: taskStartDate,
      dueDate: taskDueDate,
      originalStartDate: task.startDate,
      originalDueDate: task.dueDate,
    });
  };

  // Global mouse move handler
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;

      if (isDragging) {
        // Calculate new dates based on drag offset
        const newStartDate = xToDate(dateToX(dragStart.startDate, startDate, zoom) + deltaX, startDate, zoom);
        const newDueDate = xToDate(dateToX(dragStart.dueDate, startDate, zoom) + deltaX, startDate, zoom);

        // Snap to grid
        const snappedStart = snapToGrid(newStartDate);
        const snappedDue = snapToGrid(newDueDate);

        // Update task dates
        if (isValidDateRange(snappedStart, snappedDue)) {
          onUpdate(task.id, {
            startDate: snappedStart.toISOString(),
            dueDate: snappedDue.toISOString(),
          });
        }
      } else if (isResizing) {
        // Calculate new due date based on resize
        const newDueDate = xToDate(dateToX(dragStart.dueDate, startDate, zoom) + deltaX, startDate, zoom);
        const snappedDue = snapToGrid(newDueDate);

        // Ensure valid range
        if (isValidDateRange(dragStart.startDate, snappedDue)) {
          onUpdate(task.id, {
            dueDate: snappedDue.toISOString(),
          });
        }
      }
    };

    const handleMouseUp = () => {
      // Phase 7: Calculate dependent shifts when drag/resize ends
      if ((isDragging || isResizing) && allTasks.length > 0 && onDependentShift) {
        const currentTask = allTasks.find(t => t.id === task.id);
        if (currentTask) {
          // Check if dates actually changed
          const startChanged = currentTask.startDate !== dragStart.originalStartDate;
          const dueChanged = currentTask.dueDate !== dragStart.originalDueDate;

          if (startChanged || dueChanged) {
            // Calculate shifts for dependent tasks
            const shifts = calculateDependentShifts(
              currentTask,
              dragStart.originalStartDate,
              dragStart.originalDueDate,
              allTasks
            );

            if (shifts.length > 0) {
              // Notify parent to show confirmation dialog
              onDependentShift(shifts);
            }
          }
        }
      }

      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, task.id, startDate, zoom, onUpdate, allTasks, onDependentShift]);

  // Phase 1.5: Progress percentage (0-100)
  const progress = task.progress || 0;

  // Get progress fill color (darker shade of bar color)
  const getProgressFillColor = (priority: TaskPriority | undefined): string => {
    if (isCritical) {
      return 'rgba(220, 38, 38, 0.8)'; // Critical red (darker)
    }
    switch (priority) {
      case 'high':
        return 'rgba(220, 38, 38, 0.9)'; // Darker accent-red
      case 'medium':
        return 'rgba(157, 23, 77, 0.9)'; // Darker accent-primary
      case 'low':
        return 'rgba(59, 130, 246, 0.9)'; // Darker accent-blue
      default:
        return 'rgba(115, 115, 115, 0.9)'; // Darker neutral
    }
  };

  // Phase 1.4: Calculate baseline variance
  const varianceDays = baselineTask ? calculateVarianceDays(task, baselineTask) : null;
  const varianceStatus = getVarianceStatus(varianceDays);

  // Baseline bar positioning (if baseline exists)
  let baselineX = 0;
  let baselineWidth = 0;
  if (baselineTask && (baselineTask.startDate || baselineTask.dueDate)) {
    const baselineStartDate = baselineTask.startDate ? new Date(baselineTask.startDate) : baselineTask.dueDate ? new Date(baselineTask.dueDate) : new Date();
    const baselineDueDate = baselineTask.dueDate ? new Date(baselineTask.dueDate) : baselineTask.startDate ? new Date(baselineTask.startDate) : new Date();
    baselineX = dateToX(baselineStartDate, startDate, zoom);
    baselineWidth = calculateBarWidth(baselineStartDate, baselineDueDate, zoom);
  }

  // Phase 1.6: Milestone rendering (diamond marker instead of bar)
  if (task.isMilestone) {
    const milestoneDate = task.dueDate ? new Date(task.dueDate) : new Date();
    const milestoneX = dateToX(milestoneDate, startDate, zoom);
    const milestoneY = rowY + (60 - 28) / 2; // Center 28px diagonal diamond

    return (
      <div
        className="absolute cursor-pointer group"
        style={{ left: milestoneX - 14, top: milestoneY }} // Center diamond on date
        onClick={(e) => {
          e.stopPropagation();
          onClick(task);
        }}
      >
        {/* Diamond marker (rotated square) */}
        <div
          className={`w-5 h-5 rotate-45 shadow-md border-2 transition-all group-hover:scale-110 ${
            isCritical
              ? 'bg-status-error border-status-error-border dark:border-status-error-border-dark'
              : `border-border-light dark:border-border-dark ${getPriorityColor(task.priority)}`
          }`}
        />

        {/* Label (to the right of diamond, shown on hover) */}
        <div
          className="absolute left-8 top-0 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-surface-light dark:bg-surface-dark px-2 py-1 rounded shadow-md"
          style={{ transform: 'translateY(-25%)' }}
        >
          📍 {task.title}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Baseline bar (behind current bar) */}
      {baselineTask && (baselineTask.startDate || baselineTask.dueDate) && (
        <div
          className="absolute rounded-button border border-dashed border-border-light dark:border-border-dark bg-surface-light/30 dark:bg-surface-dark/30"
          style={{
            left: baselineX,
            top: y,
            width: Math.max(baselineWidth, 40),
            height: TASK_BAR_HEIGHT,
            pointerEvents: 'none', // Don't interfere with current bar interactions
          }}
        />
      )}

      {/* Current task bar */}
      <div
        ref={barRef}
        className={`absolute rounded-button shadow-sm transition-shadow hover:shadow-md cursor-pointer ${
          isCritical
            ? 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border-2 border-status-error-border dark:border-status-error-border-dark font-bold'
            : `border border-border-light dark:border-border-dark ${getPriorityColor(task.priority)}`
        } ${isDragging || isResizing ? 'opacity-70' : ''}`}
        style={{
          left: x,
          top: y,
          width: Math.max(width, 40), // Minimum width
          height: TASK_BAR_HEIGHT,
        }}
        onMouseDown={handleDragStart}
        onClick={(e) => {
          if (!isDragging && !isResizing) {
            e.stopPropagation();
            onClick(task);
          }
        }}
      >
        {/* Phase 1.5: Progress fill indicator */}
        {progress > 0 && (
          <div
            className="absolute inset-0 rounded-button"
            style={{
              width: `${progress}%`,
              backgroundColor: getProgressFillColor(task.priority),
            }}
          />
        )}

        {/* Task title + progress % */}
        <div className="absolute inset-0 flex items-center gap-1 px-2 text-xs font-medium truncate z-10">
          {/* Expand/collapse icon for parent tasks */}
          {isParent && onToggleExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="shrink-0 hover:bg-surface-light/20 dark:hover:bg-surface-dark/20 rounded transition-colors p-0.5"
              aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
            >
              <span className="text-[10px]">{isExpanded ? '▼' : '▶'}</span>
            </button>
          )}
          {isCritical && (
            <span className="shrink-0 text-[10px] font-bold">🔴</span>
          )}
          <span className="truncate">{task.title}</span>
          {progress > 0 && width >= 80 && (
            <span className="shrink-0 opacity-75 text-[10px]">{progress}%</span>
          )}
        </div>

      {/* Phase 1.4: Variance indicator */}
      {baselineTask && varianceDays !== null && varianceStatus !== 'on-track' && (
        <div
          className={`absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
            varianceStatus === 'ahead'
              ? 'bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark border border-status-success-border dark:border-status-success-border-dark'
              : 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark'
          }`}
          style={{ pointerEvents: 'none' }}
        >
          {varianceStatus === 'ahead' ? '▲' : '▼'} {Math.abs(varianceDays)}d
        </div>
      )}

      {/* Resize handle (right edge) */}
      <div
        className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize hover:bg-surface-light/30 dark:hover:bg-surface-dark/30 transition-colors"
        onMouseDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
    </>
  );
}
