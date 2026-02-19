/**
 * Backlinks Utility
 * Handles parsing and managing wiki-style links between notes
 * Uses [[Note Title]] syntax similar to Obsidian/Roam
 */

import type { Note } from '../types/notes';

/**
 * Pattern to match wiki-style links: [[Note Title]]
 */
const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * Extract all wiki-style links from text content
 */
export function extractWikiLinks(content: string): string[] {
  const links: string[] = [];
  let match;
  const pattern = new RegExp(LINK_PATTERN.source, 'g');

  while ((match = pattern.exec(content)) !== null) {
    const linkTitle = match[1].trim();
    if (linkTitle && !links.includes(linkTitle)) {
      links.push(linkTitle);
    }
  }

  return links;
}

/**
 * Resolve link titles to note IDs
 */
export function resolveLinksToIds(
  linkTitles: string[],
  allNotes: Record<string, Note>
): string[] {
  const noteIds: string[] = [];
  const notesArray = Object.values(allNotes);

  linkTitles.forEach((title) => {
    // Try exact title match first
    let foundNote = notesArray.find(
      (note) => note.title.toLowerCase() === title.toLowerCase()
    );

    // If not found, try partial match
    if (!foundNote) {
      foundNote = notesArray.find(
        (note) => note.title.toLowerCase().startsWith(title.toLowerCase())
      );
    }

    if (foundNote && !noteIds.includes(foundNote.id)) {
      noteIds.push(foundNote.id);
    }
  });

  return noteIds;
}

/**
 * Get all notes that link TO the given note (backlinks)
 */
export function getBacklinks(
  noteId: string,
  noteTitle: string,
  allNotes: Record<string, Note>
): Note[] {
  const backlinks: Note[] = [];
  const titleLower = noteTitle.toLowerCase();

  Object.values(allNotes).forEach((note) => {
    if (note.id === noteId) return;

    // Check linkedNotes array
    if (note.linkedNotes?.includes(noteId)) {
      backlinks.push(note);
      return;
    }

    // Fallback: check content for link pattern
    const links = extractWikiLinks(note.contentText);
    if (links.some((link) => link.toLowerCase() === titleLower)) {
      backlinks.push(note);
    }
  });

  return backlinks;
}

/**
 * Update linked notes when content changes
 */
export function updateLinkedNotes(
  content: string,
  allNotes: Record<string, Note>
): string[] {
  const linkTitles = extractWikiLinks(content);
  return resolveLinksToIds(linkTitles, allNotes);
}

/**
 * Create a wiki link string
 */
export function createWikiLink(title: string): string {
  return `[[${title}]]`;
}

/**
 * Check if text contains wiki links
 */
export function hasWikiLinks(content: string): boolean {
  const pattern = new RegExp(LINK_PATTERN.source);
  return pattern.test(content);
}

/**
 * P1: Find unlinked mentions of a note title in other notes
 * Returns mentions with context snippets for display
 */
export interface UnlinkedMention {
  noteId: string;
  noteTitle: string;
  context: string; // Text snippet with mention highlighted
  position: number; // Character position in content
}

export function findUnlinkedMentions(
  targetNoteId: string,
  targetNoteTitle: string,
  allNotes: Record<string, Note>
): UnlinkedMention[] {
  const mentions: UnlinkedMention[] = [];

  // Skip if title is too short (avoid false positives)
  if (targetNoteTitle.length < 3) return mentions;

  const notesArray = Object.values(allNotes);

  // Create regex for word-boundary matching (avoid partial matches)
  // Escape special regex characters in title
  const escapedTitle = targetNoteTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titlePattern = new RegExp(`\\b${escapedTitle}\\b`, 'gi');

  notesArray.forEach((note) => {
    // Skip the target note itself
    if (note.id === targetNoteId) return;

    // Skip notes that already have links to target
    if (note.linkedNotes?.includes(targetNoteId)) return;

    const content = note.contentText;

    // Find all matches
    let match;
    while ((match = titlePattern.exec(content)) !== null) {
      const position = match.index;
      const matchText = match[0];

      // Check if this match is inside [[brackets]] (already linked)
      const beforeMatch = content.substring(Math.max(0, position - 2), position);
      const afterMatch = content.substring(position + matchText.length, position + matchText.length + 2);

      // Skip if surrounded by [[ ]]
      if (beforeMatch === '[[' && afterMatch === ']]') continue;

      // Extract context (50 chars before/after)
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(content.length, position + matchText.length + 50);
      let context = content.substring(contextStart, contextEnd);

      // Add ellipsis if truncated
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < content.length) context = context + '...';

      mentions.push({
        noteId: note.id,
        noteTitle: note.title,
        context,
        position,
      });
    }
  });

  // Limit to 20 mentions (performance)
  return mentions.slice(0, 20);
}

/**
 * P1: Find broken wiki links in a note
 * Returns wiki link titles that don't resolve to existing notes
 */
export interface BrokenLink {
  title: string;
  context: string; // Text snippet showing the broken link in context
  position: number; // Character position in content
}

export function findBrokenLinks(
  noteContent: string,
  allNotes: Record<string, Note>
): BrokenLink[] {
  const brokenLinks: BrokenLink[] = [];
  const notesArray = Object.values(allNotes);

  // Extract all wiki links
  const linkTitles = extractWikiLinks(noteContent);

  linkTitles.forEach((linkTitle) => {
    // Check if note exists (exact match or partial match)
    const noteExists = notesArray.some(
      (note) =>
        note.title.toLowerCase() === linkTitle.toLowerCase() ||
        note.title.toLowerCase().startsWith(linkTitle.toLowerCase())
    );

    if (!noteExists) {
      // Find first occurrence of this broken link for context
      const linkPattern = new RegExp(`\\[\\[${linkTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`);
      const match = noteContent.match(linkPattern);

      if (match) {
        const position = noteContent.indexOf(match[0]);

        // Extract context (50 chars before/after)
        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(noteContent.length, position + match[0].length + 50);
        let context = noteContent.substring(contextStart, contextEnd);

        // Add ellipsis if truncated
        if (contextStart > 0) context = '...' + context;
        if (contextEnd < noteContent.length) context = context + '...';

        brokenLinks.push({
          title: linkTitle,
          context,
          position,
        });
      }
    }
  });

  return brokenLinks;
}
