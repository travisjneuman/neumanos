import { useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Flame, Award } from 'lucide-react';
import { useProductivityStore } from '../../stores/useProductivityStore';

function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e'; // green
  if (score >= 50) return '#eab308'; // yellow
  if (score >= 25) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getScoreTrailColor(score: number): string {
  if (score >= 75) return 'rgba(34, 197, 94, 0.15)';
  if (score >= 50) return 'rgba(234, 179, 8, 0.15)';
  if (score >= 25) return 'rgba(249, 115, 22, 0.15)';
  return 'rgba(239, 68, 68, 0.15)';
}

/**
 * SVG sparkline from an array of values (0-100)
 */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;

  const width = 120;
  const height = 32;
  const padding = 2;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * usableW;
    const y = padding + usableH - (v / 100) * usableH;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  // Fill area
  const fillD = `${pathD} L ${padding + usableW},${padding + usableH} L ${padding},${padding + usableH} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#sparkFill)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductivityKarmaWidget() {
  const refreshToday = useProductivityStore((s) => s.refreshToday);
  const getTodayKarma = useProductivityStore((s) => s.getTodayKarma);
  const getLevel = useProductivityStore((s) => s.getLevel);
  const getStreak = useProductivityStore((s) => s.getStreak);
  const getWeeklyTrend = useProductivityStore((s) => s.getWeeklyTrend);
  const getLast7Days = useProductivityStore((s) => s.getLast7Days);
  const cumulativeKarma = useProductivityStore((s) => s.cumulativeKarma);

  // Refresh on mount and every 60 seconds
  useEffect(() => {
    refreshToday();
    const interval = setInterval(refreshToday, 60_000);
    return () => clearInterval(interval);
  }, [refreshToday]);

  const todayKarma = useMemo(() => getTodayKarma(), [getTodayKarma, cumulativeKarma]);
  const level = useMemo(() => getLevel(), [getLevel, cumulativeKarma]);
  const streak = useMemo(() => getStreak(), [getStreak, cumulativeKarma]);
  const trend = useMemo(() => getWeeklyTrend(), [getWeeklyTrend, cumulativeKarma]);
  const last7 = useMemo(() => getLast7Days(), [getLast7Days, cumulativeKarma]);

  const score = todayKarma.score;
  const scoreColor = getScoreColor(score);
  const trailColor = getScoreTrailColor(score);

  // SVG circle params
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
          Productivity Karma
        </h3>
        <div className="flex items-center gap-1.5">
          {/* Level badge */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
          >
            <Award className="w-3 h-3" />
            Lv {level}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center gap-4 flex-1">
        {/* Circular score */}
        <div className="relative flex-shrink-0">
          <svg width="92" height="92" className="-rotate-90">
            {/* Trail */}
            <circle
              cx="46"
              cy="46"
              r={radius}
              fill="none"
              stroke={trailColor}
              strokeWidth="6"
            />
            {/* Progress */}
            <circle
              cx="46"
              cy="46"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {score}
            </span>
            <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary uppercase tracking-wide">
              karma
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Streak */}
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-accent-red flex-shrink-0" />
            <span className="text-sm text-text-light-primary dark:text-text-dark-primary font-medium">
              {streak}
            </span>
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              day streak
            </span>
          </div>

          {/* Trend */}
          <div className="flex items-center gap-2">
            {trend.delta >= 0 ? (
              <TrendingUp className="w-4 h-4 text-accent-green flex-shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-accent-red flex-shrink-0" />
            )}
            <span
              className={`text-sm font-medium ${trend.delta >= 0 ? 'text-accent-green' : 'text-accent-red'}`}
            >
              {trend.delta >= 0 ? '+' : ''}{trend.percentage}%
            </span>
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              vs last week
            </span>
          </div>

          {/* Sparkline */}
          <div className="pt-1">
            <Sparkline values={last7.map((d) => d.score)} color={scoreColor} />
          </div>
        </div>
      </div>

      {/* Breakdown footer */}
      <div className="grid grid-cols-4 gap-1 mt-3 pt-2 border-t border-border-light dark:border-border-dark">
        {[
          { label: 'Tasks', value: todayKarma.breakdown.tasks, weight: '35%' },
          { label: 'Habits', value: todayKarma.breakdown.habits, weight: '35%' },
          { label: 'Time', value: todayKarma.breakdown.timeTracked, weight: '20%' },
          { label: 'Energy', value: todayKarma.breakdown.energy, weight: '10%' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
              {item.value}
            </div>
            <div className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
