/**
 * Notion Importer
 *
 * Accepts a Notion export ZIP file containing:
 * - Markdown (.md) files for pages
 * - CSV (.csv) files for database exports
 * - Assets folder for images/attachments
 *
 * Converts Notion-specific markdown (callouts, toggles, embeds)
 * to standard markdown for NeumanOS.
 */

import { logger } from '../logger';

const log = logger.module('NotionImporter');

export interface NotionImportSummary {
  notesCreated: number;
  tasksCreated: number;
  foldersCreated: number;
  errors: string[];
  warnings: string[];
}

export interface ParsedNotionEntry {
  type: 'note' | 'task';
  title: string;
  content: string;
  tags: string[];
  folderPath: string | null;
  priority?: 'low' | 'medium' | 'high';
  status?: string;
  dueDate?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotionImportProgress {
  current: number;
  total: number;
  currentFile: string;
  phase: 'extracting' | 'parsing' | 'creating';
}

/**
 * Convert Notion-specific markdown to standard markdown
 */
function convertNotionMarkdown(content: string): string {
  let result = content;

  // Convert Notion callouts: > 💡 text → > **Note:** text
  result = result.replace(
    /^>\s*[🔴🟠🟡🟢🔵🟣⚪⚫💡📌⚠️❗❓✅📝🔗]\s*/gm,
    '> **Note:** '
  );

  // Convert Notion toggle syntax: <details><summary>Title</summary> → ## Title
  result = result.replace(
    /<details>\s*<summary>(.*?)<\/summary>/gi,
    '### $1'
  );
  result = result.replace(/<\/?details>/gi, '');

  // Remove Notion embed blocks: {% embed url="..." %}
  result = result.replace(/\{%\s*embed\s+url="([^"]+)"\s*%\}/gi, '[$1]($1)');

  // Convert Notion database links: [Title](notion://...)
  result = result.replace(/\[([^\]]+)\]\(notion:\/\/[^)]+\)/g, '[[$1]]');

  // Remove Notion page IDs from links (32-char hex at end of filenames)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]*?)%20[a-f0-9]{32}\.(md|csv)\)/gi,
    '[[$1]]'
  );

  // Clean up Notion export artifacts
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

/**
 * Parse a CSV line handling quoted fields
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
 * Find column index by matching header names (case-insensitive)
 */
function findColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.findIndex((h) => h.includes(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Determine if a CSV file looks like a task database
 * (has status/priority/due-date columns typical of project management)
 */
function isTaskDatabase(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const taskIndicators = ['status', 'priority', 'due', 'due date', 'assign', 'done'];
  const matchCount = taskIndicators.filter((t) =>
    lower.some((h) => h.includes(t))
  ).length;
  return matchCount >= 2;
}

/**
 * Map Notion/generic priority to NeumanOS priority
 */
function mapPriority(value: string): 'low' | 'medium' | 'high' {
  const lower = value.toLowerCase().trim();
  if (['high', 'urgent', 'critical', 'p1', '1'].includes(lower)) return 'high';
  if (['low', 'minor', 'p3', 'p4', '3', '4'].includes(lower)) return 'low';
  return 'medium';
}

/**
 * Parse a Notion CSV database export
 */
function parseNotionCSV(csvText: string, _filename: string): ParsedNotionEntry[] {
  const entries: ParsedNotionEntry[] = [];
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return entries;

  const headers = parseCSVLine(lines[0]);
  const isTask = isTaskDatabase(headers);

  const titleIdx = findColumn(headers, ['title', 'name', 'page', 'task']);
  const contentIdx = findColumn(headers, ['content', 'body', 'text', 'description', 'notes']);
  const tagsIdx = findColumn(headers, ['tags', 'labels', 'categories', 'multi-select', 'type']);
  const statusIdx = findColumn(headers, ['status', 'state', 'stage']);
  const priorityIdx = findColumn(headers, ['priority', 'urgency', 'importance']);
  const dueDateIdx = findColumn(headers, ['due', 'due date', 'deadline', 'date']);
  const createdIdx = findColumn(headers, ['created time', 'created', 'date created']);
  const updatedIdx = findColumn(headers, ['last edited time', 'updated', 'modified']);

  const effectiveTitleIdx = titleIdx === -1 ? 0 : titleIdx;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    const title = cols[effectiveTitleIdx] || '';
    if (!title.trim()) continue;

    const content = contentIdx !== -1 ? (cols[contentIdx] || '') : '';
    const tags: string[] = [];
    if (tagsIdx !== -1 && cols[tagsIdx]) {
      tags.push(
        ...cols[tagsIdx]
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      );
    }

    const now = new Date();
    let createdAt = now;
    let updatedAt = now;
    if (createdIdx !== -1 && cols[createdIdx]) {
      const d = new Date(cols[createdIdx]);
      if (!isNaN(d.getTime())) createdAt = d;
    }
    if (updatedIdx !== -1 && cols[updatedIdx]) {
      const d = new Date(cols[updatedIdx]);
      if (!isNaN(d.getTime())) updatedAt = d;
    }

    const entry: ParsedNotionEntry = {
      type: isTask ? 'task' : 'note',
      title,
      content,
      tags,
      folderPath: null,
      createdAt,
      updatedAt,
    };

    if (isTask) {
      if (statusIdx !== -1 && cols[statusIdx]) {
        entry.status = cols[statusIdx].trim();
      }
      if (priorityIdx !== -1 && cols[priorityIdx]) {
        entry.priority = mapPriority(cols[priorityIdx]);
      }
      if (dueDateIdx !== -1 && cols[dueDateIdx]) {
        const d = new Date(cols[dueDateIdx]);
        if (!isNaN(d.getTime())) {
          entry.dueDate = d.toISOString().split('T')[0];
        }
      }
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Parse a Notion markdown file into a note entry
 */
function parseNotionMarkdownFile(
  content: string,
  filename: string,
  folderPath: string | null
): ParsedNotionEntry {
  const converted = convertNotionMarkdown(content);

  // Extract title from first heading or filename
  let title = filename.replace(/\.md$/i, '');
  // Remove Notion page ID from filename (32-char hex)
  title = title.replace(/\s+[a-f0-9]{32}$/i, '');

  const h1Match = converted.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1].trim();
  }

  // Extract inline tags
  const tagMatches = converted.match(/(?:^|\s)#([a-zA-Z][a-zA-Z0-9_-]*)/g);
  const tags = tagMatches
    ? [...new Set(tagMatches.map((t) => t.trim().replace(/^#/, '')).filter((t) => t.length > 1))]
    : [];

  return {
    type: 'note',
    title,
    content: converted,
    tags,
    folderPath,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Import from a Notion ZIP export
 *
 * Uses JSZip-compatible approach via browser's built-in APIs
 * (DecompressionStream for individual entries isn't widespread,
 *  so we use the zip parsing approach)
 */
export async function importNotionZip(
  file: File,
  onProgress?: (progress: NotionImportProgress) => void
): Promise<{ entries: ParsedNotionEntry[]; summary: Omit<NotionImportSummary, 'notesCreated' | 'tasksCreated' | 'foldersCreated'> }> {
  const entries: ParsedNotionEntry[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // For ZIP files, we need to use a library or the File System Access API
    // Since NeumanOS is a browser app, we'll handle both ZIP and folder uploads
    // For ZIP: extract entries using a lightweight approach
    const arrayBuffer = await file.arrayBuffer();
    const files = await extractZipEntries(arrayBuffer);

    const totalFiles = files.length;
    let current = 0;

    for (const entry of files) {
      current++;
      onProgress?.({
        current,
        total: totalFiles,
        currentFile: entry.name,
        phase: 'parsing',
      });

      try {
        if (entry.name.endsWith('.csv')) {
          const text = new TextDecoder().decode(entry.data);
          const csvEntries = parseNotionCSV(text, entry.name);
          entries.push(...csvEntries);
        } else if (entry.name.endsWith('.md')) {
          // Determine folder path from zip entry path
          const parts = entry.name.split('/');
          const filename = parts.pop() || '';
          // Remove the top-level export folder name
          const folderParts = parts.length > 1 ? parts.slice(1) : [];
          const folderPath = folderParts.length > 0
            ? folderParts.map((p) => p.replace(/\s+[a-f0-9]{32}$/i, '')).join('/')
            : null;

          const text = new TextDecoder().decode(entry.data);
          const noteEntry = parseNotionMarkdownFile(text, filename, folderPath);
          entries.push(noteEntry);
        }
        // Skip asset files (images, etc.) - they're referenced but not stored
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to parse ${entry.name}: ${msg}`);
        log.warn('Failed to parse Notion entry', { file: entry.name, error: msg });
      }
    }

    if (entries.length === 0) {
      warnings.push('No importable files found in the ZIP. Expected .md or .csv files.');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to read ZIP file: ${msg}`);
    log.error('Notion ZIP import failed', { error: msg });
  }

  return { entries, summary: { errors, warnings } };
}

/**
 * Import from individual Notion files (non-ZIP fallback)
 * Accepts FileList from a file input or folder picker
 */
export async function importNotionFiles(
  files: FileList,
  onProgress?: (progress: NotionImportProgress) => void
): Promise<{ entries: ParsedNotionEntry[]; summary: Omit<NotionImportSummary, 'notesCreated' | 'tasksCreated' | 'foldersCreated'> }> {
  const entries: ParsedNotionEntry[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({
      current: i + 1,
      total,
      currentFile: file.name,
      phase: 'parsing',
    });

    try {
      const text = await file.text();
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

      if (file.name.endsWith('.csv')) {
        const csvEntries = parseNotionCSV(text, file.name);
        entries.push(...csvEntries);
      } else if (file.name.endsWith('.md')) {
        const parts = relativePath.split('/');
        const filename = parts.pop() || file.name;
        const folderParts = parts.length > 1 ? parts.slice(1) : [];
        const folderPath = folderParts.length > 0
          ? folderParts.map((p) => p.replace(/\s+[a-f0-9]{32}$/i, '')).join('/')
          : null;
        entries.push(parseNotionMarkdownFile(text, filename, folderPath));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to parse ${file.name}: ${msg}`);
    }
  }

  return { entries, summary: { errors, warnings } };
}

// --- Lightweight ZIP extractor (no dependencies) ---

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * Extract entries from a ZIP file using minimal parsing.
 * Handles stored and deflated entries using DecompressionStream where available.
 */
async function extractZipEntries(buffer: ArrayBuffer): Promise<ZipEntry[]> {
  const view = new DataView(buffer);
  const entries: ZipEntry[] = [];
  let offset = 0;
  const bytes = new Uint8Array(buffer);

  while (offset < buffer.byteLength - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break; // Local file header signature

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    // uncompressedSize at offset+22 not needed for extraction
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);

    const nameBytes = bytes.slice(offset + 30, offset + 30 + nameLength);
    const name = new TextDecoder().decode(nameBytes);

    const dataStart = offset + 30 + nameLength + extraLength;
    const rawData = bytes.slice(dataStart, dataStart + compressedSize);

    // Skip directories
    if (!name.endsWith('/') && compressedSize > 0) {
      try {
        let data: Uint8Array;
        if (compressionMethod === 0) {
          // Stored (no compression)
          data = rawData;
        } else if (compressionMethod === 8) {
          // Deflated - use DecompressionStream
          data = await inflateData(rawData);
        } else {
          // Unsupported compression, skip
          offset = dataStart + compressedSize;
          continue;
        }
        entries.push({ name, data });
      } catch {
        // If decompression fails, skip this entry
        log.warn('Failed to decompress ZIP entry', { name });
      }
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

/**
 * Inflate deflated data using DecompressionStream (raw deflate)
 */
async function inflateData(compressed: Uint8Array): Promise<Uint8Array> {
  // DecompressionStream expects raw deflate data for 'deflate-raw'
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();

  // Write compressed data (cast to satisfy strict ArrayBuffer types)
  writer.write(compressed as unknown as BufferSource).catch(() => {});
  writer.close().catch(() => {});

  // Read decompressed data
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.byteLength;
  }

  // Merge chunks
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.byteLength;
  }

  return result;
}
