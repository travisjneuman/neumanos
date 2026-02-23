/**
 * SmartScheduleButton - AI-powered daily schedule generator
 *
 * Calls suggestSchedule with current tasks, events, and energy patterns,
 * then shows a preview modal where users can accept/reject individual blocks
 * before applying them as timeboxes on the Today page.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Wand2, Check, X, Zap, Clock, AlertTriangle } from 'lucide-react';
import { suggestSchedule, type ScheduledBlock } from '../services/smartScheduler';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useEnergyStore } from '../stores/useEnergyStore';
import { useDailyPlanningStore } from '../stores/useDailyPlanningStore';
import { format, startOfDay } from 'date-fns';

interface SmartScheduleButtonProps {
  dateKey: string;
}

const ENERGY_MATCH_STYLES = {
  good: {
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/30',
    text: 'text-accent-green',
    label: 'Good fit',
  },
  ok: {
    bg: 'bg-accent-yellow/10',
    border: 'border-accent-yellow/30',
    text: 'text-accent-yellow',
    label: 'Okay fit',
  },
  poor: {
    bg: 'bg-accent-red/10',
    border: 'border-accent-red/30',
    text: 'text-accent-red',
    label: 'Poor fit',
  },
} as const;

export const SmartScheduleButton: React.FC<SmartScheduleButtonProps> = ({ dateKey }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [schedule, setSchedule] = useState<ScheduledBlock[]>([]);
  const [acceptedBlocks, setAcceptedBlocks] = useState<Set<string>>(new Set());

  // Store data
  const tasks = useKanbanStore((s) => s.tasks);
  const eventsMap = useCalendarStore((s) => s.events);
  const calculatePatterns = useEnergyStore((s) => s.calculatePatterns);
  const setTimebox = useDailyPlanningStore((s) => s.setTimebox);

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = format(today, 'yyyy-M-d');
  const todayEvents = useMemo(() => eventsMap[todayKey] || [], [eventsMap, todayKey]);

  const handleGenerate = useCallback(() => {
    const patterns = calculatePatterns();

    // Filter to tasks that are due today or overdue and not done
    const todayStr = format(today, 'yyyy-MM-dd');
    const relevantTasks = tasks.filter((t) => {
      if (t.status === 'done' || t.archivedAt) return false;
      if (!t.dueDate) return false;
      return t.dueDate <= todayStr;
    });

    if (relevantTasks.length === 0) {
      // Also include unscheduled tasks with no due date but in todo/inprogress
      const unscheduledTasks = tasks.filter((t) =>
        t.status !== 'done' && !t.archivedAt &&
        (t.status === 'todo' || t.status === 'inprogress')
      );
      if (unscheduledTasks.length === 0) return;
      const result = suggestSchedule(unscheduledTasks, todayEvents, patterns);
      setSchedule(result);
    } else {
      const result = suggestSchedule(relevantTasks, todayEvents, patterns);
      setSchedule(result);
    }

    // Accept all blocks by default
    setAcceptedBlocks(new Set());
    setShowPreview(true);
  }, [tasks, todayEvents, calculatePatterns, today]);

  const toggleBlock = useCallback((taskId: string) => {
    setAcceptedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleAcceptAll = useCallback(() => {
    setAcceptedBlocks(new Set(schedule.map((b) => b.taskId)));
  }, [schedule]);

  const handleApply = useCallback(() => {
    // Apply accepted blocks as timeboxes
    for (const block of schedule) {
      // If acceptedBlocks is empty, apply all; otherwise only accepted
      if (acceptedBlocks.size === 0 || acceptedBlocks.has(block.taskId)) {
        setTimebox(dateKey, block.taskId, block.durationMinutes);
      }
    }
    setShowPreview(false);
    setSchedule([]);
    setAcceptedBlocks(new Set());
  }, [schedule, acceptedBlocks, dateKey, setTimebox]);

  const handleClose = useCallback(() => {
    setShowPreview(false);
    setSchedule([]);
    setAcceptedBlocks(new Set());
  }, []);

  const appliedCount = acceptedBlocks.size === 0 ? schedule.length : acceptedBlocks.size;
  const totalMinutes = schedule
    .filter((b) => acceptedBlocks.size === 0 || acceptedBlocks.has(b.taskId))
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  return (
    <>
      <button
        onClick={handleGenerate}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border border-accent-primary/20 transition-colors text-sm font-medium"
        title="Auto-fill today's schedule with unscheduled tasks"
      >
        <Wand2 className="w-4 h-4" />
        Smart Schedule
      </button>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-accent-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                    Suggested Schedule
                  </h2>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    {schedule.length} tasks, {Math.round(totalMinutes / 60 * 10) / 10}h total
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
            </div>

            {/* Schedule blocks */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {schedule.length === 0 ? (
                <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks to schedule</p>
                  <p className="text-xs opacity-70 mt-1">
                    Add tasks with due dates or mark them as "To Do"
                  </p>
                </div>
              ) : (
                schedule.map((block) => {
                  const style = ENERGY_MATCH_STYLES[block.energyMatch];
                  const isSelected = acceptedBlocks.size === 0 || acceptedBlocks.has(block.taskId);

                  return (
                    <button
                      key={block.taskId}
                      onClick={() => toggleBlock(block.taskId)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated border-accent-primary/30'
                          : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark opacity-50'
                      }`}
                    >
                      {/* Check indicator */}
                      <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-accent-primary border-accent-primary'
                          : 'border-border-light dark:border-border-dark'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Time */}
                      <div className="flex-shrink-0 text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary w-24">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {block.startTime} - {block.endTime}
                      </div>

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                          {block.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                            {block.durationMinutes}min
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${style.bg} ${style.text} flex items-center gap-1`}>
                            <Zap className="w-2.5 h-2.5" />
                            {style.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {schedule.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border-light dark:border-border-dark">
                <button
                  onClick={handleAcceptAll}
                  className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  Select All
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 rounded-lg text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply {appliedCount} {appliedCount === 1 ? 'block' : 'blocks'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
