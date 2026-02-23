import { useMemo } from 'react';
import {
  Flame, Trophy, Target, Compass, CheckCircle, Sunrise, Moon,
  Crown, Award, Zap, Star, Shield, Heart, Gem, Medal,
} from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import type { HabitAchievement, HabitAchievementType } from '../../types';

// Achievement definitions with visual info
interface AchievementDef {
  type: HabitAchievementType;
  value: number;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  isGlobal: boolean; // true = not tied to a specific habit
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Streak milestones (per-habit)
  { type: 'streak', value: 3, label: '3-Day Streak', description: 'Maintain a 3-day streak', icon: Flame, color: '#f97316', isGlobal: false },
  { type: 'streak', value: 7, label: 'Weekly Warrior', description: 'Maintain a 7-day streak', icon: Flame, color: '#f97316', isGlobal: false },
  { type: 'streak', value: 14, label: 'Fortnight Fighter', description: 'Maintain a 14-day streak', icon: Zap, color: '#eab308', isGlobal: false },
  { type: 'streak', value: 30, label: 'Monthly Master', description: 'Maintain a 30-day streak', icon: Trophy, color: '#eab308', isGlobal: false },
  { type: 'streak', value: 60, label: 'Bimonthly Boss', description: 'Maintain a 60-day streak', icon: Shield, color: '#3b82f6', isGlobal: false },
  { type: 'streak', value: 90, label: 'Quarter Champion', description: 'Maintain a 90-day streak', icon: Crown, color: '#8b5cf6', isGlobal: false },
  { type: 'streak', value: 180, label: 'Half-Year Hero', description: 'Maintain a 180-day streak', icon: Gem, color: '#ec4899', isGlobal: false },
  { type: 'streak', value: 365, label: 'Year-Long Legend', description: 'Maintain a 365-day streak', icon: Star, color: '#ef4444', isGlobal: false },

  // Total completion milestones (per-habit)
  { type: 'total', value: 10, label: 'Getting Going', description: 'Complete a habit 10 times', icon: Target, color: '#22c55e', isGlobal: false },
  { type: 'total', value: 50, label: 'Half Century', description: 'Complete a habit 50 times', icon: Award, color: '#06b6d4', isGlobal: false },
  { type: 'total', value: 100, label: 'Centurion', description: 'Complete a habit 100 times', icon: Medal, color: '#3b82f6', isGlobal: false },
  { type: 'total', value: 500, label: 'Committed', description: 'Complete a habit 500 times', icon: Heart, color: '#8b5cf6', isGlobal: false },
  { type: 'total', value: 1000, label: 'Legendary', description: 'Complete a habit 1000 times', icon: Crown, color: '#eab308', isGlobal: false },

  // Global achievements
  { type: 'consistency', value: 3, label: '3-Day Perfect', description: 'All habits completed for 3 days', icon: CheckCircle, color: '#22c55e', isGlobal: true },
  { type: 'consistency', value: 7, label: 'Perfect Week', description: 'All habits completed for 7 days', icon: CheckCircle, color: '#3b82f6', isGlobal: true },
  { type: 'consistency', value: 14, label: 'Perfect Fortnight', description: 'All habits completed for 14 days', icon: CheckCircle, color: '#8b5cf6', isGlobal: true },
  { type: 'consistency', value: 30, label: 'Perfect Month', description: 'All habits completed for 30 days', icon: CheckCircle, color: '#eab308', isGlobal: true },
  { type: 'category-mastery', value: 7, label: 'Category Master', description: 'All habits in a category for 7 days', icon: Crown, color: '#ec4899', isGlobal: true },
  { type: 'explorer', value: 5, label: 'Explorer', description: 'Use 5+ different categories', icon: Compass, color: '#14b8a6', isGlobal: true },
  { type: 'early-bird', value: 10, label: 'Early Bird', description: '10 completions before 9am', icon: Sunrise, color: '#f97316', isGlobal: true },
  { type: 'night-owl', value: 10, label: 'Night Owl', description: '10 completions after 9pm', icon: Moon, color: '#6366f1', isGlobal: true },
];

function getDefForAchievement(a: HabitAchievement): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find((d) => d.type === a.type && d.value === a.value);
}

// ─── Badge Component ────────────────────────────────────

function AchievementBadge({
  def,
  unlocked,
  habitTitle,
}: {
  def: AchievementDef;
  unlocked: boolean;
  habitTitle?: string;
}) {
  const Icon = def.icon;

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
        unlocked
          ? 'bg-surface-light dark:bg-surface-dark-elevated border-border-light dark:border-border-dark'
          : 'bg-surface-light-alt/50 dark:bg-surface-dark/50 border-border-light/50 dark:border-border-dark/50 opacity-40'
      }`}
      title={`${def.label}: ${def.description}${habitTitle ? ` (${habitTitle})` : ''}`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: unlocked ? `${def.color}20` : undefined,
          border: `2px solid ${unlocked ? def.color : '#4b5563'}`,
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: unlocked ? def.color : '#6b7280' }}
        />
      </div>
      <span className="text-[10px] font-medium text-center text-text-light-primary dark:text-text-dark-primary leading-tight">
        {def.label}
      </span>
      {habitTitle && unlocked && (
        <span className="text-[9px] text-text-light-tertiary dark:text-text-dark-tertiary truncate max-w-[80px]">
          {habitTitle}
        </span>
      )}
    </div>
  );
}

// ─── Progress to Next Achievement ───────────────────────

function AchievementProgress({
  label,
  current,
  target,
  color,
  icon: Icon,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}40` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary truncate">
            {label}
          </span>
          <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary shrink-0 ml-2">
            {current}/{target}
          </span>
        </div>
        <div className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Achievements Panel ────────────────────────────

export function HabitAchievementsBadges() {
  const achievements = useHabitStore((s) => s.achievements);
  const habits = useHabitStore((s) => s.habits);

  const habitNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of habits) map.set(h.id, h.title);
    return map;
  }, [habits]);

  // Compute progress towards next achievements
  const nextAchievements = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archivedAt);
    const progress: Array<{
      label: string;
      current: number;
      target: number;
      color: string;
      icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    }> = [];

    // Best streak progress
    const bestStreak = Math.max(0, ...activeHabits.map((h) => h.currentStreak));
    const nextStreakMilestone = [7, 14, 30, 60, 90, 180, 365].find((m) => m > bestStreak);
    if (nextStreakMilestone) {
      progress.push({
        label: `${nextStreakMilestone}-Day Streak`,
        current: bestStreak,
        target: nextStreakMilestone,
        color: '#f97316',
        icon: Flame,
      });
    }

    // Best total completions progress
    const bestTotal = Math.max(0, ...activeHabits.map((h) => h.totalCompletions));
    const nextTotalMilestone = [10, 50, 100, 500, 1000].find((m) => m > bestTotal);
    if (nextTotalMilestone) {
      progress.push({
        label: `${nextTotalMilestone} Completions`,
        current: bestTotal,
        target: nextTotalMilestone,
        color: '#22c55e',
        icon: Target,
      });
    }

    // Category count progress
    const catCount = new Set(activeHabits.map((h) => h.category)).size;
    if (catCount < 5) {
      progress.push({
        label: 'Explorer (5 categories)',
        current: catCount,
        target: 5,
        color: '#14b8a6',
        icon: Compass,
      });
    }

    // Consistency progress
    if (activeHabits.length > 0) {
      const minStreak = Math.min(...activeHabits.map((h) => h.currentStreak));
      const nextConsistency = [3, 7, 14, 30].find((m) => m > minStreak);
      if (nextConsistency) {
        progress.push({
          label: `${nextConsistency}-Day Perfect (all habits)`,
          current: minStreak,
          target: nextConsistency,
          color: '#3b82f6',
          icon: CheckCircle,
        });
      }
    }

    return progress;
  }, [habits]);

  // Separate unlocked vs locked for display
  const unlockedBadges = useMemo(() => {
    return achievements
      .map((a) => {
        const def = getDefForAchievement(a);
        if (!def) return null;
        return { achievement: a, def };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [achievements]);

  // Global achievement defs that are still locked
  const lockedGlobalDefs = useMemo(() => {
    return ACHIEVEMENT_DEFS.filter(
      (def) =>
        def.isGlobal &&
        !achievements.some((a) => a.type === def.type && a.value === def.value),
    );
  }, [achievements]);

  return (
    <div className="space-y-6">
      {/* Progress to next achievements */}
      {nextAchievements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
            Next Achievements
          </h4>
          <div className="space-y-3">
            {nextAchievements.map((p, i) => (
              <AchievementProgress key={i} {...p} />
            ))}
          </div>
        </div>
      )}

      {/* Unlocked badges */}
      {unlockedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
            Unlocked ({unlockedBadges.length})
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {unlockedBadges.map(({ achievement, def }) => (
              <AchievementBadge
                key={achievement.id}
                def={def}
                unlocked
                habitTitle={achievement.habitId ? habitNameMap.get(achievement.habitId) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked global achievements */}
      {lockedGlobalDefs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-light-tertiary dark:text-text-dark-tertiary mb-3">
            Locked
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {lockedGlobalDefs.map((def) => (
              <AchievementBadge
                key={`${def.type}:${def.value}`}
                def={def}
                unlocked={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
