/**
 * EveningReview - Guided end-of-day review flow
 *
 * Steps:
 * 1. Review Completed — what was accomplished
 * 2. Handle Incomplete — move/reschedule/drop unfinished tasks
 * 3. Reflect — mood + productivity rating + journal
 * 4. Shutdown — confirmation
 */

import React, { useState, useMemo, useCallback } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  CheckCircle2,
  ListTodo,
  Heart,
  Power,
  ChevronRight,
  ChevronLeft,
  Check,
  ArrowRight,
  Trash2,
  CalendarClock,
  Star,
  X,
} from 'lucide-react';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';
import type { EveningReviewData, DailyReview as DailyReviewType, RolloverDecision } from '../../stores/useDailyPlanningStore';

interface EveningReviewProps {
  dateKey: string;
  tasksCompleted: number;
  tasksDue: number;
  hoursTracked: number;
  onComplete: () => void;
  onDismiss: () => void;
}

const STEPS = [
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'incomplete', label: 'Incomplete', icon: ListTodo },
  { id: 'reflect', label: 'Reflect', icon: Heart },
  { id: 'shutdown', label: 'Shutdown', icon: Power },
] as const;

const MOOD_OPTIONS: Array<{ value: DailyReviewType['mood']; label: string; emoji: string }> = [
  { value: 'great', label: 'Great', emoji: '🔥' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'rough', label: 'Rough', emoji: '😓' },
];

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

export const EveningReview: React.FC<EveningReviewProps> = ({
  dateKey,
  tasksCompleted,
  tasksDue,
  hoursTracked,
  onComplete,
  onDismiss,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [mood, setMood] = useState<DailyReviewType['mood']>();
  const [productivityRating, setProductivityRating] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [taskDecisions, setTaskDecisions] = useState<Record<string, RolloverDecision>>({});

  const tasks = useKanbanStore((s) => s.tasks);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const plan = useDailyPlanningStore((s) => s.getPlan(dateKey));
  const saveEveningReview = useDailyPlanningStore((s) => s.saveEveningReview);

  const today = useMemo(() => startOfDay(new Date()), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);

  // Completed tasks today
  const completedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate || t.status !== 'done') return false;
      const dueKey = format(new Date(t.dueDate), 'yyyy-M-d');
      return dueKey === dateKey;
    });
  }, [tasks, dateKey]);

  // Incomplete tasks today
  const incompleteTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate || t.status === 'done') return false;
      const dueKey = format(new Date(t.dueDate), 'yyyy-M-d');
      return dueKey === dateKey;
    });
  }, [tasks, dateKey]);

  const goalsCompleted = useMemo(
    () => plan.goals.filter((g) => g.completed).length,
    [plan.goals]
  );

  const setDecision = useCallback((taskId: string, decision: RolloverDecision) => {
    setTaskDecisions((prev) => ({ ...prev, [taskId]: decision }));
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
    const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

    // Apply task decisions
    incompleteTasks.forEach((task) => {
      const decision = taskDecisions[task.id] || 'move';
      if (decision === 'move') {
        updateTask(task.id, { dueDate: tomorrowDate });
      } else if (decision === 'drop') {
        updateTask(task.id, { dueDate: null, status: 'backlog' });
      }
      // 'reschedule' leaves the task as-is for the user to pick a date
    });

    // Save evening review
    const data: EveningReviewData = {
      tasksCompleted,
      tasksDue,
      hoursTracked,
      goalsCompleted,
      goalsDue: plan.goals.length,
      mood,
      productivityRating,
      reflectionNotes: reflectionNotes.trim(),
      completedAt: new Date().toISOString(),
      incompleteTasks: incompleteTasks.map((t) => ({
        taskId: t.id,
        decision: taskDecisions[t.id] || 'move',
      })),
    };
    saveEveningReview(dateKey, data);
    onComplete();
  }, [
    incompleteTasks, taskDecisions, tomorrow, updateTask,
    tasksCompleted, tasksDue, hoursTracked, goalsCompleted,
    plan.goals.length, mood, productivityRating, reflectionNotes,
    dateKey, saveEveningReview, onComplete,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-accent-purple" />
            <h2 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Evening Review
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
                    ? 'bg-accent-purple/10 text-accent-purple'
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
                <StepCompleted
                  completedTasks={completedTasks}
                  tasksCompleted={tasksCompleted}
                  tasksDue={tasksDue}
                  hoursTracked={hoursTracked}
                />
              )}
              {currentStep === 1 && (
                <StepIncomplete
                  tasks={incompleteTasks}
                  decisions={taskDecisions}
                  onDecision={setDecision}
                />
              )}
              {currentStep === 2 && (
                <StepReflect
                  mood={mood}
                  setMood={setMood}
                  rating={productivityRating}
                  setRating={setProductivityRating}
                  notes={reflectionNotes}
                  setNotes={setReflectionNotes}
                />
              )}
              {currentStep === 3 && <StepShutdown />}
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
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-accent-purple text-white hover:opacity-90 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg bg-accent-purple text-white hover:opacity-90 transition-colors"
            >
              <Power className="w-4 h-4" />
              End Day
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== STEP COMPONENTS ====================

interface TaskItem {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
}

const StepCompleted: React.FC<{
  completedTasks: TaskItem[];
  tasksCompleted: number;
  tasksDue: number;
  hoursTracked: number;
}> = ({ completedTasks, tasksCompleted, tasksDue, hoursTracked }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
      What You Accomplished
    </h3>
    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
      {tasksCompleted} of {tasksDue} tasks completed, {hoursTracked.toFixed(1)}h tracked.
    </p>

    {completedTasks.length === 0 ? (
      <div className="text-center py-6 text-text-light-tertiary dark:text-text-dark-tertiary">
        <p className="text-sm">No tasks completed today — that's okay.</p>
        <p className="text-xs mt-1">Every day is a fresh start.</p>
      </div>
    ) : (
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {completedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-green/5"
          >
            <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
            <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
              {task.title}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DECISION_OPTIONS: Array<{ value: RolloverDecision; icon: React.ReactNode; label: string; color: string }> = [
  { value: 'move', icon: <ArrowRight className="w-3.5 h-3.5" />, label: 'Tomorrow', color: 'text-accent-blue' },
  { value: 'reschedule', icon: <CalendarClock className="w-3.5 h-3.5" />, label: 'Later', color: 'text-accent-yellow' },
  { value: 'drop', icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Drop', color: 'text-accent-red' },
];

const StepIncomplete: React.FC<{
  tasks: TaskItem[];
  decisions: Record<string, RolloverDecision>;
  onDecision: (taskId: string, decision: RolloverDecision) => void;
}> = ({ tasks, decisions, onDecision }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
      Handle Incomplete Tasks
    </h3>
    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
      {tasks.length === 0
        ? 'All tasks completed — nicely done!'
        : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} left. What should happen?`}
    </p>

    <div className="space-y-2 max-h-[220px] overflow-y-auto">
      {tasks.map((task) => {
        const current = decisions[task.id] || 'move';
        return (
          <div
            key={task.id}
            className="px-3 py-2.5 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated"
          >
            <div className="text-sm text-text-light-primary dark:text-text-dark-primary mb-2 truncate">
              {task.title}
            </div>
            <div className="flex items-center gap-1.5">
              {DECISION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onDecision(task.id, opt.value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    current === opt.value
                      ? `${opt.color} bg-surface-light dark:bg-surface-dark border border-current/20`
                      : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-secondary dark:hover:text-text-dark-secondary'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const StepReflect: React.FC<{
  mood: DailyReviewType['mood'];
  setMood: (m: DailyReviewType['mood']) => void;
  rating: 1 | 2 | 3 | 4 | 5;
  setRating: (r: 1 | 2 | 3 | 4 | 5) => void;
  notes: string;
  setNotes: (n: string) => void;
}> = ({ mood, setMood, rating, setRating, notes, setNotes }) => (
  <div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
      How Was Your Day?
    </h3>

    {/* Mood */}
    <div className="mb-4">
      <label className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 block">
        Mood
      </label>
      <div className="flex gap-2">
        {MOOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMood(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              mood === opt.value
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border border-transparent hover:border-border-light dark:hover:border-border-dark'
            }`}
          >
            <span>{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    {/* Productivity rating */}
    <div className="mb-4">
      <label className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 block">
        Productivity (1-5)
      </label>
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRating(r)}
            className="p-1 transition-colors"
            aria-label={`Rate ${r} out of 5`}
          >
            <Star
              className={`w-6 h-6 ${
                r <= rating
                  ? 'text-accent-yellow fill-accent-yellow'
                  : 'text-text-light-tertiary dark:text-text-dark-tertiary'
              }`}
            />
          </button>
        ))}
      </div>
    </div>

    {/* Journal */}
    <div>
      <label className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 block">
        Reflections
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What went well? What could be better?"
        rows={3}
        className="w-full px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary outline-none focus:border-accent-primary resize-none"
      />
    </div>
  </div>
);

const StepShutdown: React.FC = () => (
  <div className="text-center py-6">
    <div className="w-16 h-16 rounded-full bg-accent-purple/10 flex items-center justify-center mx-auto mb-4">
      <Moon className="w-8 h-8 text-accent-purple" />
    </div>
    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
      Great work today
    </h3>
    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary max-w-xs mx-auto">
      You showed up and gave it your best. Rest well — tomorrow is a new opportunity.
    </p>
  </div>
);
