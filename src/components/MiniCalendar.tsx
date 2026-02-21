/**
 * MiniCalendar Component
 * A compact month calendar for quick date navigation.
 * Shows dots on dates that have events. Clicking a date navigates the main calendar.
 */

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarStore } from '../stores/useCalendarStore';

interface MiniCalendarProps {
  /** Called when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Currently selected/displayed date in the main calendar */
  currentDate: Date;
}

export function MiniCalendar({ onDateSelect, currentDate }: MiniCalendarProps) {
  const { events } = useCalendarStore();

  // Mini calendar tracks its own month independently
  const [miniYear, setMiniYear] = useState(currentDate.getFullYear());
  const [miniMonth, setMiniMonth] = useState(currentDate.getMonth());

  const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Build dates with event indicators
  const calendarData = useMemo(() => {
    const firstDayOfWeek = new Date(miniYear, miniMonth, 1).getDay();
    const daysInMonth = new Date(miniYear, miniMonth + 1, 0).getDate();
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Build a set of dateKeys that have events
    const datesWithEvents = new Set<string>();
    Object.keys(events).forEach((dateKey) => {
      const evts = events[dateKey];
      if (evts && evts.length > 0) {
        datesWithEvents.add(dateKey);
      }
    });

    const cells: (null | {
      day: number;
      isToday: boolean;
      isSelected: boolean;
      hasEvents: boolean;
      date: Date;
    })[] = [];

    // Empty cells before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${miniYear}-${miniMonth + 1}-${day}`;
      const isToday = miniYear === todayYear && miniMonth === todayMonth && day === todayDate;
      const isSelected =
        miniYear === currentDate.getFullYear() &&
        miniMonth === currentDate.getMonth() &&
        day === currentDate.getDate();

      cells.push({
        day,
        isToday,
        isSelected,
        hasEvents: datesWithEvents.has(dateKey),
        date: new Date(miniYear, miniMonth, day),
      });
    }

    return cells;
  }, [miniYear, miniMonth, events, currentDate]);

  const handlePrevMonth = () => {
    if (miniMonth === 0) {
      setMiniMonth(11);
      setMiniYear(miniYear - 1);
    } else {
      setMiniMonth(miniMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (miniMonth === 11) {
      setMiniMonth(0);
      setMiniYear(miniYear + 1);
    } else {
      setMiniMonth(miniMonth + 1);
    }
  };

  const monthLabel = new Date(miniYear, miniMonth, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="w-56 bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark p-3 shadow-lg">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePrevMonth}
          className="p-0.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">
          {monthLabel}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-0.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0">
        {dayHeaders.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-text-light-tertiary dark:text-text-dark-tertiary py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0">
        {calendarData.map((cell, i) => {
          if (!cell) {
            return <div key={`empty-${i}`} className="w-7 h-7" />;
          }

          return (
            <button
              key={cell.day}
              onClick={() => onDateSelect(cell.date)}
              className={`w-7 h-7 flex flex-col items-center justify-center rounded-full text-[11px] relative transition-colors
                ${cell.isSelected
                  ? 'bg-accent-primary text-white font-bold'
                  : cell.isToday
                    ? 'bg-accent-primary/20 text-accent-primary font-semibold'
                    : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                }
              `}
            >
              {cell.day}
              {cell.hasEvents && !cell.isSelected && (
                <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accent-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
