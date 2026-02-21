/**
 * TimeboxSummary - Planned time vs available time display
 *
 * Shows in the metrics bar: total planned minutes against available hours.
 */

import React from 'react';
import { Timer } from 'lucide-react';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';

interface TimeboxSummaryProps {
  dateKey: string;
}

/** Format minutes to readable string */
const formatMinutes = (mins: number): string => {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const TimeboxSummary: React.FC<TimeboxSummaryProps> = ({ dateKey }) => {
  const plan = useDailyPlanningStore((s) => s.getPlan(dateKey));
  const totalPlanned = useDailyPlanningStore((s) => s.getTotalPlannedMinutes(dateKey));

  const availableMinutes = plan.availableHours * 60;
  const usagePercent = availableMinutes > 0 ? Math.min(100, (totalPlanned / availableMinutes) * 100) : 0;
  const isOverbooked = totalPlanned > availableMinutes;

  if (totalPlanned === 0) return null;

  return (
    <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-3 border border-border-light dark:border-border-dark">
      <div className="flex items-center gap-2 text-accent-secondary mb-1">
        <Timer className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Planned</span>
      </div>
      <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
        {formatMinutes(totalPlanned)}
        <span className={`text-sm font-normal ml-1 ${
          isOverbooked
            ? 'text-accent-red'
            : 'text-text-light-secondary dark:text-text-dark-secondary'
        }`}>
          / {plan.availableHours}h
        </span>
      </div>
      {/* Usage bar */}
      <div className="mt-1.5 h-1 bg-surface-light dark:bg-surface-dark rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOverbooked ? 'bg-accent-red' : 'bg-accent-secondary'
          }`}
          style={{ width: `${Math.min(100, usagePercent)}%` }}
        />
      </div>
    </div>
  );
};
