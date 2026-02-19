/**
 * Tag Hierarchy Utilities
 * Parse flat tag strings into hierarchical structure using `/` separator
 */

export interface TagNode {
  name: string;        // Full tag path (e.g., "projects/work/client-a")
  label: string;       // Display name (e.g., "client-a")
  level: number;       // Depth in hierarchy (0 = root)
  parent: string | null; // Parent tag path
  children: TagNode[]; // Child tags
  noteCount: number;   // Number of notes with this tag
}

/**
 * Build hierarchical tag tree from flat tag list
 */
export function buildTagTree(tags: string[], tagCounts?: Record<string, number>): TagNode[] {
  const tagMap = new Map<string, TagNode>();

  // Create nodes for all tags
  tags.forEach(tag => {
    const parts = tag.split('/');
    const level = parts.length - 1;
    const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
    const label = parts[parts.length - 1];

    tagMap.set(tag, {
      name: tag,
      label,
      level,
      parent,
      children: [],
      noteCount: tagCounts?.[tag] || 0,
    });
  });

  // Build tree structure
  const roots: TagNode[] = [];
  tagMap.forEach(node => {
    if (node.parent) {
      const parentNode = tagMap.get(node.parent);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // Parent doesn't exist as a tag, treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort children recursively
  const sortNodes = (nodes: TagNode[]): TagNode[] => {
    return nodes.sort((a, b) => a.label.localeCompare(b.label)).map(node => ({
      ...node,
      children: sortNodes(node.children),
    }));
  };

  return sortNodes(roots);
}

/**
 * Get all descendant tags (including self)
 */
export function getDescendantTags(tag: string, allTags: string[]): string[] {
  const prefix = tag + '/';
  const descendants = allTags.filter(t => t.startsWith(prefix));
  return [tag, ...descendants];
}

/**
 * Check if tag matches filter (including children)
 */
export function tagMatchesFilter(noteTag: string, filterTag: string): boolean {
  // Exact match
  if (noteTag === filterTag) return true;

  // Check if noteTag is child of filterTag
  return noteTag.startsWith(filterTag + '/');
}

/**
 * Parse tag into hierarchical parts
 */
export function parseTagParts(tag: string): string[] {
  return tag.split('/').filter(part => part.trim().length > 0);
}

/**
 * Get tag depth (0 = root, 1 = first level child, etc.)
 */
export function getTagDepth(tag: string): number {
  return parseTagParts(tag).length - 1;
}

/**
 * Get parent tag path
 */
export function getParentTag(tag: string): string | null {
  const parts = parseTagParts(tag);
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('/');
}

/**
 * Normalize tag by removing leading/trailing slashes and spaces
 */
export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .split('/')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .join('/');
}
