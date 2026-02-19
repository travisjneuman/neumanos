/**
 * Toggl CSV Import Service
 * Imports time tracking data from Toggl Track CSV exports
 */

import { z } from 'zod';
import type { TimeEntry } from '../types';
import { log } from './logger';

/**
 * Toggl CSV row schema
 * Based on standard Toggl Track CSV export format
 */
const TogglRowSchema = z.object({
  User: z.string(),
  Email: z.string(),
  Client: z.string().optional(),
  Project: z.string(),
  Task: z.string().optional(),
  Description: z.string(),
  Billable: z.enum(['Yes', 'No']),
  'Start date': z.string(), // YYYY-MM-DD
  'Start time': z.string(), // HH:MM:SS
  'End date': z.string(), // YYYY-MM-DD
  'End time': z.string(), // HH:MM:SS
  Duration: z.string(), // HH:MM:SS
  Tags: z.string().optional(),
});

type TogglRow = z.infer<typeof TogglRowSchema>;

/**
 * Parse Toggl CSV file content
 */
export const parseTogglCSV = (csvContent: string): TogglRow[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Parse data rows
  const rows: TogglRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const rowObj: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowObj[header] = values[index] || '';
    });

    try {
      const parsed = TogglRowSchema.parse(rowObj);
      rows.push(parsed);
    } catch (error) {
      log.warn('Skipping invalid Toggl CSV row', { row: i + 1, error });
    }
  }

  return rows;
};

/**
 * Parse a CSV line handling quoted fields
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
};

/**
 * Convert Toggl date + time to ISO timestamp
 */
const togglDateTimeToISO = (date: string, time: string): string => {
  // date: YYYY-MM-DD, time: HH:MM:SS
  return `${date}T${time}`;
};

/**
 * Parse Toggl duration (HH:MM:SS) to seconds
 */
const parseDuration = (duration: string): number => {
  const parts = duration.split(':').map(Number);
  if (parts.length !== 3) return 0;

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Import Toggl CSV and convert to TimeEntry format
 * Returns entries with metadata for project mapping
 */
export const importTogglCSV = (
  csvContent: string,
  projectMappings: Record<string, string> = {}
): { success: boolean; entries?: Array<TimeEntry & { _togglProject?: string; _togglClient?: string }>; error?: string } => {
  try {
    const rows = parseTogglCSV(csvContent);

    if (rows.length === 0) {
      return { success: false, error: 'No valid time entries found in CSV' };
    }

    const entries: Array<TimeEntry & { _togglProject?: string; _togglClient?: string }> = [];

    rows.forEach((row) => {
      // Build ISO timestamps
      const startTime = togglDateTimeToISO(row['Start date'], row['Start time']);
      const endTime = togglDateTimeToISO(row['End date'], row['End time']);

      // Map Toggl project to our project ID (or use project name as fallback)
      const togglProjectName = row.Project || 'Untitled Project';
      const projectId = projectMappings[togglProjectName] || togglProjectName;

      // Parse tags
      const tags = row.Tags
        ? row.Tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Parse duration
      const duration = parseDuration(row.Duration);

      // Create time entry with all required fields
      const now = new Date().toISOString();
      const entry: TimeEntry & { _togglProject?: string; _togglClient?: string } = {
        id: `toggl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: 'default', // Use default workspace
        projectId,
        description: row.Description || '',
        startTime,
        endTime,
        duration,
        tags,
        billable: row.Billable === 'Yes',
        createdAt: now,
        updatedAt: now,
        projectIds: [],
        // Metadata for project creation/mapping
        _togglProject: togglProjectName,
        _togglClient: row.Client || undefined,
      };

      entries.push(entry);
    });

    log.info('Toggl CSV parsed successfully', { count: entries.length });

    return { success: true, entries };
  } catch (error) {
    log.error('Toggl CSV import failed', { error });
    return { success: false, error: String(error) };
  }
};

/**
 * Read CSV file from user upload
 */
export const readCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
};

/**
 * Extract unique Toggl projects from imported entries
 * Used to help user map Toggl projects to app projects
 */
export const extractTogglProjects = (
  entries: Array<TimeEntry & { _togglProject?: string; _togglClient?: string }>
): Array<{ togglProject: string; togglClient: string; count: number }> => {
  const projectMap = new Map<string, { togglClient: string; count: number }>();

  entries.forEach((entry) => {
    const project = entry._togglProject || 'Untitled';
    const client = entry._togglClient || '';

    if (projectMap.has(project)) {
      const existing = projectMap.get(project)!;
      projectMap.set(project, { ...existing, count: existing.count + 1 });
    } else {
      projectMap.set(project, { togglClient: client, count: 1 });
    }
  });

  return Array.from(projectMap.entries())
    .map(([togglProject, data]) => ({
      togglProject,
      togglClient: data.togglClient,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count); // Sort by frequency
};
