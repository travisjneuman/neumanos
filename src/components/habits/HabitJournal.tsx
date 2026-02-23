import { useMemo, useState } from 'react';
import { MessageSquare, Calendar, Edit2, Check, X } from 'lucide-react';
import { useHabitStore } from '../../stores/useHabitStore';
import type { Habit } from '../../types';

interface HabitJournalProps {
  habit: Habit;
  onClose: () => void;
}

export function HabitJournal({ habit, onClose }: HabitJournalProps) {
  const completions = useHabitStore((s) => s.completions);
  const updateCompletionNote = useHabitStore((s) => s.updateCompletionNote);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const habitCompletions = useMemo(
    () =>
      completions
        .filter((c) => c.habitId === habit.id)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [completions, habit.id]
  );

  const handleStartEdit = (id: string, currentNote: string) => {
    setEditingId(id);
    setEditText(currentNote);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateCompletionNote(editingId, editText);
      setEditingId(null);
      setEditText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{habit.icon}</span>
            <div>
              <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                {habit.title}
              </h2>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                Completion Journal
              </p>
            </div>
          </div>

          {habitCompletions.length === 0 ? (
            <p className="text-center py-8 text-text-light-tertiary dark:text-text-dark-tertiary">
              No completions yet. Start building your streak!
            </p>
          ) : (
            <div className="space-y-3">
              {habitCompletions.map((completion) => {
                const date = new Date(completion.completedAt);
                const dateStr = date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                const timeStr = date.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isEditing = editingId === completion.id;

                return (
                  <div
                    key={completion.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface-light-alt dark:bg-surface-dark border border-border-light dark:border-border-dark"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <Check className="w-4 h-4" style={{ color: habit.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                        <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                          {timeStr}
                        </span>
                      </div>
                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-status-success hover:bg-status-success/10 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-text-light-tertiary hover:bg-surface-light-alt rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : completion.notes ? (
                        <div className="mt-1 flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-text-light-tertiary dark:text-text-dark-tertiary shrink-0" />
                          <p className="text-sm text-text-light-primary dark:text-text-dark-primary italic">
                            {completion.notes}
                          </p>
                          <button
                            onClick={() => handleStartEdit(completion.id, completion.notes ?? '')}
                            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded shrink-0"
                          >
                            <Edit2 className="w-3 h-3 text-text-light-tertiary" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(completion.id, '')}
                          className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-primary transition-colors"
                        >
                          + Add note
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
