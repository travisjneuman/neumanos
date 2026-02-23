import { useState, useMemo } from 'react';
import { X, ChevronUp, ChevronDown, Trash2, ArrowRight } from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import { useRoutineStore, type Routine, type TimeOfDay } from '../../stores/useRoutineStore';

const ROUTINE_ICONS = ['🌅', '🌙', '💼', '🏋️', '📖', '🧘', '🎯', '⚡', '🧠', '🔥'];

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; icon: string }[] = [
  { value: 'morning', label: 'Morning', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { value: 'evening', label: 'Evening', icon: '🌙' },
  { value: 'anytime', label: 'Anytime', icon: '🕐' },
];

interface RoutineBuilderProps {
  routine?: Routine;
  onClose: () => void;
}

export function RoutineBuilder({ routine, onClose }: RoutineBuilderProps) {
  const habits = useHabitStore((s) => s.habits);
  const createRoutine = useRoutineStore((s) => s.createRoutine);
  const updateRoutine = useRoutineStore((s) => s.updateRoutine);

  const [name, setName] = useState(routine?.name ?? '');
  const [description, setDescription] = useState(routine?.description ?? '');
  const [icon, setIcon] = useState(routine?.icon ?? '🌅');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(routine?.timeOfDay ?? 'morning');
  const [estimatedMinutes, setEstimatedMinutes] = useState(routine?.estimatedMinutes ?? 15);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>(routine?.habitIds ?? []);

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt).sort((a, b) => a.order - b.order),
    [habits]
  );

  const availableHabits = useMemo(
    () => activeHabits.filter((h) => !selectedHabitIds.includes(h.id)),
    [activeHabits, selectedHabitIds]
  );

  const selectedHabits = useMemo(
    () => selectedHabitIds.map((id) => activeHabits.find((h) => h.id === id)).filter(Boolean),
    [selectedHabitIds, activeHabits]
  );

  const handleAddHabit = (habitId: string) => {
    setSelectedHabitIds((prev) => [...prev, habitId]);
  };

  const handleRemoveHabit = (habitId: string) => {
    setSelectedHabitIds((prev) => prev.filter((id) => id !== habitId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedHabitIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= selectedHabitIds.length - 1) return;
    setSelectedHabitIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim() || selectedHabitIds.length === 0) return;

    const data = {
      name: name.trim(),
      description: description.trim(),
      icon,
      habitIds: selectedHabitIds,
      timeOfDay,
      estimatedMinutes,
    };

    if (routine) {
      updateRoutine(routine.id, data);
    } else {
      createRoutine(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {routine ? 'Edit Routine' : 'Create Routine'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark"
          >
            <X className="w-5 h-5 text-text-light-tertiary dark:text-text-dark-tertiary" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Power Routine"
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this routine helps you achieve..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ROUTINE_ICONS.map((i) => (
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

          {/* Time of Day */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Time of Day
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_OF_DAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeOfDay(opt.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    timeOfDay === opt.value
                      ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                      : 'border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark'
                  }`}
                >
                  <span className="block text-lg mb-0.5">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Minutes */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={480}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          {/* Habit Chain */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Habit Chain ({selectedHabitIds.length} habits)
            </label>

            {/* Selected habits with reorder controls */}
            {selectedHabits.length > 0 && (
              <div className="space-y-1 mb-3">
                {selectedHabits.map((habit, index) => {
                  if (!habit) return null;
                  return (
                    <div key={habit.id}>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-light-alt dark:bg-surface-dark border border-border-light dark:border-border-dark">
                        <span className="text-sm font-medium text-text-light-tertiary dark:text-text-dark-tertiary w-6 text-center">
                          {index + 1}
                        </span>
                        <span className="text-lg">{habit.icon}</span>
                        <span className="flex-1 text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                          {habit.title}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-surface-light dark:hover:bg-surface-dark-elevated disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === selectedHabits.length - 1}
                            className="p-1 rounded hover:bg-surface-light dark:hover:bg-surface-dark-elevated disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                          </button>
                          <button
                            onClick={() => handleRemoveHabit(habit.id)}
                            className="p-1 rounded hover:bg-status-error/10"
                          >
                            <Trash2 className="w-4 h-4 text-status-error" />
                          </button>
                        </div>
                      </div>
                      {/* Arrow connector between habits */}
                      {index < selectedHabits.length - 1 && (
                        <div className="flex justify-center py-0.5">
                          <ArrowRight className="w-4 h-4 text-accent-primary rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add habit dropdown */}
            {availableHabits.length > 0 && (
              <div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddHabit(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-lg border border-dashed border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="" disabled>
                    + Add habit to chain...
                  </option>
                  {availableHabits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.icon} {h.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeHabits.length === 0 && (
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary text-center py-4">
                Create some habits first, then add them to a routine.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedHabitIds.length === 0}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            {routine ? 'Save Changes' : 'Create Routine'}
          </button>
        </div>
      </div>
    </div>
  );
}
