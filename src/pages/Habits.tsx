import { useState, useMemo, useCallback } from 'react';
import { Plus, Target, Flame, Trophy, Archive, RotateCcw, Trash2, Edit2, Check, MoreVertical } from 'lucide-react';
import { useHabitStore } from '../stores/useHabitStore';
import { PageContent } from '../components/PageContent';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Habit, HabitFrequency } from '../types';

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
    case 'specific-days':
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return habit.targetDays?.map((d) => days[d]).join(', ') ?? '';
    case 'times-per-week':
      return `${habit.timesPerWeek}x per week`;
    default:
      return '';
  }
}

// Default colors for habits
const HABIT_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#22c55e', // green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#ef4444', // red
];

// Default icons for habits
const HABIT_ICONS = ['🎯', '💪', '📚', '🧘', '🏃', '💧', '🍎', '😴', '✍️', '🎨'];

interface HabitModalProps {
  habit?: Habit;
  onClose: () => void;
  onSave: (data: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'totalCompletions' | 'order'>) => void;
}

function HabitModal({ habit, onClose, onSave }: HabitModalProps) {
  const [title, setTitle] = useState(habit?.title ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? '🎯');
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? 'daily');
  const [targetDays, setTargetDays] = useState<number[]>(habit?.targetDays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.timesPerWeek ?? 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      frequency,
      targetDays: frequency === 'specific-days' ? targetDays : undefined,
      timesPerWeek: frequency === 'times-per-week' ? timesPerWeek : undefined,
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

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  weekProgress: boolean[];
}

function HabitCard({
  habit,
  isCompletedToday,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
  weekProgress,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const trackToday = shouldTrackToday(habit);

  return (
    <div
      className="group bg-surface-light dark:bg-surface-dark-elevated rounded-xl p-4 border border-border-light dark:border-border-dark hover:border-accent-primary/30 transition-all"
      style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-4">
        {/* Check button */}
        <button
          onClick={onToggle}
          disabled={!trackToday}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all shrink-0 ${
            isCompletedToday
              ? 'bg-status-success text-white'
              : trackToday
              ? 'bg-surface-light-alt dark:bg-surface-dark hover:bg-accent-primary/20 border-2 border-border-light dark:border-border-dark'
              : 'bg-surface-light-alt dark:bg-surface-dark opacity-50 cursor-not-allowed'
          }`}
          title={
            trackToday
              ? isCompletedToday
                ? 'Mark incomplete'
                : 'Mark complete'
              : 'Not scheduled for today'
          }
        >
          {isCompletedToday ? (
            <Check className="w-5 h-5" />
          ) : (
            <span>{habit.icon}</span>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {habit.title}
              </h3>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                {getFrequencyLabel(habit)}
              </p>
            </div>

            {/* Stats + Menu */}
            <div className="flex items-center gap-3">
              {/* Streak */}
              {habit.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-accent-orange">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{habit.currentStreak}</span>
                </div>
              )}

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-lg border border-border-light dark:border-border-dark py-1 min-w-[120px]">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit();
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light-alt dark:hover:bg-surface-dark flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onArchive();
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light-alt dark:hover:bg-surface-dark flex items-center gap-2"
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete();
                        }}
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

          {/* Week progress */}
          <div className="flex gap-1 mt-3">
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
        </div>
      </div>
    </div>
  );
}

/**
 * HabitsContent - Core habits UI that can be embedded in Tasks page as a tab
 * Exported separately to allow use without PageContent wrapper
 */
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

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  const todayKey = getDateKey(new Date());
  const todayProgress = getTodayProgress();

  const activeHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.archivedAt)
        .sort((a, b) => a.order - b.order),
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

  const handleSaveHabit = (
    data: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'totalCompletions' | 'order'>
  ) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
    setShowModal(false);
    setEditingHabit(null);
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

      {/* Add habit button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          Your Habits ({activeHabits.length})
        </h2>
        <button
          onClick={() => {
            setEditingHabit(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Habit
        </button>
      </div>

      {/* Habit list */}
      {activeHabits.length === 0 ? (
        <div className="text-center py-12 bg-surface-light dark:bg-surface-dark-elevated rounded-xl border border-border-light dark:border-border-dark">
          <Target className="w-12 h-12 mx-auto text-text-light-tertiary dark:text-text-dark-tertiary mb-3" />
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
            No habits yet. Start building positive routines!
          </p>
          <button
            onClick={() => {
              setEditingHabit(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompletedToday={isCompletedOnDate(habit.id, todayKey)}
              onToggle={() => toggleCompletion(habit.id, todayKey)}
              onEdit={() => {
                setEditingHabit(habit);
                setShowModal(true);
              }}
              onArchive={() => archiveHabit(habit.id)}
              onDelete={() => handleDeleteHabit(habit.id)}
              weekProgress={getWeekProgress(habit.id)}
            />
          ))}
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

      {/* Modal */}
      {showModal && (
        <HabitModal
          habit={editingHabit ?? undefined}
          onClose={() => {
            setShowModal(false);
            setEditingHabit(null);
          }}
          onSave={handleSaveHabit}
        />
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
