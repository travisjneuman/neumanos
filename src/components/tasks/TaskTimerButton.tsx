import React, { useState, useCallback } from 'react';
import { Play, Square } from 'lucide-react';
import { useTimeTrackingStore } from '../../stores/useTimeTrackingStore';
import { ConfirmDialog } from '../ConfirmDialog';

interface TaskTimerButtonProps {
  taskId: string;
  taskTitle: string;
  projectId?: string;
  size?: 'sm' | 'md';
}

/**
 * Quick-start timer button for Kanban cards and list view rows.
 * Starts a timer pre-filled with the task title and project.
 * If a timer is already running, shows a confirmation before starting a new one.
 */
export const TaskTimerButton: React.FC<TaskTimerButtonProps> = ({
  taskId,
  taskTitle,
  projectId,
  size = 'sm',
}) => {
  const activeEntry = useTimeTrackingStore((s) => s.activeEntry);
  const startTimerForCard = useTimeTrackingStore((s) => s.startTimerForCard);
  const stopTimer = useTimeTrackingStore((s) => s.stopTimer);
  const [showConfirm, setShowConfirm] = useState(false);

  const isTimerActiveForThis = activeEntry?.taskId === taskId;
  const isAnyTimerRunning = activeEntry !== null;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isTimerActiveForThis) {
      // Stop the current timer for this task
      stopTimer();
      return;
    }

    if (isAnyTimerRunning) {
      // Another timer is running, confirm before switching
      setShowConfirm(true);
      return;
    }

    // No timer running, start one
    startTimerForCard(taskId, taskTitle);
    if (projectId) {
      useTimeTrackingStore.getState().updateActiveEntry({ projectId });
    }
  }, [isTimerActiveForThis, isAnyTimerRunning, taskId, taskTitle, projectId, startTimerForCard, stopTimer]);

  const handleConfirmSwitch = useCallback(async () => {
    await stopTimer();
    startTimerForCard(taskId, taskTitle);
    if (projectId) {
      useTimeTrackingStore.getState().updateActiveEntry({ projectId });
    }
    setShowConfirm(false);
  }, [stopTimer, startTimerForCard, taskId, taskTitle, projectId]);

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const buttonSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <>
      <button
        onClick={handleClick}
        className={`${buttonSize} inline-flex items-center justify-center rounded-full transition-all ${
          isTimerActiveForThis
            ? 'bg-status-error text-white hover:bg-status-error/80 animate-pulse'
            : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 hover:scale-110'
        }`}
        title={isTimerActiveForThis ? 'Stop timer' : 'Start timer for this task'}
        aria-label={isTimerActiveForThis ? 'Stop timer' : 'Start timer'}
      >
        {isTimerActiveForThis ? (
          <Square className={iconSize} />
        ) : (
          <Play className={iconSize} fill="currentColor" />
        )}
      </button>

      {showConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmSwitch}
          title="Timer Already Running"
          message={`A timer is already running for "${activeEntry?.description || 'Untitled'}". Stop it and start a new timer for "${taskTitle}"?`}
          variant="warning"
        />
      )}
    </>
  );
};
