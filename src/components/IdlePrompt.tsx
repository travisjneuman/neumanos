import { useState } from 'react';

/**
 * Idle Prompt Modal
 *
 * Displays when user returns from idle state, allowing them to:
 * - Keep the idle time (continue tracking)
 * - Discard the idle time (stop timer at idle start)
 * - Adjust the time (manually set when to stop)
 */

export interface IdlePromptProps {
  /**
   * Whether the prompt is visible
   */
  isOpen: boolean;

  /**
   * Idle duration in milliseconds
   */
  idleDuration: number;

  /**
   * When idle period started (ISO timestamp)
   */
  idleStartTime: string;

  /**
   * Timer description (for context)
   */
  timerDescription: string;

  /**
   * Callback when user chooses to keep idle time
   */
  onKeep: () => void;

  /**
   * Callback when user chooses to discard idle time
   */
  onDiscard: () => void;

  /**
   * Callback when user adjusts the time
   * @param adjustedEndTime ISO timestamp when timer should have stopped
   */
  onAdjust: (adjustedEndTime: string) => void;

  /**
   * Callback when user dismisses without action
   */
  onDismiss: () => void;
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function IdlePrompt({
  isOpen,
  idleDuration,
  idleStartTime,
  timerDescription,
  onKeep,
  onDiscard,
  onAdjust,
  onDismiss
}: IdlePromptProps) {
  const [adjustedMinutes, setAdjustedMinutes] = useState(Math.floor(idleDuration / 60000));

  if (!isOpen) return null;

  const handleAdjust = () => {
    const idleStart = new Date(idleStartTime);
    const adjustedEndTime = new Date(idleStart.getTime() + adjustedMinutes * 60000);
    onAdjust(adjustedEndTime.toISOString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-surface-elevated p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-text-primary">
            You were idle
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            No activity detected for <span className="font-medium text-text-primary">{formatDuration(idleDuration)}</span>
          </p>
        </div>

        {/* Timer info */}
        <div className="mb-6 rounded-md bg-surface-base p-3">
          <p className="text-sm font-medium text-text-primary">Active timer:</p>
          <p className="mt-1 text-sm text-text-secondary">{timerDescription}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Keep */}
          <button
            onClick={onKeep}
            className="w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-primary/90"
          >
            Keep tracking (include idle time)
          </button>

          {/* Discard */}
          <button
            onClick={onDiscard}
            className="w-full rounded-md bg-status-error/10 px-4 py-2 text-sm font-medium text-status-error transition-colors hover:bg-status-error/20"
          >
            Discard idle time (stop at {new Date(idleStartTime).toLocaleTimeString()})
          </button>

          {/* Adjust */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Or adjust the idle time:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max={Math.floor(idleDuration / 60000)}
                value={adjustedMinutes}
                onChange={(e) => setAdjustedMinutes(Number(e.target.value))}
                className="flex-1"
              />
              <span className="min-w-[60px] text-sm text-text-secondary">
                {adjustedMinutes}m
              </span>
            </div>
            <button
              onClick={handleAdjust}
              className="w-full rounded-md bg-surface-base px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              Stop timer {adjustedMinutes} minutes after idle started
            </button>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="mt-4 w-full text-sm text-text-tertiary transition-colors hover:text-text-secondary"
        >
          Decide later
        </button>
      </div>
    </div>
  );
}
