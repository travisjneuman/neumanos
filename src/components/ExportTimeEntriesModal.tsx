import { useState } from 'react';
import { X, Download, Calendar, FolderOpen, Filter } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import {
  exportTimeEntriesToCSV,
  downloadCSV,
  type ExportOptions,
} from '../services/csvTimeEntryExport';

interface ExportTimeEntriesModalProps {
  onClose: () => void;
}

type DatePreset = 'today' | 'this-week' | 'this-month' | 'last-month' | 'all' | 'custom';

/**
 * Get date range for a preset
 */
function getPresetDateRange(preset: DatePreset): { start?: Date; end?: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'this-week': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: monday, end: sunday };
    }
    case 'this-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: firstDay, end: lastDay };
    }
    case 'last-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: firstDay, end: lastDay };
    }
    case 'all':
    default:
      return { start: undefined, end: undefined };
  }
}

/**
 * ExportTimeEntriesModal Component
 *
 * Modal for configuring and executing time entry CSV exports.
 * Part of Plan 07-03: Billable Time Tracking
 */
export function ExportTimeEntriesModal({ onClose }: ExportTimeEntriesModalProps) {
  const entries = useTimeTrackingStore((s) => s.entries);
  const projects = useTimeTrackingStore((s) => s.projects);
  const defaultHourlyRate = useTimeTrackingStore((s) => s.defaultHourlyRate);

  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [includeNonBillable, setIncludeNonBillable] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeProjects = projects.filter((p) => p.active && !p.archived);

  const handleExport = () => {
    setError(null);

    // Build date range
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (datePreset === 'custom') {
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) endDate = new Date(customEndDate);
    } else {
      const range = getPresetDateRange(datePreset);
      startDate = range.start;
      endDate = range.end;
    }

    // Build options
    const options: ExportOptions = {
      startDate,
      endDate,
      projectIds: selectedProjectId !== 'all' ? [selectedProjectId] : undefined,
      includeNonBillable,
      includeSummary,
      defaultHourlyRate,
    };

    // Execute export
    const result = exportTimeEntriesToCSV(entries, projects, options);

    if (!result.success) {
      setError(result.error || 'Export failed');
      return;
    }

    // Download the file
    downloadCSV(result.data!, result.filename || 'time-entries.csv');
    onClose();
  };

  // Calculate preview counts
  const getPreviewCounts = () => {
    let filtered = [...entries];

    // Apply date filter
    if (datePreset !== 'all') {
      const range =
        datePreset === 'custom'
          ? {
              start: customStartDate ? new Date(customStartDate) : undefined,
              end: customEndDate ? new Date(customEndDate) : undefined,
            }
          : getPresetDateRange(datePreset);

      if (range.start) {
        filtered = filtered.filter((e) => new Date(e.startTime) >= range.start!);
      }
      if (range.end) {
        const endOfDay = new Date(range.end);
        endOfDay.setHours(23, 59, 59, 999);
        filtered = filtered.filter((e) => new Date(e.startTime) <= endOfDay);
      }
    }

    // Apply project filter
    if (selectedProjectId !== 'all') {
      filtered = filtered.filter((e) => e.projectId === selectedProjectId);
    }

    // Apply billable filter
    if (!includeNonBillable) {
      filtered = filtered.filter((e) => e.billable);
    }

    const billableCount = filtered.filter((e) => e.billable).length;
    const nonBillableCount = filtered.filter((e) => !e.billable).length;

    return { total: filtered.length, billable: billableCount, nonBillable: nonBillableCount };
  };

  const counts = getPreviewCounts();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Export Time Entries
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Date Range */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                Date Range
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['today', 'this-week', 'this-month', 'last-month', 'all', 'custom'] as const).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      datePreset === preset
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                    }`}
                  >
                    {preset === 'today' && 'Today'}
                    {preset === 'this-week' && 'This Week'}
                    {preset === 'this-month' && 'This Month'}
                    {preset === 'last-month' && 'Last Month'}
                    {preset === 'all' && 'All Time'}
                    {preset === 'custom' && 'Custom'}
                  </button>
                )
              )}
            </div>

            {/* Custom date inputs */}
            {datePreset === 'custom' && (
              <div className="flex gap-3 mt-3">
                <div className="flex-1">
                  <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full p-2 text-sm bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full p-2 text-sm bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Project Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                Project
              </label>
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 text-sm bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary"
            >
              <option value="all">All Projects</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                Options
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNonBillable}
                  onChange={(e) => setIncludeNonBillable(e.target.checked)}
                  className="w-4 h-4 rounded border-border-light dark:border-border-dark accent-accent-primary"
                />
                <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  Include non-billable entries
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="w-4 h-4 rounded border-border-light dark:border-border-dark accent-accent-primary"
                />
                <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  Include summary totals at bottom
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 rounded-lg">
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Export Preview
            </p>
            <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
              <span className="font-medium">{counts.total}</span> entries
              {counts.total > 0 && (
                <>
                  {' '}
                  ({counts.billable} billable
                  {includeNonBillable && `, ${counts.nonBillable} non-billable`})
                </>
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
              <p className="text-sm text-status-error">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={counts.total === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
