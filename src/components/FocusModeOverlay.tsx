/**
 * Focus Mode Overlay
 *
 * A modal overlay version of focus mode that can be activated from anywhere.
 * Renders as a full-screen overlay without navigating to a new page.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, X, RotateCcw, Target, Clock, CheckCircle2 } from 'lucide-react';
import { useFocusModeStore } from '../stores/useFocusModeStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useKanbanStore } from '../stores/useKanbanStore';

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface FocusModeOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Called when the overlay should close */
  onClose: () => void;
  /** Optional task ID to link to this focus session */
  taskId?: string;
}

export const FocusModeOverlay: React.FC<FocusModeOverlayProps> = ({
  isOpen,
  onClose,
  taskId,
}) => {
  // Focus mode state
  const {
    startedAt,
    startFocus,
    endFocus,
  } = useFocusModeStore();

  // Time tracking state
  const { activeEntry, startTimer, stopTimer } = useTimeTrackingStore();

  // Get linked task details
  const tasks = useKanbanStore((state) => state.tasks);
  const linkedTask = taskId ? tasks.find((t) => t.id === taskId) : null;

  // Session duration (updates every second)
  const [sessionDuration, setSessionDuration] = useState(0);

  // Start focus session when overlay opens
  useEffect(() => {
    if (isOpen) {
      startFocus(taskId);
    }
  }, [isOpen, taskId, startFocus]);

  // Update session duration every second
  useEffect(() => {
    if (!isOpen || !startedAt) return;

    const updateDuration = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      setSessionDuration(Math.floor((now - start) / 1000));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [isOpen, startedAt]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case ' ':
          e.preventDefault();
          handleTimerToggle();
          break;
        case 'r':
        case 'R':
          handleReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeEntry, taskId]);

  // Handle close
  const handleClose = useCallback(() => {
    endFocus();
    onClose();
  }, [endFocus, onClose]);

  // Handle timer toggle
  const handleTimerToggle = useCallback(() => {
    if (activeEntry) {
      stopTimer();
    } else if (taskId) {
      startTimer({
        taskId,
        description: linkedTask?.title || 'Focus session',
      });
    } else {
      startTimer({
        description: 'Focus session',
      });
    }
  }, [activeEntry, taskId, linkedTask, startTimer, stopTimer]);

  // Handle reset
  const handleReset = useCallback(() => {
    startFocus(taskId);
  }, [startFocus, taskId]);

  if (!isOpen) return null;

  const overlay = (
    <div className="fixed inset-0 bg-surface-dark z-[100] flex flex-col items-center justify-center animate-fadeIn">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-transparent to-accent-primary/10" />

      {/* Close/minimize button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-elevated/80 text-text-dark-secondary hover:text-text-dark-primary transition-all"
        title="Exit Focus Mode (Esc)"
        aria-label="Exit Focus Mode"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Session duration */}
        <div className="space-y-2">
          <div className="text-8xl md:text-9xl font-light text-text-dark-primary tracking-tight">
            {formatDuration(sessionDuration)}
          </div>
          <div className="flex items-center justify-center gap-2 text-text-dark-secondary">
            <Clock className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wide">Focus Time</span>
          </div>
        </div>

        {/* Linked task */}
        {linkedTask && (
          <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-surface-dark-elevated border border-border-dark">
            <Target className="w-5 h-5 text-accent-primary" />
            <span className="text-lg text-text-dark-primary font-medium">
              {linkedTask.title}
            </span>
            {linkedTask.status === 'done' && (
              <CheckCircle2 className="w-5 h-5 text-accent-green" />
            )}
          </div>
        )}

        {/* Timer controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="p-4 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-elevated/80 text-text-dark-secondary hover:text-text-dark-primary transition-all"
            title="Reset Session (R)"
            aria-label="Reset session"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={handleTimerToggle}
            className={`p-6 rounded-full transition-all shadow-lg ${
              activeEntry
                ? 'bg-accent-primary hover:bg-accent-primary/90 text-white'
                : 'bg-accent-primary hover:bg-accent-primary/90 text-white'
            }`}
            title={activeEntry ? 'Pause Timer (Space)' : 'Start Timer (Space)'}
            aria-label={activeEntry ? 'Pause timer' : 'Start timer'}
          >
            {activeEntry ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </button>

          <div className="w-14 h-14" />
        </div>

        {/* Active timer indicator */}
        {activeEntry && (
          <div className="flex items-center justify-center gap-2 text-accent-primary animate-pulse">
            <div className="w-2 h-2 rounded-full bg-accent-primary" />
            <span className="text-sm font-medium uppercase tracking-wide">Recording</span>
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-6 text-text-dark-muted text-xs">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 rounded bg-surface-dark-elevated border border-border-dark font-mono">
            Space
          </kbd>
          <span>Timer</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 rounded bg-surface-dark-elevated border border-border-dark font-mono">
            R
          </kbd>
          <span>Reset</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 rounded bg-surface-dark-elevated border border-border-dark font-mono">
            Esc
          </kbd>
          <span>Exit</span>
        </div>
      </div>
    </div>
  );

  // Render in portal to escape layout constraints
  return createPortal(overlay, document.body);
};

export default FocusModeOverlay;
