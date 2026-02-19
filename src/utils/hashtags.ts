/**
 * Hashtag Utility
 * Handles parsing and extracting hashtags from note content
 * Supports #tag and #[[multi word tag]] syntax similar to Obsidian/Roam
 */

/**
 * Pattern to match hashtags: #tag or #[[multi word]]
 * - #(\[\[.*?\]\]) captures #[[anything inside brackets]]
 * - #([a-zA-Z][a-zA-Z0-9-]*) captures #word (must start with letter, can contain alphanumerics and hyphens)
 */
const HASHTAG_PATTERN = /#(\[\[.*?\]\]|[a-zA-Z][a-zA-Z0-9-]*)/g;

/**
 * Extract all hashtags from text content
 * Returns array of unique tag names (without # prefix)
 *
 * Examples:
 * - "This has #tag and #[[multi word]]" → ["tag", "multi word"]
 * - "#123 is not valid but #tag123 is" → ["tag123"]
 * - "##double should be #double" → ["double"]
 */
export function extractHashtags(content: string): string[] {
  const tags: string[] = [];
  let match;
  const pattern = new RegExp(HASHTAG_PATTERN.source, 'g');

  while ((match = pattern.exec(content)) !== null) {
    let tag = match[1].trim();

    // If tag is wrapped in [[brackets]], extract the content
    if (tag.startsWith('[[') && tag.endsWith(']]')) {
      tag = tag.slice(2, -2).trim();
    }

    // Remove trailing punctuation (e.g., #tag. → tag)
    tag = tag.replace(/[.,;:!?]$/, '');

    // Add if valid and not duplicate
    if (tag && isValidHashtag(tag) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

/**
 * Validate a hashtag format
 * - Must not be empty
 * - Must not be pure numbers (e.g., "123" is invalid)
 * - Must start with a letter or be a bracketed multi-word tag
 *
 * Examples:
 * - isValidHashtag("tag") → true
 * - isValidHashtag("tag123") → true
 * - isValidHashtag("multi word") → true
 * - isValidHashtag("123") → false
 * - isValidHashtag("") → false
 */
export function isValidHashtag(tag: string): boolean {
  if (!tag || tag.trim().length === 0) {
    return false;
  }

  const trimmed = tag.trim();

  // Pure numbers are invalid
  if (/^\d+$/.test(trimmed)) {
    return false;
  }

  // Single-word tags must start with a letter
  if (!trimmed.includes(' ')) {
    return /^[a-zA-Z]/.test(trimmed);
  }

  // Multi-word tags are valid if not empty
  return true;
}

/**
 * Create a hashtag string from a tag name
 * Automatically wraps multi-word tags in [[brackets]]
 */
export function createHashtag(tag: string): string {
  if (tag.includes(' ')) {
    return `#[[${tag}]]`;
  }
  return `#${tag}`;
}

/**
 * Check if text contains hashtags
 */
export function hasHashtags(content: string): boolean {
  const pattern = new RegExp(HASHTAG_PATTERN.source);
  return pattern.test(content);
}
