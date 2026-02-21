import { useMemo } from 'react';
import { Star, Zap, Shield, Crown, Sword } from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import { getLevelFromXp } from '../../stores/useHabitStore';

// Level tier configuration
const LEVEL_TIERS = [
  { minLevel: 1, label: 'Novice', icon: Star, color: '#9ca3af' },
  { minLevel: 5, label: 'Apprentice', icon: Zap, color: '#22c55e' },
  { minLevel: 10, label: 'Adept', icon: Shield, color: '#3b82f6' },
  { minLevel: 20, label: 'Expert', icon: Sword, color: '#8b5cf6' },
  { minLevel: 30, label: 'Master', icon: Crown, color: '#eab308' },
];

function getTier(level: number) {
  let tier = LEVEL_TIERS[0];
  for (const t of LEVEL_TIERS) {
    if (level >= t.minLevel) tier = t;
  }
  return tier;
}

export function HabitRewardsPanel() {
  const totalXp = useHabitStore((s) => s.getTotalXp());
  const habits = useHabitStore((s) => s.habits);

  const { level, currentXp, nextLevelXp } = useMemo(
    () => getLevelFromXp(totalXp),
    [totalXp]
  );

  const tier = getTier(level);
  const TierIcon = tier.icon;
  const progressPercent = Math.round((currentXp / nextLevelXp) * 100);

  // Top habits by XP
  const topHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.archivedAt && (h.totalXp ?? 0) > 0)
        .sort((a, b) => (b.totalXp ?? 0) - (a.totalXp ?? 0))
        .slice(0, 5),
    [habits]
  );

  return (
    <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-5 border border-border-light dark:border-border-dark">
      {/* Level display */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${tier.color}20`, border: `2px solid ${tier.color}` }}
        >
          <TierIcon className="w-7 h-7" style={{ color: tier.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Level {level}
            </span>
            <span className="text-sm font-medium" style={{ color: tier.color }}>
              {tier.label}
            </span>
          </div>
          <div className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            {totalXp.toLocaleString()} total XP
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary mb-1">
          <span>{currentXp} / {nextLevelXp} XP</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: tier.color,
            }}
          />
        </div>
      </div>

      {/* Difficulty XP reference */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Trivial', xp: 5, color: '#9ca3af' },
          { label: 'Easy', xp: 10, color: '#22c55e' },
          { label: 'Medium', xp: 20, color: '#f97316' },
          { label: 'Hard', xp: 40, color: '#ef4444' },
        ].map((d) => (
          <div
            key={d.label}
            className="text-center py-1.5 rounded-lg bg-surface-light-alt dark:bg-surface-dark"
          >
            <div className="text-xs font-medium" style={{ color: d.color }}>
              {d.label}
            </div>
            <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              +{d.xp} XP
            </div>
          </div>
        ))}
      </div>

      {/* Top habits by XP */}
      {topHabits.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Top Habits by XP
          </h4>
          <div className="space-y-1.5">
            {topHabits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span>{habit.icon}</span>
                  <span className="truncate text-text-light-primary dark:text-text-dark-primary">
                    {habit.title}
                  </span>
                </div>
                <span className="text-text-light-tertiary dark:text-text-dark-tertiary shrink-0 ml-2">
                  {(habit.totalXp ?? 0).toLocaleString()} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
