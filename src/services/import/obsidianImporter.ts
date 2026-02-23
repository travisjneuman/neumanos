/**
 * Obsidian Importer
 *
 * Imports an Obsidian vault (folder of .md files) into NeumanOS.
 * - Parses YAML frontmatter for metadata (tags, aliases, dates)
 * - Converts [[wiki-links]] to NeumanOS format
 * - Preserves folder structure
 * - Handles attachments folder (skips large files)
 */

import { logger } from '../logger';

const log = logger.module('ObsidianImporter');

export interface ObsidianImportSummary {
  notesCreated: number;
  foldersCreated: number;
  wikiLinksFound: number;
  attachmentsSkipped: number;
  errors: string[];
  warnings: string[];
}

export interface ParsedObsidianNote {
  title: string;
  content: string;
  tags: string[];
  aliases: string[];
  folderPath: string | null;
  linkedNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ObsidianImportProgress {
  current: number;
  total: number;
  currentFile: string;
  phase: 'scanning' | 'parsing' | 'creating';
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  metadata: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) return { metadata: {}, body: content };

  const yamlText = match[1];
  const body = content.slice(match[0].length);
  const metadata: Record<string, unknown> = {};

  // Simple YAML parser for frontmatter fields
  const lines = yamlText.split('\n');
  let currentKey = '';
  let listValues: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      if (inList && currentKey) {
        metadata[currentKey] = listValues;
        inList = false;
        currentKey = '';
        listValues = [];
      }
      continue;
    }

    // Check for list item
    if (trimmed.startsWith('- ') && inList) {
      listValues.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ''));
      continue;
    }

    // If we were in a list, save it
    if (inList && currentKey) {
      metadata[currentKey] = listValues;
      inList = false;
      listValues = [];
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value: unknown = trimmed.slice(colonIdx + 1).trim();

    if (value === '' || value === undefined) {
      // Could be start of a list
      currentKey = key;
      inList = true;
      listValues = [];
      continue;
    }

    // Handle inline arrays [a, b, c]
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
    currentKey = key;
  }

  // Handle trailing list
  if (inList && currentKey) {
    metadata[currentKey] = listValues;
  }

  return { metadata, body };
}

/**
 * Extract [[wiki-links]] and [[wiki-links|display text]] from content
 */
function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}

/**
 * Extract #tags from content (not in code blocks or headings)
 */
function extractInlineTags(content: string): string[] {
  const withoutCode = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');

  const regex = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_/-]*)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(withoutCode)) !== null) {
    if (match[0].trimStart().startsWith('##')) continue;
    tags.push(match[1]);
  }
  return [...new Set(tags)];
}

/**
 * Convert Obsidian-specific syntax to standard markdown
 */
function convertObsidianSyntax(content: string): string {
  let result = content;

  // Convert ![[embed]] to [[embed]] (we don't support embeds as inline)
  result = result.replace(/!\[\[([^\]]+)\]\]/g, '[[$1]]');

  // Convert Obsidian callouts: > [!note] text -> > **Note:** text
  result = result.replace(
    /^>\s*\[!(note|tip|info|warning|danger|bug|example|quote|abstract|todo|success|failure|question)\]\s*/gim,
    (_, type: string) => `> **${type.charAt(0).toUpperCase() + type.slice(1)}:** `
  );

  // Remove Obsidian comments (double percent signs around text)
  result = result.replace(/%%([^%]+)%%/g, '');

  // Convert ==highlights== to **bold** (closest equivalent)
  result = result.replace(/==([^=]+)==/g, '**$1**');

  return result;
}

/**
 * Check if a file path is an attachment (image, pdf, etc.)
 */
function isAttachment(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const attachmentExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'pdf', 'mp3', 'mp4', 'wav', 'ogg'];
  return attachmentExts.includes(ext);
}

/**
 * Import Obsidian vault from a FileList (via folder picker / webkitdirectory)
 */
export async function importObsidianVault(
  files: FileList,
  onProgress?: (progress: ObsidianImportProgress) => void
): Promise<{ notes: ParsedObsidianNote[]; summary: Omit<ObsidianImportSummary, 'notesCreated' | 'foldersCreated'> }> {
  const notes: ParsedObsidianNote[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let attachmentsSkipped = 0;
  let wikiLinksFound = 0;

  // Filter to .md files, skip hidden files/folders and .obsidian config
  const mdFiles: File[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

    // Skip hidden files/folders and .obsidian
    if (path.split('/').some((p) => p.startsWith('.') || p === '.obsidian')) {
      continue;
    }

    if (isAttachment(path)) {
      attachmentsSkipped++;
      continue;
    }

    if (file.name.endsWith('.md')) {
      mdFiles.push(file);
    }
  }

  if (mdFiles.length === 0) {
    warnings.push('No .md files found in the selected folder.');
    return { notes, summary: { errors, warnings, wikiLinksFound: 0, attachmentsSkipped } };
  }

  const total = mdFiles.length;

  for (let i = 0; i < mdFiles.length; i++) {
    const file = mdFiles[i];
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

    onProgress?.({
      current: i + 1,
      total,
      currentFile: relativePath,
      phase: 'parsing',
    });

    try {
      const content = await file.text();
      const { metadata, body } = parseFrontmatter(content);

      // Convert Obsidian syntax
      const converted = convertObsidianSyntax(body);

      // Extract title: frontmatter title > first H1 > filename
      let title = '';
      if (typeof metadata.title === 'string' && metadata.title) {
        title = metadata.title;
      } else {
        const h1Match = converted.match(/^#\s+(.+)$/m);
        if (h1Match) {
          title = h1Match[1].trim();
        } else {
          title = file.name.replace(/\.md$/i, '');
        }
      }

      // Extract tags from frontmatter + inline
      const fmTags = Array.isArray(metadata.tags)
        ? (metadata.tags as string[])
        : typeof metadata.tags === 'string'
          ? [metadata.tags]
          : [];
      const inlineTags = extractInlineTags(converted);
      const allTags = [...new Set([...fmTags, ...inlineTags])];

      // Extract aliases
      const aliases = Array.isArray(metadata.aliases)
        ? (metadata.aliases as string[])
        : typeof metadata.aliases === 'string'
          ? [metadata.aliases]
          : [];

      // Extract wiki links
      const linkedNotes = extractWikiLinks(converted);
      wikiLinksFound += linkedNotes.length;

      // Determine folder path
      const pathParts = relativePath.split('/');
      pathParts.pop(); // Remove filename
      // Remove root folder name (vault folder)
      const folderParts = pathParts.length > 1 ? pathParts.slice(1) : [];
      const folderPath = folderParts.length > 0 ? folderParts.join('/') : null;

      // Parse dates
      const now = new Date();
      let createdAt = now;
      let updatedAt = now;

      if (metadata.created) {
        const d = new Date(String(metadata.created));
        if (!isNaN(d.getTime())) createdAt = d;
      } else if (metadata.date) {
        const d = new Date(String(metadata.date));
        if (!isNaN(d.getTime())) createdAt = d;
      }

      if (metadata.updated || metadata.modified) {
        const d = new Date(String(metadata.updated || metadata.modified));
        if (!isNaN(d.getTime())) updatedAt = d;
      }

      notes.push({
        title,
        content: converted,
        tags: allTags,
        aliases,
        folderPath,
        linkedNotes,
        createdAt,
        updatedAt,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to parse ${relativePath}: ${msg}`);
      log.warn('Failed to parse Obsidian file', { file: relativePath, error: msg });
    }
  }

  return {
    notes,
    summary: { errors, warnings, wikiLinksFound, attachmentsSkipped },
  };
}

/**
 * Collect unique folder paths from parsed notes
 */
export function collectFolderPaths(notes: ParsedObsidianNote[]): string[] {
  const paths = new Set<string>();
  for (const note of notes) {
    if (!note.folderPath) continue;
    // Add all parent paths too
    const parts = note.folderPath.split('/');
    for (let i = 1; i <= parts.length; i++) {
      paths.add(parts.slice(0, i).join('/'));
    }
  }
  return [...paths].sort();
}

/**
 * Remap wiki-link titles to NeumanOS note IDs
 */
export function remapWikiLinks(
  notes: ParsedObsidianNote[],
  titleToIdMap: Map<string, string>
): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const note of notes) {
    if (note.linkedNotes.length === 0) continue;

    const resolvedIds: string[] = [];
    for (const link of note.linkedNotes) {
      const id = titleToIdMap.get(link.toLowerCase());
      if (id) resolvedIds.push(id);
    }

    if (resolvedIds.length > 0) {
      result.set(note.title, resolvedIds);
    }
  }

  return result;
}
