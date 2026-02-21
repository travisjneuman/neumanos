import { useMemo } from 'react';
import { Flame, Trophy, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useHabitStore } from '../../stores/useHabitStore';
import type { Habit } from '../../types';

interface HabitStatsProps {
  habit: Habit;
  onClose: () => void;
}

/** Build 7-day rolling average data for trend chart */
function buildTrendData(
  completions: Array<{ date: string; completed: boolean }>,
  windowSize: number
): Array<{ label: string; rate: number }> {
  const result: Array<{ label: string; rate: number }> = [];

  for (let i = windowSize - 1; i < completions.length; i++) {
    const window = completions.slice(i - windowSize + 1, i + 1);
    const completedCount = window.filter((c) => c.completed).length;
    const rate = Math.round((completedCount / windowSize) * 100);
    const parts = completions[i].date.split('-');
    const label = `${parts[1]}/${parts[2]}`;
    result.push({ label, rate });
  }

  // Sample to avoid overcrowding (max ~30 points)
  if (result.length > 30) {
    const step = Math.ceil(result.length / 30);
    return result.filter((_, i) => i % step === 0 || i === result.length - 1);
  }

  return result;
}

export function HabitStats({ habit, onClose }: HabitStatsProps) {
  const getCompletionRate = useHabitStore((s) => s.getCompletionRate);
  const getCompletionHistory = useHabitStore((s) => s.getCompletionHistory);

  const rate7 = getCompletionRate(habit.id, 7);
  const rate30 = getCompletionRate(habit.id, 30);
  const rate90 = getCompletionRate(habit.id, 90);

  const trendData = useMemo(() => {
    const history = getCompletionHistory(habit.id, 90);
    return buildTrendData(history, 7);
  }, [habit.id, getCompletionHistory]);

  const statCards = [
    { label: 'Current Streak', value: `${habit.currentStreak}`, icon: Flame, accent: 'text-accent-orange' },
    { label: 'Longest Streak', value: `${habit.longestStreak}`, icon: Trophy, accent: 'text-accent-yellow' },
    { label: 'Total Completions', value: `${habit.totalCompletions}`, icon: BarChart3, accent: 'text-accent-primary' },
  ];

  const rateCards = [
    { label: 'Last 7 days', value: rate7 },
    { label: 'Last 30 days', value: rate30 },
    { label: 'Last 90 days', value: rate90 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{habit.icon}</span>
            <div>
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                {habit.title}
              </h2>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                Statistics & Trends
              </p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-light-alt dark:bg-surface-dark rounded-lg p-3 text-center"
              >
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.accent}`} />
                <div className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {stat.value}
                </div>
                <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Completion rates */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Completion Rate
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {rateCards.map((rate) => (
                <div
                  key={rate.label}
                  className="bg-surface-light-alt dark:bg-surface-dark rounded-lg p-3"
                >
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                      {rate.value}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rate.value}%`,
                        backgroundColor: habit.color,
                      }}
                    />
                  </div>
                  <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                    {rate.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend line chart */}
          {trendData.length > 2 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                90-Day Trend (7-day rolling average)
              </h3>
              <div className="h-40 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(v: number) => `${v}%`}
                      width={40}
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
                      stroke={habit.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
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
