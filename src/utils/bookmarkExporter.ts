/**
 * Bookmark Exporter
 *
 * Exports links to Netscape Bookmark HTML format (standard for all browsers).
 * Compatible with: Safari, Chrome/Chromium, Firefox/Gecko, Edge, Opera
 *
 * Supports:
 * - Hierarchical folder export (using LinkFolder tree)
 * - Legacy category-based export (fallback)
 * - Collection export
 * - Various filter options
 *
 * Output format (Netscape Bookmark HTML):
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

import type { Link, LinkCollection } from '../stores/useLinkLibraryStore';
import type { LinkFolderTreeNode } from '../stores/useLinkFoldersStore';

export interface ExportOptions {
  /** Export title (shown in browser import) */
  title?: string;
  /** Include links without folders in an "Uncategorized" folder */
  includeUncategorized?: boolean;
  /** Include archived links */
  includeArchived?: boolean;
  /** Include favorites only */
  favoritesOnly?: boolean;
  /** Preserve folder hierarchy (uses folderId, not legacy category) */
  useFolderHierarchy?: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  title: 'Exported Bookmarks',
  includeUncategorized: true,
  includeArchived: false,
  favoritesOnly: false,
  useFolderHierarchy: true,
};

/**
 * Escape HTML special characters for safe output
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convert Date to Unix timestamp (seconds since epoch)
 */
function toUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/**
 * Generate Netscape bookmark HTML header
 */
function generateHeader(title: string): string {
  const escapedTitle = escapeHtml(title);
  return [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file. -->',
    '<!-- It will be read and overwritten. -->',
    '<!-- DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    `<TITLE>${escapedTitle}</TITLE>`,
    `<H1>${escapedTitle}</H1>`,
    '',
  ].join('\n');
}

/**
 * Generate Netscape bookmark HTML for a single link
 */
function generateBookmarkEntry(link: Link, indent: string = '        '): string {
  const addDate = toUnixTimestamp(link.createdAt);
  const title = escapeHtml(link.title || link.url);
  const url = escapeHtml(link.url);

  // Optional: Include last modified date if available
  const lastModified = link.updatedAt
    ? ` LAST_MODIFIED="${toUnixTimestamp(link.updatedAt)}"`
    : '';

  return `${indent}<DT><A HREF="${url}" ADD_DATE="${addDate}"${lastModified}>${title}</A>`;
}

/**
 * Generate Netscape bookmark HTML for a folder with its contents
 * Recursively handles nested folders
 */
function generateFolderEntry(
  folder: LinkFolderTreeNode,
  linksInFolder: Link[],
  allLinks: Link[],
  indent: string = '    '
): string {
  const folderTitle = escapeHtml(folder.name);
  const addDate = toUnixTimestamp(folder.createdAt);
  const lastModified = toUnixTimestamp(folder.updatedAt);
  const lines: string[] = [];

  // Folder opening - include ADD_DATE and LAST_MODIFIED for better browser compatibility
  lines.push(`${indent}<DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${lastModified}">${folderTitle}</H3>`);
  lines.push(`${indent}<DL><p>`);

  // Add links directly in this folder
  linksInFolder.forEach((link) => {
    lines.push(generateBookmarkEntry(link, indent + '    '));
  });

  // Recursively add child folders
  folder.children.forEach((childFolder) => {
    const childLinks = allLinks.filter((l) => l.folderId === childFolder.id);
    lines.push(generateFolderEntry(childFolder, childLinks, allLinks, indent + '    '));
  });

  // Folder closing
  lines.push(`${indent}</DL><p>`);

  return lines.join('\n');
}

/**
 * Export links with folder hierarchy to Netscape Bookmark HTML format
 *
 * @param links - All links to export
 * @param folderTree - Folder tree from useLinkFoldersStore.getTree()
 * @param options - Export options
 */
export function exportWithFolders(
  links: Link[],
  folderTree: LinkFolderTreeNode[],
  options: ExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Filter links based on options
  let filteredLinks = links;

  if (!opts.includeArchived) {
    filteredLinks = filteredLinks.filter((l) => !l.isArchived);
  }

  if (opts.favoritesOnly) {
    filteredLinks = filteredLinks.filter((l) => l.isFavorite);
  }

  // Build HTML
  const lines: string[] = [];

  // Header
  lines.push(generateHeader(opts.title || 'Bookmarks'));
  lines.push('<DL><p>');

  // Sort folder tree by sortOrder
  const sortedTree = [...folderTree].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  );

  // Export each root folder and its contents
  sortedTree.forEach((folder) => {
    const folderLinks = filteredLinks.filter((l) => l.folderId === folder.id);
    lines.push(generateFolderEntry(folder, folderLinks, filteredLinks));
  });

  // Export uncategorized links (no folderId)
  const uncategorizedLinks = filteredLinks.filter((l) => !l.folderId);
  if (opts.includeUncategorized && uncategorizedLinks.length > 0) {
    lines.push('    <DT><H3>Uncategorized</H3>');
    lines.push('    <DL><p>');
    uncategorizedLinks.forEach((link) => {
      lines.push(generateBookmarkEntry(link, '        '));
    });
    lines.push('    </DL><p>');
  }

  lines.push('</DL><p>');

  return lines.join('\n');
}

/**
 * Export links to Netscape Bookmark HTML format (legacy: category-based)
 * Use exportWithFolders() for hierarchical folder export
 */
export function exportToNetscapeHtml(
  links: Link[],
  options: ExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options, useFolderHierarchy: false };

  // Filter links based on options
  let filteredLinks = links;

  if (!opts.includeArchived) {
    filteredLinks = filteredLinks.filter((l) => !l.isArchived);
  }

  if (opts.favoritesOnly) {
    filteredLinks = filteredLinks.filter((l) => l.isFavorite);
  }

  // Build HTML
  const lines: string[] = [];

  // Header
  lines.push(generateHeader(opts.title || 'Bookmarks'));
  lines.push('<DL><p>');

  // Group by category (legacy string path like "Parent > Child")
  const grouped: Record<string, Link[]> = {};
  const uncategorized: Link[] = [];

  filteredLinks.forEach((link) => {
    if (link.category) {
      if (!grouped[link.category]) {
        grouped[link.category] = [];
      }
      grouped[link.category].push(link);
    } else {
      uncategorized.push(link);
    }
  });

  // Convert "Parent > Child" paths into nested structure
  // Build a tree from category paths
  interface CategoryNode {
    name: string;
    children: Record<string, CategoryNode>;
    links: Link[];
  }

  const categoryTree: Record<string, CategoryNode> = {};

  Object.entries(grouped).forEach(([categoryPath, categoryLinks]) => {
    const parts = categoryPath.split('>').map((s) => s.trim());
    let current = categoryTree;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = { name: part, children: {}, links: [] };
      }
      if (index === parts.length - 1) {
        // Leaf node - add links here
        current[part].links = categoryLinks;
      }
      current = current[part].children;
    });
  });

  // Recursively generate folder entries from category tree
  function generateCategoryFolders(
    nodes: Record<string, CategoryNode>,
    indent: string
  ): void {
    const sortedNames = Object.keys(nodes).sort();
    sortedNames.forEach((name) => {
      const node = nodes[name];
      const now = Math.floor(Date.now() / 1000);

      lines.push(`${indent}<DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${escapeHtml(name)}</H3>`);
      lines.push(`${indent}<DL><p>`);

      // Add links in this category
      node.links.forEach((link) => {
        lines.push(generateBookmarkEntry(link, indent + '    '));
      });

      // Recurse into children
      generateCategoryFolders(node.children, indent + '    ');

      lines.push(`${indent}</DL><p>`);
    });
  }

  generateCategoryFolders(categoryTree, '    ');

  // Add uncategorized links
  if (opts.includeUncategorized && uncategorized.length > 0) {
    const now = Math.floor(Date.now() / 1000);
    lines.push(`    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">Uncategorized</H3>`);
    lines.push('    <DL><p>');
    uncategorized.forEach((link) => {
      lines.push(generateBookmarkEntry(link, '        '));
    });
    lines.push('    </DL><p>');
  }

  lines.push('</DL><p>');

  return lines.join('\n');
}

/**
 * Export a specific collection to Netscape HTML
 */
export function exportCollectionToNetscapeHtml(
  collection: LinkCollection,
  allLinks: Record<string, Link>,
  options: ExportOptions = {}
): string {
  // Get links in collection
  const collectionLinks = collection.linkIds
    .map((id) => allLinks[id])
    .filter((link): link is Link => link !== undefined);

  return exportToNetscapeHtml(collectionLinks, {
    ...options,
    title: options.title || collection.name,
    includeUncategorized: true,
  });
}

/**
 * Download HTML content as a file
 */
export function downloadAsHtml(content: string, filename: string = 'bookmarks.html'): void {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export and download links with folder hierarchy
 */
export function exportAndDownload(
  links: Link[],
  folderTree: LinkFolderTreeNode[] | null,
  options: ExportOptions = {},
  filename: string = 'bookmarks.html'
): void {
  let html: string;

  if (folderTree && folderTree.length > 0) {
    // Use folder hierarchy export
    html = exportWithFolders(links, folderTree, options);
  } else {
    // Fall back to legacy category export
    html = exportToNetscapeHtml(links, options);
  }

  downloadAsHtml(html, filename);
}

/**
 * Export and download a collection
 */
export function exportCollectionAndDownload(
  collection: LinkCollection,
  allLinks: Record<string, Link>,
  filename?: string
): void {
  const html = exportCollectionToNetscapeHtml(collection, allLinks, {
    title: collection.name,
  });

  const safeName = collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadAsHtml(html, filename || `${safeName}_bookmarks.html`);
}

/**
 * Export only favorites to browser-compatible format
 */
export function exportFavoritesAndDownload(
  links: Link[],
  folderTree: LinkFolderTreeNode[] | null,
  filename: string = 'favorites.html'
): void {
  exportAndDownload(links, folderTree, { favoritesOnly: true, title: 'Favorites' }, filename);
}
