import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import type { Habit } from '../../types';

interface HabitStreakCalendarProps {
  habit: Habit;
  onClose: () => void;
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function HabitStreakCalendar({ habit, onClose }: HabitStreakCalendarProps) {
  const completions = useHabitStore((s) => s.completions);
  const [viewDate, setViewDate] = useState(() => new Date());

  const completionSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of completions) {
      if (c.habitId === habit.id) set.add(c.date);
    }
    return set;
  }, [completions, habit.id]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Start on Monday
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: Array<{ date: Date; inMonth: boolean; completed: boolean; isToday: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, inMonth: false, completed: completionSet.has(getDateKey(d)), isToday: false });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isToday = date.getTime() === today.getTime();
      days.push({ date, inMonth: true, completed: completionSet.has(getDateKey(date)), isToday });
    }

    // Next month padding to fill 6 rows max
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, inMonth: false, completed: completionSet.has(getDateKey(d)), isToday: false });
    }

    return days;
  }, [year, month, completionSet]);

  const monthLabel = new Date(year, month).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const completedThisMonth = calendarDays.filter((d) => d.inMonth && d.completed).length;
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">{habit.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                {habit.title}
              </h3>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                {completedThisMonth}/{totalDaysInMonth} days this month
              </p>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            </button>
            <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {monthLabel}
            </span>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center text-xs transition-colors ${
                  !day.inMonth
                    ? 'text-text-light-tertiary/30 dark:text-text-dark-tertiary/30'
                    : day.completed
                    ? 'text-white font-medium'
                    : day.isToday
                    ? 'ring-1 ring-accent-primary text-text-light-primary dark:text-text-dark-primary'
                    : 'text-text-light-secondary dark:text-text-dark-secondary'
                }`}
                style={
                  day.inMonth && day.completed
                    ? { backgroundColor: habit.color }
                    : undefined
                }
              >
                {day.date.getDate()}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
