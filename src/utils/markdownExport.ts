/**
 * Markdown Export Utilities
 *
 * Converts notes and tasks to portable markdown format with wiki link preservation,
 * folder structure support, and ZIP export capabilities.
 */

import JSZip from 'jszip';
import {
  $convertToMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import { createEditor } from 'lexical';
import { logger } from '../services/logger';
import type { Note, Folder } from '../types/notes';
import type { Task } from '../types';

const log = logger.module('MarkdownExport');

// ==================== TASK 1: LEXICAL-TO-MARKDOWN CONVERTER ====================

/**
 * Export note to markdown format with frontmatter
 *
 * Converts Lexical JSON content to markdown while preserving wiki links and metadata.
 * Adds YAML frontmatter with note metadata (title, dates, tags, folder, etc.)
 */
export function exportNoteToMarkdown(
  note: Note,
  _allNotes: Record<string, Note>,
  folders?: Folder[]
): string {
  try {
    // Parse Lexical content
    let markdownContent = '';

    if (note.content) {
      try {
        // Create a temporary editor to convert Lexical state to markdown
        const editor = createEditor({
          onError: (error) => {
            log.error('Lexical editor error during markdown conversion', { error });
          },
        });

        editor.update(() => {
          const parsedContent = JSON.parse(note.content);
          const editorState = editor.parseEditorState(parsedContent);
          editor.setEditorState(editorState);
        });

        // Convert to markdown using Lexical transformers
        editor.getEditorState().read(() => {
          markdownContent = $convertToMarkdownString(TRANSFORMERS);
        });
      } catch (error) {
        log.warn('Failed to parse Lexical content, using plain text', { error });
        markdownContent = note.contentText || '';
      }
    } else {
      // Fallback to plain text if no Lexical content
      markdownContent = note.contentText || '';
    }

    // Build frontmatter
    const frontmatter = buildFrontmatter(note, folders);

    // Combine frontmatter + content
    return `${frontmatter}\n${markdownContent}`;
  } catch (error) {
    log.error('Error exporting note to markdown', { noteId: note.id, error });
    throw error;
  }
}

/**
 * Build YAML frontmatter from note metadata
 */
function buildFrontmatter(note: Note, folders?: Folder[]): string {
  const metadata: Record<string, any> = {
    title: note.title,
    created: note.createdAt.toISOString(),
    updated: note.updatedAt.toISOString(),
  };

  // Add tags if present
  if (note.tags && note.tags.length > 0) {
    metadata.tags = note.tags;
  }

  // Resolve folder name if folderId exists
  if (note.folderId && folders) {
    const folder = folders.find((f) => f.id === note.folderId);
    if (folder) {
      metadata.folder = folder.name;
    }
  }

  // Add optional fields
  if (note.isPinned) metadata.pinned = true;
  if (note.isFavorite) metadata.favorite = true;
  if (note.color) metadata.color = note.color;
  if (note.icon) metadata.icon = note.icon;

  // Convert to YAML format
  const yamlLines = ['---'];
  Object.entries(metadata).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      yamlLines.push(`${key}: [${value.map((v) => JSON.stringify(v)).join(', ')}]`);
    } else if (typeof value === 'string' && value.includes(':')) {
      // Quote strings with colons to avoid YAML parsing issues
      yamlLines.push(`${key}: "${value}"`);
    } else {
      yamlLines.push(`${key}: ${JSON.stringify(value)}`);
    }
  });
  yamlLines.push('---');

  return yamlLines.join('\n');
}

/**
 * Generate markdown-safe filename from note title
 *
 * Sanitizes title for filesystem compatibility:
 * - Removes special characters: < > : " / \ | ? *
 * - Replaces spaces with hyphens
 * - Truncates to 255 characters (filesystem limit)
 * - Adds .md extension
 */
export function getMarkdownFilename(note: Note): string {
  let filename = note.title;

  // Replace special filesystem characters
  filename = filename.replace(/[<>:"/\\|?*]/g, '');

  // Replace spaces with hyphens
  filename = filename.replace(/\s+/g, '-');

  // Remove leading/trailing hyphens
  filename = filename.replace(/^-+|-+$/g, '');

  // Truncate to 255 chars (leave room for .md extension)
  filename = filename.substring(0, 250);

  // Fallback if empty after sanitization
  if (!filename) {
    filename = `note-${note.id.substring(0, 8)}`;
  }

  return `${filename}.md`;
}

/**
 * Validate markdown content
 *
 * Checks if markdown string is valid:
 * - Non-empty content beyond frontmatter
 * - Frontmatter parses correctly
 */
export function isValidMarkdown(markdown: string): boolean {
  if (!markdown || markdown.trim().length === 0) {
    return false;
  }

  // Check for frontmatter
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    // No frontmatter is okay, just needs content
    return markdown.trim().length > 0;
  }

  // Validate frontmatter YAML (basic check)
  const frontmatter = frontmatterMatch[1];
  try {
    // Check for basic YAML structure (key: value pairs)
    const lines = frontmatter.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.includes(':')) {
        return false; // Invalid YAML line
      }
    }
  } catch {
    return false;
  }

  // Check for content beyond frontmatter
  const content = markdown.substring(frontmatterMatch[0].length).trim();
  return content.length > 0;
}

// ==================== TASK 2: TASK-TO-MARKDOWN FORMATTER ====================

/**
 * Export single task to markdown with frontmatter and metadata
 */
export function exportTaskToMarkdown(task: Task): string {
  // Build frontmatter
  const frontmatter = buildTaskFrontmatter(task);

  // Build task body
  const body = buildTaskBody(task);

  return `${frontmatter}\n${body}`;
}

/**
 * Build YAML frontmatter for task
 */
function buildTaskFrontmatter(task: Task): string {
  const metadata: Record<string, any> = {
    title: task.title,
    status: task.status,
    priority: task.priority,
    created: task.created,
  };

  // Add dates if present
  if (task.startDate) metadata['start-date'] = task.startDate;
  if (task.dueDate) metadata['due-date'] = task.dueDate;

  // Add tags
  if (task.tags && task.tags.length > 0) {
    metadata.tags = task.tags;
  }

  // Add card number if present
  if (task.cardNumber) {
    metadata['card-number'] = `KAN-${task.cardNumber}`;
  }

  // Convert to YAML
  const yamlLines = ['---'];
  Object.entries(metadata).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      yamlLines.push(`${key}: [${value.map((v) => JSON.stringify(v)).join(', ')}]`);
    } else if (value === null) {
      yamlLines.push(`${key}: null`);
    } else if (typeof value === 'string' && value.includes(':')) {
      yamlLines.push(`${key}: "${value}"`);
    } else {
      yamlLines.push(`${key}: ${JSON.stringify(value)}`);
    }
  });
  yamlLines.push('---');

  return yamlLines.join('\n');
}

/**
 * Build task body with description, checklist, metadata
 */
function buildTaskBody(task: Task): string {
  const sections: string[] = [];

  // Description
  if (task.description) {
    sections.push('## Description\n');
    sections.push(task.description + '\n');
  }

  // Checklist
  if (task.checklist && task.checklist.length > 0) {
    sections.push('## Checklist\n');
    task.checklist
      .sort((a, b) => a.order - b.order)
      .forEach((item) => {
        const checkbox = item.completed ? '[x]' : '[ ]';
        sections.push(`- ${checkbox} ${item.text}`);
      });
    sections.push('');
  }

  // Subtasks
  if (task.subtasks && task.subtasks.length > 0) {
    sections.push('## Subtasks\n');
    task.subtasks
      .sort((a, b) => a.order - b.order)
      .forEach((subtask) => {
        const checkbox = subtask.completed ? '[x]' : '[ ]';
        sections.push(`- ${checkbox} ${subtask.title}`);
        if (subtask.description) {
          sections.push(`  ${subtask.description}`);
        }
      });
    sections.push('');
  }

  // Comments
  if (task.comments && task.comments.length > 0) {
    sections.push('## Comments\n');
    task.comments.forEach((comment) => {
      const date = new Date(comment.createdAt).toLocaleString();
      sections.push(`**${comment.author}** (${date}):`);
      sections.push(comment.text + '\n');
    });
  }

  // Metadata section
  sections.push('## Metadata\n');
  sections.push(`- **Status:** ${formatStatusLabel(task.status)}`);
  sections.push(`- **Priority:** ${formatPriorityLabel(task.priority)}`);
  sections.push(`- **Created:** ${formatDate(task.created)}`);

  if (task.startDate) {
    sections.push(`- **Start Date:** ${formatDate(task.startDate)}`);
  }
  if (task.dueDate) {
    sections.push(`- **Due Date:** ${formatDate(task.dueDate)}`);
  }
  if (task.estimatedHours) {
    sections.push(`- **Estimated Hours:** ${task.estimatedHours}`);
  }
  if (task.actualHours) {
    sections.push(`- **Actual Hours:** ${task.actualHours}`);
  }
  if (task.progress !== undefined) {
    sections.push(`- **Progress:** ${task.progress}%`);
  }
  if (task.assignedTo) {
    sections.push(`- **Assigned To:** ${task.assignedTo}`);
  }

  // Dependencies
  if (task.dependencies && task.dependencies.length > 0) {
    sections.push('\n## Dependencies\n');
    task.dependencies.forEach((dep) => {
      sections.push(`- ${dep.type}: ${dep.taskId} (lag: ${dep.lag} days)`);
    });
  }

  // Recurrence
  if (task.recurrence) {
    sections.push('\n## Recurrence\n');
    sections.push(formatRecurrence(task.recurrence));
  }

  // Time tracking
  if (task.timeTracking) {
    sections.push('\n## Time Tracking\n');
    if (task.timeTracking.estimated) {
      sections.push(`- **Estimated:** ${task.timeTracking.estimated} hours`);
    }
    sections.push(`- **Actual:** ${task.timeTracking.actual} hours`);
    if (task.timeTracking.timerHistory.length > 0) {
      sections.push('\n### Timer History');
      task.timeTracking.timerHistory.forEach((entry) => {
        const duration = Math.round(entry.duration / 60); // Convert to minutes
        sections.push(`- ${formatDate(entry.startTime)}: ${duration} minutes`);
      });
    }
  }

  // Attachments (note: data URLs not exportable)
  if (task.attachments && task.attachments.length > 0) {
    sections.push('\n## Attachments\n');
    sections.push('*Note: File attachments contain binary data and cannot be exported to markdown. Download attachments separately.*\n');
    task.attachments.forEach((att) => {
      sections.push(`- ${att.filename} (${att.fileType}, ${formatFileSize(att.fileSize)})`);
    });
  }

  return sections.join('\n');
}

/**
 * Export multiple tasks to single markdown file (grouped by status)
 */
export function exportTasksToMarkdown(tasks: Task[]): string {
  const sections: string[] = [];

  // Title
  sections.push('# Tasks Export\n');
  sections.push(`*Exported on ${new Date().toLocaleString()}*\n`);

  // Table of contents
  sections.push('## Table of Contents\n');
  const statuses: Array<'backlog' | 'todo' | 'inprogress' | 'review' | 'done'> = [
    'backlog',
    'todo',
    'inprogress',
    'review',
    'done',
  ];
  statuses.forEach((status) => {
    const count = tasks.filter((t) => t.status === status).length;
    if (count > 0) {
      sections.push(`- [${formatStatusLabel(status)}](#${status}) (${count} tasks)`);
    }
  });
  sections.push('');

  // Group tasks by status
  statuses.forEach((status) => {
    const statusTasks = tasks.filter((t) => t.status === status);
    if (statusTasks.length === 0) return;

    sections.push(`\n## ${formatStatusLabel(status)}\n`);

    statusTasks.forEach((task) => {
      sections.push(`### ${task.title}\n`);
      if (task.cardNumber) {
        sections.push(`**Card:** KAN-${task.cardNumber}\n`);
      }
      sections.push(`**Priority:** ${formatPriorityLabel(task.priority)}`);
      if (task.dueDate) {
        sections.push(`| **Due:** ${formatDate(task.dueDate)}`);
      }
      sections.push('\n');

      if (task.description) {
        sections.push(task.description + '\n');
      }

      // Checklist preview
      if (task.checklist && task.checklist.length > 0) {
        const completed = task.checklist.filter((i) => i.completed).length;
        sections.push(`*Checklist: ${completed}/${task.checklist.length} completed*\n`);
      }

      sections.push('---\n');
    });
  });

  return sections.join('\n');
}

// ==================== TASK 3: FILE SYSTEM EXPORT HELPERS ====================

/**
 * Create ZIP archive from file array
 *
 * @param files Array of {path, content} objects
 * @returns Blob ready for download
 */
export async function createMarkdownZip(
  files: Array<{ path: string; content: string }>
): Promise<Blob> {
  const zip = new JSZip();

  // Add files to ZIP
  files.forEach(({ path, content }) => {
    zip.file(path, content);
  });

  // Generate ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' });
  log.info('Created ZIP archive', { fileCount: files.length });

  return blob;
}

/**
 * Build folder path from folder ID (recursively resolves parent folders)
 *
 * @param folderId Target folder ID (null = root)
 * @param folders All folders
 * @returns Path string (e.g., "notes/Work/Projects")
 */
export function buildFolderPath(
  folderId: string | null,
  folders: Folder[]
): string {
  if (!folderId) {
    return 'notes';
  }

  const folder = folders.find((f) => f.id === folderId);
  if (!folder) {
    log.warn('Folder not found', { folderId });
    return 'notes';
  }

  // Sanitize folder name
  const sanitizedName = folder.name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '-');

  // Recursively build parent path
  if (folder.parentId) {
    const parentPath = buildFolderPath(folder.parentId, folders);
    return `${parentPath}/${sanitizedName}`;
  }

  return `notes/${sanitizedName}`;
}

/**
 * Download blob to user's filesystem
 *
 * @param blob Blob to download
 * @param filename Download filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Create temporary download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  log.info('Download triggered', { filename });
}

/**
 * Export notes with folder structure preserved
 *
 * @param notes All notes to export
 * @param folders All folders
 * @returns ZIP blob ready for download
 */
export async function exportNotesWithFolders(
  notes: Note[],
  folders: Folder[]
): Promise<Blob> {
  const files: Array<{ path: string; content: string }> = [];
  const filenameMap = new Map<string, number>(); // Track duplicate filenames

  // Convert all notes to markdown files
  const allNotesMap = Object.fromEntries(notes.map((n) => [n.id, n]));

  notes.forEach((note) => {
    // Build folder path
    const folderPath = buildFolderPath(note.folderId, folders);

    // Get markdown filename
    let filename = getMarkdownFilename(note);

    // Handle duplicate filenames
    const fullPath = `${folderPath}/${filename}`;
    if (filenameMap.has(fullPath)) {
      const count = filenameMap.get(fullPath)! + 1;
      filenameMap.set(fullPath, count);
      const baseName = filename.replace(/\.md$/, '');
      filename = `${baseName}-${count}.md`;
    } else {
      filenameMap.set(fullPath, 1);
    }

    // Convert to markdown
    const markdown = exportNoteToMarkdown(note, allNotesMap, folders);

    files.push({
      path: `${folderPath}/${filename}`,
      content: markdown,
    });
  });

  return createMarkdownZip(files);
}

/**
 * Export all data (notes + tasks) with metadata
 *
 * @param notes All notes
 * @param tasks All tasks
 * @param folders All folders
 * @returns ZIP blob with notes, tasks, and metadata.json
 */
export async function exportAllData(
  notes: Note[],
  tasks: Task[],
  folders: Folder[]
): Promise<Blob> {
  const files: Array<{ path: string; content: string }> = [];
  const allNotesMap = Object.fromEntries(notes.map((n) => [n.id, n]));
  const filenameMap = new Map<string, number>();

  // Export notes with folder structure
  notes.forEach((note) => {
    const folderPath = buildFolderPath(note.folderId, folders);
    let filename = getMarkdownFilename(note);

    // Handle duplicates
    const fullPath = `${folderPath}/${filename}`;
    if (filenameMap.has(fullPath)) {
      const count = filenameMap.get(fullPath)! + 1;
      filenameMap.set(fullPath, count);
      const baseName = filename.replace(/\.md$/, '');
      filename = `${baseName}-${count}.md`;
    } else {
      filenameMap.set(fullPath, 1);
    }

    const markdown = exportNoteToMarkdown(note, allNotesMap, folders);
    files.push({
      path: `${folderPath}/${filename}`,
      content: markdown,
    });
  });

  // Export tasks (grouped by status)
  const statuses: Array<'backlog' | 'todo' | 'inprogress' | 'review' | 'done'> = [
    'backlog',
    'todo',
    'inprogress',
    'review',
    'done',
  ];

  statuses.forEach((status) => {
    const statusTasks = tasks.filter((t) => t.status === status);
    if (statusTasks.length === 0) return;

    const markdown = exportTasksToMarkdown(statusTasks);
    files.push({
      path: `tasks/by-status/${status}.md`,
      content: markdown,
    });
  });

  // Export all tasks in single file
  const allTasksMarkdown = exportTasksToMarkdown(tasks);
  files.push({
    path: 'tasks/all-tasks.md',
    content: allTasksMarkdown,
  });

  // Export metadata
  const metadata = {
    exportedAt: new Date().toISOString(),
    noteCount: notes.length,
    taskCount: tasks.length,
    folderCount: folders.length,
  };
  files.push({
    path: 'metadata.json',
    content: JSON.stringify(metadata, null, 2),
  });

  return createMarkdownZip(files);
}

/**
 * Generate download filename for export
 *
 * @returns Filename in format: neumanos-export-YYYY-MM-DD-HHmmss.zip
 */
export function getExportFilename(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHmmss
  return `neumanos-export-${date}-${time}.zip`;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format status label for display
 */
function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    inprogress: 'In Progress',
    review: 'Review',
    done: 'Done',
  };
  return labels[status] || status;
}

/**
 * Format priority label for display
 */
function formatPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return labels[priority] || priority;
}

/**
 * Format date for human-readable display
 */
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format recurrence pattern for human-readable display
 */
function formatRecurrence(recurrence: Task['recurrence']): string {
  if (!recurrence) return '';

  const { frequency, interval, endType, endCount, endDate } = recurrence;

  let pattern = `Every ${interval > 1 ? interval : ''} ${frequency}`;

  if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
    const days = recurrence.daysOfWeek.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]);
    pattern += ` on ${days.join(', ')}`;
  }

  if (recurrence.dayOfMonth) {
    pattern += ` on day ${recurrence.dayOfMonth}`;
  }

  // End condition
  if (endType === 'after' && endCount) {
    pattern += ` (ends after ${endCount} occurrences)`;
  } else if (endType === 'until' && endDate) {
    pattern += ` (ends on ${formatDate(endDate)})`;
  } else {
    pattern += ' (never ends)';
  }

  return pattern;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
