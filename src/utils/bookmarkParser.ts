/**
 * Bookmark Parser
 *
 * Parses Netscape Bookmark HTML format (standard for all browsers).
 * Supports Chrome, Firefox, Safari, Edge bookmark exports.
 *
 * Format example:
 * <!DOCTYPE NETSCAPE-Bookmark-file-1>
 * <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
 * <TITLE>Bookmarks</TITLE>
 * <H1>Bookmarks</H1>
 * <DL><p>
 *     <DT><H3>Folder Name</H3>
 *     <DL><p>
 *         <DT><A HREF="https://example.com" ADD_DATE="1234567890">Link Title</A>
 *     </DL><p>
 * </DL><p>
 */

import type { Link } from '../stores/useLinkLibraryStore';

export interface ParsedBookmark {
  url: string;
  title: string;
  description?: string;
  favicon?: string; // Base64 data URL from ICON attribute (Firefox/Chrome exports)
  tags: string[];
  category?: string; // Folder path as string (legacy: "Folder1 > Folder2")
  folderPath?: string[]; // Folder path as array for folder creation
  isFavorite: boolean;
  isArchived: boolean;
  addDate?: Date;
}

export interface ParseResult {
  bookmarks: ParsedBookmark[];
  folderStructure: FolderNode;
  stats: {
    total: number;
    withFolders: number;
    duplicateUrls: number;
  };
}

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  bookmarkCount: number;
}

/**
 * Internal bookmark with depth for deduplication
 */
interface BookmarkWithDepth extends ParsedBookmark {
  depth: number;
  encounterOrder: number;
}

/**
 * Parse Netscape Bookmark HTML file content
 *
 * Deduplication strategy: When duplicate URLs exist, keep the one at the
 * SHALLOWEST folder depth (closest to root). This ensures bookmarks are
 * kept in the most general/accessible location. If depths are equal,
 * keep the first encountered (original document order).
 */
export function parseNetscapeBookmarks(htmlContent: string): ParseResult {
  // Collect ALL bookmarks first (with depth info), then dedupe at the end
  const allBookmarks: BookmarkWithDepth[] = [];
  let encounterIndex = 0;

  // Root folder structure
  const folderStructure: FolderNode = {
    name: 'Bookmarks',
    path: '',
    children: [],
    bookmarkCount: 0,
  };

  // Track current folder path
  const folderStack: string[] = [];
  const folderNodeStack: FolderNode[] = [folderStructure];

  // Parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Find all DT elements (both folders and links)
  const processNode = (element: Element, depth: number = 0) => {
    for (const child of Array.from(element.children)) {
      if (child.tagName === 'DT') {
        // Check if it's a folder (has H3) or a link (has A)
        const h3 = child.querySelector(':scope > H3');
        const anchor = child.querySelector(':scope > A');

        if (h3) {
          // It's a folder
          const folderName = h3.textContent?.trim() || 'Untitled Folder';
          folderStack.push(folderName);

          const newFolder: FolderNode = {
            name: folderName,
            path: folderStack.join('/'),
            children: [],
            bookmarkCount: 0,
          };

          const parentFolder = folderNodeStack[folderNodeStack.length - 1];
          parentFolder.children.push(newFolder);
          folderNodeStack.push(newFolder);

          // Process the folder's contents (next sibling DL)
          const dl = child.querySelector(':scope > DL');
          if (dl) {
            processNode(dl, depth + 1);
          }

          folderStack.pop();
          folderNodeStack.pop();
        } else if (anchor) {
          // It's a bookmark link
          const url = anchor.getAttribute('HREF') || '';
          const title = anchor.textContent?.trim() || url;
          const addDateStr = anchor.getAttribute('ADD_DATE');
          const favicon = anchor.getAttribute('ICON') || undefined; // Base64 data URL from Firefox/Chrome

          // Skip invalid URLs
          if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            continue;
          }

          // Parse add date
          let addDate: Date | undefined;
          if (addDateStr) {
            const timestamp = parseInt(addDateStr, 10);
            if (!isNaN(timestamp)) {
              // Unix timestamp (seconds since epoch)
              addDate = new Date(timestamp * 1000);
            }
          }

          // Build category from folder path
          const category = folderStack.length > 0 ? folderStack.join(' > ') : undefined;
          const folderPath = folderStack.length > 0 ? [...folderStack] : undefined;

          const bookmark: BookmarkWithDepth = {
            url,
            title,
            favicon,
            category,
            folderPath,
            tags: [], // Can be populated later via AI
            isFavorite: false,
            isArchived: false,
            addDate,
            depth: folderStack.length, // 0 = root level, 1 = one folder deep, etc.
            encounterOrder: encounterIndex++,
          };

          allBookmarks.push(bookmark);

          // Update folder bookmark counts (will be recalculated after dedup)
          folderNodeStack.forEach((folder) => {
            folder.bookmarkCount++;
          });
        }
      } else if (child.tagName === 'DL') {
        // Process nested DL directly
        processNode(child, depth);
      }
    }
  };

  // Find the main DL element
  const mainDL = doc.querySelector('DL');
  if (mainDL) {
    processNode(mainDL);
  }

  // Deduplicate: for each URL, keep the shallowest occurrence
  // Group bookmarks by URL
  const urlToBookmarks = new Map<string, BookmarkWithDepth[]>();
  for (const bookmark of allBookmarks) {
    const existing = urlToBookmarks.get(bookmark.url) || [];
    existing.push(bookmark);
    urlToBookmarks.set(bookmark.url, existing);
  }

  // Select the best occurrence for each URL (shallowest depth, then first encountered)
  const bookmarks: ParsedBookmark[] = [];
  let duplicateCount = 0;

  for (const [, occurrences] of urlToBookmarks) {
    if (occurrences.length === 1) {
      // No duplicates, just add it
      const { depth: _d, encounterOrder: _e, ...bookmark } = occurrences[0];
      bookmarks.push(bookmark);
    } else {
      // Multiple occurrences - sort by depth (ascending), then encounter order
      occurrences.sort((a, b) => {
        if (a.depth !== b.depth) {
          return a.depth - b.depth; // Prefer shallower (smaller depth)
        }
        return a.encounterOrder - b.encounterOrder; // Tiebreaker: first encountered
      });

      // Keep the first (shallowest), count the rest as duplicates
      const { depth: _d, encounterOrder: _e, ...bookmark } = occurrences[0];
      bookmarks.push(bookmark);
      duplicateCount += occurrences.length - 1;
    }
  }

  // Sort bookmarks back to original encounter order for consistent import
  // This preserves the user's original bookmark organization
  const urlToEncounterOrder = new Map<string, number>();
  for (const bookmark of allBookmarks) {
    // For each URL, record the MINIMUM encounter order (first time we saw it)
    const existing = urlToEncounterOrder.get(bookmark.url);
    if (existing === undefined || bookmark.encounterOrder < existing) {
      urlToEncounterOrder.set(bookmark.url, bookmark.encounterOrder);
    }
  }

  bookmarks.sort((a, b) => {
    const orderA = urlToEncounterOrder.get(a.url) ?? 0;
    const orderB = urlToEncounterOrder.get(b.url) ?? 0;
    return orderA - orderB;
  });

  return {
    bookmarks,
    folderStructure,
    stats: {
      total: bookmarks.length,
      withFolders: bookmarks.filter((b) => b.category).length,
      duplicateUrls: duplicateCount,
    },
  };
}

/**
 * Convert parsed bookmarks to Link format for import
 */
export function convertToLinks(
  parsed: ParsedBookmark[]
): Omit<Link, 'id' | 'createdAt' | 'updatedAt' | 'visitCount'>[] {
  return parsed.map((bookmark, index) => ({
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description,
    favicon: bookmark.favicon, // Base64 data URL from browser export
    category: bookmark.category,
    tags: bookmark.tags,
    isFavorite: bookmark.isFavorite,
    isArchived: bookmark.isArchived,
    projectIds: [],
    sortOrder: index, // Will be recalculated by importLinks per folder
  }));
}

/**
 * Extract unique categories from parsed bookmarks
 */
export function extractCategories(bookmarks: ParsedBookmark[]): string[] {
  const categories = new Set<string>();
  bookmarks.forEach((b) => {
    if (b.category) {
      categories.add(b.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Group bookmarks by category
 */
export function groupByCategory(
  bookmarks: ParsedBookmark[]
): Record<string, ParsedBookmark[]> {
  const grouped: Record<string, ParsedBookmark[]> = {
    Uncategorized: [],
  };

  bookmarks.forEach((bookmark) => {
    const category = bookmark.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(bookmark);
  });

  return grouped;
}

/**
 * Extract all folder paths from folder structure (for creating folders in store)
 * Returns array of { name, path, parentPath } for each folder
 */
export interface FolderPathInfo {
  name: string;
  path: string[]; // Full path as array
  parentPath: string[] | null; // Parent path, or null for root folders
}

export function extractFolderPaths(folderStructure: FolderNode): FolderPathInfo[] {
  const result: FolderPathInfo[] = [];

  const traverse = (node: FolderNode, parentPath: string[] | null) => {
    // Skip the root "Bookmarks" node
    if (node.path !== '') {
      const pathParts = node.path.split('/');
      result.push({
        name: node.name,
        path: pathParts,
        parentPath: parentPath,
      });
    }

    for (const child of node.children) {
      const currentPath = node.path === '' ? [] : node.path.split('/');
      traverse(child, currentPath.length > 0 ? currentPath : null);
    }
  };

  traverse(folderStructure, null);
  return result;
}

/**
 * Validate bookmark file content
 */
export function isValidBookmarkFile(content: string): boolean {
  // Check for Netscape bookmark file signature
  return (
    content.includes('NETSCAPE-Bookmark-file') ||
    content.includes('<DL>') ||
    content.includes('<A HREF=')
  );
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
