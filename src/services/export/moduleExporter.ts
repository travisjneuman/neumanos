/**
 * Module Exporter
 *
 * Export individual modules as standard formats:
 * - Notes -> Markdown ZIP
 * - Tasks -> CSV
 * - Calendar -> ICS
 * - Time Entries -> CSV
 * - Habits -> CSV
 */

import { logger } from '../logger';
import { useNotesStore } from '../../stores/useNotesStore';
import { useFoldersStore } from '../../stores/useFoldersStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useTimeTrackingStore } from '../../stores/useTimeTrackingStore';
import { useHabitStore } from '../../stores/useHabitStore';
import { exportToICS, downloadICS } from '../icsImportExport';
import { format } from 'date-fns';

const log = logger.module('ModuleExporter');

/**
 * Escape a CSV field value (wrap in quotes if needed)
 */
function csvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from headers and rows
 */
function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(csvField).join(',');
  const dataLines = rows.map((row) => row.map(csvField).join(','));
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Trigger a browser file download
 */
function triggerDownload(blob: Blob, filename: string): void {
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
 * Export all notes as a ZIP of markdown files
 * Preserves folder structure
 */
export async function exportNotesAsMarkdown(): Promise<{ filename: string; noteCount: number }> {
  const notes = useNotesStore.getState().getAllNotes();
  const folders = useFoldersStore.getState().folders;

  // Build folder path map
  const folderPathMap = new Map<string, string>();
  function buildPath(folderId: string): string {
    if (folderPathMap.has(folderId)) return folderPathMap.get(folderId)!;
    const folder = folders[folderId];
    if (!folder) return '';
    const parentPath = folder.parentId ? buildPath(folder.parentId) : '';
    const path = parentPath ? `${parentPath}/${folder.name}` : folder.name;
    folderPathMap.set(folderId, path);
    return path;
  }

  // Build folder paths for all folders
  for (const folderId of Object.keys(folders)) {
    buildPath(folderId);
  }

  // Create a simple ZIP using the ZIP format specification
  const files: Array<{ path: string; content: string }> = [];

  for (const note of notes) {
    // Build frontmatter
    const frontmatter: string[] = ['---'];
    frontmatter.push(`title: "${note.title.replace(/"/g, '\\"')}"`);
    if (note.tags.length > 0) {
      frontmatter.push(`tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]`);
    }
    frontmatter.push(`created: ${new Date(note.createdAt).toISOString()}`);
    frontmatter.push(`updated: ${new Date(note.updatedAt).toISOString()}`);
    if (note.isPinned) frontmatter.push('pinned: true');
    if (note.isFavorite) frontmatter.push('favorite: true');
    frontmatter.push('---');
    frontmatter.push('');

    const content = frontmatter.join('\n') + `# ${note.title}\n\n${note.contentText || ''}`;

    // Determine file path
    const folderPath = note.folderId ? folderPathMap.get(note.folderId) : null;
    const safeTitle = note.title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 200);
    const filePath = folderPath ? `${folderPath}/${safeTitle}.md` : `${safeTitle}.md`;

    files.push({ path: filePath, content });
  }

  // Create ZIP blob using the simple ZIP builder
  const zipBlob = createZipBlob(files);

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const filename = `NeumanOS-notes-${timestamp}.zip`;
  triggerDownload(zipBlob, filename);

  log.info('Notes exported as markdown ZIP', { noteCount: notes.length });
  return { filename, noteCount: notes.length };
}

/**
 * Export tasks as CSV
 */
export function exportTasksAsCSV(): { filename: string; taskCount: number } {
  const state = useKanbanStore.getState();
  const allTasks = Object.values(state.tasks);

  const headers = [
    'Title', 'Description', 'Status', 'Priority', 'Tags',
    'Due Date', 'Start Date', 'Created', 'Assigned To',
    'Estimated Hours', 'Subtasks',
  ];

  const rows = allTasks.map((task) => [
    task.title,
    task.description,
    task.status,
    task.priority,
    task.tags.join('; '),
    task.dueDate || '',
    task.startDate || '',
    task.created,
    task.assignedTo || '',
    task.estimatedHours?.toString() || '',
    task.subtasks?.map((s) => `${s.completed ? '[x]' : '[ ]'} ${s.title}`).join(' | ') || '',
  ]);

  const csv = buildCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const filename = `NeumanOS-tasks-${timestamp}.csv`;
  triggerDownload(blob, filename);

  log.info('Tasks exported as CSV', { taskCount: allTasks.length });
  return { filename, taskCount: allTasks.length };
}

/**
 * Export calendar events as ICS
 */
export function exportCalendarAsICS(): { filename: string; eventCount: number } {
  const events = useCalendarStore.getState().events;
  const result = exportToICS(events);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to export calendar events');
  }

  const eventCount = Object.values(events).reduce((acc, arr) => acc + arr.length, 0);
  const filename = `NeumanOS-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
  downloadICS(result.data, filename);

  log.info('Calendar exported as ICS', { eventCount });
  return { filename, eventCount };
}

/**
 * Export time entries as CSV
 */
export function exportTimeEntriesAsCSV(): { filename: string; entryCount: number } {
  const entries = useTimeTrackingStore.getState().entries;

  const headers = [
    'Date', 'Description', 'Project', 'Tags', 'Duration (hours)',
    'Start Time', 'End Time', 'Billable', 'Hourly Rate', 'Notes',
  ];

  const rows = entries.map((entry) => {
    const durationHours = (entry.duration / 3600).toFixed(2);
    return [
      entry.startTime ? format(new Date(entry.startTime), 'yyyy-MM-dd') : '',
      entry.description,
      entry.projectId || '',
      entry.tags.join('; '),
      durationHours,
      entry.startTime || '',
      entry.endTime || '',
      entry.billable ? 'Yes' : 'No',
      entry.hourlyRate?.toString() || '',
      entry.notes || '',
    ];
  });

  const csv = buildCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const filename = `NeumanOS-time-entries-${timestamp}.csv`;
  triggerDownload(blob, filename);

  log.info('Time entries exported as CSV', { entryCount: entries.length });
  return { filename, entryCount: entries.length };
}

/**
 * Export habits as CSV
 */
export function exportHabitsAsCSV(): { filename: string; habitCount: number } {
  const state = useHabitStore.getState();
  const habits = state.habits;

  const headers = [
    'Name', 'Description', 'Category', 'Difficulty', 'Frequency',
    'Current Streak', 'Longest Streak', 'Total Completions',
    'Total XP', 'Created', 'Color', 'Icon',
  ];

  const rows = habits.map((habit) => [
    habit.title,
    habit.description || '',
    habit.category,
    habit.difficulty,
    habit.frequency,
    habit.currentStreak.toString(),
    habit.longestStreak.toString(),
    habit.totalCompletions.toString(),
    habit.totalXp.toString(),
    habit.createdAt,
    habit.color,
    habit.icon || '',
  ]);

  const csv = buildCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const filename = `NeumanOS-habits-${timestamp}.csv`;
  triggerDownload(blob, filename);

  log.info('Habits exported as CSV', { habitCount: habits.length });
  return { filename, habitCount: habits.length };
}

// --- Simple ZIP builder (no dependencies) ---

interface ZipFile {
  path: string;
  content: string;
}

/**
 * Create a ZIP blob from an array of files
 * Uses the ZIP file format specification (PKZIP)
 */
function createZipBlob(files: ZipFile[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const dataBytes = encoder.encode(file.content);

    // Local file header
    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lhView = new DataView(localHeader);
    lhView.setUint32(0, 0x04034b50, true); // Local file header signature
    lhView.setUint16(4, 20, true); // Version needed
    lhView.setUint16(6, 0, true); // Flags
    lhView.setUint16(8, 0, true); // Compression (stored)
    lhView.setUint16(10, 0, true); // Mod time
    lhView.setUint16(12, 0, true); // Mod date
    lhView.setUint32(14, crc32(dataBytes), true); // CRC-32
    lhView.setUint32(18, dataBytes.length, true); // Compressed size
    lhView.setUint32(22, dataBytes.length, true); // Uncompressed size
    lhView.setUint16(26, nameBytes.length, true); // File name length
    lhView.setUint16(28, 0, true); // Extra field length
    new Uint8Array(localHeader).set(nameBytes, 30);

    parts.push(new Uint8Array(localHeader));
    parts.push(dataBytes);

    // Central directory entry
    const cdEntry = new ArrayBuffer(46 + nameBytes.length);
    const cdView = new DataView(cdEntry);
    cdView.setUint32(0, 0x02014b50, true); // Central directory signature
    cdView.setUint16(4, 20, true); // Version made by
    cdView.setUint16(6, 20, true); // Version needed
    cdView.setUint16(8, 0, true); // Flags
    cdView.setUint16(10, 0, true); // Compression
    cdView.setUint16(12, 0, true); // Mod time
    cdView.setUint16(14, 0, true); // Mod date
    cdView.setUint32(16, crc32(dataBytes), true); // CRC-32
    cdView.setUint32(20, dataBytes.length, true); // Compressed size
    cdView.setUint32(24, dataBytes.length, true); // Uncompressed size
    cdView.setUint16(28, nameBytes.length, true); // File name length
    cdView.setUint16(30, 0, true); // Extra field length
    cdView.setUint16(32, 0, true); // Comment length
    cdView.setUint16(34, 0, true); // Disk number
    cdView.setUint16(36, 0, true); // Internal attrs
    cdView.setUint32(38, 0, true); // External attrs
    cdView.setUint32(42, offset, true); // Relative offset
    new Uint8Array(cdEntry).set(nameBytes, 46);

    centralDirectory.push(new Uint8Array(cdEntry));
    offset += 30 + nameBytes.length + dataBytes.length;
  }

  // Add central directory
  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDirectory) {
    parts.push(cd);
    cdSize += cd.length;
  }

  // End of central directory record
  const eocd = new ArrayBuffer(22);
  const eocdView = new DataView(eocd);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Disk number
  eocdView.setUint16(6, 0, true); // CD disk number
  eocdView.setUint16(8, files.length, true); // Entries on this disk
  eocdView.setUint16(10, files.length, true); // Total entries
  eocdView.setUint32(12, cdSize, true); // CD size
  eocdView.setUint32(16, cdOffset, true); // CD offset
  eocdView.setUint16(20, 0, true); // Comment length
  parts.push(new Uint8Array(eocd));

  return new Blob(parts as BlobPart[], { type: 'application/zip' });
}

/**
 * CRC-32 calculation for ZIP file integrity
 */
function crc32(data: Uint8Array): number {
  let crc = ~0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc >>> 0;
}
