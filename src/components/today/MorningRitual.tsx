/**
 * MorningRitual - Guided morning planning wizard
 *
 * Step-by-step flow:
 * 1. Review Calendar — today's events
 * 2. Pick Tasks — select from backlog for today
 * 3. Set Capacity — hours available today
 * 4. Review & Go — summary, start the day
 */

import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Calendar,
  ListChecks,
  Clock,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  Minus,
} from 'lucide-react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';
import type { MorningRitualRecord } from '../../stores/useDailyPlanningStore';

interface MorningRitualProps {
  dateKey: string;
  onComplete: () => void;
  onDismiss: () => void;
}

const STEPS = [
  { id: 'calendar', label: 'Review Calendar', icon: Calendar },
  { id: 'tasks', label: 'Pick Tasks', icon: ListChecks },
  { id: 'capacity', label: 'Set Capacity', icon: Clock },
  { id: 'review', label: 'Review & Go', icon: Rocket },
] as const;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
  }),
};

export const MorningRitual: React.FC<MorningRitualProps> = ({
  dateKey,
  onComplete,
  onDismiss,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [capacity, setCapacity] = useState(8);

  const today = useMemo(() => startOfDay(new Date()), []);
  const eventsMap = useCalendarStore((s) => s.events);
  const tasks = useKanbanStore((s) => s.tasks);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const completeMorningRitual = useDailyPlanningStore((s) => s.completeMorningRitual);
  const setAvailableHours = useDailyPlanningStore((s) => s.setAvailableHours);

  const todayEvents = useMemo(() => eventsMap[dateKey] || [], [eventsMap, dateKey]);

  // Backlog tasks: not done, no due date or in backlog
  const backlogTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done' && !t.archivedAt && (t.status === 'backlog' || !t.dueDate))
      .slice(0, 30);
  }, [tasks]);

  // Tasks already planned for today
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done') return false;
      const dueKey = format(new Date(t.dueDate), 'yyyy-M-d');
      return dueKey === dateKey;
    });
  }, [tasks, dateKey]);

  const toggleTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(() => {
    // Move selected backlog tasks to today
    const todayDate = format(today, 'yyyy-MM-dd');
    selectedTaskIds.forEach((taskId) => {
      updateTask(taskId, { dueDate: todayDate, status: 'todo' });
    });

    // Set capacity
    setAvailableHours(dateKey, capacity);

    // Record ritual completion
    const record: MorningRitualRecord = {
      completedAt: new Date().toISOString(),
      capacitySet: capacity,
      tasksPlanned: selectedTaskIds.size + todayTasks.length,
    };
    completeMorningRitual(dateKey, record);
    onComplete();
  }, [selectedTaskIds, capacity, dateKey, today, updateTask, setAvailableHours, completeMorningRitual, todayTasks.length, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-accent-yellow" />
            <h2 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Morning Ritual
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-border-light dark:border-border-dark">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : isDone
                    ? 'text-accent-green'
                    : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="px-6 py-5 min-h-[300px] relative overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {currentStep === 0 && (
                <StepCalendar events={todayEvents} today={today} />
              )}
              {currentStep === 1 && (
                <StepPickTasks
                  backlogTasks={backlogTasks}
                  todayTasks={todayTasks}
                  selectedIds={selectedTaskIds}
                  onToggle={toggleTask}
                />
              )}
              {currentStep === 2 && (
                <StepCapacity capacity={capacity} setCapacity={setCapacity} />
              )}
              {currentStep === 3 && (
                <StepReview
                  eventsCount={todayEvents.length}
                  existingTasks={todayTasks.length}
                  newTasks={selectedTaskIds.size}
                  capacity={capacity}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-accent-green text-white hover:opacity-90 transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Start Your Day
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== STEP COMPONENTS ====================

interface CalendarEvent {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
}

const StepCalendar: React.FC<{ events: CalendarEvent[]; today: Date }> = ({ events, today }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
      Today's Calendar
    </h3>
    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
      {format(today, 'EEEE, MMMM d')} — review what's on your schedule.
    </p>
    {events.length === 0 ? (
      <div className="text-center py-8 text-text-light-tertiary dark:text-text-dark-tertiary">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No events scheduled today</p>
        <p className="text-xs mt-1">Your calendar is clear — more time for deep work.</p>
      </div>
    ) : (
      <div className="space-y-2 max-h-[220px] overflow-y-auto">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated"
          >
            {event.startTime ? (
              <span className="text-xs font-mono text-accent-primary w-12 flex-shrink-0">
                {event.startTime}
              </span>
            ) : (
              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary w-12 flex-shrink-0">
                All day
              </span>
            )}
            <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
              {event.title}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

interface TaskItem {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
}

const StepPickTasks: React.FC<{
  backlogTasks: TaskItem[];
  todayTasks: TaskItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}> = ({ backlogTasks, todayTasks, selectedIds, onToggle }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
      Pick Your Tasks
    </h3>
    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
      Select tasks from your backlog to work on today.
    </p>

    {todayTasks.length > 0 && (
      <div className="mb-3">
        <div className="text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary mb-1.5">
          Already planned ({todayTasks.length})
        </div>
        <div className="space-y-1 max-h-[80px] overflow-y-auto">
          {todayTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 px-2 py-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              <Check className="w-3 h-3 text-accent-green flex-shrink-0" />
              <span className="truncate">{task.title}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary mb-1.5">
      Backlog ({backlogTasks.length})
    </div>
    {backlogTasks.length === 0 ? (
      <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary py-4 text-center">
        No backlog tasks available
      </p>
    ) : (
      <div className="space-y-1 max-h-[160px] overflow-y-auto">
        {backlogTasks.map((task) => {
          const selected = selectedIds.has(task.id);
          return (
            <button
              key={task.id}
              onClick={() => onToggle(task.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                selected
                  ? 'bg-accent-primary/10 border border-accent-primary/30'
                  : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated border border-transparent'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selected
                  ? 'bg-accent-primary border-accent-primary'
                  : 'border-border-light dark:border-border-dark'
              }`}>
                {selected && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                task.priority === 'high' ? 'bg-accent-red' :
                task.priority === 'medium' ? 'bg-accent-yellow' : 'bg-accent-green'
              }`} />
              <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                {task.title}
              </span>
            </button>
          );
        })}
      </div>
    )}
    {selectedIds.size > 0 && (
      <div className="mt-2 text-xs text-accent-primary font-medium">
        <Plus className="w-3 h-3 inline mr-1" />
        {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} selected
      </div>
    )}
  </div>
);

const StepCapacity: React.FC<{
  capacity: number;
  setCapacity: (h: number) => void;
}> = ({ capacity, setCapacity }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
      Set Your Capacity
    </h3>
    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
      How many hours are you available to work today?
    </p>

    <div className="flex items-center justify-center gap-4 mb-6">
      <button
        onClick={() => setCapacity(Math.max(0.5, capacity - 0.5))}
        className="p-2 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark transition-colors"
        aria-label="Decrease capacity"
      >
        <Minus className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
      </button>
      <div className="text-center">
        <div className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {capacity}
        </div>
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">hours</div>
      </div>
      <button
        onClick={() => setCapacity(Math.min(16, capacity + 0.5))}
        className="p-2 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark transition-colors"
        aria-label="Increase capacity"
      >
        <Plus className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
      </button>
    </div>

    {/* Quick presets */}
    <div className="flex items-center justify-center gap-2">
      {[4, 6, 8, 10].map((h) => (
        <button
          key={h}
          onClick={() => setCapacity(h)}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            capacity === h
              ? 'bg-accent-primary text-white'
              : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-border-light dark:hover:bg-border-dark'
          }`}
        >
          {h}h
        </button>
      ))}
    </div>
  </div>
);

const StepReview: React.FC<{
  eventsCount: number;
  existingTasks: number;
  newTasks: number;
  capacity: number;
}> = ({ eventsCount, existingTasks, newTasks, capacity }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
      Your Day at a Glance
    </h3>
    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
      Ready to start? Here's your plan.
    </p>

    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated">
        <div className="flex items-center gap-2 text-sm text-text-light-primary dark:text-text-dark-primary">
          <Calendar className="w-4 h-4 text-accent-blue" />
          Events
        </div>
        <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">{eventsCount}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated">
        <div className="flex items-center gap-2 text-sm text-text-light-primary dark:text-text-dark-primary">
          <ListChecks className="w-4 h-4 text-accent-purple" />
          Tasks
        </div>
        <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
          {existingTasks + newTasks}
          {newTasks > 0 && (
            <span className="text-xs font-normal text-accent-green ml-1">+{newTasks} new</span>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated">
        <div className="flex items-center gap-2 text-sm text-text-light-primary dark:text-text-dark-primary">
          <Clock className="w-4 h-4 text-accent-yellow" />
          Capacity
        </div>
        <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">{capacity}h</span>
      </div>
    </div>
  </div>
);
