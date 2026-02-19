/**
 * Tag Suggestions Utility
 *
 * Generates smart tag suggestions based on:
 * - Content analysis (keyword extraction)
 * - Frequency (most-used tags)
 * - Co-occurrence (tags often used together)
 * - Hierarchical (child tags when parent selected)
 * - Recent tags (recently used)
 */

import type { Note, TagSuggestion } from '../types/notes';

/**
 * Extract keywords from content for content-based suggestions
 * Simple algorithm: find common words (>3 chars) that appear in tags
 */
function extractKeywords(content: string, allTags: string[]): string[] {
  const normalized = content.toLowerCase();
  const keywords: string[] = [];

  // Check if any tag (or part of hierarchical tag) appears in content
  allTags.forEach(tag => {
    const tagParts = tag.toLowerCase().split('/');
    tagParts.forEach(part => {
      if (part.length > 2 && normalized.includes(part)) {
        keywords.push(tag);
      }
    });
  });

  return keywords;
}

/**
 * Get most frequently used tags across all notes
 */
function getMostFrequentTags(notes: Note[], limit: number): string[] {
  const tagCounts = new Map<string, number>();

  notes.forEach(note => {
    if (!note.isArchived) {
      note.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    }
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Find tags that are frequently used together with existing tags
 */
function getCoOccurringTags(existingTags: string[], notes: Note[]): Map<string, number> {
  const coOccurrence = new Map<string, number>();

  notes.forEach(note => {
    if (note.isArchived) return;

    // Check if note has any of the existing tags
    const hasExistingTag = existingTags.some(tag => note.tags.includes(tag));
    if (!hasExistingTag) return;

    // Count other tags in this note
    note.tags.forEach(tag => {
      if (!existingTags.includes(tag)) {
        coOccurrence.set(tag, (coOccurrence.get(tag) || 0) + 1);
      }
    });
  });

  return coOccurrence;
}

/**
 * Get child tags when parent tag is selected
 */
function getHierarchicalSuggestions(existingTags: string[], allTags: string[]): string[] {
  const suggestions: string[] = [];

  existingTags.forEach(parentTag => {
    const prefix = parentTag + '/';
    allTags.forEach(tag => {
      if (tag.startsWith(prefix) && !existingTags.includes(tag)) {
        suggestions.push(tag);
      }
    });
  });

  return suggestions;
}

/**
 * Get recently used tags from latest notes
 */
function getRecentTags(notes: Note[], limit: number, excludeTags: string[]): string[] {
  const recentTags: string[] = [];
  const tagSet = new Set<string>(excludeTags);

  // Sort notes by updatedAt descending
  const sortedNotes = [...notes]
    .filter(note => !note.isArchived)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  // Collect tags from most recent notes
  for (const note of sortedNotes) {
    for (const tag of note.tags) {
      if (!tagSet.has(tag)) {
        tagSet.add(tag);
        recentTags.push(tag);
        if (recentTags.length >= limit) {
          return recentTags;
        }
      }
    }
  }

  return recentTags;
}

/**
 * Generate tag suggestions for a note
 *
 * @param content - Note content (plain text)
 * @param existingTags - Tags already applied to this note
 * @param allNotes - All notes in the system
 * @param maxSuggestions - Maximum number of suggestions to return
 * @returns Sorted array of tag suggestions with scores
 */
export function generateTagSuggestions(
  content: string,
  existingTags: string[],
  allNotes: Note[],
  maxSuggestions = 5
): TagSuggestion[] {
  const suggestions = new Map<string, TagSuggestion>();
  const allTags = Array.from(new Set(allNotes.flatMap(note => note.tags)));

  // 1. Content-based suggestions (highest weight)
  const contentKeywords = extractKeywords(content, allTags);
  contentKeywords.forEach(tag => {
    if (!existingTags.includes(tag)) {
      suggestions.set(tag, {
        tag,
        score: 10,
        reason: 'content',
      });
    }
  });

  // 2. Hierarchical suggestions (high weight if parent selected)
  const hierarchicalTags = getHierarchicalSuggestions(existingTags, allTags);
  hierarchicalTags.forEach(tag => {
    const existing = suggestions.get(tag);
    if (existing) {
      existing.score += 8;
    } else {
      suggestions.set(tag, {
        tag,
        score: 8,
        reason: 'hierarchical',
      });
    }
  });

  // 3. Co-occurrence suggestions (medium weight)
  if (existingTags.length > 0) {
    const coOccurring = getCoOccurringTags(existingTags, allNotes);
    coOccurring.forEach((count, tag) => {
      const existing = suggestions.get(tag);
      const score = Math.min(count, 6); // Cap at 6 points
      if (existing) {
        existing.score += score;
      } else {
        suggestions.set(tag, {
          tag,
          score,
          reason: 'co-occurrence',
        });
      }
    });
  }

  // 4. Frequency suggestions (low weight)
  const frequentTags = getMostFrequentTags(allNotes, 10);
  frequentTags.forEach((tag, index) => {
    if (!existingTags.includes(tag)) {
      const existing = suggestions.get(tag);
      const score = Math.max(1, 5 - index); // 5 points for most frequent, decreasing
      if (existing) {
        existing.score += score;
      } else {
        suggestions.set(tag, {
          tag,
          score,
          reason: 'frequency',
        });
      }
    }
  });

  // 5. Recent tags (lowest weight, fallback)
  const recentTags = getRecentTags(allNotes, 5, existingTags);
  recentTags.forEach(tag => {
    const existing = suggestions.get(tag);
    if (existing) {
      existing.score += 2;
    } else {
      suggestions.set(tag, {
        tag,
        score: 2,
        reason: 'recent',
      });
    }
  });

  // Sort by score descending and return top N
  return Array.from(suggestions.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
}

/**
 * Get user-friendly reason label for suggestion
 */
export function getSuggestionReasonLabel(reason: TagSuggestion['reason']): string {
  switch (reason) {
    case 'content':
      return 'Matches content';
    case 'frequency':
      return 'Frequently used';
    case 'co-occurrence':
      return 'Often used together';
    case 'hierarchical':
      return 'Related tag';
    case 'recent':
      return 'Recently used';
    default:
      return 'Suggested';
  }
}
