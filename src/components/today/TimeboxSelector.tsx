/**
 * TimeboxSelector - Duration picker for task timeboxing
 *
 * Inline dropdown to assign time estimates to tasks.
 * Preset options: 15min, 30min, 1hr, 2hr, custom.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';
import type { TimeboxPreset } from '../../stores/useDailyPlanningStore';

interface TimeboxSelectorProps {
  dateKey: string;
  taskId: string;
}

const PRESETS: Array<{ label: string; minutes: TimeboxPreset }> = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
];

/** Format minutes to a short display string */
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const TimeboxSelector: React.FC<TimeboxSelectorProps> = ({ dateKey, taskId }) => {
  const timebox = useDailyPlanningStore((s) => s.getTimebox(dateKey, taskId));
  const setTimebox = useDailyPlanningStore((s) => s.setTimebox);
  const removeTimebox = useDailyPlanningStore((s) => s.removeTimebox);

  const [isOpen, setIsOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePresetClick = useCallback(
    (minutes: number) => {
      setTimebox(dateKey, taskId, minutes);
      setIsOpen(false);
    },
    [dateKey, taskId, setTimebox]
  );

  const handleCustomSubmit = useCallback(() => {
    const parsed = parseInt(customValue, 10);
    if (parsed > 0 && parsed <= 480) {
      setTimebox(dateKey, taskId, parsed);
    }
    setIsCustom(false);
    setIsOpen(false);
    setCustomValue('');
  }, [dateKey, taskId, customValue, setTimebox]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeTimebox(dateKey, taskId);
      setIsOpen(false);
    },
    [dateKey, taskId, removeTimebox]
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
          timebox
            ? 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20'
            : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
        }`}
        title={timebox ? `Estimated: ${formatDuration(timebox.durationMinutes)}` : 'Set time estimate'}
        aria-label="Set time estimate"
      >
        <Clock className="w-3 h-3" />
        {timebox ? (
          <span>{formatDuration(timebox.durationMinutes)}</span>
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-50 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          {!isCustom ? (
            <>
              {PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => handlePresetClick(preset.minutes)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface-light dark:hover:bg-surface-dark transition-colors ${
                    timebox?.durationMinutes === preset.minutes
                      ? 'text-accent-primary font-medium'
                      : 'text-text-light-primary dark:text-text-dark-primary'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => setIsCustom(true)}
                className="w-full text-left px-3 py-1.5 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
              >
                Custom...
              </button>
              {timebox && (
                <>
                  <div className="border-t border-border-light dark:border-border-dark my-1" />
                  <button
                    onClick={handleRemove}
                    className="w-full text-left px-3 py-1.5 text-sm text-accent-red hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
                  >
                    Remove
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="px-3 py-2">
              <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1 block">
                Minutes
              </label>
              <input
                type="number"
                min={1}
                max={480}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit();
                  if (e.key === 'Escape') {
                    setIsCustom(false);
                    setCustomValue('');
                  }
                }}
                placeholder="e.g. 45"
                className="w-full px-2 py-1 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-text-light-primary dark:text-text-dark-primary outline-none focus:border-accent-primary"
                autoFocus
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
