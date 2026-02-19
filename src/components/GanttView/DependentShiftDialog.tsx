/**
 * DependentShiftDialog Component
 * Confirmation dialog for propagating date changes to dependent tasks
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../Modal';
import type { Task } from '../../types';

interface TaskShift {
  taskId: string;
  newStartDate: string | null;
  newDueDate: string | null;
  reason: string;
}

interface DependentShiftDialogProps {
  isOpen: boolean;
  shifts: TaskShift[];
  tasks: Task[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DependentShiftDialog({
  isOpen,
  shifts,
  tasks,
  onConfirm,
  onCancel,
}: DependentShiftDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  // Get task title by ID
  const getTaskTitle = (taskId: string): string => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || `Task ${taskId}`;
  };

  // Format date for display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'None';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get date change description
  const getDateChange = (shift: TaskShift): { start: string; due: string } => {
    const task = tasks.find(t => t.id === shift.taskId);
    if (!task) return { start: '', due: '' };

    const oldStart = task.startDate ? formatDate(task.startDate) : 'None';
    const newStart = shift.newStartDate ? formatDate(shift.newStartDate) : 'None';
    const oldDue = task.dueDate ? formatDate(task.dueDate) : 'None';
    const newDue = shift.newDueDate ? formatDate(shift.newDueDate) : 'None';

    return {
      start: oldStart !== newStart ? `${oldStart} → ${newStart}` : '',
      due: oldDue !== newDue ? `${oldDue} → ${newDue}` : '',
    };
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Dependent Tasks Will Shift"
      maxWidth="md"
      hideHeader={true}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-status-warning-bg dark:bg-status-warning-bg-dark flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-status-warning-text dark:text-status-warning-text-dark" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              Dependent Tasks Will Shift
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Moving this task will affect {shifts.length} dependent {shifts.length === 1 ? 'task' : 'tasks'}.
              Review the changes below and confirm to proceed.
            </p>
          </div>
        </div>

        {/* Affected tasks list */}
        <div className="space-y-3 mb-6">
          {shifts.map((shift) => {
            const change = getDateChange(shift);
            return (
              <div
                key={shift.taskId}
                className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium text-sm text-text-light-primary dark:text-text-dark-primary">
                    {getTaskTitle(shift.taskId)}
                  </h4>
                </div>
                <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-1">
                  {change.start && (
                    <div>
                      <span className="font-medium">Start:</span> {change.start}
                    </div>
                  )}
                  {change.due && (
                    <div>
                      <span className="font-medium">Due:</span> {change.due}
                    </div>
                  )}
                  <div className="text-text-light-tertiary dark:text-text-dark-tertiary italic">
                    {shift.reason}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={confirmed}
            className="px-4 py-2 text-sm font-medium bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary border border-border-light dark:border-border-dark rounded-button hover:bg-surface-light dark:hover:bg-surface-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmed}
            className="px-4 py-2 text-sm font-medium bg-accent-primary text-white dark:text-dark-background rounded-button hover:bg-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {confirmed ? 'Applying...' : 'Confirm & Apply'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
