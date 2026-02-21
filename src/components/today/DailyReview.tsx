/**
 * DailyReview - End-of-Day Review Section
 *
 * Shows task completion metrics, goal status, time tracked,
 * and a text area for reflection notes. Stores review per-date.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
} from 'lucide-react';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';
import type { DailyReview as DailyReviewType } from '../../stores/useDailyPlanningStore';

interface DailyReviewProps {
  dateKey: string;
  tasksCompleted: number;
  tasksDue: number;
  hoursTracked: number;
}

const MOOD_OPTIONS: Array<{ value: DailyReviewType['mood']; icon: React.ReactNode; label: string }> = [
  { value: 'great', icon: <ThumbsUp className="w-4 h-4" />, label: 'Great' },
  { value: 'good', icon: <Smile className="w-4 h-4" />, label: 'Good' },
  { value: 'okay', icon: <Meh className="w-4 h-4" />, label: 'Okay' },
  { value: 'rough', icon: <Frown className="w-4 h-4" />, label: 'Rough' },
];

export const DailyReview: React.FC<DailyReviewProps> = ({
  dateKey,
  tasksCompleted,
  tasksDue,
  hoursTracked,
}) => {
  const plan = useDailyPlanningStore((s) => s.getPlan(dateKey));
  const existingReview = useDailyPlanningStore((s) => s.getReview(dateKey));
  const saveReview = useDailyPlanningStore((s) => s.saveReview);

  const [isExpanded, setIsExpanded] = useState(!!existingReview);
  const [notes, setNotes] = useState(existingReview?.reflectionNotes || '');
  const [mood, setMood] = useState<DailyReviewType['mood']>(existingReview?.mood);

  const goalsCompleted = useMemo(
    () => plan.goals.filter((g) => g.completed).length,
    [plan.goals]
  );

  const handleSave = useCallback(() => {
    const review: DailyReviewType = {
      reflectionNotes: notes.trim(),
      mood,
      completedAt: new Date().toISOString(),
      tasksCompleted,
      tasksDue,
      hoursTracked,
      goalsCompleted,
      goalsDue: plan.goals.length,
    };
    saveReview(dateKey, review);
  }, [dateKey, notes, mood, tasksCompleted, tasksDue, hoursTracked, goalsCompleted, plan.goals.length, saveReview]);

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent-yellow" />
          <span className="font-semibold text-text-light-primary dark:text-text-dark-primary text-sm">
            Daily Review
          </span>
          {existingReview && (
            <span className="text-xs text-accent-green">Saved</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Metrics snapshot */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-accent-green" />
              <span className="text-text-light-secondary dark:text-text-dark-secondary">
                {tasksCompleted}/{tasksDue} tasks
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-accent-primary" />
              <span className="text-text-light-secondary dark:text-text-dark-secondary">
                {hoursTracked.toFixed(1)}h tracked
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-accent-purple" />
              <span className="text-text-light-secondary dark:text-text-dark-secondary">
                {goalsCompleted}/{plan.goals.length} goals
              </span>
            </div>
          </div>

          {/* Mood selector */}
          <div>
            <label className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 block">
              How was your day?
            </label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    mood === option.value
                      ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/30'
                      : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border border-transparent hover:border-border-light dark:hover:border-border-dark'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reflection notes */}
          <div>
            <label className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 block">
              Reflections
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well? What could be better? Key learnings..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary outline-none focus:border-accent-primary resize-none"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full py-2 rounded-lg text-sm font-medium bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors"
          >
            {existingReview ? 'Update Review' : 'Save Review'}
          </button>
        </div>
      )}
    </div>
  );
};
