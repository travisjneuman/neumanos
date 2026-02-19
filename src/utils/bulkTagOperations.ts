/**
 * Bulk Tag Operations Utility
 *
 * Functions for bulk tag management:
 * - Add tag to multiple items
 * - Remove tag from multiple items
 * - Replace tag globally
 * - Merge multiple tags into one
 * - Delete unused tags
 */

import type { Note } from '../types/notes';

export interface BulkOperationResult {
  success: boolean;
  affectedCount: number;
  errors?: string[];
}

/**
 * Add a tag to multiple notes
 */
export function bulkAddTagToNotes(
  noteIds: string[],
  tag: string,
  notes: Record<string, Note>
): Record<string, Note> {
  const updatedNotes = { ...notes };

  noteIds.forEach(id => {
    const note = updatedNotes[id];
    if (note && !note.tags.includes(tag)) {
      updatedNotes[id] = {
        ...note,
        tags: [...note.tags, tag],
        updatedAt: new Date(),
      };
    }
  });

  return updatedNotes;
}

/**
 * Remove a tag from multiple notes
 */
export function bulkRemoveTagFromNotes(
  noteIds: string[],
  tag: string,
  notes: Record<string, Note>
): Record<string, Note> {
  const updatedNotes = { ...notes };

  noteIds.forEach(id => {
    const note = updatedNotes[id];
    if (note && note.tags.includes(tag)) {
      updatedNotes[id] = {
        ...note,
        tags: note.tags.filter(t => t !== tag),
        updatedAt: new Date(),
      };
    }
  });

  return updatedNotes;
}

/**
 * Replace all instances of one tag with another across all notes
 */
export function replaceTagGlobally(
  oldTag: string,
  newTag: string,
  notes: Record<string, Note>
): { notes: Record<string, Note>; count: number } {
  const updatedNotes = { ...notes };
  let count = 0;

  Object.entries(notes).forEach(([id, note]) => {
    if (note.tags.includes(oldTag)) {
      const newTags = note.tags.map(t => (t === oldTag ? newTag : t));
      // Remove duplicates if newTag already exists
      const uniqueTags = Array.from(new Set(newTags));

      updatedNotes[id] = {
        ...note,
        tags: uniqueTags,
        updatedAt: new Date(),
      };
      count++;
    }
  });

  return { notes: updatedNotes, count };
}

/**
 * Merge multiple tags into a single tag across all notes
 */
export function mergeTagsGlobally(
  sourceTags: string[],
  targetTag: string,
  notes: Record<string, Note>
): { notes: Record<string, Note>; count: number } {
  const updatedNotes = { ...notes };
  let count = 0;

  Object.entries(notes).forEach(([id, note]) => {
    const hasSourceTag = sourceTags.some(tag => note.tags.includes(tag));

    if (hasSourceTag) {
      // Remove all source tags and add target tag
      const filteredTags = note.tags.filter(tag => !sourceTags.includes(tag));
      const newTags = filteredTags.includes(targetTag)
        ? filteredTags
        : [...filteredTags, targetTag];

      updatedNotes[id] = {
        ...note,
        tags: newTags,
        updatedAt: new Date(),
      };
      count++;
    }
  });

  return { notes: updatedNotes, count };
}

/**
 * Get all tags that are not used by any notes
 */
export function getUnusedTags(
  allTags: string[],
  notes: Record<string, Note>
): string[] {
  const usedTags = new Set<string>();

  Object.values(notes).forEach(note => {
    if (!note.isArchived) {
      note.tags.forEach(tag => usedTags.add(tag));
    }
  });

  return allTags.filter(tag => !usedTags.has(tag));
}

/**
 * Delete all unused tags (tags with zero usage)
 * Returns list of deleted tags
 */
export function deleteUnusedTags(
  allTags: string[],
  notes: Record<string, Note>
): string[] {
  return getUnusedTags(allTags, notes);
}

/**
 * Preview the impact of a bulk operation
 */
export interface BulkOperationPreview {
  affectedNoteIds: string[];
  affectedCount: number;
  operation: 'add' | 'remove' | 'replace' | 'merge';
  details: string;
}

export function previewBulkAddTag(
  noteIds: string[],
  tag: string,
  notes: Record<string, Note>
): BulkOperationPreview {
  const affectedNoteIds = noteIds.filter(id => {
    const note = notes[id];
    return note && !note.tags.includes(tag);
  });

  return {
    affectedNoteIds,
    affectedCount: affectedNoteIds.length,
    operation: 'add',
    details: `Add "${tag}" to ${affectedNoteIds.length} note(s)`,
  };
}

export function previewBulkRemoveTag(
  noteIds: string[],
  tag: string,
  notes: Record<string, Note>
): BulkOperationPreview {
  const affectedNoteIds = noteIds.filter(id => {
    const note = notes[id];
    return note && note.tags.includes(tag);
  });

  return {
    affectedNoteIds,
    affectedCount: affectedNoteIds.length,
    operation: 'remove',
    details: `Remove "${tag}" from ${affectedNoteIds.length} note(s)`,
  };
}

export function previewReplaceTag(
  oldTag: string,
  newTag: string,
  notes: Record<string, Note>
): BulkOperationPreview {
  const affectedNoteIds = Object.entries(notes)
    .filter(([, note]) => note.tags.includes(oldTag))
    .map(([id]) => id);

  return {
    affectedNoteIds,
    affectedCount: affectedNoteIds.length,
    operation: 'replace',
    details: `Replace "${oldTag}" with "${newTag}" in ${affectedNoteIds.length} note(s)`,
  };
}

export function previewMergeTags(
  sourceTags: string[],
  targetTag: string,
  notes: Record<string, Note>
): BulkOperationPreview {
  const affectedNoteIds = Object.entries(notes)
    .filter(([, note]) => sourceTags.some(tag => note.tags.includes(tag)))
    .map(([id]) => id);

  return {
    affectedNoteIds,
    affectedCount: affectedNoteIds.length,
    operation: 'merge',
    details: `Merge [${sourceTags.join(', ')}] into "${targetTag}" in ${affectedNoteIds.length} note(s)`,
  };
}
