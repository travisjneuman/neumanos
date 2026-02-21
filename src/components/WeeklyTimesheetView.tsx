import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { formatDuration } from '../utils/timeFormatters';
import { timeTrackingDb } from '../db/timeTrackingDb';
import type { TimeEntry, TimeTrackingProject } from '../types';

interface TimesheetCell {
  projectId: string | null;
  date: string;
  totalSeconds: number;
  entries: TimeEntry[];
}

interface TimesheetRow {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  cells: Record<string, TimesheetCell>;
  totalSeconds: number;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * WeeklyTimesheetView Component
 * Grid-style timesheet showing days as columns and projects as rows.
 * Each cell shows hours worked. Click cells to add time.
 * Shows daily and project totals.
 */
export function WeeklyTimesheetView() {
  const { projects, addManualEntry, loadProjects } = useTimeTrackingStore();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ projectId: string | null; date: string } | null>(null);
  const [cellHours, setCellHours] = useState('');
  const [cellMinutes, setCellMinutes] = useState('');

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  // Load entries for the week
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadProjects();
      const weekEntries = await timeTrackingDb.getEntriesByDateRange(weekStart, weekEnd);
      setEntries(weekEntries);
      setLoading(false);
    };
    loadData();
  }, [weekStart, weekEnd, loadProjects]);

  // Build timesheet rows
  const { rows, dailyTotals, grandTotal } = useMemo(() => {
    const rowMap = new Map<string | null, TimesheetRow>();
    const dailyTotalsMap: Record<string, number> = {};
    let grandTotalSeconds = 0;

    // Initialize daily totals
    weekDays.forEach((day) => {
      dailyTotalsMap[formatDateKey(day)] = 0;
    });

    // Group entries by project and date
    entries.forEach((entry) => {
      const projectId = entry.projectId ?? null;
      const dateKey = new Date(entry.startTime).toISOString().split('T')[0];

      if (!rowMap.has(projectId)) {
        const project = projectId ? projects.find((p) => p.id === projectId) : null;
        rowMap.set(projectId, {
          projectId,
          projectName: project?.name || 'No Project',
          projectColor: project?.color || '#94A3B8',
          cells: {},
          totalSeconds: 0,
        });
      }

      const row = rowMap.get(projectId)!;
      if (!row.cells[dateKey]) {
        row.cells[dateKey] = {
          projectId,
          date: dateKey,
          totalSeconds: 0,
          entries: [],
        };
      }

      row.cells[dateKey].totalSeconds += entry.duration;
      row.cells[dateKey].entries.push(entry);
      row.totalSeconds += entry.duration;
      dailyTotalsMap[dateKey] = (dailyTotalsMap[dateKey] || 0) + entry.duration;
      grandTotalSeconds += entry.duration;
    });

    // Sort rows: projects with time first, then alphabetically
    const sortedRows = Array.from(rowMap.values()).sort((a, b) => {
      if (a.totalSeconds !== b.totalSeconds) return b.totalSeconds - a.totalSeconds;
      return a.projectName.localeCompare(b.projectName);
    });

    // Add rows for projects that have no entries this week (if there are any projects)
    const activeProjects = projects.filter((p) => p.active && !p.archived);
    activeProjects.forEach((project) => {
      if (!rowMap.has(project.id)) {
        sortedRows.push({
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          cells: {},
          totalSeconds: 0,
        });
      }
    });

    return {
      rows: sortedRows,
      dailyTotals: dailyTotalsMap,
      grandTotal: grandTotalSeconds,
    };
  }, [entries, projects, weekDays]);

  const navigateWeek = (direction: number) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getMonday(new Date()));
  };

  const handleCellClick = (projectId: string | null, dateKey: string) => {
    setEditingCell({ projectId, date: dateKey });
    setCellHours('');
    setCellMinutes('30');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const hours = parseInt(cellHours) || 0;
    const minutes = parseInt(cellMinutes) || 0;
    const totalSeconds = hours * 3600 + minutes * 60;

    if (totalSeconds <= 0) {
      setEditingCell(null);
      return;
    }

    const startDate = new Date(`${editingCell.date}T09:00:00`);
    const endDate = new Date(startDate.getTime() + totalSeconds * 1000);

    await addManualEntry({
      description: 'Timesheet entry',
      projectId: editingCell.projectId ?? undefined,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: totalSeconds,
      tags: [],
      billable: true,
      projectIds: [],
    });

    // Reload entries
    const weekEntries = await timeTrackingDb.getEntriesByDateRange(weekStart, weekEnd);
    setEntries(weekEntries);
    setEditingCell(null);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-light-secondary dark:text-text-dark-secondary">
          Loading timesheet...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary min-w-[240px] text-center">
            {formatWeekRange()}
          </h3>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={goToCurrentWeek}
          className="px-3 py-1.5 text-sm font-medium text-accent-primary bg-accent-primary/10 rounded-lg hover:bg-accent-primary/20 transition-colors"
        >
          This Week
        </button>
      </div>

      {/* Timesheet Grid */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-light-elevated dark:bg-surface-dark-elevated border-b border-border-light dark:border-border-dark">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wider w-48">
                  Project
                </th>
                {weekDays.map((day, index) => (
                  <th
                    key={formatDateKey(day)}
                    className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[90px] ${
                      isToday(day)
                        ? 'text-accent-primary bg-accent-primary/5'
                        : 'text-text-light-secondary dark:text-text-dark-secondary'
                    }`}
                  >
                    <div>{DAY_NAMES[index]}</div>
                    <div className={`text-sm font-normal ${isToday(day) ? 'text-accent-primary font-bold' : ''}`}>
                      {day.getDate()}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wider min-w-[90px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
                    No projects found. Create projects in the Projects tab to use the timesheet view.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.projectId ?? 'no-project'} className="hover:bg-surface-light-elevated/50 dark:hover:bg-surface-dark-elevated/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.projectColor }}
                        />
                        <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                          {row.projectName}
                        </span>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const dateKey = formatDateKey(day);
                      const cell = row.cells[dateKey];
                      const isEditing = editingCell?.projectId === row.projectId && editingCell?.date === dateKey;
                      const hasTime = cell && cell.totalSeconds > 0;

                      return (
                        <td
                          key={dateKey}
                          className={`px-1 py-1 text-center ${
                            isToday(day) ? 'bg-accent-primary/5' : ''
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min="0"
                                max="23"
                                value={cellHours}
                                onChange={(e) => setCellHours(e.target.value)}
                                className="w-10 px-1 py-1 text-xs text-center bg-surface-light-elevated dark:bg-surface-dark-elevated border border-accent-primary rounded focus:outline-none text-text-light-primary dark:text-text-dark-primary"
                                placeholder="h"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                              <span className="text-xs text-text-light-tertiary">:</span>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={cellMinutes}
                                onChange={(e) => setCellMinutes(e.target.value)}
                                className="w-10 px-1 py-1 text-xs text-center bg-surface-light-elevated dark:bg-surface-dark-elevated border border-accent-primary rounded focus:outline-none text-text-light-primary dark:text-text-dark-primary"
                                placeholder="m"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleCellSave();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCellClick(row.projectId, dateKey)}
                              className={`w-full px-2 py-2 rounded text-sm font-mono transition-colors ${
                                hasTime
                                  ? 'text-text-light-primary dark:text-text-dark-primary font-medium hover:bg-accent-primary/10'
                                  : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                              }`}
                              title={hasTime ? `${cell.entries.length} entries` : 'Click to add time'}
                            >
                              {hasTime ? (
                                formatDuration(cell.totalSeconds, { showSeconds: false })
                              ) : (
                                <Plus className="w-3 h-3 mx-auto opacity-30 hover:opacity-60" />
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-mono font-semibold text-accent-primary">
                        {row.totalSeconds > 0
                          ? formatDuration(row.totalSeconds, { showSeconds: false })
                          : '--:--'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Daily Totals Footer */}
            <tfoot>
              <tr className="bg-surface-light-elevated dark:bg-surface-dark-elevated border-t-2 border-border-light dark:border-border-dark">
                <td className="px-4 py-3 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Daily Total
                </td>
                {weekDays.map((day) => {
                  const dateKey = formatDateKey(day);
                  const dayTotal = dailyTotals[dateKey] || 0;
                  return (
                    <td
                      key={dateKey}
                      className={`px-3 py-3 text-center text-sm font-mono font-semibold ${
                        isToday(day)
                          ? 'text-accent-primary bg-accent-primary/5'
                          : dayTotal > 0
                          ? 'text-text-light-primary dark:text-text-dark-primary'
                          : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                      }`}
                    >
                      {dayTotal > 0 ? formatDuration(dayTotal, { showSeconds: false }) : '--:--'}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-mono font-bold text-accent-primary">
                    {grandTotal > 0
                      ? formatDuration(grandTotal, { showSeconds: false })
                      : '--:--'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Week Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-surface-light dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Total Hours</div>
          <div className="text-2xl font-mono font-bold text-accent-primary mt-1">
            {formatDuration(grandTotal, { showSeconds: false })}
          </div>
        </div>
        <div className="p-4 bg-surface-light dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Active Projects</div>
          <div className="text-2xl font-mono font-bold text-text-light-primary dark:text-text-dark-primary mt-1">
            {rows.filter((r) => r.totalSeconds > 0).length}
          </div>
        </div>
        <div className="p-4 bg-surface-light dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Daily Average</div>
          <div className="text-2xl font-mono font-bold text-text-light-primary dark:text-text-dark-primary mt-1">
            {(() => {
              const daysWithTime = Object.values(dailyTotals).filter((t) => t > 0).length;
              return daysWithTime > 0
                ? formatDuration(Math.round(grandTotal / daysWithTime), { showSeconds: false })
                : '--:--';
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
