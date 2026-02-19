/**
 * CSV Import/Export Service for Time Entries
 * Provides functionality to export time entries to CSV and import from CSV files.
 *
 * Enhanced for Plan 07-03: Billable Time Tracking
 * - Added export options (date range, project filter, billable-only)
 * - Added summary row with totals
 * - Improved file naming
 */

import type { TimeEntry, TimeTrackingProject } from '../types';

export interface ExportOptions {
  /** Filter by date range (start date) */
  startDate?: Date;
  /** Filter by date range (end date) */
  endDate?: Date;
  /** Filter by specific project IDs (empty = all projects) */
  projectIds?: string[];
  /** Only include billable entries */
  billableOnly?: boolean;
  /** Include non-billable entries */
  includeNonBillable?: boolean;
  /** Include summary row at bottom */
  includeSummary?: boolean;
  /** Default hourly rate for entries without rate */
  defaultHourlyRate?: number;
  /** Currency code for formatting */
  currency?: string;
}

interface ExportResult {
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}

interface ImportResult {
  success: boolean;
  entries?: Omit<TimeEntry, 'id'>[];
  error?: string;
  skipped?: number;
}

/**
 * Export time entries to CSV format with options
 */
export function exportTimeEntriesToCSV(
  entries: TimeEntry[],
  projects: TimeTrackingProject[],
  options?: ExportOptions
): ExportResult {
  try {
    // Apply filters if options provided
    let filteredEntries = [...entries];

    if (options?.startDate) {
      filteredEntries = filteredEntries.filter(
        (e) => new Date(e.startTime) >= options.startDate!
      );
    }
    if (options?.endDate) {
      const endOfDay = new Date(options.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filteredEntries = filteredEntries.filter(
        (e) => new Date(e.startTime) <= endOfDay
      );
    }
    if (options?.projectIds && options.projectIds.length > 0) {
      filteredEntries = filteredEntries.filter(
        (e) => e.projectId && options.projectIds!.includes(e.projectId)
      );
    }
    if (options?.billableOnly) {
      filteredEntries = filteredEntries.filter((e) => e.billable);
    }
    if (options?.includeNonBillable === false) {
      filteredEntries = filteredEntries.filter((e) => e.billable);
    }

    if (filteredEntries.length === 0) {
      return { success: false, error: 'No entries to export' };
    }

    // Create project lookup maps
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const projectRateMap = new Map(projects.map((p) => [p.id, p.hourlyRate]));
    const defaultRate = options?.defaultHourlyRate ?? 0;

    // CSV Headers
    const headers = [
      'Date',
      'Start Time',
      'End Time',
      'Duration (minutes)',
      'Description',
      'Project',
      'Tags',
      'Notes',
      'Is Billable',
      'Hourly Rate',
      'Billable Amount',
    ];

    // Track totals for summary row
    let totalBillableMinutes = 0;
    let totalNonBillableMinutes = 0;
    let totalBillableAmount = 0;

    // Format entries as CSV rows
    const rows = filteredEntries.map((entry) => {
      const startDate = new Date(entry.startTime);
      const endDate = entry.endTime ? new Date(entry.endTime) : null;

      // Calculate effective rate and billable amount
      const hours = entry.duration / 3600;
      const rate =
        entry.hourlyRate ??
        projectRateMap.get(entry.projectId || '') ??
        defaultRate;
      const billableAmount =
        entry.billable && rate > 0 ? hours * rate : 0;

      // Accumulate totals
      if (entry.billable) {
        totalBillableMinutes += Math.round(entry.duration / 60);
        totalBillableAmount += billableAmount;
      } else {
        totalNonBillableMinutes += Math.round(entry.duration / 60);
      }

      return [
        startDate.toISOString().split('T')[0], // Date (YYYY-MM-DD)
        startDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }), // Start Time (HH:MM)
        endDate
          ? endDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : '', // End Time
        Math.round(entry.duration / 60).toString(), // Duration in minutes
        escapeCSV(entry.description || ''),
        escapeCSV(projectMap.get(entry.projectId || '') || 'No Project'),
        escapeCSV((entry.tags || []).join(', ')),
        escapeCSV(entry.notes || ''),
        entry.billable ? 'Yes' : 'No', // Is Billable
        rate > 0 ? rate.toFixed(2) : '', // Hourly Rate
        billableAmount > 0 ? billableAmount.toFixed(2) : '0.00', // Billable Amount
      ];
    });

    // Build CSV content
    const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

    // Add summary row if requested
    if (options?.includeSummary !== false) {
      csvLines.push(''); // Empty line before summary
      csvLines.push(
        [
          'SUMMARY',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ].join(',')
      );
      csvLines.push(
        [
          'Total Billable',
          '',
          '',
          totalBillableMinutes.toString(),
          `${filteredEntries.filter((e) => e.billable).length} entries`,
          '',
          '',
          '',
          '',
          '',
          totalBillableAmount.toFixed(2),
        ].join(',')
      );
      if (totalNonBillableMinutes > 0) {
        csvLines.push(
          [
            'Total Non-Billable',
            '',
            '',
            totalNonBillableMinutes.toString(),
            `${filteredEntries.filter((e) => !e.billable).length} entries`,
            '',
            '',
            '',
            '',
            '',
            '',
          ].join(',')
        );
      }
      csvLines.push(
        [
          'GRAND TOTAL',
          '',
          '',
          (totalBillableMinutes + totalNonBillableMinutes).toString(),
          `${filteredEntries.length} entries`,
          '',
          '',
          '',
          '',
          '',
          totalBillableAmount.toFixed(2),
        ].join(',')
      );
    }

    const csvContent = csvLines.join('\n');

    // Generate filename
    const filename = generateExportFilename(
      options?.startDate,
      options?.endDate,
      options?.projectIds,
      projects
    );

    return { success: true, data: csvContent, filename };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Generate a descriptive filename for the export
 */
function generateExportFilename(
  startDate?: Date,
  endDate?: Date,
  projectIds?: string[],
  projects?: TimeTrackingProject[]
): string {
  const parts = ['time-entries'];

  // Add project name if single project
  if (projectIds && projectIds.length === 1 && projects) {
    const project = projects.find((p) => p.id === projectIds[0]);
    if (project) {
      parts.push(project.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-'));
    }
  }

  // Add date range
  if (startDate && endDate) {
    const formatDate = (d: Date) =>
      d.toISOString().split('T')[0].replace(/-/g, '');
    parts.push(`${formatDate(startDate)}-${formatDate(endDate)}`);
  } else if (startDate) {
    parts.push(`from-${startDate.toISOString().split('T')[0].replace(/-/g, '')}`);
  } else if (endDate) {
    parts.push(`to-${endDate.toISOString().split('T')[0].replace(/-/g, '')}`);
  } else {
    parts.push(new Date().toISOString().split('T')[0].replace(/-/g, ''));
  }

  return `${parts.join('-')}.csv`;
}

/**
 * Import time entries from CSV format
 */
export function importTimeEntriesFromCSV(
  csvContent: string,
  projects: TimeTrackingProject[]
): ImportResult {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return { success: false, error: 'CSV file must have headers and at least one data row' };
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

    // Find column indices
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const startTimeIdx = headers.findIndex(h => h.includes('start'));
    const endTimeIdx = headers.findIndex(h => h.includes('end'));
    const durationIdx = headers.findIndex(h => h.includes('duration'));
    const descriptionIdx = headers.findIndex(h => h.includes('description'));
    const projectIdx = headers.findIndex(h => h.includes('project'));
    const tagsIdx = headers.findIndex(h => h.includes('tag'));
    const notesIdx = headers.findIndex(h => h.includes('note'));

    if (dateIdx === -1) {
      return { success: false, error: 'CSV must have a Date column' };
    }

    // Create project lookup map (name -> id)
    const projectMap = new Map(projects.map(p => [p.name.toLowerCase(), p.id]));

    const entries: Omit<TimeEntry, 'id'>[] = [];
    let skipped = 0;

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);

        const dateStr = values[dateIdx]?.trim();
        if (!dateStr) {
          skipped++;
          continue;
        }

        // Parse date and times
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          skipped++;
          continue;
        }

        let startTime: Date;
        let endTime: Date | null = null;
        let duration: number;

        // Try to get start time
        if (startTimeIdx !== -1 && values[startTimeIdx]?.trim()) {
          const timeParts = values[startTimeIdx].trim().split(':');
          startTime = new Date(date);
          startTime.setHours(parseInt(timeParts[0]) || 0, parseInt(timeParts[1]) || 0, 0, 0);
        } else {
          startTime = new Date(date);
          startTime.setHours(9, 0, 0, 0); // Default to 9 AM
        }

        // Try to get end time
        if (endTimeIdx !== -1 && values[endTimeIdx]?.trim()) {
          const timeParts = values[endTimeIdx].trim().split(':');
          endTime = new Date(date);
          endTime.setHours(parseInt(timeParts[0]) || 0, parseInt(timeParts[1]) || 0, 0, 0);
        }

        // Calculate duration
        if (durationIdx !== -1 && values[durationIdx]?.trim()) {
          duration = parseInt(values[durationIdx].trim()) * 60; // Convert minutes to seconds
        } else if (endTime) {
          duration = Math.max(0, (endTime.getTime() - startTime.getTime()) / 1000);
        } else {
          duration = 3600; // Default 1 hour
        }

        // Get project ID
        let projectId: string | null = null;
        if (projectIdx !== -1 && values[projectIdx]?.trim()) {
          const projectName = values[projectIdx].trim().toLowerCase();
          projectId = projectMap.get(projectName) || null;
        }

        // Parse tags
        const tags: string[] = [];
        if (tagsIdx !== -1 && values[tagsIdx]?.trim()) {
          tags.push(...values[tagsIdx].split(',').map(t => t.trim()).filter(Boolean));
        }

        entries.push({
          workspaceId: 'default',
          description: descriptionIdx !== -1 ? unescapeCSV(values[descriptionIdx] || '') : '',
          projectId: projectId || undefined,
          startTime: startTime.toISOString(),
          endTime: endTime?.toISOString() || undefined,
          duration,
          tags,
          notes: notesIdx !== -1 ? unescapeCSV(values[notesIdx] || '') : undefined,
          billable: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectIds: [],
        });
      } catch {
        skipped++;
      }
    }

    if (entries.length === 0) {
      return { success: false, error: 'No valid entries found in CSV', skipped };
    }

    return { success: true, entries, skipped };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Download CSV content as a file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read CSV file content
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Helper: Escape CSV field
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Helper: Unescape CSV field
function unescapeCSV(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  return value;
}

// Helper: Parse CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
