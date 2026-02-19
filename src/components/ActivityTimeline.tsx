import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import type { TimeEntry } from '../types';

/**
 * Activity Timeline Component
 *
 * Visual timeline showing all time entries for a selected day.
 * Displays as horizontal blocks across 24 hours with color coding.
 */

export function ActivityTimeline() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const projects = useTimeTrackingStore((s) => s.projects);

  useEffect(() => {
    // Load entries for selected date
    const loadEntries = async () => {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { timeTrackingDb } = await import('../db/timeTrackingDb');
      const entries = await timeTrackingDb.getEntriesByDateRange(startOfDay, endOfDay);
      setTodayEntries(entries);
    };

    loadEntries();
  }, [selectedDate]);

  // Calculate position and width for each entry on 24-hour timeline
  const getEntryPosition = (entry: TimeEntry) => {
    const startTime = new Date(entry.startTime);
    const endTime = entry.endTime ? new Date(entry.endTime) : new Date();

    // Get hours as decimals (0-24)
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;

    const left = (startHour / 24) * 100; // Percentage
    const width = ((endHour - startHour) / 24) * 100; // Percentage

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  // Get project color for entry
  const getEntryColor = (entry: TimeEntry) => {
    if (entry.projectId) {
      const project = projects.find((p) => p.id === entry.projectId);
      return project?.color || '#94A3B8';
    }
    return '#94A3B8'; // Default gray
  };

  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Calculate total time for day
  const totalTime = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalHours = Math.floor(totalTime / 3600);
  const totalMinutes = Math.floor((totalTime % 3600) / 60);

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-accent-primary" />
          <div>
            <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Activity Timeline
            </h2>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Visual timeline of your day ({totalHours}h {totalMinutes}m tracked)
            </p>
          </div>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {/* Hour Labels */}
        <div className="relative h-6 bg-surface-light-secondary/30 dark:bg-surface-dark-secondary/30 rounded-lg">
          {Array.from({ length: 25 }, (_, i) => i).map((hour) => (
            <div
              key={hour}
              className="absolute top-0 bottom-0 flex items-center justify-center"
              style={{ left: `${(hour / 24) * 100}%` }}
            >
              <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {hour.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline Track */}
        <div className="relative h-20 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
          {/* Hour Grid Lines */}
          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
            <div
              key={hour}
              className="absolute top-0 bottom-0 w-px bg-border-light dark:bg-border-dark opacity-50"
              style={{ left: `${(hour / 24) * 100}%` }}
            />
          ))}

          {/* Entry Blocks */}
          {todayEntries.map((entry) => {
            const position = getEntryPosition(entry);
            const color = getEntryColor(entry);

            return (
              <div
                key={entry.id}
                className="absolute top-2 bottom-2 rounded cursor-pointer hover:opacity-80 transition-opacity group"
                style={{
                  left: position.left,
                  width: position.width,
                  backgroundColor: color,
                }}
                title={`${entry.description}\n${formatTime(new Date(entry.startTime))} - ${
                  entry.endTime ? formatTime(new Date(entry.endTime)) : 'Now'
                }`}
              >
                {/* Entry Label (show if wide enough) */}
                <div className="absolute inset-0 flex items-center justify-center px-2">
                  <span className="text-xs text-white font-medium truncate group-hover:scale-110 transition-transform">
                    {entry.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Entry List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
            Entries ({todayEntries.length})
          </h3>
          {todayEntries.length === 0 ? (
            <div className="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
              <p>No time tracked on this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayEntries.map((entry) => {
                const startTime = new Date(entry.startTime);
                const endTime = entry.endTime ? new Date(entry.endTime) : null;
                const hours = Math.floor(entry.duration / 3600);
                const minutes = Math.floor((entry.duration % 3600) / 60);
                const project = entry.projectId
                  ? projects.find((p) => p.id === entry.projectId)
                  : null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-3 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary transition-colors cursor-pointer"
                  >
                    {/* Color Indicator */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getEntryColor(entry) }}
                    />

                    {/* Time Range */}
                    <div className="flex-shrink-0 text-sm font-mono text-text-light-secondary dark:text-text-dark-secondary">
                      {formatTime(startTime)} - {endTime ? formatTime(endTime) : 'Now'}
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                        {entry.description}
                      </p>
                      {project && (
                        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                          {project.name}
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="flex-shrink-0 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {hours}h {minutes.toString().padStart(2, '0')}m
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
