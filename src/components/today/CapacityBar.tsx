/**
 * CapacityBar - Visual capacity indicator for the Today page
 *
 * Shows total available hours, planned hours, and completed hours
 * with color-coded status (green/yellow/red).
 */

import React, { useMemo } from 'react';
import { Battery, BatteryCharging, BatteryWarning } from 'lucide-react';
import { useDailyPlanningStore } from '../../stores/useDailyPlanningStore';

interface CapacityBarProps {
  dateKey: string;
  hoursTracked: number;
}

export const CapacityBar: React.FC<CapacityBarProps> = ({ dateKey, hoursTracked }) => {
  const plan = useDailyPlanningStore((s) => s.getPlan(dateKey));
  const totalPlannedMinutes = useDailyPlanningStore((s) => s.getTotalPlannedMinutes(dateKey));

  const { availableHours, plannedHours, completedHours, status, plannedPercent, completedPercent } = useMemo(() => {
    const available = plan.availableHours;
    const planned = totalPlannedMinutes / 60;
    const completed = hoursTracked;
    const ratio = available > 0 ? planned / available : 0;

    let barStatus: 'green' | 'yellow' | 'red';
    if (ratio <= 0.75) barStatus = 'green';
    else if (ratio <= 1.0) barStatus = 'yellow';
    else barStatus = 'red';

    return {
      availableHours: available,
      plannedHours: planned,
      completedHours: completed,
      status: barStatus,
      plannedPercent: available > 0 ? Math.min(100, (planned / available) * 100) : 0,
      completedPercent: available > 0 ? Math.min(100, (completed / available) * 100) : 0,
    };
  }, [plan.availableHours, totalPlannedMinutes, hoursTracked]);

  const statusColors = {
    green: 'bg-accent-green',
    yellow: 'bg-accent-yellow',
    red: 'bg-accent-red',
  };

  const statusTextColors = {
    green: 'text-accent-green',
    yellow: 'text-accent-yellow',
    red: 'text-accent-red',
  };

  const StatusIcon = status === 'red' ? BatteryWarning : status === 'yellow' ? BatteryCharging : Battery;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusTextColors[status]}`} />
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary text-sm">
            Capacity
          </h3>
        </div>
        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {availableHours}h available
        </span>
      </div>

      {/* Stacked progress bar */}
      <div className="h-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full overflow-hidden relative">
        {/* Planned (background layer) */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${statusColors[status]} opacity-30 transition-all duration-500`}
          style={{ width: `${plannedPercent}%` }}
        />
        {/* Completed (foreground layer) */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${statusColors[status]} transition-all duration-500`}
          style={{ width: `${completedPercent}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-sm ${statusColors[status]}`} />
          <span>{completedHours.toFixed(1)}h done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-sm ${statusColors[status]} opacity-30`} />
          <span>{plannedHours.toFixed(1)}h planned</span>
        </div>
        {status === 'red' && (
          <span className="text-accent-red font-medium">
            Over by {(plannedHours - availableHours).toFixed(1)}h
          </span>
        )}
      </div>
    </div>
  );
};
