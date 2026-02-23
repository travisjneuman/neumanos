/**
 * Markdown / Obsidian Import Service
 *
 * Parses markdown files with:
 * - YAML frontmatter (title, tags, date, etc.)
 * - [[wiki-links]] conversion
 * - #tag extraction
 * - Folder structure preservation
 */

import { logger } from './logger';

const log = logger.module('MarkdownImport');

export interface ParsedMarkdownNote {
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  relativePath: string;
  folderPath: string | null;
  linkedNotes: string[];
}

export interface MarkdownImportResult {
  notes: ParsedMarkdownNote[];
  totalFiles: number;
  skippedFiles: number;
  errors: string[];
  warnings: string[];
}

export interface MarkdownImportProgress {
  current: number;
  total: number;
  currentFile: string;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  metadata: Record<string, unknown>;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, body: content };
  }

  const yamlText = match[1];
  const body = content.slice(match[0].length);
  const metadata: Record<string, unknown> = {};

  // Simple YAML parser for common frontmatter fields
  for (const line of yamlText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    let value: unknown = trimmed.slice(colonIndex + 1).trim();

    // Handle arrays (e.g., tags: [a, b])
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    // Handle quoted strings
    else if (typeof value === 'string' && /^["'].*["']$/.test(value)) {
      value = value.slice(1, -1);
    }
    // Handle booleans
    else if (value === 'true') value = true;
    else if (value === 'false') value = false;

    metadata[key] = value;
  }

  // Handle YAML list items (- value) for arrays
  const listRegex = /^(\w+):\s*\n((?:\s+-\s+.+\n?)+)/gm;
  let listMatch: RegExpExecArray | null;
  while ((listMatch = listRegex.exec(yamlText)) !== null) {
    const key = listMatch[1];
    const items = listMatch[2]
      .split('\n')
      .map((l) => l.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean)
      .map((s) => s.replace(/^["']|["']$/g, ''));
    metadata[key] = items;
  }

  return { metadata, body };
}

/**
 * Extract [[wiki-links]] from markdown content
 */
function extractWikiLinksFromContent(content: string): string[] {
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push(match[1].trim());
  }

  return [...new Set(links)];
}

/**
 * Extract #tags from markdown content (not inside code blocks)
 */
function extractInlineTags(content: string): string[] {
  // Remove code blocks first
  const withoutCode = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');

  const tagRegex = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(withoutCode)) !== null) {
    // Skip markdown headings (## Heading)
    if (match[0].trimStart().startsWith('##')) continue;
    tags.push(match[1]);
  }

  return [...new Set(tags)];
}

/**
 * Parse a single markdown file
 */
function parseMarkdownFile(
  content: string,
  filename: string,
  relativePath: string
): ParsedMarkdownNote {
  const { metadata, body } = parseFrontmatter(content);

  // Extract title: frontmatter title > first H1 > filename
  let title = '';
  if (typeof metadata.title === 'string' && metadata.title) {
    title = metadata.title;
  } else {
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
    } else {
      title = filename.replace(/\.md$/i, '');
    }
  }

  // Extract tags from frontmatter and inline
  const frontmatterTags = Array.isArray(metadata.tags)
    ? (metadata.tags as string[])
    : typeof metadata.tags === 'string'
    ? [metadata.tags]
    : [];
  const inlineTags = extractInlineTags(body);
  const allTags = [...new Set([...frontmatterTags, ...inlineTags])];

  // Extract wiki links
  const linkedNotes = extractWikiLinksFromContent(body);

  // Parse dates
  const now = new Date();
  let createdAt = now;
  let updatedAt = now;

  if (metadata.created || metadata.date || metadata.createdAt) {
    const dateVal = metadata.created || metadata.date || metadata.createdAt;
    const parsed = new Date(dateVal as string);
    if (!isNaN(parsed.getTime())) createdAt = parsed;
  }

  if (metadata.updated || metadata.modified || metadata.updatedAt) {
    const dateVal = metadata.updated || metadata.modified || metadata.updatedAt;
    const parsed = new Date(dateVal as string);
    if (!isNaN(parsed.getTime())) updatedAt = parsed;
  }

  // Derive folder path from relative path
  const pathParts = relativePath.split('/');
  const folderPath = pathParts.length > 1
    ? pathParts.slice(0, -1).join('/')
    : null;

  return {
    title,
    content: body.trim(),
    tags: allTags,
    createdAt,
    updatedAt,
    relativePath,
    folderPath,
    linkedNotes,
  };
}

/**
 * Read files from a FileList (from directory input)
 */
export async function importMarkdownFiles(
  files: FileList,
  onProgress?: (progress: MarkdownImportProgress) => void
): Promise<MarkdownImportResult> {
  const notes: ParsedMarkdownNote[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let skippedFiles = 0;

  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    onProgress?.({
      current: i + 1,
      total: totalFiles,
      currentFile: file.name,
    });

    // Only process .md files
    if (!file.name.toLowerCase().endsWith('.md')) {
      skippedFiles++;
      continue;
    }

    // Skip hidden files and common non-note files
    const relativePath = file.webkitRelativePath || file.name;
    if (
      relativePath.includes('/.') ||
      relativePath.includes('\\.') ||
      file.name.startsWith('.')
    ) {
      skippedFiles++;
      continue;
    }

    try {
      const content = await file.text();

      // Skip empty files
      if (!content.trim()) {
        warnings.push(`Skipped empty file: ${relativePath}`);
        skippedFiles++;
        continue;
      }

      const parsed = parseMarkdownFile(content, file.name, relativePath);
      notes.push(parsed);
    } catch (error) {
      const msg = `Failed to parse ${relativePath}: ${error}`;
      errors.push(msg);
      log.error(msg);
    }
  }

  log.info('Markdown import complete', {
    total: totalFiles,
    imported: notes.length,
    skipped: skippedFiles,
    errors: errors.length,
  });

  return {
    notes,
    totalFiles,
    skippedFiles,
    errors,
    warnings,
  };
}

/**
 * Collect unique folder paths from parsed notes
 * Returns a flat list of all folder paths (including intermediate ones)
 */
export function collectFolderPaths(notes: ParsedMarkdownNote[]): string[] {
  const folderSet = new Set<string>();

  notes.forEach((note) => {
    if (note.folderPath) {
      // Add all intermediate paths too (e.g., "a/b/c" -> "a", "a/b", "a/b/c")
      const parts = note.folderPath.split('/');
      for (let i = 1; i <= parts.length; i++) {
        folderSet.add(parts.slice(0, i).join('/'));
      }
    }
  });

  // Sort so parent folders come first
  return Array.from(folderSet).sort();
}

/**
 * Remap [[wiki-links]] in note content to internal IDs after import
 * Creates a title -> noteId mapping and replaces link titles with IDs
 */
export function remapWikiLinks(
  notes: ParsedMarkdownNote[],
  titleToIdMap: Map<string, string>
): Map<string, string[]> {
  const linkedNotesMap = new Map<string, string[]>();

  notes.forEach((note) => {
    const linkedNoteIds: string[] = [];

    note.linkedNotes.forEach((linkTitle) => {
      // Try exact match
      let targetId = titleToIdMap.get(linkTitle.toLowerCase());

      // Try without file extension
      if (!targetId) {
        const withoutExt = linkTitle.replace(/\.md$/i, '');
        targetId = titleToIdMap.get(withoutExt.toLowerCase());
      }

      // Try just the filename part (for paths like "folder/note")
      if (!targetId) {
        const parts = linkTitle.split('/');
        const filename = parts[parts.length - 1];
        targetId = titleToIdMap.get(filename.toLowerCase());
      }

      if (targetId) {
        linkedNoteIds.push(targetId);
      }
    });

    if (linkedNoteIds.length > 0) {
      linkedNotesMap.set(note.title, [...new Set(linkedNoteIds)]);
    }
  });

  return linkedNotesMap;
}
