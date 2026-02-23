import React, { useState, useEffect, useCallback, memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Paperclip } from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useTimeTrackingStore } from '../../stores/useTimeTrackingStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CustomFieldDisplay } from '../../components/CustomFieldDisplay';
import { TaskTimerButton } from '../../components/tasks/TaskTimerButton';
import { WhenTagBadge } from '../../components/tasks/WhenTagPicker';
import type { Task } from '../../types';

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
  isSelected?: boolean;
  onRegisterRef?: (ref: { triggerEdit: () => void }) => void;
  onCardClick?: (task: Task, tab?: 'subtasks' | 'checklist' | 'comments' | 'activity') => void;
}

const KanbanCardComponent: React.FC<KanbanCardProps> = ({
  task,
  isDragging = false,
  isSelected = false,
  onRegisterRef,
  onCardClick,
}) => {
  const { updateTask, deleteTask, archiveTask, getBlockers, getBlocked, getCriticalPath, getOverdueBlockers } = useKanbanStore();
  const { getTotalTimeForCard, activeEntry } = useTimeTrackingStore();
  const members = useSettingsStore((state) => state.members);
  const taskFieldDefinitions = useSettingsStore((state) => state.customFieldDefinitions.tasks);

  // Phase 1.3: Check if this task is on critical path
  const isCritical = getCriticalPath().includes(task.id);

  // P1: Get overdue blockers for dependency warnings
  const overdueBlockers = getOverdueBlockers(task.id);

  // Phase 3.1: Get assigned members
  const assignedMembers = (task.assignees || [])
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as typeof members;
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get total time logged for this card
  const totalSeconds = getTotalTimeForCard(task.id);
  const hasTimeTracked = totalSeconds > 0;
  const isTimerActive = activeEntry?.taskId === task.id;
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    startDate: task.startDate || '',
    dueDate: task.dueDate || '',
  });

  // Register ref for keyboard shortcut access
  useEffect(() => {
    if (onRegisterRef) {
      onRegisterRef({
        triggerEdit: () => setIsEditing(true),
      });
    }
  }, [onRegisterRef]);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    disabled: isEditing,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const priorityColors = {
    low: 'border-l-status-info',
    medium: 'border-l-status-warning',
    high: 'border-l-status-error',
  };

  const priorityLabels = {
    low: 'Low',
    medium: 'Med',
    high: 'High',
  };

  // Format seconds to hours with 1 decimal (e.g., "2.5h")
  const formatTime = (seconds: number): string => {
    const hours = seconds / 3600;
    return hours < 0.1 ? '<0.1h' : `${hours.toFixed(1)}h`;
  };

  // Get custom fields that are visible in cards and have values for this task
  const activeCustomFields = task.customFields
    ? taskFieldDefinitions
        .filter(field => {
          // Check visibility flag (default to true for backward compatibility)
          const isVisible = field.visibleInCard !== false;
          const value = task.customFields?.[field.id];
          const hasValue = value !== null && value !== undefined && value !== '';
          return isVisible && hasValue;
        })
        .map(field => ({
          field,
          value: task.customFields![field.id]
        }))
    : [];

  const handleSave = useCallback(() => {
    updateTask(task.id, {
      title: editedTask.title.trim() || task.title,
      description: editedTask.description,
      priority: editedTask.priority,
      startDate: editedTask.startDate || null,
      dueDate: editedTask.dueDate || null,
    });
    setIsEditing(false);
    setShowMenu(false);
  }, [task.id, task.title, editedTask, updateTask]);

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    setShowDeleteDialog(true);
    setShowMenu(false);
  }, []);

  const confirmDelete = useCallback(() => {
    deleteTask(task.id);
    setShowDeleteDialog(false);
  }, [task.id, deleteTask]);

  const cancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
    setIsDeleting(false);
  }, []);

  const handleArchive = useCallback(() => {
    archiveTask(task.id);
    setShowMenu(false);
  }, [task.id, archiveTask]);

  const handleCardClick = useCallback(() => {
    if (!isDeleting && onCardClick) {
      onCardClick(task);
    }
  }, [isDeleting, task, onCardClick]);

  if (isEditing) {
    return (
      <div className="kanban-card-edit bg-surface-light dark:bg-surface-dark-elevated rounded-lg p-3 shadow-md border-2 border-accent-blue">
        <input
          type="text"
          value={editedTask.title}
          onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
          placeholder="Task title"
          className="w-full mb-2 px-2 py-1 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue focus:outline-none"
          autoFocus
        />
        <textarea
          value={editedTask.description}
          onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="w-full mb-2 px-2 py-1 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue focus:outline-none resize-none"
        />

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Start Date</label>
            <input
              type="date"
              value={editedTask.startDate}
              onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Due Date</label>
            <input
              type="date"
              value={editedTask.dueDate}
              onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Priority</label>
          <select
            value={editedTask.priority}
            onChange={(e) =>
              setEditedTask({ ...editedTask, priority: e.target.value as any })
            }
            className="w-full px-2 py-1 text-sm border border-border-light dark:border-border-dark rounded bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-1 text-sm bg-accent-blue text-white rounded hover:bg-accent-blue-hover transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 text-sm bg-surface-dark text-white rounded hover:opacity-80 transition-opacity"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Phase 3.4: Get first image attachment for cover
  const coverImage = task.attachments?.find(a => a.fileType.startsWith('image/'));
  const coverMode = task.coverMode || 'fit';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleCardClick}
      className={`kanban-card bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-md border-l-4 ${
        priorityColors[task.priority]
      } cursor-grab active:cursor-grabbing hover:shadow-lg transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${
        isSelected ? 'ring-2 ring-accent-blue ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark' : ''
      } ${coverImage ? 'p-0' : 'p-3'} overflow-hidden rounded-lg`}
    >
      {/* Phase 3.4: Card Cover Image */}
      {coverImage && (
        <div className="relative w-full h-[120px] overflow-hidden rounded-t-lg">
          <img
            src={coverImage.dataUrl}
            alt={coverImage.filename}
            className={`w-full h-full ${
              coverMode === 'fit'
                ? 'object-contain bg-surface-light-elevated dark:bg-surface-dark-elevated'
                : 'object-cover'
            }`}
            loading="lazy"
          />
        </div>
      )}

      <div className={coverImage ? 'p-3' : ''}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          {/* Phase A: Card Number */}
          {task.cardNumber && (
            <span className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary mr-2">
              KAN-{task.cardNumber}
            </span>
          )}
          <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary text-sm inline flex items-center gap-1.5">
            {/* Phase 1.6: Milestone indicator */}
            {task.isMilestone && (
              <span className="shrink-0 text-sm" title="Milestone">📍</span>
            )}
            {task.title}
          </h4>
          {/* Phase 1.3: Critical path indicator */}
          {isCritical && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark">
              🔴 CRITICAL
            </span>
          )}
          {/* P1: Overdue blocker warning */}
          {overdueBlockers.length > 0 && (
            <span
              className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark border border-status-warning-border dark:border-status-warning-border-dark"
              title={`Blocked by ${overdueBlockers.length} overdue task${overdueBlockers.length > 1 ? 's' : ''}: ${overdueBlockers.map(b => b.title).join(', ')}`}
            >
              ⚠️ {overdueBlockers.length} overdue
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-1">
          <TaskTimerButton taskId={task.id} taskTitle={task.title} size="sm" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary p-1"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded shadow-lg z-10 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-surface-light-elevated dark:hover:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleArchive();
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-surface-light-elevated dark:hover:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary"
              >
                📦 Archive
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleDelete();
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-surface-light-elevated dark:hover:bg-surface-dark text-status-error"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority Badge */}
        <span className="text-xs px-2 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary">
          {priorityLabels[task.priority]}
        </span>

        {/* Due Date with overdue/due soon indicators */}
        {task.dueDate && (() => {
          const dueDate = new Date(task.dueDate);
          const now = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysUntilDue < 0;
          const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

          return (
            <span className={`text-xs px-2 py-0.5 rounded ${
              isOverdue
                ? 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark'
                : isDueSoon
                ? 'bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark'
                : 'bg-surface-light-elevated dark:bg-surface-dark text-accent-blue'
            }`}>
              📅 {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          );
        })()}

        {/* P1: Recurring Task Indicator */}
        {(task.recurrence || task.recurrenceId) && (
          <span
            className="text-xs px-2 py-0.5 rounded bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue dark:text-accent-blue-hover font-medium"
            title={
              task.isRecurringParent
                ? `Recurring task (${task.recurrence?.frequency})${task.nextOccurrence ? ` • Next: ${task.nextOccurrence}` : ''}`
                : 'Instance of recurring task'
            }
          >
            🔁 {task.isRecurringParent ? 'Recurring' : 'Instance'}
          </span>
        )}

        {/* When Tag (Wave 4E) */}
        {task.whenTag && <WhenTagBadge tag={task.whenTag} />}

        {/* Estimated Hours */}
        {task.estimatedHours && (
          <span className="text-xs px-2 py-0.5 rounded bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary">
            ⏱️ {task.estimatedHours}h
          </span>
        )}

        {/* Time Tracked (Phase A: Time Tracking Integration) */}
        {hasTimeTracked && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (onCardClick) {
                onCardClick(task);
              }
            }}
            className={`text-xs px-2 py-0.5 rounded font-medium cursor-pointer transition-all hover:scale-105 ${
              isTimerActive
                ? 'bg-accent-blue text-white hover:bg-accent-blue/90 animate-pulse'
                : 'bg-surface-light-elevated dark:bg-surface-dark text-accent-blue dark:text-accent-blue-hover'
            }`}
            title={isTimerActive ? 'Timer running - click to view' : 'Total time tracked - click to view'}
          >
            {isTimerActive && '⏱️ '}🕐 {formatTime(totalSeconds)}
          </span>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && task.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue dark:text-accent-blue-hover"
          >
            #{tag}
          </span>
        ))}

        {/* Custom Fields (P1 Feature) */}
        {activeCustomFields.map(({ field, value }) => (
          <CustomFieldDisplay
            key={field.id}
            field={field}
            value={value}
            variant="card"
          />
        ))}

        {/* Dependency Indicators (PHASE 5 PART 6) */}
        {(() => {
          const blockers = getBlockers(task.id);
          const incompleteBlockers = blockers.filter((b) => b.status !== 'done');

          if (incompleteBlockers.length > 0) {
            return (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCardClick) {
                    onCardClick(task);
                  }
                }}
                className="text-xs px-2 py-0.5 rounded font-medium cursor-pointer transition-all hover:scale-105 bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark hover:opacity-80"
                title={`Blocked by ${incompleteBlockers.length} task(s)`}
              >
                🔒 Blocked by {incompleteBlockers.length}
              </span>
            );
          }

          const blocked = getBlocked(task.id);
          if (blocked.length > 0) {
            return (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCardClick) {
                    onCardClick(task);
                  }
                }}
                className="text-xs px-2 py-0.5 rounded font-medium cursor-pointer transition-all hover:scale-105 bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark-elevated"
                title={`Blocking ${blocked.length} task(s)`}
              >
                ⚠️ Blocks {blocked.length}
              </span>
            );
          }

          return null;
        })()}

        {/* Subtask Progress Badge */}
        {task.subtasks && task.subtasks.length > 0 && (() => {
          const completedCount = task.subtasks.filter(st => st.completed).length;
          const totalCount = task.subtasks.length;
          const isComplete = completedCount === totalCount;

          return (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (onCardClick) {
                  onCardClick(task, 'subtasks');
                }
              }}
              className={`text-xs px-2 py-0.5 rounded font-medium cursor-pointer transition-all hover:scale-105 ${
                isComplete
                  ? 'bg-status-success text-white hover:bg-status-success/90'
                  : completedCount > 0
                  ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
                  : 'bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark-elevated'
              }`}
            >
              ✓ {completedCount}/{totalCount} subtasks
            </span>
          );
        })()}

        {/* Assignee Avatars - Phase 3.1 */}
        {assignedMembers.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {assignedMembers.slice(0, 3).map((member, index) => (
              <div
                key={member.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px] border-2 border-surface-light dark:border-surface-dark-elevated shrink-0"
                style={{
                  backgroundColor: member.avatarColor,
                  zIndex: assignedMembers.length - index
                }}
                title={member.name}
              >
                {member.initials}
              </div>
            ))}
            {assignedMembers.length > 3 && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary border-2 border-surface-light dark:border-surface-dark-elevated"
                title={`+${assignedMembers.length - 3} more`}
              >
                +{assignedMembers.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Attachment Badge - Phase 3.2 */}
        {task.attachments && task.attachments.length > 0 && (
          <span
            className="flex items-center gap-1 text-xs text-text-light-secondary dark:text-text-dark-secondary"
            title={`${task.attachments.length} attachment${task.attachments.length > 1 ? 's' : ''}`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            {task.attachments.length}
          </span>
        )}
      </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
          variant="danger"
        />
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render if task, isDragging, or isSelected props change
export const KanbanCard = memo(KanbanCardComponent, (prevProps, nextProps) => {
  const prevAssignees = prevProps.task.assignees || [];
  const nextAssignees = nextProps.task.assignees || [];
  const prevAttachments = prevProps.task.attachments || [];
  const nextAttachments = nextProps.task.attachments || [];
  const prevCustomFields = prevProps.task.customFields || {};
  const nextCustomFields = nextProps.task.customFields || {};

  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.startDate === nextProps.task.startDate &&
    prevProps.task.tags.length === nextProps.task.tags.length &&
    prevAssignees.length === nextAssignees.length &&
    prevAttachments.length === nextAttachments.length &&
    prevProps.task.coverMode === nextProps.task.coverMode &&
    Object.keys(prevCustomFields).length === Object.keys(nextCustomFields).length &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isSelected === nextProps.isSelected
  );
});
