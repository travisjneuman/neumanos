/**
 * Link Library Store
 *
 * Manages links (bookmarks) with:
 * - Import/Export (Netscape HTML format)
 * - Collections for organization
 * - AI-powered categorization
 * - Favorites and archive features
 *
 * Persists to IndexedDB via createSyncedStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';
import { useProjectContextStore, matchesProjectFilter } from './useProjectContextStore';
import { normalizeUrl } from '../utils/urlNormalizer';
import { useActivityStore } from './useActivityStore';

// ============================================================================
// Types
// ============================================================================

export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon?: string;
  category?: string; // AI-suggested or manual (legacy: string path)
  folderId?: string; // Reference to LinkFolder (new: hierarchical folders)
  tags: string[];
  projectIds: string[]; // Project context IDs for global filter system (empty = uncategorized)
  isFavorite: boolean;
  isArchived: boolean;
  deletedAt?: Date; // Soft delete timestamp (null/undefined = not deleted, auto-purge after 30 days)
  lastVisited?: Date;
  visitCount: number;
  sortOrder: number; // For manual ordering within folders (lower = higher in list)
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkCollection {
  id: string;
  name: string;
  icon?: string; // Emoji or custom
  color?: string; // Accent color
  linkIds: string[]; // Ordered list of link IDs
  isExpanded: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ViewMode = 'grid' | 'list';
export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'visitCount' | 'manual';
export type SortDirection = 'asc' | 'desc';

export interface DuplicateGroup {
  normalizedUrl: string;
  links: Link[];
}

interface LinkLibraryState {
  // Data
  links: Record<string, Link>;
  collections: Record<string, LinkCollection>;

  // UI State (not persisted)
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  activeCollectionId: string | null; // null = all links
  selectedLinkIds: Set<string>; // For bulk operations
}

interface LinkLibraryActions {
  // Link CRUD
  addLink: (data: Omit<Link, 'id' | 'createdAt' | 'updatedAt' | 'visitCount'>) => Link;
  updateLink: (id: string, updates: Partial<Omit<Link, 'id' | 'createdAt'>>) => void;
  deleteLink: (id: string) => void;
  deleteLinks: (ids: string[]) => void;

  // Link Operations
  toggleFavorite: (id: string) => void;
  toggleArchived: (id: string) => void;
  incrementVisitCount: (id: string) => void;
  setLinkCategory: (id: string, category: string) => void;
  addTagsToLink: (id: string, tags: string[]) => void;
  removeTagsFromLink: (id: string, tags: string[]) => void;

  // Collection CRUD
  addCollection: (data: Omit<LinkCollection, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => LinkCollection;
  updateCollection: (id: string, updates: Partial<Omit<LinkCollection, 'id' | 'createdAt'>>) => void;
  deleteCollection: (id: string) => void;
  reorderCollections: (orderedIds: string[]) => void;

  // Collection Operations
  addLinkToCollection: (linkId: string, collectionId: string) => void;
  removeLinkFromCollection: (linkId: string, collectionId: string) => void;
  moveLinkBetweenCollections: (linkId: string, fromCollectionId: string, toCollectionId: string) => void;
  reorderLinksInCollection: (collectionId: string, orderedLinkIds: string[]) => void;

  // Bulk Import
  importLinks: (links: Omit<Link, 'id' | 'createdAt' | 'updatedAt' | 'visitCount'>[]) => Link[];

  // UI State
  setViewMode: (mode: ViewMode) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  setSearchQuery: (query: string) => void;
  setActiveCollection: (collectionId: string | null) => void;
  toggleLinkSelection: (id: string) => void;
  selectAllLinks: (ids: string[]) => void;
  clearSelection: () => void;

  // Queries
  getLink: (id: string) => Link | undefined;
  getAllLinks: () => Link[];
  getFilteredLinks: () => Link[];
  getLinksInCollection: (collectionId: string) => Link[];
  getLinksInFolder: (folderId: string | null) => Link[]; // null = root (no folder)
  getFavoriteLinks: () => Link[];
  getArchivedLinks: () => Link[];
  searchLinks: (query: string) => Link[];
  getAllTags: () => string[];
  getAllCategories: () => string[];

  // Folder operations
  setLinkFolder: (linkId: string, folderId: string | null) => void;
  moveLinksToFolder: (linkIds: string[], folderId: string | null) => void;

  // Reordering (for drag-and-drop)
  reorderLinksInFolder: (folderId: string | null, orderedLinkIds: string[]) => void;
  getNextSortOrder: (folderId: string | null) => number;

  // Duplicate Detection & Merge
  findDuplicates: () => DuplicateGroup[];
  mergeDuplicates: (keepId: string, deleteIds: string[], mergeTags: boolean) => void;

  // Trash / Soft Delete
  restoreLink: (id: string) => void;
  restoreLinks: (ids: string[]) => void;
  permanentlyDeleteLink: (id: string) => void;
  permanentlyDeleteLinks: (ids: string[]) => void;
  emptyTrash: () => void;
  getDeletedLinks: () => Link[];
  purgeOldDeletedLinks: (daysOld?: number) => number; // Returns count of purged links
}

type LinkLibraryStore = LinkLibraryState & LinkLibraryActions;

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => `link_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
const generateCollectionId = () => `col_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// ============================================================================
// Store Implementation
// ============================================================================

export const useLinkLibraryStore = create<LinkLibraryStore>()(
  persist(
    (set, get) => ({
      // Initial State
      links: {},
      collections: {},
      viewMode: 'grid',
      sortField: 'createdAt',
      sortDirection: 'desc',
      searchQuery: '',
      activeCollectionId: null,
      selectedLinkIds: new Set(),

      // ========================================================================
      // Link CRUD
      // ========================================================================

      addLink: (data) => {
        const id = generateId();
        const now = new Date();

        // Calculate next sortOrder for the folder
        const folderId = data.folderId ?? null;
        const linksInFolder = Object.values(get().links).filter(
          (l) => (l.folderId ?? null) === folderId && !l.isArchived
        );
        const maxSortOrder = linksInFolder.length > 0
          ? Math.max(...linksInFolder.map((l) => l.sortOrder ?? 0))
          : -1;

        const link: Link = {
          ...data,
          id,
          visitCount: 0,
          sortOrder: maxSortOrder + 1,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          links: { ...state.links, [id]: link },
        }));
        useActivityStore.getState().logActivity({
          type: 'created',
          module: 'links',
          entityId: id,
          entityTitle: link.title || link.url,
        });

        return link;
      },

      updateLink: (id, updates) => {
        set((state) => {
          const existing = state.links[id];
          if (!existing) return state;

          return {
            links: {
              ...state.links,
              [id]: {
                ...existing,
                ...updates,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      deleteLink: (id) => {
        set((state) => {
          const link = state.links[id];
          if (!link) return state;

          // Soft delete: set deletedAt timestamp instead of removing
          const updatedLinks = {
            ...state.links,
            [id]: {
              ...link,
              deletedAt: new Date(),
              updatedAt: new Date(),
            },
          };

          // Remove from all collections (deleted links shouldn't be in collections)
          const updatedCollections = { ...state.collections };
          Object.values(updatedCollections).forEach((collection) => {
            collection.linkIds = collection.linkIds.filter((linkId) => linkId !== id);
          });

          // Remove from selection
          const newSelection = new Set(state.selectedLinkIds);
          newSelection.delete(id);

          return {
            links: updatedLinks,
            collections: updatedCollections,
            selectedLinkIds: newSelection,
          };
        });
      },

      deleteLinks: (ids) => {
        set((state) => {
          const idsSet = new Set(ids);
          const now = new Date();

          // Soft delete: set deletedAt on all specified links
          const updatedLinks = { ...state.links };
          ids.forEach((id) => {
            if (updatedLinks[id]) {
              updatedLinks[id] = {
                ...updatedLinks[id],
                deletedAt: now,
                updatedAt: now,
              };
            }
          });

          // Remove from all collections
          const updatedCollections = { ...state.collections };
          Object.values(updatedCollections).forEach((collection) => {
            collection.linkIds = collection.linkIds.filter((linkId) => !idsSet.has(linkId));
          });

          // Remove from selection
          const newSelection = new Set(state.selectedLinkIds);
          ids.forEach((id) => newSelection.delete(id));

          return {
            links: updatedLinks,
            collections: updatedCollections,
            selectedLinkIds: newSelection,
          };
        });
      },

      // ========================================================================
      // Link Operations
      // ========================================================================

      toggleFavorite: (id) => {
        set((state) => {
          const link = state.links[id];
          if (!link) return state;

          return {
            links: {
              ...state.links,
              [id]: {
                ...link,
                isFavorite: !link.isFavorite,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      toggleArchived: (id) => {
        set((state) => {
          const link = state.links[id];
          if (!link) return state;

          return {
            links: {
              ...state.links,
              [id]: {
                ...link,
                isArchived: !link.isArchived,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      incrementVisitCount: (id) => {
        set((state) => {
          const link = state.links[id];
          if (!link) return state;

          return {
            links: {
              ...state.links,
              [id]: {
                ...link,
                visitCount: link.visitCount + 1,
                lastVisited: new Date(),
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      setLinkCategory: (id, category) => {
        set((state) => {
          const link = state.links[id];
          if (!link) return state;

          return {
            links: {
              ...state.links,
              [id]: {
                ...link,
                category,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      addTagsToLink: (id, tags) => {
        set((state) => {
          const link = state.links[id];
          if (!link) return state;

          const uniqueTags = [...new Set([...link.tags, ...tags])];

          return {
            links: {
              ...state.links,
              [id]: {
                ...link,
                tags: uniqueTags,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      removeTagsFromLink: (id, tags) => {
        set((state) => {
          const link = state.links[id];
          if (!link) return state;

          const tagsToRemove = new Set(tags);

          return {
            links: {
              ...state.links,
              [id]: {
                ...link,
                tags: link.tags.filter((t) => !tagsToRemove.has(t)),
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      // ========================================================================
      // Collection CRUD
      // ========================================================================

      addCollection: (data) => {
        const id = generateCollectionId();
        const now = new Date();
        const maxSortOrder = Math.max(0, ...Object.values(get().collections).map((c) => c.sortOrder));

        const collection: LinkCollection = {
          ...data,
          id,
          sortOrder: maxSortOrder + 1,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          collections: { ...state.collections, [id]: collection },
        }));

        return collection;
      },

      updateCollection: (id, updates) => {
        set((state) => {
          const existing = state.collections[id];
          if (!existing) return state;

          return {
            collections: {
              ...state.collections,
              [id]: {
                ...existing,
                ...updates,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      deleteCollection: (id) => {
        set((state) => {
          const { [id]: _, ...remainingCollections } = state.collections;

          // Clear active collection if it was deleted
          const newActiveCollectionId =
            state.activeCollectionId === id ? null : state.activeCollectionId;

          return {
            collections: remainingCollections,
            activeCollectionId: newActiveCollectionId,
          };
        });
      },

      reorderCollections: (orderedIds) => {
        set((state) => {
          const updatedCollections = { ...state.collections };

          orderedIds.forEach((id, index) => {
            if (updatedCollections[id]) {
              updatedCollections[id] = {
                ...updatedCollections[id],
                sortOrder: index,
                updatedAt: new Date(),
              };
            }
          });

          return { collections: updatedCollections };
        });
      },

      // ========================================================================
      // Collection Operations
      // ========================================================================

      addLinkToCollection: (linkId, collectionId) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection || collection.linkIds.includes(linkId)) return state;

          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                linkIds: [...collection.linkIds, linkId],
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      removeLinkFromCollection: (linkId, collectionId) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection) return state;

          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                linkIds: collection.linkIds.filter((id) => id !== linkId),
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      moveLinkBetweenCollections: (linkId, fromCollectionId, toCollectionId) => {
        set((state) => {
          const fromCollection = state.collections[fromCollectionId];
          const toCollection = state.collections[toCollectionId];

          if (!fromCollection || !toCollection) return state;

          return {
            collections: {
              ...state.collections,
              [fromCollectionId]: {
                ...fromCollection,
                linkIds: fromCollection.linkIds.filter((id) => id !== linkId),
                updatedAt: new Date(),
              },
              [toCollectionId]: {
                ...toCollection,
                linkIds: [...toCollection.linkIds, linkId],
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      reorderLinksInCollection: (collectionId, orderedLinkIds) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection) return state;

          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                linkIds: orderedLinkIds,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      // ========================================================================
      // Bulk Import
      // ========================================================================

      importLinks: (linksData) => {
        const now = new Date();
        const newLinks: Link[] = [];
        const skippedDuplicates: string[] = [];

        set((state) => {
          const updatedLinks = { ...state.links };

          // Create URL index for duplicate detection
          const existingUrls = new Set(
            Object.values(state.links).map((link) => link.url)
          );

          // Track sortOrder per folder for imported links
          const folderSortOrders: Record<string, number> = {};

          // Initialize with max existing sortOrder per folder
          Object.values(state.links).forEach((link) => {
            const folderId = link.folderId ?? '__root__';
            const currentMax = folderSortOrders[folderId] ?? -1;
            folderSortOrders[folderId] = Math.max(currentMax, link.sortOrder ?? 0);
          });

          linksData.forEach((data) => {
            // Skip duplicates (same URL)
            if (existingUrls.has(data.url)) {
              skippedDuplicates.push(data.url);
              return;
            }

            const id = generateId();
            const folderId = data.folderId ?? '__root__';

            // Get next sortOrder for this folder
            const nextSortOrder = (folderSortOrders[folderId] ?? -1) + 1;
            folderSortOrders[folderId] = nextSortOrder;

            const link: Link = {
              ...data,
              id,
              visitCount: 0,
              sortOrder: nextSortOrder,
              createdAt: now,
              updatedAt: now,
            };
            updatedLinks[id] = link;
            newLinks.push(link);
            existingUrls.add(data.url); // Add to index to catch duplicates within import
          });

          return { links: updatedLinks };
        });

        // Log import stats for user feedback
        if (skippedDuplicates.length > 0) {
          console.log(
            `Imported ${newLinks.length} new bookmarks, skipped ${skippedDuplicates.length} duplicates`
          );
        }

        return newLinks;
      },

      // ========================================================================
      // UI State
      // ========================================================================

      setViewMode: (mode) => set({ viewMode: mode }),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (direction) => set({ sortDirection: direction }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveCollection: (collectionId) => set({ activeCollectionId: collectionId }),

      toggleLinkSelection: (id) => {
        set((state) => {
          const newSelection = new Set(state.selectedLinkIds);
          if (newSelection.has(id)) {
            newSelection.delete(id);
          } else {
            newSelection.add(id);
          }
          return { selectedLinkIds: newSelection };
        });
      },

      selectAllLinks: (ids) => {
        set({ selectedLinkIds: new Set(ids) });
      },

      clearSelection: () => {
        set({ selectedLinkIds: new Set() });
      },

      // ========================================================================
      // Queries
      // ========================================================================

      getLink: (id) => get().links[id],

      getAllLinks: () => Object.values(get().links).filter((l) => !l.isArchived && !l.deletedAt),

      getFilteredLinks: () => {
        const { activeProjectIds } = useProjectContextStore.getState();
        const links = Object.values(get().links).filter((l) => !l.isArchived && !l.deletedAt);

        // Use centralized project filter utility
        return links.filter((link) =>
          matchesProjectFilter(link.projectIds, activeProjectIds)
        );
      },

      getLinksInCollection: (collectionId) => {
        const state = get();
        const collection = state.collections[collectionId];
        if (!collection) return [];

        return collection.linkIds
          .map((id) => state.links[id])
          .filter((link): link is Link => link !== undefined && !link.isArchived && !link.deletedAt);
      },

      getLinksInFolder: (folderId) => {
        return Object.values(get().links)
          .filter((link) => {
            if (link.isArchived || link.deletedAt) return false;
            // null = root (links without folder assignment)
            if (folderId === null) {
              return !link.folderId;
            }
            return link.folderId === folderId;
          })
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      },

      setLinkFolder: (linkId, folderId) => {
        set((state) => {
          const link = state.links[linkId];
          if (!link) return state;

          return {
            links: {
              ...state.links,
              [linkId]: {
                ...link,
                folderId: folderId ?? undefined,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      moveLinksToFolder: (linkIds, folderId) => {
        set((state) => {
          const updatedLinks = { ...state.links };
          const now = new Date();

          // Get max sortOrder in target folder
          const linksInTargetFolder = Object.values(updatedLinks).filter(
            (l) => (l.folderId ?? null) === folderId && !l.isArchived && !l.deletedAt
          );
          let nextSortOrder = linksInTargetFolder.length > 0
            ? Math.max(...linksInTargetFolder.map((l) => l.sortOrder ?? 0)) + 1
            : 0;

          for (const linkId of linkIds) {
            const link = updatedLinks[linkId];
            if (link) {
              updatedLinks[linkId] = {
                ...link,
                folderId: folderId ?? undefined,
                sortOrder: nextSortOrder++,
                updatedAt: now,
              };
            }
          }

          return { links: updatedLinks };
        });
      },

      // ========================================================================
      // Reordering (for drag-and-drop)
      // ========================================================================

      reorderLinksInFolder: (_folderId, orderedLinkIds) => {
        set((state) => {
          const updatedLinks = { ...state.links };
          const now = new Date();

          orderedLinkIds.forEach((linkId, index) => {
            const link = updatedLinks[linkId];
            if (link) {
              updatedLinks[linkId] = {
                ...link,
                sortOrder: index,
                updatedAt: now,
              };
            }
          });

          return { links: updatedLinks };
        });
      },

      getNextSortOrder: (folderId) => {
        const linksInFolder = Object.values(get().links).filter(
          (l) => (l.folderId ?? null) === folderId && !l.isArchived && !l.deletedAt
        );
        if (linksInFolder.length === 0) return 0;
        return Math.max(...linksInFolder.map((l) => l.sortOrder ?? 0)) + 1;
      },

      getFavoriteLinks: () => Object.values(get().links).filter((l) => l.isFavorite && !l.isArchived && !l.deletedAt),

      getArchivedLinks: () => Object.values(get().links).filter((l) => l.isArchived && !l.deletedAt),

      searchLinks: (query) => {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return get().getAllLinks();

        return Object.values(get().links).filter((link) => {
          if (link.isArchived || link.deletedAt) return false;

          return (
            link.title.toLowerCase().includes(normalizedQuery) ||
            link.url.toLowerCase().includes(normalizedQuery) ||
            link.description?.toLowerCase().includes(normalizedQuery) ||
            link.category?.toLowerCase().includes(normalizedQuery) ||
            link.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
          );
        });
      },

      getAllTags: () => {
        const allTags = new Set<string>();
        Object.values(get().links).forEach((link) => {
          link.tags.forEach((tag) => allTags.add(tag));
        });
        return Array.from(allTags).sort();
      },

      getAllCategories: () => {
        const allCategories = new Set<string>();
        Object.values(get().links).forEach((link) => {
          if (link.category) {
            allCategories.add(link.category);
          }
        });
        return Array.from(allCategories).sort();
      },

      // ========================================================================
      // Duplicate Detection & Merge
      // ========================================================================

      findDuplicates: () => {
        const links = Object.values(get().links).filter((l) => !l.isArchived);
        const groups = new Map<string, Link[]>();

        // Group by normalized URL
        for (const link of links) {
          const normalized = normalizeUrl(link.url);
          const existing = groups.get(normalized) || [];
          existing.push(link);
          groups.set(normalized, existing);
        }

        // Return only groups with more than one link, sorted by count desc
        const duplicateGroups: DuplicateGroup[] = [];
        for (const [normalizedUrl, linkGroup] of groups) {
          if (linkGroup.length > 1) {
            // Sort links in each group by createdAt desc (newest first)
            linkGroup.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            duplicateGroups.push({ normalizedUrl, links: linkGroup });
          }
        }

        // Sort groups by number of duplicates (most duplicates first)
        duplicateGroups.sort((a, b) => b.links.length - a.links.length);

        return duplicateGroups;
      },

      mergeDuplicates: (keepId, deleteIds, mergeTags) => {
        set((state) => {
          const keepLink = state.links[keepId];
          if (!keepLink) return state;

          // Collect tags from links to be deleted if mergeTags is true
          let mergedTags = [...keepLink.tags];
          if (mergeTags) {
            for (const deleteId of deleteIds) {
              const deleteLink = state.links[deleteId];
              if (deleteLink) {
                mergedTags = [...new Set([...mergedTags, ...deleteLink.tags])];
              }
            }
          }

          // Update kept link with merged tags
          const updatedKeepLink: Link = {
            ...keepLink,
            tags: mergedTags,
            updatedAt: new Date(),
          };

          // Remove deleted links
          const deleteIdSet = new Set(deleteIds);
          const remainingLinks: Record<string, Link> = {};
          Object.entries(state.links).forEach(([id, link]) => {
            if (id === keepId) {
              remainingLinks[id] = updatedKeepLink;
            } else if (!deleteIdSet.has(id)) {
              remainingLinks[id] = link;
            }
          });

          // Remove from all collections
          const updatedCollections = { ...state.collections };
          Object.values(updatedCollections).forEach((collection) => {
            collection.linkIds = collection.linkIds.filter(
              (linkId) => !deleteIdSet.has(linkId)
            );
          });

          // Remove from selection
          const newSelection = new Set(state.selectedLinkIds);
          deleteIds.forEach((id) => newSelection.delete(id));

          return {
            links: remainingLinks,
            collections: updatedCollections,
            selectedLinkIds: newSelection,
          };
        });
      },

      // ========================================================================
      // Trash / Soft Delete Operations
      // ========================================================================

      restoreLink: (id) => {
        set((state) => {
          const link = state.links[id];
          if (!link || !link.deletedAt) return state;

          return {
            links: {
              ...state.links,
              [id]: {
                ...link,
                deletedAt: undefined,
                updatedAt: new Date(),
              },
            },
          };
        });
      },

      restoreLinks: (ids) => {
        set((state) => {
          const now = new Date();
          const updatedLinks = { ...state.links };

          ids.forEach((id) => {
            if (updatedLinks[id]?.deletedAt) {
              updatedLinks[id] = {
                ...updatedLinks[id],
                deletedAt: undefined,
                updatedAt: now,
              };
            }
          });

          return { links: updatedLinks };
        });
      },

      permanentlyDeleteLink: (id) => {
        set((state) => {
          const { [id]: _, ...remainingLinks } = state.links;

          // Remove from selection
          const newSelection = new Set(state.selectedLinkIds);
          newSelection.delete(id);

          return {
            links: remainingLinks,
            selectedLinkIds: newSelection,
          };
        });
      },

      permanentlyDeleteLinks: (ids) => {
        set((state) => {
          const idsSet = new Set(ids);
          const remainingLinks: Record<string, Link> = {};

          Object.entries(state.links).forEach(([id, link]) => {
            if (!idsSet.has(id)) {
              remainingLinks[id] = link;
            }
          });

          // Remove from selection
          const newSelection = new Set(state.selectedLinkIds);
          ids.forEach((id) => newSelection.delete(id));

          return {
            links: remainingLinks,
            selectedLinkIds: newSelection,
          };
        });
      },

      emptyTrash: () => {
        set((state) => {
          const remainingLinks: Record<string, Link> = {};

          Object.entries(state.links).forEach(([id, link]) => {
            if (!link.deletedAt) {
              remainingLinks[id] = link;
            }
          });

          return { links: remainingLinks };
        });
      },

      getDeletedLinks: () => {
        return Object.values(get().links).filter((l) => l.deletedAt);
      },

      purgeOldDeletedLinks: (daysOld = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        let purgedCount = 0;

        set((state) => {
          const remainingLinks: Record<string, Link> = {};

          Object.entries(state.links).forEach(([id, link]) => {
            if (link.deletedAt && new Date(link.deletedAt) < cutoffDate) {
              purgedCount++;
            } else {
              remainingLinks[id] = link;
            }
          });

          return { links: remainingLinks };
        });

        return purgedCount;
      },
    }),
    {
      name: 'link-library',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 3, // v3: Add deletedAt for soft delete / trash functionality
      partialize: (state) => ({
        // Only persist data, not UI state
        links: state.links,
        collections: state.collections,
      }),
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as any;

        // Version 0 -> 1: Add projectIds field to all links
        if (version < 1 && state.links) {
          console.log('[LinkLibraryStore] Adding projectIds field to all links');
          const updatedLinks: Record<string, Link> = {};
          Object.entries(state.links).forEach(([id, link]: [string, any]) => {
            updatedLinks[id] = {
              ...link,
              projectIds: link.projectIds ?? [],
            };
          });
          state = {
            ...state,
            links: updatedLinks,
          };
        }

        // Version 1 -> 2: Add sortOrder field to all links
        if (version < 2 && state.links) {
          console.log('[LinkLibraryStore] Adding sortOrder field to all links');
          // Group links by folderId and assign sortOrder by createdAt
          const linksByFolder: Record<string, Array<[string, any]>> = {};

          Object.entries(state.links).forEach(([id, link]: [string, any]) => {
            const folderId = link.folderId ?? '__root__';
            if (!linksByFolder[folderId]) {
              linksByFolder[folderId] = [];
            }
            linksByFolder[folderId].push([id, link]);
          });

          const updatedLinks: Record<string, Link> = {};

          Object.values(linksByFolder).forEach((folderLinks) => {
            // Sort by createdAt to preserve chronological order
            folderLinks.sort((a, b) => {
              const dateA = new Date(a[1].createdAt || 0).getTime();
              const dateB = new Date(b[1].createdAt || 0).getTime();
              return dateA - dateB;
            });

            folderLinks.forEach(([id, link], index) => {
              updatedLinks[id] = {
                ...link,
                sortOrder: index,
              };
            });
          });

          state = {
            ...state,
            links: updatedLinks,
          };
        }

        // Version 2 -> 3: Add deletedAt field (soft delete)
        // No migration needed - deletedAt is optional and defaults to undefined
        if (version < 3) {
          console.log('[LinkLibraryStore] v3: deletedAt field available for soft delete');
        }

        return state;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.links) {
          // Convert date strings back to Date objects
          Object.values(state.links).forEach((link) => {
            if (typeof link.createdAt === 'string') {
              link.createdAt = new Date(link.createdAt);
            }
            if (typeof link.updatedAt === 'string') {
              link.updatedAt = new Date(link.updatedAt);
            }
            if (link.lastVisited && typeof link.lastVisited === 'string') {
              link.lastVisited = new Date(link.lastVisited);
            }
            if (link.deletedAt && typeof link.deletedAt === 'string') {
              link.deletedAt = new Date(link.deletedAt);
            }
          });
        }
        if (state?.collections) {
          Object.values(state.collections).forEach((collection) => {
            if (typeof collection.createdAt === 'string') {
              collection.createdAt = new Date(collection.createdAt);
            }
            if (typeof collection.updatedAt === 'string') {
              collection.updatedAt = new Date(collection.updatedAt);
            }
          });
        }
      },
    }
  )
);
