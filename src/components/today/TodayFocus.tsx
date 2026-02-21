/**
 * TodayFocus - Daily Goals/Intentions Section
 *
 * Displays 1-3 daily goals at the top of the Today page.
 * Users can add, edit, toggle, and remove goals.
 */

import React, { useState, useCallback } from 'react';
import { Target, Plus, Check, X, Pencil } from 'lucide-react';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';

interface TodayFocusProps {
  dateKey: string;
}

export const TodayFocus: React.FC<TodayFocusProps> = ({ dateKey }) => {
  const plan = useDailyPlanningStore((s) => s.getPlan(dateKey));
  const addGoal = useDailyPlanningStore((s) => s.addGoal);
  const updateGoal = useDailyPlanningStore((s) => s.updateGoal);
  const toggleGoal = useDailyPlanningStore((s) => s.toggleGoal);
  const removeGoal = useDailyPlanningStore((s) => s.removeGoal);

  const [newGoalText, setNewGoalText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const goals = plan.goals;
  const completedCount = goals.filter((g) => g.completed).length;

  const handleAdd = useCallback(() => {
    const trimmed = newGoalText.trim();
    if (!trimmed) return;
    addGoal(dateKey, trimmed);
    setNewGoalText('');
    setIsAdding(false);
  }, [dateKey, newGoalText, addGoal]);

  const handleStartEdit = useCallback((goalId: string, text: string) => {
    setEditingId(goalId);
    setEditText(text);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (trimmed) {
      updateGoal(dateKey, editingId, trimmed);
    }
    setEditingId(null);
    setEditText('');
  }, [dateKey, editingId, editText, updateGoal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: 'add' | 'edit') => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (action === 'add') handleAdd();
        else handleSaveEdit();
      }
      if (e.key === 'Escape') {
        if (action === 'add') {
          setIsAdding(false);
          setNewGoalText('');
        } else {
          setEditingId(null);
          setEditText('');
        }
      }
    },
    [handleAdd, handleSaveEdit]
  );

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-accent-purple" />
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary text-sm">
            Today's Focus
          </h3>
          {goals.length > 0 && (
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {completedCount}/{goals.length}
            </span>
          )}
        </div>
        {goals.length < 3 && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            title="Add goal"
            aria-label="Add goal"
          >
            <Plus className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        )}
      </div>

      {goals.length === 0 && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full text-center py-3 text-sm text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-secondary dark:hover:text-text-dark-secondary transition-colors border border-dashed border-border-light dark:border-border-dark rounded-lg"
        >
          Set your intentions for today
        </button>
      )}

      <div className="space-y-2">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggleGoal(dateKey, goal.id)}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                goal.completed
                  ? 'bg-accent-green border-accent-green'
                  : 'border-border-light dark:border-border-dark hover:border-accent-green'
              }`}
              aria-label={goal.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {goal.completed && <Check className="w-3 h-3 text-white" />}
            </button>

            {editingId === goal.id ? (
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => handleKeyDown(e, 'edit')}
                className="flex-1 bg-transparent text-sm text-text-light-primary dark:text-text-dark-primary border-b border-accent-primary outline-none py-0.5"
                autoFocus
              />
            ) : (
              <span
                className={`flex-1 text-sm ${
                  goal.completed
                    ? 'line-through text-text-light-tertiary dark:text-text-dark-tertiary'
                    : 'text-text-light-primary dark:text-text-dark-primary'
                }`}
              >
                {goal.text}
              </span>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editingId !== goal.id && (
                <button
                  onClick={() => handleStartEdit(goal.id, goal.text)}
                  className="p-0.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated"
                  aria-label="Edit goal"
                >
                  <Pencil className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
                </button>
              )}
              <button
                onClick={() => removeGoal(dateKey, goal.id)}
                className="p-0.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated"
                aria-label="Remove goal"
              >
                <X className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
              </button>
            </div>
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-border-light dark:border-border-dark" />
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'add')}
              placeholder="What's your focus?"
              className="flex-1 bg-transparent text-sm text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary border-b border-border-light dark:border-border-dark focus:border-accent-primary outline-none py-0.5"
              autoFocus
            />
            <button
              onClick={() => {
                setIsAdding(false);
                setNewGoalText('');
              }}
              className="p-0.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated"
              aria-label="Cancel"
            >
              <X className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
