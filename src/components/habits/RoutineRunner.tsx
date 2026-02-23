import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Check, SkipForward, Clock, ArrowRight, Trophy } from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import type { Routine } from '../../stores/useRoutineStore';
import type { Habit } from '../../types';

// Helper to get date key in YYYY-M-D format
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface RoutineRunnerProps {
  routine: Routine;
  onClose: () => void;
}

export function RoutineRunner({ routine, onClose }: RoutineRunnerProps) {
  const habits = useHabitStore((s) => s.habits);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const isCompletedOnDate = useHabitStore((s) => s.isCompletedOnDate);

  const todayKey = getDateKey(new Date());

  const routineHabits = useMemo(
    () => routine.habitIds
      .map((id) => habits.find((h) => h.id === id))
      .filter((h): h is Habit => h !== undefined),
    [routine.habitIds, habits]
  );

  // Track which step we're on
  const [currentStep, setCurrentStep] = useState(() => {
    // Start at the first incomplete habit
    const firstIncomplete = routineHabits.findIndex(
      (h) => !isCompletedOnDate(h.id, todayKey)
    );
    return firstIncomplete >= 0 ? firstIncomplete : 0;
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate progress
  const completedCount = useMemo(
    () => routineHabits.filter((h) => isCompletedOnDate(h.id, todayKey)).length,
    [routineHabits, isCompletedOnDate, todayKey]
  );

  const progressPercentage = routineHabits.length > 0
    ? Math.round((completedCount / routineHabits.length) * 100)
    : 0;

  // Timer
  useEffect(() => {
    if (!isFinished) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished]);

  // Check if all done
  useEffect(() => {
    if (completedCount === routineHabits.length && routineHabits.length > 0) {
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [completedCount, routineHabits.length]);

  const handleComplete = useCallback(() => {
    const habit = routineHabits[currentStep];
    if (!habit) return;

    if (!isCompletedOnDate(habit.id, todayKey)) {
      toggleCompletion(habit.id, todayKey);
    }

    // Move to next incomplete step
    const nextIncomplete = routineHabits.findIndex(
      (h, i) => i > currentStep && !isCompletedOnDate(h.id, todayKey)
    );
    if (nextIncomplete >= 0) {
      setCurrentStep(nextIncomplete);
    } else {
      // Check if all are complete
      const anyIncomplete = routineHabits.findIndex(
        (h) => h.id !== habit.id && !isCompletedOnDate(h.id, todayKey)
      );
      if (anyIncomplete >= 0) {
        setCurrentStep(anyIncomplete);
      }
    }
  }, [currentStep, routineHabits, isCompletedOnDate, todayKey, toggleCompletion]);

  const handleSkip = useCallback(() => {
    const nextStep = currentStep + 1;
    if (nextStep < routineHabits.length) {
      setCurrentStep(nextStep);
    }
  }, [currentStep, routineHabits.length]);

  const currentHabit = routineHabits[currentStep];

  if (routineHabits.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-md mx-4 p-6 text-center">
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
            No habits found in this routine. Some may have been deleted.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <span className="text-xl">{routine.icon}</span>
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              {routine.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark"
          >
            <X className="w-5 h-5 text-text-light-tertiary dark:text-text-dark-tertiary" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {completedCount} / {routineHabits.length} completed
            </span>
            <div className="flex items-center gap-1 text-text-light-tertiary dark:text-text-dark-tertiary">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-light-alt dark:bg-surface-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Completion celebration */}
        {isFinished ? (
          <div className="p-8 text-center routine-complete-animation">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-status-success/20 flex items-center justify-center routine-trophy-bounce">
              <Trophy className="w-10 h-10 text-status-success" />
            </div>
            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
              Routine Complete!
            </h3>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-1">
              All {routineHabits.length} habits done in {formatElapsed(elapsedSeconds)}
            </p>
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Great work on your {routine.name}!
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Current habit (prominent) */}
            {currentHabit && (
              <div className="p-6">
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary uppercase tracking-wider mb-3">
                  Step {currentStep + 1} of {routineHabits.length}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-surface-light-alt dark:bg-surface-dark border-2 border-border-light dark:border-border-dark"
                    style={{ borderColor: currentHabit.color }}
                  >
                    {currentHabit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {currentHabit.title}
                    </h3>
                    {currentHabit.description && (
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                        {currentHabit.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleComplete}
                    disabled={isCompletedOnDate(currentHabit.id, todayKey)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-status-success text-white rounded-xl font-medium hover:bg-status-success/90 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    {isCompletedOnDate(currentHabit.id, todayKey) ? 'Done' : 'Complete'}
                  </button>
                  <button
                    onClick={handleSkip}
                    disabled={currentStep >= routineHabits.length - 1}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-border-light dark:border-border-dark rounded-xl text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors disabled:opacity-30"
                  >
                    <SkipForward className="w-4 h-4" />
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* Habit chain overview */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {routineHabits.map((habit, index) => {
                  const isComplete = isCompletedOnDate(habit.id, todayKey);
                  const isCurrent = index === currentStep;
                  return (
                    <div key={habit.id} className="flex items-center shrink-0">
                      <button
                        onClick={() => setCurrentStep(index)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                          isComplete
                            ? 'bg-status-success text-white'
                            : isCurrent
                            ? 'bg-accent-primary/20 ring-2 ring-accent-primary text-accent-primary'
                            : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-tertiary dark:text-text-dark-tertiary'
                        }`}
                        title={habit.title}
                      >
                        {isComplete ? <Check className="w-4 h-4" /> : habit.icon}
                      </button>
                      {index < routineHabits.length - 1 && (
                        <ArrowRight className="w-3 h-3 mx-0.5 text-text-light-tertiary dark:text-text-dark-tertiary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Celebration CSS animation */}
        <style>{`
          .routine-trophy-bounce {
            animation: trophyBounce 0.6s ease-out;
          }
          @keyframes trophyBounce {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          .routine-complete-animation {
            animation: fadeSlideUp 0.4s ease-out;
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
