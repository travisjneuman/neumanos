import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Calendar, Clock, PieChart as PieChartIcon,
  BarChart3, Flame,
} from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import type { Habit, HabitCompletion, HabitCategory } from '../../types';

// Category display config
const CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: 'Health',
  productivity: 'Productivity',
  learning: 'Learning',
  social: 'Social',
  mindfulness: 'Mindfulness',
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  creative: 'Creative',
  finance: 'Finance',
  uncategorized: 'Uncategorized',
};

const CHART_COLORS = [
  '#06b6d4', '#8b5cf6', '#ec4899', '#f97316',
  '#22c55e', '#3b82f6', '#eab308', '#ef4444',
  '#14b8a6', '#a855f7',
];

// Helper to get date key in YYYY-M-D format
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

interface WeeklyTrendPoint {
  label: string;
  rate: number;
}

interface DayOfWeekData {
  day: string;
  completions: number;
  possible: number;
  rate: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TimeDistData {
  period: string;
  count: number;
  color: string;
}

/** Build weekly completion rate trend for the last 12 weeks */
function buildWeeklyTrend(
  habits: Habit[],
  completions: HabitCompletion[],
): WeeklyTrendPoint[] {
  const points: WeeklyTrendPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeHabits = habits.filter((h) => !h.archivedAt);

  for (let weekOffset = 11; weekOffset >= 0; weekOffset--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - weekOffset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let possible = 0;
    let completed = 0;

    for (let d = new Date(weekStart); d <= weekEnd && d <= today; d.setDate(d.getDate() + 1)) {
      const dk = getDateKey(d);
      for (const habit of activeHabits) {
        possible++;
        if (completions.some((c) => c.habitId === habit.id && c.date === dk)) {
          completed++;
        }
      }
    }

    const rate = possible > 0 ? Math.round((completed / possible) * 100) : 0;
    const month = weekStart.toLocaleString('en', { month: 'short' });
    const day = weekStart.getDate();
    points.push({ label: `${month} ${day}`, rate });
  }

  return points;
}

/** Build monthly heatmap data (last 6 months) */
function buildMonthlyHeatmap(
  habits: Habit[],
  completions: HabitCompletion[],
): Array<{ date: string; count: number; level: number }> {
  const data: Array<{ date: string; count: number; level: number }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeHabits = habits.filter((h) => !h.archivedAt);

  for (let i = 179; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dk = getDateKey(d);

    const count = activeHabits.reduce((sum, habit) => {
      return sum + (completions.some((c) => c.habitId === habit.id && c.date === dk) ? 1 : 0);
    }, 0);

    const total = activeHabits.length;
    const ratio = total > 0 ? count / total : 0;
    const level = ratio === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;

    data.push({ date: dk, count, level });
  }

  return data;
}

/** Best/worst days of the week */
function buildDayOfWeekStats(
  habits: Habit[],
  completions: HabitCompletion[],
): DayOfWeekData[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const stats = dayNames.map((day) => ({
    day,
    completions: 0,
    possible: 0,
    rate: 0,
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeHabits = habits.filter((h) => !h.archivedAt);

  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dk = getDateKey(d);
    const dow = d.getDay();

    for (const habit of activeHabits) {
      stats[dow].possible++;
      if (completions.some((c) => c.habitId === habit.id && c.date === dk)) {
        stats[dow].completions++;
      }
    }
  }

  for (const s of stats) {
    s.rate = s.possible > 0 ? Math.round((s.completions / s.possible) * 100) : 0;
  }

  // Reorder to start from Monday
  return [...stats.slice(1), stats[0]];
}

/** Category breakdown */
function buildCategoryBreakdown(
  habits: Habit[],
  completions: HabitCompletion[],
): CategoryData[] {
  const activeHabits = habits.filter((h) => !h.archivedAt);
  const catMap = new Map<HabitCategory, number>();

  for (const habit of activeHabits) {
    const count = completions.filter((c) => c.habitId === habit.id).length;
    catMap.set(habit.category, (catMap.get(habit.category) ?? 0) + count);
  }

  let colorIdx = 0;
  const data: CategoryData[] = [];
  for (const [cat, value] of catMap.entries()) {
    if (value > 0) {
      data.push({
        name: CATEGORY_LABELS[cat],
        value,
        color: CHART_COLORS[colorIdx % CHART_COLORS.length],
      });
      colorIdx++;
    }
  }

  return data.sort((a, b) => b.value - a.value);
}

/** Time distribution */
function buildTimeDistribution(completions: HabitCompletion[]): TimeDistData[] {
  let morning = 0;
  let afternoon = 0;
  let evening = 0;

  for (const c of completions) {
    const hour = new Date(c.completedAt).getHours();
    if (hour < 12) morning++;
    else if (hour < 18) afternoon++;
    else evening++;
  }

  return [
    { period: 'Morning (6am-12pm)', count: morning, color: '#f97316' },
    { period: 'Afternoon (12pm-6pm)', count: afternoon, color: '#3b82f6' },
    { period: 'Evening (6pm-12am)', count: evening, color: '#8b5cf6' },
  ];
}

// ─── Heatmap Sub-component ──────────────────────────────

const HEATMAP_COLORS = ['#1e1e2e', '#1a4731', '#166534', '#15803d', '#22c55e'];

function ContributionHeatmap({ data }: { data: Array<{ date: string; count: number; level: number }> }) {
  // Arrange into weeks (columns) with 7 rows (Mon-Sun)
  const weeks: Array<Array<{ date: string; count: number; level: number } | null>> = [];
  let currentWeek: Array<{ date: string; count: number; level: number } | null> = [];

  // Fill in the first partial week
  const firstDate = data[0];
  if (firstDate) {
    const parts = firstDate.date.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dow = d.getDay();
    const mondayIdx = dow === 0 ? 6 : dow - 1;
    for (let i = 0; i < mondayIdx; i++) {
      currentWeek.push(null);
    }
  }

  for (const entry of data) {
    currentWeek.push(entry);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-6 h-3 text-[9px] text-text-light-tertiary dark:text-text-dark-tertiary flex items-center">
              {label}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: day ? HEATMAP_COLORS[day.level] : 'transparent' }}
                title={day ? `${day.date}: ${day.count} completions` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
        <span>Less</span>
        {HEATMAP_COLORS.map((color, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Streak Leaderboard Sub-component ───────────────────

function StreakLeaderboard({ habits }: { habits: Habit[] }) {
  const topStreaks = useMemo(
    () =>
      habits
        .filter((h) => !h.archivedAt && h.currentStreak > 0)
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, 5),
    [habits],
  );

  if (topStreaks.length === 0) return null;

  const maxStreak = topStreaks[0]?.currentStreak ?? 1;

  return (
    <div>
      <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
        <Flame className="w-4 h-4" />
        Streak Leaderboard
      </h4>
      <div className="space-y-2">
        {topStreaks.map((habit, idx) => (
          <div key={habit.id} className="flex items-center gap-3">
            <span className="text-sm font-bold text-text-light-tertiary dark:text-text-dark-tertiary w-5">
              #{idx + 1}
            </span>
            <span className="text-lg">{habit.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate text-text-light-primary dark:text-text-dark-primary">
                  {habit.title}
                </span>
                <span className="text-sm font-medium text-accent-orange shrink-0 ml-2">
                  {habit.currentStreak} days
                </span>
              </div>
              <div className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-orange transition-all"
                  style={{ width: `${(habit.currentStreak / maxStreak) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Analytics Component ───────────────────────────

interface HabitAnalyticsProps {
  onClose: () => void;
}

export function HabitAnalytics({ onClose }: HabitAnalyticsProps) {
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);

  const weeklyTrend = useMemo(() => buildWeeklyTrend(habits, completions), [habits, completions]);
  const heatmapData = useMemo(() => buildMonthlyHeatmap(habits, completions), [habits, completions]);
  const dayOfWeekStats = useMemo(() => buildDayOfWeekStats(habits, completions), [habits, completions]);
  const categoryBreakdown = useMemo(() => buildCategoryBreakdown(habits, completions), [habits, completions]);
  const timeDist = useMemo(() => buildTimeDistribution(completions), [completions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-accent-primary" />
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                Habit Analytics
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Completion Rate Trend */}
            <div className="bg-surface-light-alt dark:bg-surface-dark rounded-xl p-4">
              <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Weekly Completion Rate
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(v: number) => `${v}%`}
                      width={35}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Completion Rate']}
                      contentStyle={{
                        backgroundColor: 'var(--color-surface-dark, #1f2937)',
                        border: '1px solid var(--color-border-dark, #374151)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#06b6d4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best/Worst Days */}
            <div className="bg-surface-light-alt dark:bg-surface-dark rounded-xl p-4">
              <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Best & Worst Days (90 days)
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekStats}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(v: number) => `${v}%`}
                      width={35}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Completion Rate']}
                      contentStyle={{
                        backgroundColor: 'var(--color-surface-dark, #1f2937)',
                        border: '1px solid var(--color-border-dark, #374151)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {dayOfWeekStats.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.rate >= 70 ? '#22c55e' : entry.rate >= 40 ? '#f97316' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Heatmap */}
            <div className="bg-surface-light-alt dark:bg-surface-dark rounded-xl p-4">
              <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                6-Month Activity Heatmap
              </h4>
              <ContributionHeatmap data={heatmapData} />
            </div>

            {/* Category Breakdown */}
            <div className="bg-surface-light-alt dark:bg-surface-dark rounded-xl p-4">
              <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                Category Breakdown
              </h4>
              {categoryBreakdown.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0} completions`, name ?? '']}
                        contentStyle={{
                          backgroundColor: 'var(--color-surface-dark, #1f2937)',
                          border: '1px solid var(--color-border-dark, #374151)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="middle"
                        align="right"
                        layout="vertical"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary text-center py-8">
                  No completion data yet
                </p>
              )}
            </div>

            {/* Streak Leaderboard */}
            <div className="bg-surface-light-alt dark:bg-surface-dark rounded-xl p-4">
              <StreakLeaderboard habits={habits} />
            </div>

            {/* Time Distribution */}
            <div className="bg-surface-light-alt dark:bg-surface-dark rounded-xl p-4">
              <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Completion Time Distribution
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeDist} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis
                      dataKey="period"
                      type="category"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      width={130}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [`${value ?? 0}`, 'Completions']}
                      contentStyle={{
                        backgroundColor: 'var(--color-surface-dark, #1f2937)',
                        border: '1px solid var(--color-border-dark, #374151)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {timeDist.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end px-6 py-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
