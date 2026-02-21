/**
 * Link Folders Store
 *
 * Zustand store for managing link/bookmark folder hierarchy
 * Persisted to IndexedDB via syncedStorage
 * Supports unlimited nesting depth
 *
 * Similar to useFoldersStore (for notes) but for Link Library
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { createSyncedStorage } from '../lib/syncedStorage';
import { logger } from '../services/logger';

const log = logger.module('LinkFoldersStore');

// ============================================================================
// Types
// ============================================================================

export interface LinkFolder {
  id: string;
  name: string;
  parentId: string | null; // null = root level
  icon?: string;
  color?: string;
  isExpanded: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkFolderTreeNode extends LinkFolder {
  children: LinkFolderTreeNode[];
  depth: number;
  path: LinkFolder[];
  linkCount: number; // Direct links in this folder
  totalLinkCount: number; // Links in this folder + all descendants
}

export type LinkFolderUpdate = Partial<Omit<LinkFolder, 'id' | 'createdAt'>>;

// ============================================================================
// Constants
// ============================================================================

const LINK_FOLDER_CONSTANTS = {
  MAX_DEPTH: 20, // Allow deep nesting for browser bookmark imports
  DEFAULT_NAME: 'New Folder',
};

// ============================================================================
// Store Interface
// ============================================================================

interface LinkFoldersStore {
  // State
  folders: Record<string, LinkFolder>;
  activeFolderId: string | null;
  expandedFolderIds: Set<string>;

  // CRUD
  createFolder: (params?: Partial<LinkFolder>) => LinkFolder;
  getFolder: (id: string) => LinkFolder | undefined;
  updateFolder: (id: string, updates: LinkFolderUpdate) => void;
  deleteFolder: (id: string, linkAction: 'move-to-parent' | 'delete') => void;
  duplicateFolder: (id: string) => LinkFolder | null;

  // Hierarchy
  moveFolder: (folderId: string, newParentId: string | null) => void;
  getChildren: (parentId: string | null) => LinkFolder[];
  getParent: (folderId: string) => LinkFolder | null;
  getPath: (folderId: string) => LinkFolder[];
  getDepth: (folderId: string) => number;
  getFlatTree: () => LinkFolder[];
  getTree: (linkCountMap?: Record<string, number>) => LinkFolderTreeNode[];

  // Expand/Collapse
  toggleExpanded: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseFolder: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandPath: (folderId: string) => void;

  // UI State
  setActiveFolder: (id: string | null) => void;

  // Reordering (for drag-and-drop)
  reorderFolders: (parentId: string | null, orderedFolderIds: string[]) => void;

  // Utility
  canMoveFolder: (folderId: string, targetParentId: string | null) => boolean;
  isDescendantOf: (folderId: string, ancestorId: string) => boolean;
  exportFolders: () => LinkFolder[];
  importFolders: (folders: LinkFolder[], merge: boolean) => void;
  clearAllFolders: () => void;

  // Bulk creation from import
  createFoldersFromHierarchy: (
    folderTree: Array<{ name: string; path: string[]; children: unknown[] }>
  ) => Map<string, string>; // Returns mapping of path -> folder ID
}

// ============================================================================
// Helpers
// ============================================================================

const createDefaultFolder = (overrides?: Partial<LinkFolder>): LinkFolder => {
  const now = new Date();
  return {
    id: uuidv4(),
    parentId: null,
    name: LINK_FOLDER_CONSTANTS.DEFAULT_NAME,
    isExpanded: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

const buildTree = (
  folders: LinkFolder[],
  parentId: string | null,
  depth: number = 0,
  linkCountMap: Record<string, number> = {}
): LinkFolderTreeNode[] => {
  const children = folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return children.map((folder) => {
    const subtree = buildTree(folders, folder.id, depth + 1, linkCountMap);
    const linkCount = linkCountMap[folder.id] || 0;
    const totalLinkCount =
      linkCount + subtree.reduce((sum, child) => sum + child.totalLinkCount, 0);

    return {
      ...folder,
      children: subtree,
      depth,
      path: [],
      linkCount,
      totalLinkCount,
    };
  });
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useLinkFoldersStore = create<LinkFoldersStore>()(
  persist(
    (set, get) => ({
      // Initial state
      folders: {},
      activeFolderId: null,
      expandedFolderIds: new Set<string>(),

      // CRUD
      createFolder: (params) => {
        const newFolder = createDefaultFolder(params);

        // Check max depth
        const depth = get().getDepth(newFolder.parentId || '');
        if (depth >= LINK_FOLDER_CONSTANTS.MAX_DEPTH) {
          log.warn('Max folder depth reached', {
            maxDepth: LINK_FOLDER_CONSTANTS.MAX_DEPTH,
          });
          return newFolder;
        }

        set((state) => ({
          folders: {
            ...state.folders,
            [newFolder.id]: newFolder,
          },
          expandedFolderIds: new Set([...state.expandedFolderIds, newFolder.id]),
        }));

        // Expand parent if exists
        if (newFolder.parentId) {
          get().expandFolder(newFolder.parentId);
        }

        log.debug('Link folder created', { id: newFolder.id, name: newFolder.name });
        return newFolder;
      },

      getFolder: (id) => get().folders[id],

      updateFolder: (id, updates) => {
        const folder = get().folders[id];
        if (!folder) {
          log.warn('Link folder not found', { id });
          return;
        }

        set((state) => ({
          folders: {
            ...state.folders,
            [id]: {
              ...folder,
              ...updates,
              updatedAt: new Date(),
            },
          },
        }));
        log.debug('Link folder updated', { id });
      },

      deleteFolder: (id, linkAction) => {
        const folder = get().folders[id];
        if (!folder) {
          log.warn('Link folder not found for deletion', { id });
          return;
        }

        // Get all descendant folders
        const descendants = get()
          .getFlatTree()
          .filter((f) => get().isDescendantOf(f.id, id));

        const foldersToDelete = [id, ...descendants.map((d) => d.id)];

        // Handle links in deleted folders
        // This will be handled by the caller (LinkLibrary page) which has access to useLinkLibraryStore
        // We just emit an event-like log for debugging
        log.info('Deleting link folders', {
          folderId: id,
          descendantCount: descendants.length,
          linkAction,
        });

        // Delete folders
        set((state) => {
          const remainingFolders = { ...state.folders };
          foldersToDelete.forEach((fId) => {
            delete remainingFolders[fId];
          });

          const newExpanded = new Set(state.expandedFolderIds);
          foldersToDelete.forEach((fId) => newExpanded.delete(fId));

          return {
            folders: remainingFolders,
            expandedFolderIds: newExpanded,
            activeFolderId:
              state.activeFolderId && foldersToDelete.includes(state.activeFolderId)
                ? null
                : state.activeFolderId,
          };
        });

        log.info('Link folder deleted', { id, descendantCount: descendants.length });
      },

      duplicateFolder: (id) => {
        const original = get().folders[id];
        if (!original) {
          log.warn('Link folder not found for duplication', { id });
          return null;
        }

        const duplicate = createDefaultFolder({
          ...original,
          name: `${original.name} (Copy)`,
        });

        set((state) => ({
          folders: {
            ...state.folders,
            [duplicate.id]: duplicate,
          },
        }));

        log.debug('Link folder duplicated', { originalId: id, newId: duplicate.id });
        return duplicate;
      },

      // Hierarchy
      moveFolder: (folderId, newParentId) => {
        if (!get().canMoveFolder(folderId, newParentId)) {
          log.warn('Cannot move link folder', { folderId, targetParentId: newParentId });
          return;
        }

        const folder = get().folders[folderId];
        if (!folder) return;

        set((state) => ({
          folders: {
            ...state.folders,
            [folderId]: {
              ...folder,
              parentId: newParentId,
              updatedAt: new Date(),
            },
          },
        }));

        log.debug('Link folder moved', { folderId, newParentId });
      },

      getChildren: (parentId) => {
        return Object.values(get().folders)
          .filter((f) => f.parentId === parentId)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      },

      getParent: (folderId) => {
        const folder = get().folders[folderId];
        if (!folder || !folder.parentId) return null;
        return get().folders[folder.parentId] || null;
      },

      getPath: (folderId) => {
        const path: LinkFolder[] = [];
        let current: LinkFolder | undefined = get().folders[folderId];

        while (current) {
          path.unshift(current);
          current = current.parentId ? get().folders[current.parentId] : undefined;
        }

        return path;
      },

      getDepth: (folderId) => {
        if (!folderId) return 0;

        let depth = 0;
        let current = get().folders[folderId];

        while (current?.parentId) {
          depth++;
          current = get().folders[current.parentId];

          if (depth > 100) {
            log.error('Circular link folder reference detected');
            return depth;
          }
        }

        return depth;
      },

      getFlatTree: () => {
        return Object.values(get().folders).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      },

      getTree: (linkCountMap = {}) => {
        const folders = Object.values(get().folders);
        return buildTree(folders, null, 0, linkCountMap);
      },

      // Expand/Collapse
      toggleExpanded: (id) => {
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          return { expandedFolderIds: newExpanded };
        });
      },

      expandFolder: (id) => {
        set((state) => ({
          expandedFolderIds: new Set([...state.expandedFolderIds, id]),
        }));
      },

      collapseFolder: (id) => {
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          newExpanded.delete(id);
          return { expandedFolderIds: newExpanded };
        });
      },

      expandAll: () => {
        const allIds = Object.keys(get().folders);
        set({ expandedFolderIds: new Set(allIds) });
        log.debug('Expanded all link folders');
      },

      collapseAll: () => {
        set({ expandedFolderIds: new Set() });
        log.debug('Collapsed all link folders');
      },

      expandPath: (folderId) => {
        const path = get().getPath(folderId);
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          path.forEach((folder) => newExpanded.add(folder.id));
          return { expandedFolderIds: newExpanded };
        });
      },

      // UI State
      setActiveFolder: (id) => {
        set({ activeFolderId: id });
      },

      // Reordering (for drag-and-drop)
      reorderFolders: (parentId, orderedFolderIds) => {
        set((state) => {
          const updatedFolders = { ...state.folders };
          const now = new Date();

          orderedFolderIds.forEach((folderId, index) => {
            const folder = updatedFolders[folderId];
            if (folder && folder.parentId === parentId) {
              updatedFolders[folderId] = {
                ...folder,
                sortOrder: index,
                updatedAt: now,
              };
            }
          });

          return { folders: updatedFolders };
        });

        log.debug('Folders reordered', { parentId, count: orderedFolderIds.length });
      },

      // Utility
      canMoveFolder: (folderId, targetParentId) => {
        if (folderId === targetParentId) return false;

        if (targetParentId && get().isDescendantOf(targetParentId, folderId)) {
          return false;
        }

        const newDepth = get().getDepth(targetParentId || '') + 1;
        if (newDepth >= LINK_FOLDER_CONSTANTS.MAX_DEPTH) {
          return false;
        }

        return true;
      },

      isDescendantOf: (folderId, ancestorId) => {
        let current = get().folders[folderId];
        let iterations = 0;

        while (current?.parentId) {
          if (current.parentId === ancestorId) return true;
          current = get().folders[current.parentId];

          if (iterations++ > 100) {
            log.error('Circular link folder reference detected');
            return false;
          }
        }

        return false;
      },

      exportFolders: () => Object.values(get().folders),

      importFolders: (folders, merge) => {
        if (!merge) {
          set({
            folders: Object.fromEntries(folders.map((f) => [f.id, f])),
            activeFolderId: null,
            expandedFolderIds: new Set(),
          });
          log.info('Imported link folders (replace mode)', { count: folders.length });
        } else {
          set((state) => {
            const updatedFolders = { ...state.folders };
            folders.forEach((folder) => {
              updatedFolders[folder.id] = folder;
            });
            return { folders: updatedFolders };
          });
          log.info('Imported link folders (merge mode)', { count: folders.length });
        }
      },

      clearAllFolders: () => {
        set({
          folders: {},
          activeFolderId: null,
          expandedFolderIds: new Set(),
        });
        log.info('All link folders cleared');
      },

      // Bulk creation from import (for bookmark imports with folder hierarchy)
      createFoldersFromHierarchy: (folderTree) => {
        const pathToIdMap = new Map<string, string>();
        const now = new Date();

        // Recursive function to create folders
        const createFromNode = (
          node: { name: string; path: string[]; children: unknown[] },
          parentId: string | null,
          pathPrefix: string[]
        ) => {
          const fullPath = [...pathPrefix, node.name];
          const pathKey = fullPath.join(' > ');

          // Check if folder already exists (by path)
          const existingId = pathToIdMap.get(pathKey);
          if (existingId) {
            return existingId;
          }

          // Create new folder
          const folder = createDefaultFolder({
            name: node.name,
            parentId,
            createdAt: now,
            updatedAt: now,
          });

          set((state) => ({
            folders: {
              ...state.folders,
              [folder.id]: folder,
            },
            expandedFolderIds: new Set([...state.expandedFolderIds, folder.id]),
          }));

          pathToIdMap.set(pathKey, folder.id);

          // Process children
          if (Array.isArray(node.children)) {
            for (const child of node.children) {
              if (typeof child === 'object' && child !== null && 'name' in child) {
                createFromNode(
                  child as { name: string; path: string[]; children: unknown[] },
                  folder.id,
                  fullPath
                );
              }
            }
          }

          return folder.id;
        };

        // Process all root nodes
        for (const rootNode of folderTree) {
          createFromNode(rootNode, null, []);
        }

        log.info('Created link folders from hierarchy', {
          folderCount: pathToIdMap.size,
        });

        return pathToIdMap;
      },
    }),
    {
      name: 'link-folders',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        folders: state.folders,
        expandedFolderIds: Array.from(state.expandedFolderIds),
      }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        log.debug('Link folders store rehydrating');
        if (state) {
          try {
            // Convert date strings back to Date objects
            if (state.folders && typeof state.folders === 'object') {
              Object.values(state.folders).forEach((folder) => {
                if (typeof folder.createdAt === 'string') {
                  folder.createdAt = new Date(folder.createdAt);
                }
                if (typeof folder.updatedAt === 'string') {
                  folder.updatedAt = new Date(folder.updatedAt);
                }
              });
            } else {
              state.folders = {};
            }

            // Fix corrupted Set data
            const expandedIds = state.expandedFolderIds as unknown;
            if (expandedIds instanceof Set) {
              // Already a Set
            } else if (Array.isArray(expandedIds)) {
              state.expandedFolderIds = new Set(expandedIds);
            } else {
              log.warn('Corrupted expandedFolderIds detected, resetting');
              state.expandedFolderIds = new Set<string>();
            }
          } catch (err) {
            log.error('Error during link folders store rehydration', { error: err });
            state.folders = {};
            state.expandedFolderIds = new Set<string>();
            state.activeFolderId = null;
          }
        }
        log.info('Link folders store rehydrated', {
          folderCount: state?.folders ? Object.keys(state.folders).length : 0,
        });
      },
    }
  )
);

// ============================================================================
// Selector Hooks
// ============================================================================

export const useActiveLinkFolder = () =>
  useLinkFoldersStore((state) => {
    const activeId = state.activeFolderId;
    return activeId ? state.folders[activeId] : null;
  });

export const useLinkFolderTree = () =>
  useLinkFoldersStore((state) => state.getTree());

export const useLinkFolderPath = (folderId: string) =>
  useLinkFoldersStore((state) => state.getPath(folderId));

export const useIsLinkFolderExpanded = (folderId: string) =>
  useLinkFoldersStore((state) => state.expandedFolderIds.has(folderId));
