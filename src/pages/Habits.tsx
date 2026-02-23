import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus, Target, Flame, Trophy, Archive, RotateCcw, Trash2, Edit2,
  Check, MoreVertical, ChevronDown, ChevronRight, BarChart3, BookTemplate,
  Grid3X3, Star, Lock, Bell, BellOff, Link2, Snowflake, Award,
  TrendingUp, Search, MessageSquare,
} from 'lucide-react';
import { useHabitStore } from '../stores/useHabitStore';
import { PageContent } from '../components/PageContent';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  HabitHeatmap,
  HabitStats,
  HabitTemplatePicker,
  HabitRewardsPanel,
  useCompletionAnimation,
  useHabitReminders,
  ConfettiEffect,
  StreakBump,
  HABIT_ANIMATION_STYLES,
  HabitAnalytics,
  HabitAchievementsBadges,
} from '../components/habits';
import type { HabitTemplate } from '../components/habits';
import type { Habit, HabitFrequency, HabitCategory, HabitDifficulty } from '../types';

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

// Frequency display text
function getFrequencyLabel(habit: Habit): string {
  switch (habit.frequency) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Weekdays';
    case 'weekends':
      return 'Weekends';
    case 'specific-days': {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return habit.targetDays?.map((d) => days[d]).join(', ') ?? '';
    }
    case 'times-per-week':
      return `${habit.timesPerWeek}x per week`;
    default:
      return '';
  }
}

// Category configuration
const CATEGORY_CONFIG: Record<HabitCategory, { label: string; icon: string }> = {
  health: { label: 'Health', icon: '🏥' },
  productivity: { label: 'Productivity', icon: '⚡' },
  learning: { label: 'Learning', icon: '📖' },
  social: { label: 'Social', icon: '👥' },
  mindfulness: { label: 'Mindfulness', icon: '🧘' },
  fitness: { label: 'Fitness', icon: '💪' },
  nutrition: { label: 'Nutrition', icon: '🥗' },
  creative: { label: 'Creative', icon: '🎨' },
  finance: { label: 'Finance', icon: '💰' },
  uncategorized: { label: 'Uncategorized', icon: '📌' },
};

const ALL_CATEGORIES: HabitCategory[] = [
  'health', 'productivity', 'learning', 'social', 'mindfulness',
  'fitness', 'nutrition', 'creative', 'finance', 'uncategorized',
];

// Difficulty configuration
const DIFFICULTY_CONFIG: Record<HabitDifficulty, { label: string; xp: number; color: string }> = {
  trivial: { label: 'Trivial', xp: 5, color: '#9ca3af' },
  easy: { label: 'Easy', xp: 10, color: '#22c55e' },
  medium: { label: 'Medium', xp: 20, color: '#f97316' },
  hard: { label: 'Hard', xp: 40, color: '#ef4444' },
};

const ALL_DIFFICULTIES: HabitDifficulty[] = ['trivial', 'easy', 'medium', 'hard'];

// Default colors for habits
const HABIT_COLORS = [
  '#06b6d4', '#8b5cf6', '#ec4899', '#f97316',
  '#22c55e', '#3b82f6', '#eab308', '#ef4444',
];

// Default icons for habits
const HABIT_ICONS = ['🎯', '💪', '📚', '🧘', '🏃', '💧', '🍎', '😴', '✍️', '🎨'];

// ─── Habit Modal ──────────────────────────────────────────

interface HabitModalProps {
  habit?: Habit;
  initialTemplate?: HabitTemplate;
  allHabits: Habit[];
  onClose: () => void;
  onSave: (data: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'totalCompletions' | 'totalXp' | 'order' | 'freezesUsed'>) => void;
}

function HabitModal({ habit, initialTemplate, allHabits, onClose, onSave }: HabitModalProps) {
  const [title, setTitle] = useState(habit?.title ?? initialTemplate?.title ?? '');
  const [description, setDescription] = useState(habit?.description ?? initialTemplate?.description ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? initialTemplate?.icon ?? '🎯');
  const [color, setColor] = useState(habit?.color ?? initialTemplate?.color ?? HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? initialTemplate?.frequency ?? 'daily');
  const [category, setCategory] = useState<HabitCategory>(habit?.category ?? initialTemplate?.category ?? 'uncategorized');
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(habit?.difficulty ?? 'easy');
  const [targetDays, setTargetDays] = useState<number[]>(habit?.targetDays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.timesPerWeek ?? initialTemplate?.timesPerWeek ?? 3);
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminder?.enabled ?? false);
  const [reminderTime, setReminderTime] = useState(habit?.reminder?.time ?? '09:00');
  const [requiredHabitIds, setRequiredHabitIds] = useState<string[]>(habit?.requiredHabitIds ?? []);
  const [freezesPerWeek, setFreezesPerWeek] = useState(habit?.freezesPerWeek ?? 1);

  // Available habits for dependency selection (exclude self)
  const availableForDep = useMemo(
    () => allHabits.filter((h) => !h.archivedAt && h.id !== habit?.id),
    [allHabits, habit?.id]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      category,
      difficulty,
      frequency,
      targetDays: frequency === 'specific-days' ? targetDays : undefined,
      timesPerWeek: frequency === 'times-per-week' ? timesPerWeek : undefined,
      reminder: reminderEnabled ? { enabled: true, time: reminderTime } : undefined,
      requiredHabitIds: requiredHabitIds.length > 0 ? requiredHabitIds : undefined,
      freezesPerWeek,
      projectIds: habit?.projectIds ?? [],
    });
  };

  const toggleDay = (day: number) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
              {habit ? 'Edit Habit' : 'New Habit'}
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Meditate for 10 minutes"
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why this habit matters to you..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                      icon === i
                        ? 'bg-accent-primary/20 ring-2 ring-accent-primary'
                        : 'bg-surface-light-alt dark:bg-surface-dark hover:bg-accent-primary/10'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-accent-primary' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="daily">Every day</option>
                <option value="weekdays">Weekdays only</option>
                <option value="weekends">Weekends only</option>
                <option value="specific-days">Specific days</option>
                <option value="times-per-week">X times per week</option>
              </select>
            </div>

            {/* Specific days selector */}
            {frequency === 'specific-days' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Select days
                </label>
                <div className="flex gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                        targetDays.includes(idx)
                          ? 'bg-accent-primary text-white'
                          : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-accent-primary/20'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Times per week */}
            {frequency === 'times-per-week' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Times per week
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            )}

            {/* Difficulty */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Difficulty (affects XP earned)
              </label>
              <div className="flex gap-2">
                {ALL_DIFFICULTIES.map((d) => {
                  const cfg = DIFFICULTY_CONFIG[d];
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                        difficulty === d
                          ? 'ring-2 ring-offset-1 ring-accent-primary'
                          : 'border-border-light dark:border-border-dark'
                      }`}
                      style={difficulty === d ? { borderColor: cfg.color, color: cfg.color } : undefined}
                    >
                      <div>{cfg.label}</div>
                      <div className="text-xs opacity-70">+{cfg.xp} XP</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reminder */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Daily Reminder
                </label>
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    reminderEnabled
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-tertiary dark:text-text-dark-tertiary'
                  }`}
                >
                  {reminderEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                  {reminderEnabled ? 'On' : 'Off'}
                </button>
              </div>
              {reminderEnabled && (
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              )}
            </div>

            {/* Streak Freeze */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                <Snowflake className="w-3.5 h-3.5 inline mr-1" />
                Streak Freezes per Week
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={7}
                  value={freezesPerWeek}
                  onChange={(e) => setFreezesPerWeek(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  Auto-applied when a day is missed to preserve streaks
                </span>
              </div>
            </div>

            {/* Dependencies */}
            {availableForDep.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  <Link2 className="w-3.5 h-3.5 inline mr-1" />
                  Required Habits (must complete first)
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableForDep.map((h) => (
                    <label key={h.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={requiredHabitIds.includes(h.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRequiredHabitIds((prev) => [...prev, h.id]);
                          } else {
                            setRequiredHabitIds((prev) => prev.filter((id) => id !== h.id));
                          }
                        }}
                        className="rounded border-border-light dark:border-border-dark accent-accent-primary"
                      />
                      <span>{h.icon}</span>
                      <span className="text-text-light-primary dark:text-text-dark-primary">{h.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
            >
              {habit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Habit Card ───────────────────────────────────────────

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  isLocked: boolean;
  blockingNames: string[];
  onToggle: (note?: string) => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onViewStats: () => void;
  weekProgress: boolean[];
  showConfetti: boolean;
  animatedStreak: boolean;
  freezesRemaining: number;
  isFrozenToday: boolean;
  completionNote?: string;
}

function HabitCard({
  habit,
  isCompletedToday,
  isLocked,
  blockingNames,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  onViewStats,
  weekProgress,
  showConfetti,
  animatedStreak,
  freezesRemaining,
  isFrozenToday,
  completionNote,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const trackToday = shouldTrackToday(habit);
  const canToggle = trackToday && !isLocked;

  return (
    <div
      className="group bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-4 border border-border-light dark:border-border-dark hover:border-accent-primary/30 transition-all"
      style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-4">
        {/* Check button */}
        <div className="relative">
          <button
            onClick={() => {
              if (isCompletedToday) {
                // Uncompleting — no note needed
                onToggle();
              } else if (canToggle) {
                // Show note input briefly then complete
                setShowNoteInput(true);
              }
            }}
            disabled={!canToggle}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all shrink-0 ${
              isCompletedToday
                ? 'bg-status-success text-white'
                : isLocked
                ? 'bg-surface-light-alt dark:bg-surface-dark opacity-50 cursor-not-allowed border-2 border-amber-400/50'
                : trackToday
                ? 'bg-surface-light-alt dark:bg-surface-dark hover:bg-accent-primary/20 border-2 border-border-light dark:border-border-dark'
                : 'bg-surface-light-alt dark:bg-surface-dark opacity-50 cursor-not-allowed'
            }`}
            style={isCompletedToday ? { animation: 'habit-check-pop 0.3s ease-out' } : undefined}
            title={
              isLocked
                ? `Complete first: ${blockingNames.join(', ')}`
                : trackToday
                ? isCompletedToday ? 'Mark incomplete' : 'Mark complete'
                : 'Not scheduled for today'
            }
          >
            {isCompletedToday ? (
              <Check className="w-5 h-5" style={{ animation: 'habit-check-in 0.3s ease-out' }} />
            ) : isLocked ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : (
              <span>{habit.icon}</span>
            )}
          </button>
          {showConfetti && <ConfettiEffect onDone={() => {}} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {habit.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-text-light-tertiary dark:text-text-dark-tertiary flex-wrap">
                <span>{getFrequencyLabel(habit)}</span>
                {habit.category !== 'uncategorized' && (
                  <>
                    <span className="text-border-light dark:text-border-dark">|</span>
                    <span>{CATEGORY_CONFIG[habit.category].icon} {CATEGORY_CONFIG[habit.category].label}</span>
                  </>
                )}
                {habit.difficulty && habit.difficulty !== 'easy' && (
                  <>
                    <span className="text-border-light dark:text-border-dark">|</span>
                    <span style={{ color: DIFFICULTY_CONFIG[habit.difficulty].color }}>
                      {DIFFICULTY_CONFIG[habit.difficulty].label}
                    </span>
                  </>
                )}
                {isLocked && blockingNames.length > 0 && (
                  <span className="text-amber-500 text-xs flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Requires: {blockingNames.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Stats + Menu */}
            <div className="flex items-center gap-3">
              {habit.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-accent-orange">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {animatedStreak ? <StreakBump streak={habit.currentStreak} /> : habit.currentStreak}
                  </span>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-lg border border-border-light dark:border-border-dark py-1 min-w-[140px]">
                      <button
                        onClick={() => { setShowMenu(false); onViewStats(); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light-alt dark:hover:bg-surface-dark flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Statistics
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onEdit(); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light-alt dark:hover:bg-surface-dark flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onArchive(); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light-alt dark:hover:bg-surface-dark flex items-center gap-2"
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onDelete(); }}
                        className="w-full px-3 py-2 text-left text-sm text-status-error hover:bg-status-error/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Week progress + freeze indicator */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                    weekProgress[idx]
                      ? 'bg-status-success text-white'
                      : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-tertiary dark:text-text-dark-tertiary'
                  }`}
                  title={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Freeze indicator */}
            {(freezesRemaining > 0 || isFrozenToday) && (
              <div
                className="flex items-center gap-1 text-xs"
                title={isFrozenToday ? 'Streak freeze active today' : `${freezesRemaining} freeze(s) remaining this week`}
              >
                <Snowflake className={`w-3.5 h-3.5 ${isFrozenToday ? 'text-sky-400' : 'text-sky-600/50'}`} />
                <span className={isFrozenToday ? 'text-sky-400' : 'text-text-light-tertiary dark:text-text-dark-tertiary'}>
                  {isFrozenToday ? 'Frozen' : `${freezesRemaining}`}
                </span>
              </div>
            )}
          </div>

          {/* Note input (shown when completing) */}
          {showNoteInput && !isCompletedToday && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note (optional)..."
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onToggle(noteText.trim() || undefined);
                    setShowNoteInput(false);
                    setNoteText('');
                  } else if (e.key === 'Escape') {
                    onToggle();
                    setShowNoteInput(false);
                    setNoteText('');
                  }
                }}
              />
              <button
                onClick={() => {
                  onToggle(noteText.trim() || undefined);
                  setShowNoteInput(false);
                  setNoteText('');
                }}
                className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => {
                  onToggle();
                  setShowNoteInput(false);
                  setNoteText('');
                }}
                className="px-2 py-1.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
              >
                Skip
              </button>
            </div>
          )}

          {/* Display completion note if exists */}
          {isCompletedToday && completionNote && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="italic">{completionNote}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category Section (collapsible) ──────────────────────

interface CategorySectionProps {
  category: HabitCategory;
  habits: Habit[];
  renderHabit: (habit: Habit) => React.ReactNode;
}

function CategorySection({ category, habits, renderHabit }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const config = CATEGORY_CONFIG[category];

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span>{config.icon}</span>
        <span>{config.label}</span>
        <span className="text-text-light-tertiary dark:text-text-dark-tertiary">({habits.length})</span>
      </button>
      {!collapsed && (
        <div className="space-y-3 ml-2">
          {habits.map(renderHabit)}
        </div>
      )}
    </div>
  );
}

// ─── Habits Content (main body) ──────────────────────────

export function HabitsContent() {
  const habits = useHabitStore((s) => s.habits);
  const achievements = useHabitStore((s) => s.achievements);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const restoreHabit = useHabitStore((s) => s.restoreHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);
  const isCompletedOnDate = useHabitStore((s) => s.isCompletedOnDate);
  const getWeekProgress = useHabitStore((s) => s.getWeekProgress);
  const getTodayProgress = useHabitStore((s) => s.getTodayProgress);
  const isHabitUnlocked = useHabitStore((s) => s.isHabitUnlocked);
  const getBlockingHabits = useHabitStore((s) => s.getBlockingHabits);
  const getFreezesRemainingThisWeek = useHabitStore((s) => s.getFreezesRemainingThisWeek);
  const isDateFrozen = useHabitStore((s) => s.isDateFrozen);
  const completions = useHabitStore((s) => s.completions);
  const searchCompletionNotes = useHabitStore((s) => s.searchCompletionNotes);

  // Activate habit reminders
  useHabitReminders();

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | undefined>(undefined);
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [showNoteSearch, setShowNoteSearch] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);

  const { triggerAnimation, clearAnimation, getAnimation } = useCompletionAnimation();

  // Inject animation styles
  useEffect(() => {
    const styleId = 'habit-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = HABIT_ANIMATION_STYLES;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  const todayKey = getDateKey(new Date());
  const todayProgress = getTodayProgress();

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt).sort((a, b) => a.order - b.order),
    [habits]
  );

  const archivedHabits = useMemo(
    () => habits.filter((h) => h.archivedAt),
    [habits]
  );

  const totalStreakDays = useMemo(
    () => activeHabits.reduce((sum, h) => sum + h.currentStreak, 0),
    [activeHabits]
  );

  // Group habits by category
  const habitsByCategory = useMemo(() => {
    const groups = new Map<HabitCategory, Habit[]>();
    for (const habit of activeHabits) {
      const cat = habit.category ?? 'uncategorized';
      const list = groups.get(cat) ?? [];
      list.push(habit);
      groups.set(cat, list);
    }
    // Sort categories: populated ones first, in defined order
    const sorted: Array<{ category: HabitCategory; habits: Habit[] }> = [];
    for (const cat of ALL_CATEGORIES) {
      const list = groups.get(cat);
      if (list && list.length > 0) {
        sorted.push({ category: cat, habits: list });
      }
    }
    return sorted;
  }, [activeHabits]);

  const handleToggleCompletion = useCallback((habitId: string, note?: string) => {
    const wasCompleted = isCompletedOnDate(habitId, todayKey);
    toggleCompletion(habitId, todayKey, note);

    if (!wasCompleted) {
      // Find updated streak after toggle
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        // Trigger animation with current streak + 1 (optimistic)
        const newStreak = habit.currentStreak + 1;
        triggerAnimation(habitId, newStreak);
        setTimeout(() => clearAnimation(habitId), 2000);
      }
    }
  }, [isCompletedOnDate, todayKey, toggleCompletion, habits, triggerAnimation, clearAnimation]);

  // Note search results
  const noteSearchResults = useMemo(() => {
    if (!noteSearchQuery.trim()) return [];
    return searchCompletionNotes(noteSearchQuery);
  }, [noteSearchQuery, searchCompletionNotes]);

  const handleSaveHabit = (
    data: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'totalCompletions' | 'totalXp' | 'order' | 'freezesUsed'>
  ) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
    setShowModal(false);
    setEditingHabit(null);
    setSelectedTemplate(undefined);
  };

  const handleSelectTemplate = (template: HabitTemplate) => {
    setShowTemplatePicker(false);
    setSelectedTemplate(template);
    setEditingHabit(null);
    setShowModal(true);
  };

  const handleDeleteHabit = useCallback((id: string) => {
    setHabitToDelete(id);
  }, []);

  const confirmDeleteHabit = useCallback(() => {
    if (habitToDelete) {
      deleteHabit(habitToDelete);
      setHabitToDelete(null);
    }
  }, [habitToDelete, deleteHabit]);

  const renderHabitCard = useCallback((habit: Habit) => {
    const animation = getAnimation(habit.id);
    const unlocked = isHabitUnlocked(habit.id, todayKey);
    const blocking = getBlockingHabits(habit.id, todayKey);
    const todayCompletion = completions.find(
      (c) => c.habitId === habit.id && c.date === todayKey
    );
    return (
      <HabitCard
        key={habit.id}
        habit={habit}
        isCompletedToday={isCompletedOnDate(habit.id, todayKey)}
        isLocked={!unlocked}
        blockingNames={blocking}
        onToggle={(note) => handleToggleCompletion(habit.id, note)}
        onEdit={() => { setEditingHabit(habit); setShowModal(true); }}
        onArchive={() => archiveHabit(habit.id)}
        onDelete={() => handleDeleteHabit(habit.id)}
        onViewStats={() => setStatsHabit(habit)}
        weekProgress={getWeekProgress(habit.id)}
        showConfetti={animation?.type === 'milestone'}
        animatedStreak={!!animation}
        freezesRemaining={getFreezesRemainingThisWeek(habit.id)}
        isFrozenToday={isDateFrozen(habit.id, todayKey)}
        completionNote={todayCompletion?.notes}
      />
    );
  }, [getAnimation, isCompletedOnDate, isHabitUnlocked, getBlockingHabits, todayKey, handleToggleCompletion, archiveHabit, handleDeleteHabit, getWeekProgress, getFreezesRemainingThisWeek, isDateFrozen, completions]);

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 text-accent-primary mb-1">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Today</span>
          </div>
          <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {todayProgress.completed}/{todayProgress.total}
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 text-accent-orange mb-1">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-medium">Total Streak</span>
          </div>
          <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {totalStreakDays} days
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2 text-accent-yellow mb-1">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-medium">Achievements</span>
          </div>
          <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {achievements.length}
          </div>
        </div>
      </div>

      {/* Heatmap & Rewards toggles */}
      {activeHabits.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                showHeatmap
                  ? 'text-accent-primary'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Heatmap
            </button>
            <button
              onClick={() => setShowRewards(!showRewards)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                showRewards
                  ? 'text-accent-primary'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
            >
              <Star className="w-4 h-4" />
              XP & Rewards
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                showAchievements
                  ? 'text-accent-primary'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
            >
              <Award className="w-4 h-4" />
              Badges
            </button>
            <button
              onClick={() => setShowNoteSearch(!showNoteSearch)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                showNoteSearch
                  ? 'text-accent-primary'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
            >
              <Search className="w-4 h-4" />
              Notes
            </button>
          </div>
          {showHeatmap && (
            <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-4 border border-border-light dark:border-border-dark">
              <HabitHeatmap weeks={20} />
            </div>
          )}
          {showRewards && <HabitRewardsPanel />}
          {showAchievements && (
            <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-5 border border-border-light dark:border-border-dark">
              <HabitAchievementsBadges />
            </div>
          )}
          {showNoteSearch && (
            <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-4 border border-border-light dark:border-border-dark">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                <input
                  type="text"
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  placeholder="Search completion notes..."
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              {noteSearchQuery.trim() && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {noteSearchResults.length === 0 ? (
                    <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary text-center py-4">
                      No notes found
                    </p>
                  ) : (
                    noteSearchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-start gap-2 text-sm p-2 rounded-lg bg-surface-light-alt dark:bg-surface-dark"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-text-light-tertiary dark:text-text-dark-tertiary shrink-0" />
                        <div>
                          <div className="text-text-light-primary dark:text-text-dark-primary">
                            {result.notes}
                          </div>
                          <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
                            {result.habitTitle} &middot; {result.date}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add habit + view controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Your Habits ({activeHabits.length})
          </h2>
          {activeHabits.length > 0 && habitsByCategory.length > 1 && (
            <button
              onClick={() => setGroupByCategory(!groupByCategory)}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                groupByCategory
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'bg-surface-light-alt dark:bg-surface-dark text-text-light-tertiary dark:text-text-dark-tertiary'
              }`}
            >
              Categories
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-2 px-3 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors border border-border-light dark:border-border-dark"
          >
            <BookTemplate className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => {
              setEditingHabit(null);
              setSelectedTemplate(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>
        </div>
      </div>

      {/* Habit list */}
      {activeHabits.length === 0 ? (
        <div className="text-center py-12 bg-surface-light dark:bg-surface-dark-elevated rounded-xl border border-border-light dark:border-border-dark">
          <Target className="w-12 h-12 mx-auto text-text-light-tertiary dark:text-text-dark-tertiary mb-3" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
            No habits yet. Start building positive routines!
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowTemplatePicker(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary rounded-lg hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors"
            >
              <BookTemplate className="w-4 h-4" />
              Use Template
            </button>
            <button
              onClick={() => {
                setEditingHabit(null);
                setSelectedTemplate(undefined);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Custom
            </button>
          </div>
        </div>
      ) : groupByCategory && habitsByCategory.length > 1 ? (
        // Grouped by category
        habitsByCategory.map(({ category: cat, habits: catHabits }) => (
          <CategorySection
            key={cat}
            category={cat}
            habits={catHabits}
            renderHabit={renderHabitCard}
          />
        ))
      ) : (
        // Flat list
        <div className="space-y-3">
          {activeHabits.map(renderHabitCard)}
        </div>
      )}

      {/* Archived habits */}
      {archivedHabits.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary mb-4"
          >
            <Archive className="w-4 h-4" />
            Archived ({archivedHabits.length})
          </button>

          {showArchived && (
            <div className="space-y-2 opacity-60">
              {archivedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between bg-surface-light dark:bg-surface-dark-elevated rounded-lg p-3 border border-border-light dark:border-border-dark"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{habit.icon}</span>
                    <span className="text-text-light-secondary dark:text-text-dark-secondary">
                      {habit.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreHabit(habit.id)}
                      className="p-2 hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg text-text-light-tertiary dark:text-text-dark-tertiary"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-2 hover:bg-status-error/10 rounded-lg text-status-error"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <HabitModal
          habit={editingHabit ?? undefined}
          initialTemplate={selectedTemplate}
          allHabits={activeHabits}
          onClose={() => {
            setShowModal(false);
            setEditingHabit(null);
            setSelectedTemplate(undefined);
          }}
          onSave={handleSaveHabit}
        />
      )}

      {showTemplatePicker && (
        <HabitTemplatePicker
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {statsHabit && (
        <HabitStats
          habit={statsHabit}
          onClose={() => setStatsHabit(null)}
        />
      )}

      {showAnalytics && (
        <HabitAnalytics onClose={() => setShowAnalytics(false)} />
      )}

      <ConfirmDialog
        isOpen={habitToDelete !== null}
        onClose={() => setHabitToDelete(null)}
        onConfirm={confirmDeleteHabit}
        title="Delete Habit"
        message="Permanently delete this habit? This cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}

/**
 * Habits Page - Wraps HabitsContent with PageContent for standalone page usage
 * Note: This route will redirect to /tasks?tab=habits after Phase 5 restructuring
 */
export function Habits() {
  return (
    <PageContent page="habits">
      <HabitsContent />
    </PageContent>
  );
}

export default Habits;
