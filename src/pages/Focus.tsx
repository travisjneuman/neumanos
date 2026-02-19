/**
 * Focus Page - Full-screen distraction-free focus mode
 *
 * A minimalist view designed for deep work sessions.
 * Features: large timer display, current task, keyboard controls.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, X, RotateCcw, Target, Clock, CheckCircle2 } from 'lucide-react';
import { useFocusModeStore } from '../stores/useFocusModeStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useShortcut } from '../hooks/useShortcut';

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

export const Focus: React.FC = () => {
  const navigate = useNavigate();

  // Focus mode state
  const {
    isActive,
    linkedTaskId,
    startedAt,
    startFocus,
    endFocus,
  } = useFocusModeStore();

  // Time tracking state
  const { activeEntry, startTimer, stopTimer } = useTimeTrackingStore();

  // Get linked task details
  const tasks = useKanbanStore((state) => state.tasks);
  const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : null;

  // Session duration (updates every second)
  const [sessionDuration, setSessionDuration] = useState(0);

  // Start focus session on mount if not already active
  useEffect(() => {
    if (!isActive) {
      startFocus();
    }
  }, [isActive, startFocus]);

  // Update session duration every second
  useEffect(() => {
    if (!startedAt) return;

    const updateDuration = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      setSessionDuration(Math.floor((now - start) / 1000));
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Handle exit focus mode
  const handleExit = useCallback(() => {
    endFocus();
    navigate(-1);
  }, [endFocus, navigate]);

  // Handle timer toggle
  const handleTimerToggle = useCallback(() => {
    if (activeEntry) {
      stopTimer();
    } else if (linkedTaskId) {
      // Start timer linked to task
      startTimer({
        taskId: linkedTaskId,
        description: linkedTask?.title || 'Focus session',
      });
    } else {
      // Start timer without task
      startTimer({
        description: 'Focus session',
      });
    }
  }, [activeEntry, linkedTaskId, linkedTask, startTimer, stopTimer]);

  // Handle reset (restart session)
  const handleReset = useCallback(() => {
    startFocus(linkedTaskId || undefined);
  }, [startFocus, linkedTaskId]);

  // Keyboard shortcuts
  useShortcut({
    id: 'focus-exit',
    keys: ['Escape'],
    label: 'Exit Focus Mode',
    description: 'Leave focus mode and return to previous page',
    handler: handleExit,
    priority: 100, // High priority
  });

  useShortcut({
    id: 'focus-timer-toggle',
    keys: ['Space'],
    label: 'Toggle Timer',
    description: 'Start or stop the focus timer',
    handler: handleTimerToggle,
    priority: 90,
  });

  useShortcut({
    id: 'focus-reset',
    keys: ['r'],
    label: 'Reset Session',
    description: 'Reset the focus session timer',
    handler: handleReset,
    priority: 80,
  });

  return (
    <div className="fixed inset-0 bg-surface-dark z-50 flex flex-col items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-transparent to-accent-primary/10" />

      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-6 right-6 p-3 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-elevated/80 text-text-dark-secondary hover:text-text-dark-primary transition-all"
        title="Exit Focus Mode (Esc)"
        aria-label="Exit Focus Mode"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Session duration - large display */}
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
          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-4 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-elevated/80 text-text-dark-secondary hover:text-text-dark-primary transition-all"
            title="Reset Session (R)"
            aria-label="Reset session"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          {/* Play/Pause timer button */}
          <button
            onClick={handleTimerToggle}
            className={`p-6 rounded-full transition-all shadow-lg ${
              activeEntry
                ? 'bg-accent-primary hover:bg-accent-primary/90 text-white'
                : 'bg-accent-secondary hover:bg-accent-secondary/90 text-white'
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

          {/* Placeholder for symmetry */}
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
};

export default Focus;
