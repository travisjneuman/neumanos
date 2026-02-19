/**
 * Link Folder Migration Service
 *
 * Migrates legacy category strings (e.g., "Parent > Child > Grandchild")
 * to the new hierarchical folder system.
 *
 * This migration runs once on app startup if:
 * - There are links with category strings but no folderId
 * - The migration hasn't been run before (tracked via localStorage)
 */

import { useLinkLibraryStore } from '../stores/useLinkLibraryStore';
import { useLinkFoldersStore } from '../stores/useLinkFoldersStore';

const MIGRATION_KEY = 'link-folder-migration-v1-completed';

/**
 * Check if migration has already been completed
 */
export function isMigrationCompleted(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as completed
 */
function markMigrationCompleted(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Parse a category string into path segments
 * e.g., "Development > Frontend > React" -> ["Development", "Frontend", "React"]
 */
function parseCategoryPath(category: string): string[] {
  return category
    .split('>')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

/**
 * Run the category-to-folder migration
 *
 * Algorithm:
 * 1. Collect all unique category strings from links without folderId
 * 2. Build a set of all required folder paths
 * 3. Create folders in hierarchy order (parents before children)
 * 4. Update links with corresponding folderIds
 */
export function runCategoryMigration(): {
  foldersCreated: number;
  linksUpdated: number;
} {
  // Skip if already migrated
  if (isMigrationCompleted()) {
    return { foldersCreated: 0, linksUpdated: 0 };
  }

  const linkStore = useLinkLibraryStore.getState();
  const folderStore = useLinkFoldersStore.getState();

  // Get all links that have category but no folderId
  const linksToMigrate = Object.values(linkStore.links).filter(
    (link) => link.category && !link.folderId
  );

  if (linksToMigrate.length === 0) {
    markMigrationCompleted();
    return { foldersCreated: 0, linksUpdated: 0 };
  }

  // Collect all unique category paths
  const categoryPaths = new Map<string, string[]>(); // category string -> path segments
  for (const link of linksToMigrate) {
    if (link.category && !categoryPaths.has(link.category)) {
      categoryPaths.set(link.category, parseCategoryPath(link.category));
    }
  }

  // Build complete set of folder paths needed (including intermediate folders)
  // e.g., "A > B > C" needs folders: ["A"], ["A", "B"], ["A", "B", "C"]
  const allPaths = new Set<string>();
  for (const pathSegments of categoryPaths.values()) {
    for (let i = 1; i <= pathSegments.length; i++) {
      allPaths.add(pathSegments.slice(0, i).join(' > '));
    }
  }

  // Sort paths by depth (create parents before children)
  const sortedPaths = Array.from(allPaths).sort((a, b) => {
    const depthA = a.split('>').length;
    const depthB = b.split('>').length;
    return depthA - depthB;
  });

  // Track created folders by path string -> folder id
  const pathToFolderId = new Map<string, string>();

  // Create folders
  let foldersCreated = 0;
  for (const pathString of sortedPaths) {
    const segments = parseCategoryPath(pathString);
    const folderName = segments[segments.length - 1];

    // Find parent folder id
    let parentId: string | null = null;
    if (segments.length > 1) {
      const parentPath = segments.slice(0, -1).join(' > ');
      parentId = pathToFolderId.get(parentPath) ?? null;
    }

    // Check if folder already exists with same name under same parent
    const existingFolder = Object.values(folderStore.folders).find(
      (f) => f.name === folderName && f.parentId === parentId
    );

    if (existingFolder) {
      pathToFolderId.set(pathString, existingFolder.id);
    } else {
      const newFolder = folderStore.createFolder({
        name: folderName,
        parentId,
        isExpanded: true,
        sortOrder: foldersCreated,
      });
      pathToFolderId.set(pathString, newFolder.id);
      foldersCreated++;
    }
  }

  // Update links with folder IDs
  let linksUpdated = 0;
  for (const link of linksToMigrate) {
    if (link.category) {
      const folderId = pathToFolderId.get(link.category);
      if (folderId) {
        linkStore.setLinkFolder(link.id, folderId);
        linksUpdated++;
      }
    }
  }

  markMigrationCompleted();

  console.log(
    `[LinkFolderMigration] Migration complete: ${foldersCreated} folders created, ${linksUpdated} links updated`
  );

  return { foldersCreated, linksUpdated };
}

/**
 * Reset migration flag (for testing/debugging)
 */
export function resetMigration(): void {
  localStorage.removeItem(MIGRATION_KEY);
}
