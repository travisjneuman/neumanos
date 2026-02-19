import { Play, Pause } from 'lucide-react';
import { usePomodoroStore } from '../stores/usePomodoroStore';

/**
 * Compact Pomodoro Widget
 *
 * Minimal timer display for header/sidebar with one-click controls.
 */

interface PomodoroWidgetProps {
  onClick?: () => void; // Callback to expand full timer
}

export function PomodoroWidget({ onClick }: PomodoroWidgetProps) {
  const {
    mode,
    timeRemaining,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
  } = usePomodoroStore();

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mode colors
  const modeColors = {
    focus: 'text-accent-primary',
    shortBreak: 'text-accent-green',
    longBreak: 'text-accent-blue',
  };

  const modeIcons = {
    focus: '🎯',
    shortBreak: '☕',
    longBreak: '🌟',
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRunning && !isPaused) {
      startTimer();
    } else if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 border border-border-light dark:border-border-dark hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
    >
      {/* Mode Icon */}
      <span className="text-lg">{modeIcons[mode]}</span>

      {/* Timer Display */}
      <span className={`font-mono text-sm font-medium ${modeColors[mode]}`}>
        {formatTime(timeRemaining)}
      </span>

      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        className="p-1 rounded hover:bg-surface-light-primary/10 dark:hover:bg-surface-dark-primary/10 transition-colors"
      >
        {isRunning && !isPaused ? (
          <Pause className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
        ) : (
          <Play className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" fill="currentColor" />
        )}
      </button>
    </button>
  );
}
