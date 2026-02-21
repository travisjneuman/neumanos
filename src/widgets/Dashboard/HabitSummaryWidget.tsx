import { useMemo } from 'react';
import { Target, Flame, Check } from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import { Link, useNavigate } from 'react-router-dom';
import { WidgetEmptyState } from '../../components/WidgetEmptyState';
import type { Habit } from '../../types';

// Helper to get date key in YYYY-M-D format
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// Check if habit should be tracked today
function shouldTrackToday(habit: Habit): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'specific-days':
      return habit.targetDays?.includes(dayOfWeek) ?? false;
    case 'times-per-week':
      return true;
    default:
      return true;
  }
}

export function HabitSummaryWidget() {
  const habits = useHabitStore((s) => s.habits);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const isCompletedOnDate = useHabitStore((s) => s.isCompletedOnDate);

  const todayKey = getDateKey(new Date());

  // Get today's habits that should be tracked
  const todaysHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.archivedAt && shouldTrackToday(h))
        .sort((a, b) => a.order - b.order)
        .slice(0, 5), // Show top 5
    [habits]
  );

  const progress = useMemo(() => {
    const total = todaysHabits.length;
    const completed = todaysHabits.filter((h) =>
      isCompletedOnDate(h.id, todayKey)
    ).length;
    return { completed, total };
  }, [todaysHabits, todayKey, isCompletedOnDate]);

  // Total active streaks
  const totalStreaks = useMemo(
    () =>
      habits
        .filter((h) => !h.archivedAt && h.currentStreak > 0)
        .reduce((sum, h) => sum + h.currentStreak, 0),
    [habits]
  );

  const navigateTo = useNavigate();

  if (habits.filter((h) => !h.archivedAt).length === 0) {
    return (
      <WidgetEmptyState
        icon="🎯"
        message="No habits yet"
        hint="Build daily routines and track your streaks"
        action={{ label: 'Create Habit', onClick: () => navigateTo('/habits') }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`text-lg font-bold ${
              progress.completed === progress.total && progress.total > 0
                ? 'text-status-success'
                : 'text-text-light-primary dark:text-text-dark-primary'
            }`}
          >
            {progress.completed}/{progress.total}
          </div>
          <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            today
          </span>
        </div>

        {totalStreaks > 0 && (
          <div className="flex items-center gap-1 text-accent-orange">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">{totalStreaks} streak</span>
          </div>
        )}
      </div>

      {/* Today's habits quick check-in */}
      <div className="space-y-2">
        {todaysHabits.map((habit) => {
          const completed = isCompletedOnDate(habit.id, todayKey);
          return (
            <button
              key={habit.id}
              onClick={() => toggleCompletion(habit.id, todayKey)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                completed
                  ? 'bg-status-success/10 hover:bg-status-success/20'
                  : 'bg-surface-light-alt dark:bg-surface-dark hover:bg-surface-light dark:hover:bg-surface-dark-elevated'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  completed
                    ? 'bg-status-success text-white'
                    : 'border-2 border-border-light dark:border-border-dark'
                }`}
              >
                {completed ? <Check className="w-3 h-3" /> : habit.icon}
              </div>
              <span
                className={`text-sm truncate ${
                  completed
                    ? 'text-status-success line-through'
                    : 'text-text-light-primary dark:text-text-dark-primary'
                }`}
              >
                {habit.title}
              </span>
              {habit.currentStreak > 0 && (
                <span className="ml-auto text-xs text-accent-orange flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />
                  {habit.currentStreak}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* View all link */}
      {habits.filter((h) => !h.archivedAt).length > 5 && (
        <Link
          to="/habits"
          className="block text-center text-sm text-accent-primary hover:underline"
        >
          View all habits
        </Link>
      )}
    </div>
  );
}

export default HabitSummaryWidget;
