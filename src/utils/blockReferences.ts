/**
 * Block References Utility
 *
 * Utilities for working with block-level references in notes:
 * - Parse block references ([[Title#block-id]])
 * - Generate block IDs from headings
 * - Extract manual block IDs (^block-id)
 * - Find blocks in note content
 */

import type { BlockReference } from '../types/notes';

/**
 * Slugify text to create a valid block ID
 *
 * Rules:
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters (except hyphens)
 * - Collapse multiple hyphens
 * - Trim leading/trailing hyphens
 *
 * @example
 * slugify('Getting Started') // 'getting-started'
 * slugify('API & Configuration') // 'api-configuration'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens and spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

/**
 * Parse a block reference from a wiki link title
 *
 * Splits [[Title#block-id]] into noteTitle and blockId
 * If no # present, returns just noteTitle with undefined blockId
 *
 * @example
 * parseBlockReference('My Note#getting-started')
 * // { noteTitle: 'My Note', blockId: 'getting-started' }
 *
 * parseBlockReference('My Note')
 * // { noteTitle: 'My Note', blockId: undefined }
 */
export function parseBlockReference(linkTitle: string): BlockReference {
  const hashIndex = linkTitle.indexOf('#');

  if (hashIndex === -1) {
    return {
      noteTitle: linkTitle.trim(),
      blockId: undefined,
    };
  }

  return {
    noteTitle: linkTitle.slice(0, hashIndex).trim(),
    blockId: linkTitle.slice(hashIndex + 1).trim(),
  };
}

/**
 * Extract manual block ID from text (^block-id syntax)
 *
 * Looks for ^block-id at the end of a paragraph or list item
 * Block ID must be alphanumeric with hyphens/underscores
 *
 * @example
 * extractBlockId('This is important. ^key-point')
 * // 'key-point'
 *
 * extractBlockId('No block ID here')
 * // null
 */
export function extractBlockId(text: string): string | null {
  // Match ^block-id at end of line (word chars, hyphens, underscores only)
  const match = text.match(/\^([\w-]+)\s*$/);
  return match ? match[1] : null;
}

/**
 * Remove manual block ID marker from text
 *
 * @example
 * removeBlockIdMarker('This is text. ^block-id')
 * // 'This is text.'
 */
export function removeBlockIdMarker(text: string): string {
  return text.replace(/\s*\^[\w-]+\s*$/, '').trim();
}

/**
 * Find a block in note content by block ID
 *
 * Searches for:
 * 1. Manual block IDs (^block-id)
 * 2. Heading slugs (#heading-text → heading-text)
 *
 * Returns block content and surrounding context (1 line before/after)
 *
 * @param content - Plain text content of note
 * @param blockId - Block ID to find
 * @returns Block content + context, or null if not found
 */
export function findBlockInContent(
  content: string,
  blockId: string
): { content: string; context: string } | null {
  if (!content || !blockId) return null;

  const lines = content.split('\n');
  const blockIdLower = blockId.toLowerCase();

  // Search for manual block ID (^block-id)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const manualId = extractBlockId(line);

    if (manualId && manualId.toLowerCase() === blockIdLower) {
      // Found manual block ID
      const blockContent = removeBlockIdMarker(line);
      const context = getContext(lines, i);
      return { content: blockContent, context };
    }
  }

  // Search for heading slug
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a heading (starts with #)
    if (line.trim().startsWith('#')) {
      // Extract heading text (remove # symbols)
      const headingText = line.replace(/^#+\s*/, '').trim();
      const headingSlug = slugify(headingText);

      if (headingSlug === blockIdLower) {
        // Found heading with matching slug
        const context = getContext(lines, i);
        return { content: headingText, context };
      }
    }
  }

  return null;
}

/**
 * Get context lines around a target line
 *
 * Returns 1 line before and 1 line after (if available)
 */
function getContext(lines: string[], targetIndex: number): string {
  const contextLines: string[] = [];

  // Add previous line
  if (targetIndex > 0) {
    contextLines.push(lines[targetIndex - 1]);
  }

  // Add target line
  contextLines.push(lines[targetIndex]);

  // Add next line
  if (targetIndex < lines.length - 1) {
    contextLines.push(lines[targetIndex + 1]);
  }

  return contextLines.join('\n');
}

/**
 * Generate block IDs for all headings in content
 *
 * Returns a map of heading line index → block ID
 *
 * @param content - Plain text content
 * @returns Map of line index to block ID
 */
export function generateBlockIds(content: string): Map<number, string> {
  const blockIds = new Map<number, string>();

  if (!content) return blockIds;

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a heading
    if (line.trim().startsWith('#')) {
      const headingText = line.replace(/^#+\s*/, '').trim();
      const blockId = slugify(headingText);

      if (blockId) {
        blockIds.set(i, blockId);
      }
    }
  }

  return blockIds;
}

/**
 * Extract all block references from content
 *
 * Finds all [[Title#block]] patterns and returns array of BlockReference objects
 *
 * @param content - Plain text or Lexical JSON content
 * @returns Array of block references
 */
export function extractBlockReferences(content: string): BlockReference[] {
  if (!content) return [];

  const blockRefs: BlockReference[] = [];
  const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = wikiLinkPattern.exec(content)) !== null) {
    const linkTitle = match[1].trim();
    const blockRef = parseBlockReference(linkTitle);

    // Only include if it has a block ID
    if (blockRef.blockId) {
      blockRefs.push(blockRef);
    }
  }

  return blockRefs;
}

/**
 * Create a block reference string
 *
 * @example
 * createBlockReference('My Note', 'section-1')
 * // '[[My Note#section-1]]'
 */
export function createBlockReference(noteTitle: string, blockId: string): string {
  return `[[${noteTitle}#${blockId}]]`;
}

/**
 * Check if a link title contains a block reference
 */
export function hasBlockReference(linkTitle: string): boolean {
  return linkTitle.includes('#');
}

/**
 * Validate block ID format
 *
 * Block IDs must:
 * - Be non-empty
 * - Contain only alphanumeric chars, hyphens, underscores
 * - Not start or end with hyphen
 */
export function isValidBlockId(blockId: string): boolean {
  if (!blockId) return false;

  // Must match: alphanumeric, hyphens, underscores
  // Cannot start/end with hyphen
  return /^[a-zA-Z0-9_][\w-]*[a-zA-Z0-9_]$/.test(blockId) || /^[a-zA-Z0-9_]$/.test(blockId);
}
