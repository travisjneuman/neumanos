import { useEffect, useState, useMemo } from 'react';
import { Play, Pause, Square, SkipForward, Settings, Link2, Unlink, Search } from 'lucide-react';
import { usePomodoroStore } from '../stores/usePomodoroStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { notifyPomodoroComplete } from '../utils/pomodoroNotifications';

/**
 * Pomodoro Timer Component
 *
 * Full-featured Pomodoro timer with:
 * - Timer display with progress ring
 * - Start/pause/stop controls
 * - Mode indicator (Focus/Break)
 * - Session counter
 * - Integration with time tracking
 */

export function PomodoroTimer() {
  const {
    mode,
    timeRemaining,
    isRunning,
    isPaused,
    sessionsCompleted,
    totalSessionsToday,
    linkedTaskName,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    skipSession,
  } = usePomodoroStore();

  const pomodoroSettings = useSettingsStore((s) => s.pomodoroSettings);
  const addManualEntry = useTimeTrackingStore((s) => s.addManualEntry);
  const tasks = useKanbanStore((s) => s.tasks);

  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return tasks.slice(0, 20);
    const q = taskSearch.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 20);
  }, [tasks, taskSearch]);

  // Handle session completion (create time entry for focus sessions)
  useEffect(() => {
    const store = usePomodoroStore.getState();
    const originalCompleteSession = store.completeSession;

    // Wrap completeSession to add time tracking integration
    usePomodoroStore.setState({
      completeSession: async () => {
        const currentMode = usePomodoroStore.getState().mode;
        const currentLinkedTaskId = usePomodoroStore.getState().linkedTaskId;
        const currentLinkedTaskName = usePomodoroStore.getState().linkedTaskName;

        // Call original completion logic
        originalCompleteSession();

        // Send notifications
        await notifyPomodoroComplete(
          currentMode,
          pomodoroSettings.soundEnabled,
          pomodoroSettings.notificationsEnabled
        );

        // Create time entry if it was a focus session
        if (currentMode === 'focus') {
          const duration = pomodoroSettings.focusDuration * 60; // seconds

          await addManualEntry({
            description: currentLinkedTaskName || 'Pomodoro Focus Session',
            startTime: new Date(Date.now() - duration * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration,
            taskId: currentLinkedTaskId || undefined,
            billable: true,
            tags: ['Pomodoro'],
            projectIds: [],
          });
        }
      },
    });
  }, [pomodoroSettings, addManualEntry]);

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const totalDuration = mode === 'focus'
    ? pomodoroSettings.focusDuration * 60
    : mode === 'shortBreak'
    ? pomodoroSettings.shortBreakDuration * 60
    : pomodoroSettings.longBreakDuration * 60;

  const progressPercent = ((totalDuration - timeRemaining) / totalDuration) * 100;

  // Mode styling
  const modeStyles = {
    focus: {
      bg: 'bg-accent-primary/10',
      border: 'border-accent-primary',
      text: 'text-accent-primary',
      ring: 'stroke-accent-primary',
    },
    shortBreak: {
      bg: 'bg-accent-green/10',
      border: 'border-accent-green',
      text: 'text-accent-green',
      ring: 'stroke-accent-green',
    },
    longBreak: {
      bg: 'bg-accent-blue/10',
      border: 'border-accent-blue',
      text: 'text-accent-blue',
      ring: 'stroke-accent-blue',
    },
  };

  const currentStyles = modeStyles[mode];

  const modeLabels = {
    focus: 'Focus Session',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      {/* Mode Indicator */}
      <div className="flex items-center gap-3">
        <div className={`px-4 py-2 rounded-full ${currentStyles.bg} ${currentStyles.border} border-2`}>
          <p className={`text-sm font-medium ${currentStyles.text}`}>
            {modeLabels[mode]}
          </p>
        </div>
        {linkedTaskName && (
          <div className="px-4 py-2 rounded-full bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 border border-border-light dark:border-border-dark">
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {linkedTaskName}
            </p>
          </div>
        )}
      </div>

      {/* Task Linking */}
      <div className="flex items-center gap-2">
        {linkedTaskName ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
            <Link2 className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-medium text-accent-primary">
              {linkedTaskName}
            </span>
            <button
              onClick={() => usePomodoroStore.getState().unlinkTask()}
              className="ml-1 p-0.5 rounded hover:bg-accent-primary/20 text-accent-primary transition-colors"
              title="Unlink task"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowTaskPicker(!showTaskPicker)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 border border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors text-text-light-secondary dark:text-text-dark-secondary"
            >
              <Link2 className="w-4 h-4" />
              Link to Task
            </button>
            {showTaskPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-xl z-20 p-2">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-8 pr-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-tertiary dark:placeholder-text-dark-tertiary"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredTasks.length === 0 ? (
                    <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary text-center py-3">
                      No tasks found
                    </p>
                  ) : (
                    filteredTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          usePomodoroStore.getState().linkToTask(task.id, task.title);
                          setShowTaskPicker(false);
                          setTaskSearch('');
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-surface-light-elevated dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary transition-colors truncate"
                      >
                        {task.title}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timer Display with Progress Ring */}
      <div className="relative">
        {/* SVG Progress Ring */}
        <svg className="transform -rotate-90" width="280" height="280">
          {/* Background ring */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-surface-light-secondary/30 dark:text-surface-dark-secondary/30"
          />
          {/* Progress ring */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progressPercent / 100)}`}
            className={`transition-all duration-1000 ${currentStyles.ring}`}
          />
        </svg>

        {/* Timer Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`text-6xl font-bold tracking-tight ${currentStyles.text}`}>
            {formatTime(timeRemaining)}
          </p>
          {isRunning && !isPaused && (
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-2">
              Running...
            </p>
          )}
          {isPaused && (
            <p className="text-sm text-status-warning mt-2">
              Paused
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRunning && !isPaused && (
          <button
            onClick={startTimer}
            className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Start
          </button>
        )}

        {isRunning && !isPaused && (
          <button
            onClick={pauseTimer}
            className="flex items-center gap-2 px-6 py-3 bg-status-warning text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Pause className="w-5 h-5" />
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={resumeTimer}
            className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Resume
          </button>
        )}

        {(isRunning || isPaused) && (
          <button
            onClick={stopTimer}
            className="flex items-center gap-2 px-4 py-3 bg-status-error text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Square className="w-5 h-5" />
            Stop
          </button>
        )}

        <button
          onClick={skipSession}
          className="flex items-center gap-2 px-4 py-3 bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-primary dark:text-text-dark-primary rounded-lg hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
        >
          <SkipForward className="w-5 h-5" />
          Skip
        </button>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
        <div className="text-center p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {sessionsCompleted} / {pomodoroSettings.sessionsUntilLongBreak}
          </p>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
            Sessions until long break
          </p>
        </div>
        <div className="text-center p-4 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark">
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {totalSessionsToday}
          </p>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
            Focus sessions today
          </p>
        </div>
      </div>

      {/* Settings Link */}
      <button
        className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
      >
        <Settings className="w-4 h-4" />
        Pomodoro Settings
      </button>
    </div>
  );
}
