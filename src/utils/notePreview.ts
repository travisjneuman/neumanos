/**
 * Note Preview Utility
 *
 * Utilities for generating note previews for hover popovers:
 * - Extract preview content from notes
 * - Extract block previews with context
 * - Truncate content intelligently
 */

import type { Note, NotePreview } from '../types/notes';
import { NOTE_CONSTANTS } from '../types/notes';
import { findBlockInContent } from './blockReferences';

/**
 * Extract plain text preview from note content
 *
 * Returns first N lines of content as plain text
 * Strips markdown formatting, code blocks, etc.
 *
 * @param note - Note to extract preview from
 * @param maxLines - Maximum number of lines (default: 5)
 * @returns Plain text preview
 */
export function extractPreviewContent(note: Note, maxLines?: number): string {
  const max = maxLines ?? NOTE_CONSTANTS.PREVIEW_MAX_LINES;

  if (!note.contentText) return '';

  const lines = note.contentText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0); // Remove empty lines

  // Take first N non-empty lines
  const previewLines = lines.slice(0, max);

  return previewLines.join('\n');
}

/**
 * Extract block preview with context
 *
 * Finds block in note and returns block content + surrounding lines
 *
 * @param note - Note containing the block
 * @param blockId - Block ID to find
 * @returns Block content + context, or null if not found
 */
export function extractBlockPreview(note: Note, blockId: string): string | null {
  if (!note.contentText || !blockId) return null;

  const blockInfo = findBlockInContent(note.contentText, blockId);
  if (!blockInfo) return null;

  return blockInfo.context;
}

/**
 * Truncate preview text to maximum character length
 *
 * Adds ellipsis (...) if truncated
 * Tries to break at word boundaries
 *
 * @param text - Text to truncate
 * @param maxChars - Maximum characters (default: 300)
 * @returns Truncated text
 */
export function truncatePreview(text: string, maxChars?: number): string {
  const max = maxChars ?? NOTE_CONSTANTS.PREVIEW_MAX_CHARS;

  if (text.length <= max) return text;

  // Truncate at word boundary if possible
  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > max * 0.8) {
    // If we can break at a word boundary (within last 20%)
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Create a note preview object
 *
 * Generates a complete preview with title, content, tags, date
 * Optionally includes block-specific content
 *
 * @param note - Note to preview
 * @param blockId - Optional block ID for block-specific preview
 * @returns Complete note preview object
 */
export function createNotePreview(note: Note, blockId?: string): NotePreview {
  let content: string;
  let blockContent: string | undefined;

  if (blockId) {
    // Block-specific preview
    const blockPreview = extractBlockPreview(note, blockId);
    blockContent = blockPreview ?? undefined;
    content = blockPreview ?? extractPreviewContent(note);
  } else {
    // Regular note preview
    content = extractPreviewContent(note);
  }

  // Truncate if too long
  content = truncatePreview(content);

  return {
    noteId: note.id,
    title: note.title,
    content,
    tags: note.tags,
    updatedAt: note.updatedAt,
    blockContent,
  };
}

/**
 * LRU Cache for note previews
 *
 * Caches recent previews to avoid re-computation
 * Evicts least recently used when cache is full
 */
export class PreviewCache {
  private cache: Map<string, NotePreview>;
  private maxSize: number;

  constructor(maxSize?: number) {
    this.cache = new Map();
    this.maxSize = maxSize ?? NOTE_CONSTANTS.PREVIEW_CACHE_SIZE;
  }

  /**
   * Get cached preview
   *
   * @param key - Cache key (noteId or noteId#blockId)
   * @returns Cached preview or null
   */
  get(key: string): NotePreview | null {
    const preview = this.cache.get(key);
    if (!preview) return null;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, preview);

    return preview;
  }

  /**
   * Set cached preview
   *
   * @param key - Cache key
   * @param preview - Preview to cache
   */
  set(key: string, preview: NotePreview): void {
    // If key exists, delete it first (will re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, preview);

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      // First key is oldest (LRU)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clear all cached previews
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Create cache key for note preview
   */
  static createKey(noteId: string, blockId?: string): string {
    return blockId ? `${noteId}#${blockId}` : noteId;
  }
}
