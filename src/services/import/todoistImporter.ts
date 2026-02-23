/**
 * Todoist Importer
 *
 * Imports tasks from a Todoist CSV export.
 * Todoist CSV format columns:
 * TYPE, CONTENT, DESCRIPTION, PRIORITY, INDENT, AUTHOR, RESPONSIBLE, DATE, DATE_LANG, TIMEZONE
 */

// Logger available: import { logger } from '../logger';

export interface TodoistImportSummary {
  tasksCreated: number;
  projectsDetected: string[];
  errors: string[];
  warnings: string[];
}

export interface ParsedTodoistTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'done';
  dueDate: string | null;
  tags: string[];
  indent: number;
  projectName: string | null;
}

export interface TodoistImportProgress {
  current: number;
  total: number;
  phase: 'parsing' | 'creating';
}

/**
 * Parse CSV line handling quoted fields
 */
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Map Todoist priority (1-4) to NeumanOS priority
 * Todoist: 1 = lowest, 4 = highest (inverted)
 * NeumanOS: low, medium, high
 */
function mapTodoistPriority(value: string): 'low' | 'medium' | 'high' {
  const num = parseInt(value, 10);
  if (num === 4) return 'high';
  if (num === 3) return 'medium';
  return 'low'; // 1 and 2 map to low
}

/**
 * Parse a Todoist date string to YYYY-MM-DD format
 * Todoist uses various formats like "2024-01-15", "Jan 15 2024", etc.
 */
function parseTodoistDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const cleaned = dateStr.trim();

  // Try ISO format first
  const isoMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // Try parsing with Date constructor
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Find column index by name (case-insensitive, exact match)
 */
function findColumn(headers: string[], name: string): number {
  return headers.findIndex((h) => h.toLowerCase().trim() === name.toLowerCase());
}

/**
 * Parse Todoist CSV export into tasks
 */
export function parseTodoistCSV(csvText: string): {
  tasks: ParsedTodoistTask[];
  summary: Omit<TodoistImportSummary, 'tasksCreated'>;
} {
  const tasks: ParsedTodoistTask[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const projectsDetected = new Set<string>();

  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) {
    return { tasks: [], summary: { errors: ['CSV file is empty or has no data rows'], warnings, projectsDetected: [] } };
  }

  const headers = parseCSVLine(lines[0]);

  // Map Todoist columns
  const typeIdx = findColumn(headers, 'TYPE');
  const contentIdx = findColumn(headers, 'CONTENT');
  const descIdx = findColumn(headers, 'DESCRIPTION');
  const priorityIdx = findColumn(headers, 'PRIORITY');
  const indentIdx = findColumn(headers, 'INDENT');
  const dateIdx = findColumn(headers, 'DATE');
  // responsibleIdx available for future use: findColumn(headers, 'RESPONSIBLE')

  if (contentIdx === -1) {
    // Fallback: try to find any content-like column
    const altContentIdx = headers.findIndex((h) =>
      ['content', 'title', 'name', 'task'].includes(h.toLowerCase().trim())
    );
    if (altContentIdx === -1) {
      return {
        tasks: [],
        summary: {
          errors: ['Could not find a CONTENT or similar column in the CSV. Is this a Todoist export?'],
          warnings,
          projectsDetected: [],
        },
      };
    }
    warnings.push('Using fallback column detection. File may not be a standard Todoist export.');
  }

  const effectiveContentIdx = contentIdx === -1 ? 0 : contentIdx;

  let currentProject: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    const type = typeIdx !== -1 ? cols[typeIdx]?.trim().toLowerCase() : '';
    const content = cols[effectiveContentIdx] || '';

    if (!content.trim()) continue;

    // Todoist uses "project" type rows to indicate project headers
    if (type === 'project') {
      currentProject = content.trim();
      projectsDetected.add(currentProject);
      continue;
    }

    // Skip section headers
    if (type === 'section') continue;

    // Parse task
    const title = content.trim();
    const description = descIdx !== -1 ? (cols[descIdx] || '') : '';
    const priority = priorityIdx !== -1 ? mapTodoistPriority(cols[priorityIdx] || '1') : 'medium';
    const indent = indentIdx !== -1 ? parseInt(cols[indentIdx] || '1', 10) : 1;
    const dueDate = dateIdx !== -1 ? parseTodoistDate(cols[dateIdx] || '') : null;

    // Build tags from project and priority
    const tags: string[] = [];
    if (currentProject) {
      tags.push(currentProject.toLowerCase().replace(/\s+/g, '-'));
    }

    // Determine status: completed tasks in Todoist export are marked
    const status: 'todo' | 'done' = type === 'completed_task' ? 'done' : 'todo';

    tasks.push({
      title,
      description,
      priority,
      status,
      dueDate,
      tags,
      indent,
      projectName: currentProject,
    });
  }

  if (tasks.length === 0) {
    warnings.push('No tasks found in the CSV file.');
  }

  return {
    tasks,
    summary: { errors, warnings, projectsDetected: [...projectsDetected] },
  };
}
