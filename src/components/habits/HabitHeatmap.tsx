import { useMemo, useState } from 'react';
import { useHabitStore } from '../../stores/useHabitStore';

type HeatmapRange = 90 | 180 | 365;

interface HabitHeatmapProps {
  habitId?: string; // If undefined, shows aggregate for all active habits
  weeks?: number;
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Get green shade intensity (0-4) based on completion count */
function getIntensity(count: number, max: number): number {
  if (count === 0) return 0;
  if (max <= 1) return 4;
  const ratio = count / max;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

const INTENSITY_COLORS = [
  'bg-surface-light-alt dark:bg-surface-dark',       // 0 - none
  'bg-emerald-200 dark:bg-emerald-900',              // 1
  'bg-emerald-400 dark:bg-emerald-700',              // 2
  'bg-emerald-500 dark:bg-emerald-500',              // 3
  'bg-emerald-600 dark:bg-emerald-400',              // 4
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export function HabitHeatmap({ habitId, weeks: initialWeeks = 20 }: HabitHeatmapProps) {
  const completions = useHabitStore((s) => s.completions);
  const habits = useHabitStore((s) => s.habits);
  const [range, setRange] = useState<HeatmapRange | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ date: string; habits: string[] } | null>(null);

  const weeks = range ? Math.ceil(range / 7) : initialWeeks;

  const { grid, monthMarkers, maxCount, totalCompletions, dayCompletionMap } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = weeks * 7;

    // Build a map of date -> completion count and date -> habit titles
    const countMap = new Map<string, number>();
    const dayHabits = new Map<string, string[]>();
    const activeHabitIds = habitId
      ? [habitId]
      : habits.filter((h) => !h.archivedAt).map((h) => h.id);
    const habitTitleMap = new Map(habits.map((h) => [h.id, h.title]));

    for (const c of completions) {
      if (activeHabitIds.includes(c.habitId)) {
        countMap.set(c.date, (countMap.get(c.date) ?? 0) + 1);
        const list = dayHabits.get(c.date) ?? [];
        const title = habitTitleMap.get(c.habitId) ?? 'Unknown';
        if (!list.includes(title)) list.push(title);
        dayHabits.set(c.date, list);
      }
    }

    // Find the start date (align to Monday)
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to Monday
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    // Build grid: columns = weeks, rows = days (Mon=0 to Sun=6)
    const gridData: Array<Array<{ date: string; count: number; dateObj: Date }>> = [];
    const markers: Array<{ weekIndex: number; label: string }> = [];
    let max = 0;
    let total = 0;
    let lastMonth = -1;

    const current = new Date(startDate);
    let weekIndex = 0;

    while (current <= endDate || weekIndex < weeks) {
      const week: Array<{ date: string; count: number; dateObj: Date }> = [];

      for (let day = 0; day < 7; day++) {
        const dateKey = getDateKey(current);
        const count = countMap.get(dateKey) ?? 0;
        const isFuture = current > today;

        week.push({
          date: dateKey,
          count: isFuture ? -1 : count,
          dateObj: new Date(current),
        });

        if (!isFuture) {
          max = Math.max(max, count);
          total += count;
        }

        // Track month changes for labels
        if (day === 0 && current.getMonth() !== lastMonth) {
          lastMonth = current.getMonth();
          markers.push({ weekIndex, label: MONTH_LABELS[lastMonth] });
        }

        current.setDate(current.getDate() + 1);
      }

      gridData.push(week);
      weekIndex++;
      if (weekIndex >= weeks + 2) break; // Safety
    }

    return { grid: gridData, monthMarkers: markers, maxCount: max, totalCompletions: total, dayCompletionMap: dayHabits };
  }, [completions, habits, habitId, weeks]);

  const handleDayClick = (date: string) => {
    const habitList = dayCompletionMap.get(date);
    if (habitList && habitList.length > 0) {
      setSelectedDay({ date, habits: habitList });
    } else {
      setSelectedDay(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Range toggle */}
      <div className="flex items-center gap-2 mb-2">
        {([90, 180, 365] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(range === r ? null : r)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              range === r
                ? 'bg-accent-primary/10 text-accent-primary font-medium'
                : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-secondary dark:hover:text-text-dark-secondary'
            }`}
          >
            {r}d
          </button>
        ))}
      </div>

      {/* Month labels */}
      <div className="flex ml-8 mb-1">
        {monthMarkers.map((m, i) => (
          <span
            key={i}
            className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary"
            style={{
              position: 'relative',
              left: `${m.weekIndex * 14}px`,
              marginRight: i < monthMarkers.length - 1
                ? `${((monthMarkers[i + 1]?.weekIndex ?? m.weekIndex) - m.weekIndex) * 14 - 24}px`
                : 0,
            }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="w-6 h-[12px] text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary leading-[12px]">
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <button
                key={di}
                type="button"
                onClick={() => day.count > 0 && handleDayClick(day.date)}
                className={`w-[12px] h-[12px] rounded-[2px] ${
                  day.count < 0
                    ? 'bg-transparent'
                    : INTENSITY_COLORS[getIntensity(day.count, maxCount)]
                } ${day.count > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                title={day.count >= 0 ? `${day.date}: ${day.count} completion${day.count !== 1 ? 's' : ''}` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {totalCompletions} completions in the last {weeks} weeks
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mr-1">Less</span>
          {INTENSITY_COLORS.map((cls, i) => (
            <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${cls}`} />
          ))}
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary ml-1">More</span>
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-3 p-3 rounded-lg bg-surface-light-alt dark:bg-surface-dark border border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
              {selectedDay.date}
            </span>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
            >
              Close
            </button>
          </div>
          <ul className="space-y-1">
            {selectedDay.habits.map((name) => (
              <li key={name} className="text-xs text-text-light-primary dark:text-text-dark-primary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
