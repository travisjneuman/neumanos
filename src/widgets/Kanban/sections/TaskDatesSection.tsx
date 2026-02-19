/**
 * TaskDatesSection
 *
 * Extracted section component for Start Date and Due Date editing.
 * Features:
 * - Inline natural language date input
 * - Overdue warning display
 * - Clear date buttons
 * - Milestone support (hides start date, changes label)
 */

import React from 'react';
import { NaturalLanguageDateInput } from '../../../components/NaturalLanguageDateInput';
import { formatDateForDisplay } from '../../../utils/naturalLanguageDates';
import { differenceInDays } from 'date-fns';
import type { Task } from '../../../types';

interface TaskDatesSectionProps {
  task: Task;
  startDate: string | null;
  setStartDate: (date: string | null) => void;
  dueDate: string | null;
  setDueDate: (date: string | null) => void;
  isEditingStartDate: boolean;
  setIsEditingStartDate: (editing: boolean) => void;
  isEditingDueDate: boolean;
  setIsEditingDueDate: (editing: boolean) => void;
  onFieldBlur: (field: keyof Task, value: unknown) => void;
}

export const TaskDatesSection: React.FC<TaskDatesSectionProps> = ({
  task,
  startDate,
  setStartDate,
  dueDate,
  setDueDate,
  isEditingStartDate,
  setIsEditingStartDate,
  isEditingDueDate,
  setIsEditingDueDate,
  onFieldBlur,
}) => {
  const isMilestone = task?.isMilestone;

  return (
    <div className={`grid ${isMilestone ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
      {/* Start Date - Hidden for milestones (single-point events) */}
      {!isMilestone && (
        <div>
          <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Start Date
          </label>
          {isEditingStartDate ? (
            <NaturalLanguageDateInput
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                onFieldBlur('startDate', date);
                setIsEditingStartDate(false);
              }}
              label=""
              autoFocus
              placeholder="Type 'tomorrow', 'next Monday'..."
            />
          ) : (
            <button
              onClick={() => setIsEditingStartDate(true)}
              className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-left hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors group flex items-center justify-between"
            >
              {startDate ? (
                <>
                  <span className="text-text-light-primary dark:text-text-dark-primary">
                    {formatDateForDisplay(new Date(startDate))}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartDate(null);
                      onFieldBlur('startDate', null);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-red transition-opacity"
                    aria-label="Clear start date"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="text-text-light-secondary dark:text-text-dark-secondary">+ Add start date</span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Due Date / Milestone Date */}
      <div>
        <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
          {isMilestone ? 'Milestone Date' : 'Due Date'}
        </label>
        {isEditingDueDate ? (
          <NaturalLanguageDateInput
            value={dueDate}
            onChange={(date) => {
              setDueDate(date);
              onFieldBlur('dueDate', date);
              setIsEditingDueDate(false);
            }}
            label=""
            autoFocus
            placeholder="Type 'tomorrow', 'next Friday'..."
          />
        ) : (
          <button
            onClick={() => setIsEditingDueDate(true)}
            className={`w-full p-2 bg-surface-light dark:bg-surface-dark border rounded-lg text-sm text-left hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors group flex items-center justify-between ${
              dueDate && new Date(dueDate) < new Date() && task?.status !== 'done'
                ? 'border-accent-red bg-accent-red/10 dark:bg-accent-red/20'
                : 'border-border-light dark:border-border-dark'
            }`}
          >
            {dueDate ? (
              <>
                <div className="flex-1">
                  <span className={`${
                    dueDate && new Date(dueDate) < new Date() && task?.status !== 'done'
                      ? 'text-accent-red font-medium'
                      : 'text-text-light-primary dark:text-text-dark-primary'
                  }`}>
                    {formatDateForDisplay(new Date(dueDate))}
                  </span>
                  {dueDate && (() => {
                    const days = differenceInDays(new Date(dueDate), new Date());
                    const isOverdue = days < 0 && task?.status !== 'done';
                    const isDueToday = days === 0;

                    if (isOverdue) {
                      return (
                        <span className="ml-2 text-xs text-accent-red">
                          overdue by {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''}
                        </span>
                      );
                    }
                    if (isDueToday) {
                      return <span className="ml-2 text-xs text-accent-orange">due today</span>;
                    }
                    if (days > 0 && days <= 7) {
                      return <span className="ml-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">{days} day{days !== 1 ? 's' : ''} from now</span>;
                    }
                    return null;
                  })()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDueDate(null);
                    onFieldBlur('dueDate', null);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-red transition-opacity"
                  aria-label="Clear due date"
                >
                  ✕
                </button>
              </>
            ) : (
              <span className="text-text-light-secondary dark:text-text-dark-secondary">+ Add due date</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskDatesSection;
