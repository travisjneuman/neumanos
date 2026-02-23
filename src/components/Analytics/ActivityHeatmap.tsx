/**
 * Activity Heatmap
 *
 * GitHub-style contribution heatmap showing daily activity counts.
 * Uses CSS grid with color intensity based on event count.
 */

import React, { useState, useMemo } from 'react';
import { useActivityStore } from '../../stores/useActivityStore';

interface ActivityHeatmapProps {
  days?: 30 | 90 | 365;
}

const INTENSITY_CLASSES = [
  'bg-surface-light-elevated dark:bg-surface-dark-elevated', // 0
  'bg-green-900/40', // low
  'bg-green-700/60', // medium-low
  'bg-green-500/70', // medium
  'bg-green-400/80', // medium-high
  'bg-green-300',    // high
];

function getIntensityClass(count: number, max: number): string {
  if (count === 0) return INTENSITY_CLASSES[0];
  if (max === 0) return INTENSITY_CLASSES[0];
  const ratio = count / max;
  if (ratio <= 0.2) return INTENSITY_CLASSES[1];
  if (ratio <= 0.4) return INTENSITY_CLASSES[2];
  if (ratio <= 0.6) return INTENSITY_CLASSES[3];
  if (ratio <= 0.8) return INTENSITY_CLASSES[4];
  return INTENSITY_CLASSES[5];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ days: initialDays }) => {
  const [days, setDays] = useState<30 | 90 | 365>(initialDays || 90);
  const getDailyActivityCounts = useActivityStore((s) => s.getDailyActivityCounts);
  const events = useActivityStore((s) => s.events);

  const { cells, maxCount, totalEvents } = useMemo(() => {
    const counts = getDailyActivityCounts(days);
    const entries = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(...Object.values(counts), 1);
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    return { cells: entries, maxCount: max, totalEvents: total };
  }, [days, getDailyActivityCounts, events]);

  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Calculate number of weeks for grid columns
  const weeks = Math.ceil(days / 7);

  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark p-5 bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
            Activity Heatmap
          </h3>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            {totalEvents} event{totalEvents !== 1 ? 's' : ''} in the last {days} days
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-0.5">
          {([30, 90, 365] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                days === d
                  ? 'bg-accent-primary text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
            >
              {d === 30 ? '30d' : d === 90 ? '90d' : '1y'}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto relative">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${weeks}, 1fr)`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column',
          }}
        >
          {cells.map(([date, count]) => (
            <div
              key={date}
              className={`w-3 h-3 rounded-sm ${getIntensityClass(count, maxCount)} cursor-pointer transition-all hover:ring-1 hover:ring-white/30`}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredCell({ date, count, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setHoveredCell(null)}
            />
          ))}
        </div>

        {/* Tooltip */}
        {hoveredCell && (
          <div
            className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-surface-dark-elevated text-text-dark-primary text-xs shadow-lg pointer-events-none"
            style={{
              left: hoveredCell.x,
              top: hoveredCell.y - 36,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="font-medium">{hoveredCell.count} event{hoveredCell.count !== 1 ? 's' : ''}</span>
            <span className="text-text-dark-secondary ml-1.5">
              {new Date(hoveredCell.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary mr-1">Less</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary ml-1">More</span>
      </div>
    </div>
  );
};
