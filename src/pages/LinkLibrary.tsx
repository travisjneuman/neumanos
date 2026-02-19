/**
 * Link Library Page
 *
 * Full-featured bookmark management system with:
 * - Import/Export (Netscape HTML format)
 * - Collections for organization
 * - AI-powered categorization
 * - Search and filter
 * - Grid/List view toggle
 * - Virtualized rendering for 900+ links
 */

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { List, Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { CollectionSidebar } from '../components/CollectionSidebar';
import { useLinkLibraryStore, type Link, type DuplicateGroup } from '../stores/useLinkLibraryStore';
import { useLinkFoldersStore } from '../stores/useLinkFoldersStore';
import {
  parseNetscapeBookmarks,
  convertToLinks,
  readFileAsText,
  isValidBookmarkFile,
} from '../utils/bookmarkParser';
import type { CategorySuggestion } from '../services/linkCategorizer';
import {
  exportAndDownload,
} from '../utils/bookmarkExporter';
import { PageContent } from '../components/PageContent';
import { Modal } from '../components/Modal';
import { Button } from '../components/ui';
import { faviconCacheService } from '../services/faviconCache';
import { runCategoryMigration } from '../services/linkFolderMigration';

// Constants for virtualization
const CARD_HEIGHT = 88; // Compact card height in pixels
const CARD_MIN_WIDTH = 240; // Minimum card width (allows more columns)
const CARD_GAP = 12; // Gap between cards
const LIST_ITEM_HEIGHT = 48; // List item height

export const LinkLibrary: React.FC = () => {
  // State subscriptions - only re-render when these specific values change
  const links = useLinkLibraryStore((s) => s.links);
  const collections = useLinkLibraryStore((s) => s.collections);
  const viewMode = useLinkLibraryStore((s) => s.viewMode);
  const sortField = useLinkLibraryStore((s) => s.sortField);
  const sortDirection = useLinkLibraryStore((s) => s.sortDirection);
  const searchQuery = useLinkLibraryStore((s) => s.searchQuery);
  const activeCollectionId = useLinkLibraryStore((s) => s.activeCollectionId);
  const selectedLinkIds = useLinkLibraryStore((s) => s.selectedLinkIds);

  // Actions - stable references, no re-render on store change
  const setViewMode = useLinkLibraryStore((s) => s.setViewMode);
  const setSortField = useLinkLibraryStore((s) => s.setSortField);
  const setSortDirection = useLinkLibraryStore((s) => s.setSortDirection);
  const setSearchQuery = useLinkLibraryStore((s) => s.setSearchQuery);
  const toggleLinkSelection = useLinkLibraryStore((s) => s.toggleLinkSelection);
  const selectAllLinks = useLinkLibraryStore((s) => s.selectAllLinks);
  const clearSelection = useLinkLibraryStore((s) => s.clearSelection);
  const deleteLinks = useLinkLibraryStore((s) => s.deleteLinks);
  const toggleFavorite = useLinkLibraryStore((s) => s.toggleFavorite);
  const toggleArchived = useLinkLibraryStore((s) => s.toggleArchived);
  const importLinks = useLinkLibraryStore((s) => s.importLinks);
  const updateLink = useLinkLibraryStore((s) => s.updateLink);
  const deleteLink = useLinkLibraryStore((s) => s.deleteLink);
  const getAllLinks = useLinkLibraryStore((s) => s.getAllLinks);
  const findDuplicates = useLinkLibraryStore((s) => s.findDuplicates);
  const mergeDuplicates = useLinkLibraryStore((s) => s.mergeDuplicates);
  const getLinksInCollection = useLinkLibraryStore((s) => s.getLinksInCollection);
  const getFavoriteLinks = useLinkLibraryStore((s) => s.getFavoriteLinks);
  const getArchivedLinks = useLinkLibraryStore((s) => s.getArchivedLinks);
  const searchLinks = useLinkLibraryStore((s) => s.searchLinks);
  const getLinksInFolder = useLinkLibraryStore((s) => s.getLinksInFolder);
  const reorderLinksInFolder = useLinkLibraryStore((s) => s.reorderLinksInFolder);
  const getDeletedLinks = useLinkLibraryStore((s) => s.getDeletedLinks);
  const restoreLink = useLinkLibraryStore((s) => s.restoreLink);
  const restoreLinks = useLinkLibraryStore((s) => s.restoreLinks);
  const permanentlyDeleteLink = useLinkLibraryStore((s) => s.permanentlyDeleteLink);
  const emptyTrash = useLinkLibraryStore((s) => s.emptyTrash);

  // Folder store subscriptions
  const activeFolderId = useLinkFoldersStore((s) => s.activeFolderId);
  const createFoldersFromHierarchy = useLinkFoldersStore((s) => s.createFoldersFromHierarchy);

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{ total: number; imported: number; skipped?: number } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    link: Link;
  } | null>(null);

  // Edit modal state
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  // AI Categorization state
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizationProgress, setCategorizationProgress] = useState({ processed: 0, total: 0 });
  const [pendingSuggestions, setPendingSuggestions] = useState<CategorySuggestion[]>([]);
  const [categorizationError, setCategorizationError] = useState<string | null>(null);

  // Dedupe modal state
  const [isDedupeModalOpen, setIsDedupeModalOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [mergeTags, setMergeTags] = useState(true);

  // Delete confirmation modal state
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null);

  // Archive confirmation modal state
  const [linkToArchive, setLinkToArchive] = useState<Link | null>(null);

  // Permanent delete confirmation modal state (for trash view)
  const [linkToPermanentlyDelete, setLinkToPermanentlyDelete] = useState<Link | null>(null);

  // Check if viewing trash
  const isViewingTrash = activeCollectionId === 'deleted';

  // Warm favicon cache on mount and clean expired entries
  useEffect(() => {
    faviconCacheService.warmCache();
    faviconCacheService.cleanExpiredEntries();
  }, []);

  // Run category-to-folder migration on first mount
  useEffect(() => {
    runCategoryMigration();
  }, []);

  // Get filtered and sorted links
  const displayedLinks = useMemo(() => {
    let result: Link[];

    // Filter by folder, collection, or view
    if (activeFolderId !== null) {
      // Folder selected - get links in that folder (already sorted by sortOrder)
      result = getLinksInFolder(activeFolderId);
    } else if (activeCollectionId === 'favorites') {
      result = getFavoriteLinks();
    } else if (activeCollectionId === 'archived') {
      result = getArchivedLinks();
    } else if (activeCollectionId === 'deleted') {
      result = getDeletedLinks();
    } else if (activeCollectionId) {
      result = getLinksInCollection(activeCollectionId);
    } else if (searchQuery) {
      result = searchLinks(searchQuery);
    } else {
      result = getAllLinks();
    }

    // Sort (unless manual sort which uses sortOrder from getLinksInFolder)
    if (sortField !== 'manual') {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'updatedAt':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
          case 'visitCount':
            comparison = a.visitCount - b.visitCount;
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    // For 'manual' sort, getLinksInFolder already returns sorted by sortOrder

    return result;
  }, [
    links, // CRITICAL: Must depend on links to recompute when data changes
    activeFolderId,
    activeCollectionId,
    searchQuery,
    sortField,
    sortDirection,
    getAllLinks,
    getLinksInCollection,
    getLinksInFolder,
    getFavoriteLinks,
    getArchivedLinks,
    getDeletedLinks,
    searchLinks,
  ]);

  // Handle file import
  const handleFileImport = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setImportError(null);
      setImportStats(null);

      try {
        const content = await readFileAsText(file);

        if (!isValidBookmarkFile(content)) {
          throw new Error('Invalid bookmark file format. Please export bookmarks from your browser.');
        }

        const result = parseNetscapeBookmarks(content);

        // Create folders from the parsed hierarchy first
        // This returns a Map of path string ("Parent > Child") -> folder ID
        const pathToFolderIdMap = createFoldersFromHierarchy(
          result.folderStructure.children.map((node) => ({
            name: node.name,
            path: [], // Path is built recursively by createFoldersFromHierarchy
            children: node.children,
          }))
        );

        // Convert bookmarks to links and assign folderId based on folderPath
        const linksToImport = convertToLinks(result.bookmarks).map((link, idx) => {
          const bookmark = result.bookmarks[idx];
          if (bookmark.folderPath && bookmark.folderPath.length > 0) {
            const pathKey = bookmark.folderPath.join(' > ');
            const folderId = pathToFolderIdMap.get(pathKey);
            if (folderId) {
              return { ...link, folderId };
            }
          }
          return link;
        });

        const imported = importLinks(linksToImport);
        const skipped = result.stats.total - imported.length;

        setImportStats({
          total: result.stats.total,
          imported: imported.length,
          skipped: skipped > 0 ? skipped : undefined,
        });

        // Prefetch favicons for newly imported links
        if (imported.length > 0) {
          const urls = imported.map((link) => link.url);
          faviconCacheService.prefetchFavicons(urls);
        }
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Failed to import bookmarks');
      } finally {
        setIsImporting(false);
      }
    },
    [importLinks, createFoldersFromHierarchy]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
        handleFileImport(file);
      } else {
        setImportError('Please drop a valid HTML bookmark file');
      }
    },
    [handleFileImport]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle file input
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileImport(file);
      }
    },
    [handleFileImport]
  );

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedLinkIds.size > 0) {
      deleteLinks(Array.from(selectedLinkIds));
      clearSelection();
    }
  }, [selectedLinkIds, deleteLinks, clearSelection]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedLinkIds.size === displayedLinks.length) {
      clearSelection();
    } else {
      selectAllLinks(displayedLinks.map((l) => l.id));
    }
  }, [selectedLinkIds.size, displayedLinks, selectAllLinks, clearSelection]);

  // Handle AI categorization (lazy-load the categorizer)
  const handleCategorize = useCallback(async () => {
    // Get links to categorize (uncategorized ones only)
    const uncategorizedLinks = displayedLinks.filter((l) => !l.category);

    if (uncategorizedLinks.length === 0) {
      setCategorizationError('All links are already categorized.');
      return;
    }

    setIsCategorizing(true);
    setCategorizationError(null);
    setCategorizationProgress({ processed: 0, total: uncategorizedLinks.length });

    try {
      // Lazy-load the AI categorization service (and providerRouter) only when needed
      const { categorizeLinksBatched } = await import('../services/linkCategorizer');

      const result = await categorizeLinksBatched(
        uncategorizedLinks,
        10, // Batch size
        (processed, total, _batch) => {
          setCategorizationProgress({ processed, total });
        }
      );

      setIsCategorizing(false);

      if (result.success && result.suggestions.length > 0) {
        setPendingSuggestions(result.suggestions);
      } else if (result.error) {
        setCategorizationError(result.error);
      }
    } catch (error) {
      setIsCategorizing(false);
      setCategorizationError(error instanceof Error ? error.message : 'Failed to load AI categorization');
    }
  }, [displayedLinks]);

  // Accept a category suggestion
  const handleAcceptSuggestion = useCallback(
    (suggestion: CategorySuggestion) => {
      updateLink(suggestion.linkId, {
        category: suggestion.category,
        tags: suggestion.tags,
      });
      setPendingSuggestions((prev) => prev.filter((s) => s.linkId !== suggestion.linkId));
    },
    [updateLink]
  );

  // Reject a category suggestion
  const handleRejectSuggestion = useCallback((linkId: string) => {
    setPendingSuggestions((prev) => prev.filter((s) => s.linkId !== linkId));
  }, []);

  // Accept all suggestions
  const handleAcceptAllSuggestions = useCallback(() => {
    pendingSuggestions.forEach((suggestion) => {
      updateLink(suggestion.linkId, {
        category: suggestion.category,
        tags: suggestion.tags,
      });
    });
    setPendingSuggestions([]);
  }, [pendingSuggestions, updateLink]);

  // Dismiss all suggestions
  const handleDismissAllSuggestions = useCallback(() => {
    setPendingSuggestions([]);
  }, []);

  // Handle export
  const getTree = useLinkFoldersStore((s) => s.getTree);
  const handleExport = useCallback(() => {
    const allLinks = getAllLinks();
    const folderTree = getTree();
    exportAndDownload(allLinks, folderTree, { title: 'NeumanOS Bookmarks' });
  }, [getAllLinks, getTree]);

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, link: Link) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, link });
  }, []);

  // Handle edit link
  const handleEditLink = useCallback((link: Link) => {
    setEditingLink(link);
  }, []);

  // Handle delete single link - show confirmation modal
  const handleDeleteLink = useCallback((link: Link) => {
    setLinkToDelete(link);
    setContextMenu(null);
  }, []);

  // Confirm delete - actually delete the link
  const confirmDeleteLink = useCallback(() => {
    if (linkToDelete) {
      deleteLink(linkToDelete.id);
      setLinkToDelete(null);
    }
  }, [linkToDelete, deleteLink]);

  // Handle archive single link - show confirmation modal
  const handleArchiveLink = useCallback((link: Link) => {
    setLinkToArchive(link);
    setContextMenu(null);
  }, []);

  // Confirm archive - actually toggle the archive state
  const confirmArchiveLink = useCallback(() => {
    if (linkToArchive) {
      toggleArchived(linkToArchive.id);
      setLinkToArchive(null);
    }
  }, [linkToArchive, toggleArchived]);

  // Handle restore link (from trash)
  const handleRestoreLink = useCallback((link: Link) => {
    restoreLink(link.id);
  }, [restoreLink]);

  // Handle permanent delete - show confirmation modal
  const handlePermanentDeleteLink = useCallback((link: Link) => {
    setLinkToPermanentlyDelete(link);
  }, []);

  // Confirm permanent delete
  const confirmPermanentDeleteLink = useCallback(() => {
    if (linkToPermanentlyDelete) {
      permanentlyDeleteLink(linkToPermanentlyDelete.id);
      setLinkToPermanentlyDelete(null);
    }
  }, [linkToPermanentlyDelete, permanentlyDeleteLink]);

  // Handle bulk restore
  const handleBulkRestore = useCallback(() => {
    if (selectedLinkIds.size > 0) {
      restoreLinks(Array.from(selectedLinkIds));
      clearSelection();
    }
  }, [selectedLinkIds, restoreLinks, clearSelection]);

  // Handle empty trash
  const handleEmptyTrash = useCallback(() => {
    if (confirm('Are you sure you want to permanently delete all items in trash? This cannot be undone.')) {
      emptyTrash();
    }
  }, [emptyTrash]);

  // ========================================================================
  // Drag and Drop for Links (Manual Sort Mode)
  // ========================================================================

  // Check if DnD mode is active (folder selected + manual sort)
  const isDnDMode = activeFolderId !== null && sortField === 'manual';

  // DnD sensors with click protection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Click protection during drag
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // Keep clicks disabled briefly after drag ends
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragging(false);
        dragTimeoutRef.current = null;
      }, 150);

      if (over && active.id !== over.id) {
        const oldIndex = displayedLinks.findIndex((link) => link.id === active.id);
        const newIndex = displayedLinks.findIndex((link) => link.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(displayedLinks, oldIndex, newIndex);
          reorderLinksInFolder(
            activeFolderId,
            newOrder.map((link) => link.id)
          );
        }
      }
    },
    [displayedLinks, activeFolderId, reorderLinksInFolder]
  );

  const linkCount = Object.keys(links).length;
  const collectionCount = Object.keys(collections).length;

  return (
    <PageContent page="links" variant="split-view">
      {/* Collection Sidebar */}
      <CollectionSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 p-4 overflow-hidden">
        {/* Stats Bar */}
        <div className="flex items-center gap-4 mb-3 text-sm text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0">
          <span>{linkCount} links</span>
          <span>•</span>
          <span>{collectionCount} collections</span>
          {selectedLinkIds.size > 0 && (
            <>
              <span>•</span>
              <span className="text-accent-blue">{selectedLinkIds.size} selected</span>
            </>
          )}
        </div>

        {/* Action Bar - scrollable on narrow screens */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0 overflow-x-auto pb-1">
        {/* Search */}
        <div className="min-w-[200px] max-w-xs flex-shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search links..."
            className="w-full px-4 py-2 rounded-button border border-border-light dark:border-border-dark
                       bg-surface-light dark:bg-surface-dark
                       text-text-light-primary dark:text-text-dark-primary
                       focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-button bg-surface-light-elevated dark:bg-surface-dark-elevated">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'grid'
                ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-text-light-primary dark:text-text-dark-primary'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'list'
                ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-text-light-primary dark:text-text-dark-primary'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
          >
            List
          </button>
        </div>

        {/* Sort */}
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as typeof sortField)}
          className="px-3 py-2 rounded-button border border-border-light dark:border-border-dark
                     bg-surface-light dark:bg-surface-dark
                     text-text-light-primary dark:text-text-dark-primary text-sm"
        >
          <option value="createdAt">Date Added</option>
          <option value="updatedAt">Last Updated</option>
          <option value="title">Title</option>
          <option value="visitCount">Most Visited</option>
          {activeFolderId !== null && <option value="manual">Manual (Drag to reorder)</option>}
        </select>

        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          className="p-2 rounded-button border border-border-light dark:border-border-dark
                     bg-surface-light dark:bg-surface-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
                     transition-colors"
          title={sortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>

        {/* Import Button */}
        <label className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button
                         text-sm font-medium cursor-pointer transition-colors">
          Import
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        {/* Export Button */}
        {linkCount > 0 && (
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-border-light dark:border-border-dark
                       bg-surface-light dark:bg-surface-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
                       text-text-light-primary dark:text-text-dark-primary rounded-button
                       text-sm font-medium transition-colors"
          >
            Export
          </button>
        )}

        {/* AI Categorize Button - AI provider SDK only loads when clicked */}
        {linkCount > 0 && (
          <button
            onClick={handleCategorize}
            disabled={isCategorizing}
            className="px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary
                       hover:from-accent-primary-hover hover:to-accent-secondary-hover
                       text-white rounded-button text-sm font-medium transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
            title="Use AI to categorize uncategorized links"
          >
            {isCategorizing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Categorizing...
              </>
            ) : (
              'AI Categorize'
            )}
          </button>
        )}

        {/* Find Duplicates Button */}
        {linkCount > 0 && (
          <button
            onClick={() => {
              const groups = findDuplicates();
              setDuplicateGroups(groups);
              setIsDedupeModalOpen(true);
            }}
            className="px-4 py-2 border border-border-light dark:border-border-dark
                       bg-surface-light dark:bg-surface-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
                       text-text-light-primary dark:text-text-dark-primary rounded-button
                       text-sm font-medium transition-colors"
            title="Find and merge duplicate bookmarks"
          >
            Find Duplicates
          </button>
        )}

        {/* Bulk Actions (when items selected) */}
        {selectedLinkIds.size > 0 && !isViewingTrash && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-accent-red hover:bg-accent-red-hover text-white rounded-button
                       text-sm font-medium transition-colors"
          >
            Delete ({selectedLinkIds.size})
          </button>
        )}

        {/* Trash-specific actions */}
        {isViewingTrash && selectedLinkIds.size > 0 && (
          <button
            onClick={handleBulkRestore}
            className="px-4 py-2 bg-accent-green hover:bg-accent-green-hover text-white rounded-button
                       text-sm font-medium transition-colors"
          >
            Restore ({selectedLinkIds.size})
          </button>
        )}

        {isViewingTrash && displayedLinks.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-2 bg-accent-red hover:bg-accent-red-hover text-white rounded-button
                       text-sm font-medium transition-colors"
          >
            Empty Trash
          </button>
        )}
      </div>

      {/* Import Status */}
      {(importError || importStats) && (
        <div
          className={`mb-6 p-4 rounded-button ${importError
              ? 'bg-accent-red/10 border border-accent-red text-accent-red'
              : 'bg-accent-green/10 border border-accent-green text-accent-green'
            }`}
        >
          {importError ? (
            <p>{importError}</p>
          ) : importStats ? (
            <div>
              <p className="font-medium">
                Successfully imported {importStats.imported} of {importStats.total} bookmarks!
              </p>
              {importStats.skipped && importStats.skipped > 0 && (
                <p className="text-sm mt-1 opacity-90">
                  Skipped {importStats.skipped} duplicate{importStats.skipped > 1 ? 's' : ''} (already in library)
                </p>
              )}
            </div>
          ) : null}
          <button
            onClick={() => {
              setImportError(null);
              setImportStats(null);
            }}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Categorization Progress */}
      {isCategorizing && (
        <div className="mb-6 p-4 rounded-button bg-accent-primary/10 border border-accent-primary">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            <div className="flex-1">
              <p className="text-text-light-primary dark:text-text-dark-primary font-medium">
                Categorizing links with AI...
              </p>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {categorizationProgress.processed} of {categorizationProgress.total} processed
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
              style={{
                width: `${categorizationProgress.total > 0
                  ? (categorizationProgress.processed / categorizationProgress.total) * 100
                  : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Categorization Error */}
      {categorizationError && (
        <div className="mb-6 p-4 rounded-button bg-accent-red/10 border border-accent-red text-accent-red">
          <p>{categorizationError}</p>
          <button
            onClick={() => setCategorizationError(null)}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI Category Suggestions */}
      {pendingSuggestions.length > 0 && (
        <div className="mb-6 p-4 rounded-card bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 border border-accent-primary/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                AI Category Suggestions
              </h3>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {pendingSuggestions.length} suggestions ready for review
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptAllSuggestions}
                className="px-3 py-1.5 bg-accent-green hover:bg-accent-green-hover text-white rounded-button text-sm font-medium transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={handleDismissAllSuggestions}
                className="px-3 py-1.5 border border-border-light dark:border-border-dark
                           text-text-light-secondary dark:text-text-dark-secondary
                           hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
                           rounded-button text-sm font-medium transition-colors"
              >
                Dismiss All
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingSuggestions.map((suggestion) => {
              const link = links[suggestion.linkId];
              if (!link) return null;
              return (
                <div
                  key={suggestion.linkId}
                  className="flex items-center gap-3 p-3 rounded-button bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {link.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-accent-blue/10 text-accent-blue">
                        {suggestion.category}
                      </span>
                      {suggestion.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-full bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {Math.round(suggestion.confidence * 100)}% confident
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptSuggestion(suggestion)}
                    className="p-2 text-accent-green hover:bg-accent-green/10 rounded transition-colors"
                    title="Accept"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion.linkId)}
                    className="p-2 text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                    title="Reject"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trash Info Banner */}
      {isViewingTrash && displayedLinks.length > 0 && (
        <div className="mb-4 p-4 rounded-button bg-status-warning/10 border border-status-warning/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗑️</span>
            <div className="flex-1">
              <p className="text-text-light-primary dark:text-text-dark-primary font-medium">
                Recently Deleted
              </p>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Items here will be permanently deleted after 30 days. Restore items to keep them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {displayedLinks.length === 0 ? (
        /* Empty State / Drop Zone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 flex flex-col items-center justify-center p-8
                     border-2 border-dashed border-border-light dark:border-border-dark rounded-card
                     bg-surface-light dark:bg-surface-dark-elevated"
        >
          {isImporting ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-text-light-secondary dark:text-text-dark-secondary">
                Importing bookmarks...
              </p>
            </div>
          ) : (
            <>
              <span className="text-6xl mb-4">🔗</span>
              <h3 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
                {searchQuery ? 'No links found' : 'No links yet'}
              </h3>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-center max-w-md mb-6">
                {searchQuery
                  ? `No links match "${searchQuery}"`
                  : 'Import your browser bookmarks or add links manually to get started.'}
              </p>
              {!searchQuery && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Drag and drop a bookmark HTML file here, or
                  </p>
                  <label className="px-6 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button
                                   text-base font-medium cursor-pointer transition-colors">
                    Choose File
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </>
          )}
        </div>
      ) : isDnDMode ? (
        /* DnD-enabled List (Manual Sort Mode) */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Info banner */}
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded bg-accent-primary/10 text-accent-primary text-sm flex-shrink-0">
            <GripVertical className="w-4 h-4" />
            <span>Drag items to reorder. Changes are saved automatically.</span>
          </div>

          {/* DnD List */}
          <div className="flex-1 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayedLinks.map((link) => link.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {displayedLinks.map((link) => (
                    <SortableLinkItem
                      key={link.id}
                      link={link}
                      isSelected={selectedLinkIds.has(link.id)}
                      isDragging={isDragging}
                      onToggleSelection={toggleLinkSelection}
                      onToggleFavorite={toggleFavorite}
                      onEdit={handleEditLink}
                      onDelete={handleDeleteLink}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      ) : (
        /* Links Grid/List - Virtualized */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <input
              type="checkbox"
              checked={selectedLinkIds.size === displayedLinks.length && displayedLinks.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4"
            />
            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Select All
            </span>
          </div>

          {/* Virtualized Grid/List Container - relative parent for absolute AutoSizer */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <AutoSizer>
              {({ height, width }) => {
                // Ensure we have valid dimensions
                if (!height || !width || height < 100 || width < 100) {
                  return <div style={{ height, width }}>Loading...</div>;
                }

                if (viewMode === 'grid') {
                  // Calculate columns based on available width
                  const columnCount = Math.max(2, Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)));
                  const columnWidth = (width - (columnCount - 1) * CARD_GAP) / columnCount;
                  const rowCount = Math.ceil(displayedLinks.length / columnCount);

                  return (
                    <div style={{ width, height, overflowX: 'hidden', overflowY: 'auto' }}>
                      <Grid
                        columnCount={columnCount}
                        columnWidth={columnWidth + CARD_GAP}
                        defaultHeight={height}
                        defaultWidth={width}
                        rowCount={rowCount}
                        rowHeight={CARD_HEIGHT + CARD_GAP}
                        cellProps={{
                          links: displayedLinks,
                          columnCount,
                          selectedLinkIds,
                          toggleLinkSelection,
                          toggleFavorite,
                          onArchive: handleArchiveLink,
                          onDelete: handleDeleteLink,
                          onEdit: handleEditLink,
                          onContextMenu: handleContextMenu,
                          isViewingTrash,
                          onRestore: handleRestoreLink,
                          onPermanentDelete: handlePermanentDeleteLink,
                        }}
                        overscanCount={2}
                        cellComponent={GridCell}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div style={{ width, height, overflowX: 'hidden', overflowY: 'auto' }}>
                      <List
                        defaultHeight={height}
                        rowCount={displayedLinks.length}
                        rowHeight={LIST_ITEM_HEIGHT + 8}
                        rowProps={{
                          links: displayedLinks,
                          selectedLinkIds,
                          toggleLinkSelection,
                          toggleFavorite,
                          onArchive: handleArchiveLink,
                          onDelete: handleDeleteLink,
                          onEdit: handleEditLink,
                          onContextMenu: handleContextMenu,
                          isViewingTrash,
                          onRestore: handleRestoreLink,
                          onPermanentDelete: handlePermanentDeleteLink,
                        }}
                        overscanCount={5}
                        rowComponent={ListRow}
                      />
                    </div>
                  );
                }
              }}
              </AutoSizer>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <LinkContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          link={contextMenu.link}
          onClose={() => setContextMenu(null)}
          onEdit={() => {
            setEditingLink(contextMenu.link);
            setContextMenu(null);
          }}
          onFavorite={() => {
            toggleFavorite(contextMenu.link.id);
            setContextMenu(null);
          }}
          onArchive={() => {
            handleArchiveLink(contextMenu.link);
          }}
          onDelete={() => {
            handleDeleteLink(contextMenu.link);
          }}
        />
      )}

      {/* Edit Link Modal */}
      {editingLink && (
        <LinkEditModal
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSave={(updates) => {
            updateLink(editingLink.id, updates);
            setEditingLink(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {linkToDelete && (
        <Modal isOpen={true} onClose={() => setLinkToDelete(null)} title="Delete Bookmark" maxWidth="sm">
          <div className="space-y-4">
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Are you sure you want to delete this bookmark?
            </p>
            <div className="p-3 rounded-lg bg-surface-light-elevated dark:bg-surface-dark border border-border-light dark:border-border-dark">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                {linkToDelete.title}
              </p>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary truncate mt-1">
                {linkToDelete.url}
              </p>
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              It will be moved to Recently Deleted and can be restored within 30 days.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setLinkToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDeleteLink}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Archive Confirmation Modal */}
      {linkToArchive && (
        <Modal isOpen={true} onClose={() => setLinkToArchive(null)} title={linkToArchive.isArchived ? "Unarchive Bookmark" : "Archive Bookmark"} maxWidth="sm">
          <div className="space-y-4">
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              {linkToArchive.isArchived
                ? "Are you sure you want to unarchive this bookmark? It will be restored to your library."
                : "Are you sure you want to archive this bookmark? You can find it later in the Archived section."}
            </p>
            <div className="p-3 rounded-lg bg-surface-light-elevated dark:bg-surface-dark border border-border-light dark:border-border-dark">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                {linkToArchive.title}
              </p>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary truncate mt-1">
                {linkToArchive.url}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setLinkToArchive(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmArchiveLink}>
                {linkToArchive.isArchived ? "Unarchive" : "Archive"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Permanent Delete Confirmation Modal (Trash View) */}
      {linkToPermanentlyDelete && (
        <Modal isOpen={true} onClose={() => setLinkToPermanentlyDelete(null)} title="Permanently Delete" maxWidth="sm">
          <div className="space-y-4">
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Are you sure you want to permanently delete this bookmark?
            </p>
            <div className="p-3 rounded-lg bg-surface-light-elevated dark:bg-surface-dark border border-border-light dark:border-border-dark">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                {linkToPermanentlyDelete.title}
              </p>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary truncate mt-1">
                {linkToPermanentlyDelete.url}
              </p>
            </div>
            <p className="text-sm text-accent-red font-medium">
              This action cannot be undone. The bookmark will be gone forever.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setLinkToPermanentlyDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmPermanentDeleteLink}>
                Permanently Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dedupe Modal */}
      {isDedupeModalOpen && (
        <DedupeModal
          duplicateGroups={duplicateGroups}
          mergeTags={mergeTags}
          onMergeTagsChange={setMergeTags}
          onMergeGroup={(keepId, deleteIds) => {
            mergeDuplicates(keepId, deleteIds, mergeTags);
            // Update local state to remove merged group
            setDuplicateGroups((prev) =>
              prev.filter((g) => !g.links.some((l) => l.id === keepId))
            );
          }}
          onMergeAll={() => {
            // Keep newest in each group
            for (const group of duplicateGroups) {
              const sorted = [...group.links].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
              );
              const keepId = sorted[0].id;
              const deleteIds = sorted.slice(1).map((l) => l.id);
              mergeDuplicates(keepId, deleteIds, mergeTags);
            }
            setDuplicateGroups([]);
            setIsDedupeModalOpen(false);
          }}
          onClose={() => setIsDedupeModalOpen(false)}
        />
      )}
    </PageContent>
  );
};

// ============================================================================
// Virtualized Grid Cell Component
// ============================================================================

interface GridCellCustomProps {
  links: Link[];
  columnCount: number;
  selectedLinkIds: Set<string>;
  toggleLinkSelection: (id: string) => void;
  toggleFavorite: (id: string) => void;
  onArchive: (link: Link) => void;
  onDelete: (link: Link) => void;
  onEdit: (link: Link) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
  isViewingTrash: boolean;
  onRestore: (link: Link) => void;
  onPermanentDelete: (link: Link) => void;
}

// react-window v2 passes columnIndex, rowIndex, style, ariaAttributes automatically
const GridCell = (props: GridCellCustomProps & {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  ariaAttributes: { 'aria-colindex': number; role: 'gridcell' };
}) => {
  const { links, columnCount, selectedLinkIds, toggleLinkSelection, toggleFavorite, onArchive, onDelete, onEdit, onContextMenu, isViewingTrash, onRestore, onPermanentDelete, columnIndex, rowIndex, style } = props;
  const index = rowIndex * columnCount + columnIndex;

  if (index >= links.length) {
    return <div style={style} />;
  }

  const link = links[index];
  const isSelected = selectedLinkIds.has(link.id);

  return (
    <div style={{ ...style, paddingRight: CARD_GAP, paddingBottom: CARD_GAP }}>
      <LinkCard
        link={link}
        isSelected={isSelected}
        onToggleSelect={() => toggleLinkSelection(link.id)}
        onToggleFavorite={() => toggleFavorite(link.id)}
        onToggleArchive={() => onArchive(link)}
        onDelete={() => onDelete(link)}
        onEdit={() => onEdit(link)}
        onContextMenu={(e) => onContextMenu(e, link)}
        isViewingTrash={isViewingTrash}
        onRestore={() => onRestore(link)}
        onPermanentDelete={() => onPermanentDelete(link)}
      />
    </div>
  );
};

// ============================================================================
// Virtualized List Row Component
// ============================================================================

interface ListRowCustomProps {
  links: Link[];
  selectedLinkIds: Set<string>;
  toggleLinkSelection: (id: string) => void;
  toggleFavorite: (id: string) => void;
  onArchive: (link: Link) => void;
  onDelete: (link: Link) => void;
  onEdit: (link: Link) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
  isViewingTrash: boolean;
  onRestore: (link: Link) => void;
  onPermanentDelete: (link: Link) => void;
}

// react-window v2 passes index, style, ariaAttributes automatically
const ListRow = (props: ListRowCustomProps & {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' };
}) => {
  const { links, selectedLinkIds, toggleLinkSelection, toggleFavorite, onArchive, onDelete, onEdit, onContextMenu, isViewingTrash, onRestore, onPermanentDelete, index, style } = props;
  const link = links[index];
  const isSelected = selectedLinkIds.has(link.id);

  return (
    <div style={{ ...style, paddingBottom: 8 }}>
      <LinkListItem
        link={link}
        isSelected={isSelected}
        onToggleSelect={() => toggleLinkSelection(link.id)}
        onToggleFavorite={() => toggleFavorite(link.id)}
        onToggleArchive={() => onArchive(link)}
        onDelete={() => onDelete(link)}
        onEdit={() => onEdit(link)}
        onContextMenu={(e) => onContextMenu(e, link)}
        isViewingTrash={isViewingTrash}
        onRestore={() => onRestore(link)}
        onPermanentDelete={() => onPermanentDelete(link)}
      />
    </div>
  );
};

// ============================================================================
// Sortable Link Item Component (DnD Mode)
// ============================================================================

interface SortableLinkItemProps {
  link: Link;
  isSelected: boolean;
  isDragging: boolean;
  onToggleSelection: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (link: Link) => void;
  onContextMenu: (e: React.MouseEvent, link: Link) => void;
}

const SortableLinkItem = memo(function SortableLinkItem({
  link,
  isSelected,
  isDragging,
  onToggleSelection,
  onToggleFavorite,
  onEdit,
  onDelete,
}: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id: link.id });

  // Use cached favicon
  const faviconUrl = useCachedFavicon(link.url, link.favicon);
  const hostname = useMemo(() => getHostname(link.url), [link.url]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isItemDragging ? 0.5 : 1,
    pointerEvents: isDragging ? 'none' : 'auto',
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        return;
      }
      onToggleSelection(link.id);
    },
    [isDragging, link.id, onToggleSelection]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
        isSelected
          ? 'bg-accent-blue/10 border-accent-blue'
          : 'bg-surface-light dark:bg-surface-dark-elevated border-border-light dark:border-border-dark hover:border-accent-primary'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark cursor-grab active:cursor-grabbing text-text-light-secondary dark:text-text-dark-secondary"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Selection Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelection(link.id)}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="w-4 h-4"
      />

      {/* Favicon */}
      <img
        src={faviconUrl}
        alt=""
        className="w-5 h-5 rounded flex-shrink-0"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
        }}
      />

      {/* Title & URL */}
      <div className="flex-1 min-w-0" onClick={handleClick}>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
            }
          }}
          className="font-medium text-text-light-primary dark:text-text-dark-primary hover:text-accent-blue truncate block"
        >
          {link.title || link.url}
        </a>
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary truncate">
          {hostname}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(link.id);
          }}
          className={`p-1 rounded transition-colors ${
            link.isFavorite
              ? 'text-accent-yellow'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-yellow'
          }`}
          title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {link.isFavorite ? '★' : '☆'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(link);
          }}
          className="p-1 rounded text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue transition-colors"
          title="Edit"
        >
          ✎
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link);
          }}
          className="p-1 rounded text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-red transition-colors"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// Link Card Component (Grid View) - Compact Layout
// ============================================================================

interface LinkCardProps {
  link: Link;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isViewingTrash?: boolean;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}

// Fallback favicon URL (Google's service) - used when cache misses
const getFallbackFaviconUrl = (url: string, size: number = 32): string => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
  } catch {
    return '';
  }
};

// Hook for cached favicon - returns cached data URL or triggers async fetch
const useCachedFavicon = (url: string, storedFavicon?: string): string => {
  const [cachedFavicon, setCachedFavicon] = useState<string | null>(null);

  useEffect(() => {
    // If link already has a stored favicon, use it
    if (storedFavicon) {
      setCachedFavicon(storedFavicon);
      return;
    }

    // Check memory cache synchronously first
    const syncCached = faviconCacheService.getFaviconSync(url);
    if (syncCached) {
      setCachedFavicon(syncCached);
      return;
    }

    // Trigger async fetch
    let cancelled = false;
    faviconCacheService.getFavicon(url).then((dataUrl) => {
      if (!cancelled && dataUrl) {
        setCachedFavicon(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url, storedFavicon]);

  // Return cached favicon, stored favicon, or fallback to Google
  return cachedFavicon || storedFavicon || getFallbackFaviconUrl(url);
};

// Memoized hostname extractor
const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const LinkCard = memo<LinkCardProps>(({
  link,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onEdit,
  onContextMenu,
  isViewingTrash,
  onRestore,
  onPermanentDelete,
}) => {
  // Use cached favicon (Memory → IndexedDB → DDG → Google fallback)
  const faviconUrl = useCachedFavicon(link.url, link.favicon);
  const hostname = useMemo(() => getHostname(link.url), [link.url]);

  return (
    <div
      className={`
        h-full p-2.5 rounded-lg bg-surface-light dark:bg-surface-dark-elevated
        border transition-colors duration-150 flex flex-col cursor-pointer
        ${isSelected
          ? 'border-accent-blue ring-2 ring-accent-blue/20'
          : 'border-border-light dark:border-border-dark hover:border-accent-blue/50'
        }
      `}
      onContextMenu={onContextMenu}
      onDoubleClick={onEdit}
    >
      {/* Header Row: Checkbox + Favicon + Title + Actions */}
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5"
        />
        <img
          src={faviconUrl}
          alt=""
          className="w-4 h-4 rounded flex-shrink-0"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236b7280"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
          }}
        />
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 font-medium text-[13px] leading-tight text-text-light-primary dark:text-text-dark-primary
                     hover:text-accent-blue truncate"
          title={link.title}
        >
          {link.title}
        </a>
        {/* Inline Actions - different for trash view */}
        {isViewingTrash ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onRestore?.(); }}
              className="p-0.5 rounded text-sm text-accent-green hover:text-accent-green-hover transition-colors flex-shrink-0"
              title="Restore"
            >
              ↩️
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(); }}
              className="p-0.5 rounded text-accent-red hover:text-accent-red-hover transition-colors flex-shrink-0"
              title="Permanently delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className={`p-0.5 rounded transition-colors flex-shrink-0 text-sm ${link.isFavorite
                  ? 'text-accent-yellow'
                  : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-yellow'
                }`}
              title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {link.isFavorite ? '★' : '☆'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
              className="p-0.5 rounded text-sm text-text-light-tertiary dark:text-text-dark-tertiary
                         hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors flex-shrink-0"
              title={link.isArchived ? 'Unarchive' : 'Archive'}
            >
              📥
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-0.5 rounded text-accent-red hover:text-accent-red-hover transition-colors flex-shrink-0"
              title="Delete link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Hostname Row */}
      <div className="mt-0.5 pl-[22px]">
        <p className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary truncate">
          {hostname}
        </p>
      </div>

      {/* Category & Tags Row */}
      {(link.category || link.tags.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-1.5 pl-[22px]">
          {link.category && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-accent-blue/10 text-accent-blue">
              {link.category}
            </span>
          )}
          {link.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-[10px] rounded-full bg-surface-light-elevated dark:bg-surface-dark
                         text-text-light-secondary dark:text-text-dark-secondary"
            >
              {tag}
            </span>
          ))}
          {link.tags.length > 2 && (
            <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
              +{link.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

LinkCard.displayName = 'LinkCard';

// ============================================================================
// Link List Item Component (List View) - Compact Layout
// ============================================================================

const LinkListItem = memo<LinkCardProps>(({
  link,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onEdit,
  onContextMenu,
  isViewingTrash,
  onRestore,
  onPermanentDelete,
}) => {
  // Use cached favicon (Memory → IndexedDB → DDG → Google fallback)
  const faviconUrl = useCachedFavicon(link.url, link.favicon);
  const hostname = useMemo(() => getHostname(link.url), [link.url]);

  return (
    <div
      className={`
        flex items-center gap-2 px-2.5 py-1.5 rounded-lg h-full cursor-pointer
        bg-surface-light dark:bg-surface-dark-elevated
        border transition-colors duration-150
        ${isSelected
          ? 'border-accent-blue ring-2 ring-accent-blue/20'
          : 'border-border-light dark:border-border-dark hover:border-accent-blue/50'
        }
      `}
      onContextMenu={onContextMenu}
      onDoubleClick={onEdit}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 rounded appearance-none cursor-pointer border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark-elevated checked:bg-accent-primary checked:border-accent-primary checked:bg-[url('data:image/svg+xml,%3csvg%20viewBox%3D%270%200%2016%2016%27%20fill%3D%27white%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3e%3cpath%20d%3D%27M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%27%2F%3e%3c%2Fsvg%3e')] bg-center bg-no-repeat flex-shrink-0"
      />

      <img
        src={faviconUrl}
        alt=""
        className="w-4 h-4 rounded flex-shrink-0"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex-1 min-w-0 font-medium text-[13px] text-text-light-primary dark:text-text-dark-primary
                   hover:text-accent-blue truncate"
        title={link.title}
      >
        {link.title}
      </a>

      <span className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary truncate max-w-[160px] flex-shrink-0">
        {hostname}
      </span>

      {link.category && (
        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-accent-blue/10 text-accent-blue flex-shrink-0">
          {link.category}
        </span>
      )}

      {isViewingTrash ? (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onRestore?.(); }}
            className="p-0.5 rounded text-sm text-accent-green hover:text-accent-green-hover transition-colors flex-shrink-0"
            title="Restore"
          >
            ↩️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPermanentDelete?.(); }}
            className="p-0.5 rounded text-accent-red hover:text-accent-red-hover transition-colors flex-shrink-0"
            title="Permanently delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`p-0.5 rounded transition-colors flex-shrink-0 text-sm ${link.isFavorite
                ? 'text-accent-yellow'
                : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-yellow'
              }`}
            title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {link.isFavorite ? '★' : '☆'}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleArchive(); }}
            className="p-0.5 rounded text-sm text-text-light-tertiary dark:text-text-dark-tertiary
                       hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors flex-shrink-0"
            title={link.isArchived ? 'Unarchive' : 'Archive'}
          >
            📥
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-0.5 rounded text-accent-red hover:text-accent-red-hover transition-colors flex-shrink-0"
            title="Delete link"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
});

LinkListItem.displayName = 'LinkListItem';

// ============================================================================
// Context Menu Component
// ============================================================================

interface LinkContextMenuProps {
  x: number;
  y: number;
  link: Link;
  onClose: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function LinkContextMenu({ x, y, link, onClose, onEdit, onFavorite, onArchive, onDelete }: LinkContextMenuProps) {
  return (
    <>
      {/* Backdrop to close menu */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* Menu */}
      <div
        className="fixed z-50 w-48 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1"
        style={{ left: x, top: y }}
      >
        <button
          onClick={onEdit}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
        >
          <span className="text-sm">✏️</span>
          <span className="text-sm">Edit</span>
        </button>
        <button
          onClick={onFavorite}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
        >
          <span className="text-sm">{link.isFavorite ? '☆' : '★'}</span>
          <span className="text-sm">{link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
        </button>
        <button
          onClick={onArchive}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
        >
          <span className="text-sm">📥</span>
          <span className="text-sm">{link.isArchived ? 'Unarchive' : 'Archive'}</span>
        </button>
        <div className="border-t border-border-light dark:border-border-dark my-1" />
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-status-error/10 text-status-error"
        >
          <span className="text-sm">🗑</span>
          <span className="text-sm">Delete</span>
        </button>
      </div>
    </>
  );
}

// ============================================================================
// Edit Link Modal Component
// ============================================================================

interface LinkEditModalProps {
  link: Link;
  onClose: () => void;
  onSave: (updates: Partial<Link>) => void;
}

function LinkEditModal({ link, onClose, onSave }: LinkEditModalProps) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [category, setCategory] = useState(link.category || '');
  const [tagsInput, setTagsInput] = useState(link.tags.join(', '));

  const handleSave = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      title,
      url,
      category: category || undefined,
      tags,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Link" maxWidth="md">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-button border border-border-light dark:border-border-dark
                       bg-surface-light dark:bg-surface-dark
                       text-text-light-primary dark:text-text-dark-primary
                       focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-button border border-border-light dark:border-border-dark
                       bg-surface-light dark:bg-surface-dark
                       text-text-light-primary dark:text-text-dark-primary
                       focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Development, Design, News"
            className="w-full px-3 py-2 rounded-button border border-border-light dark:border-border-dark
                       bg-surface-light dark:bg-surface-dark
                       text-text-light-primary dark:text-text-dark-primary
                       focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g., react, typescript, tutorial"
            className="w-full px-3 py-2 rounded-button border border-border-light dark:border-border-dark
                       bg-surface-light dark:bg-surface-dark
                       text-text-light-primary dark:text-text-dark-primary
                       focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Dedupe Modal Component
// ============================================================================

interface DedupeModalProps {
  duplicateGroups: DuplicateGroup[];
  mergeTags: boolean;
  onMergeTagsChange: (value: boolean) => void;
  onMergeGroup: (keepId: string, deleteIds: string[]) => void;
  onMergeAll: () => void;
  onClose: () => void;
}

function DedupeModal({
  duplicateGroups,
  mergeTags,
  onMergeTagsChange,
  onMergeGroup,
  onMergeAll,
  onClose,
}: DedupeModalProps) {
  // Track which link to keep in each group (default: newest)
  const [selectedKeepIds, setSelectedKeepIds] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const group of duplicateGroups) {
      // Default to newest (sort by createdAt descending)
      const sorted = [...group.links].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      initial[group.normalizedUrl] = sorted[0].id;
    }
    return initial;
  });

  const handleMergeGroup = (group: DuplicateGroup) => {
    const keepId = selectedKeepIds[group.normalizedUrl];
    const deleteIds = group.links.filter((l) => l.id !== keepId).map((l) => l.id);
    onMergeGroup(keepId, deleteIds);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Duplicate Links" maxWidth="lg">
      <div className="space-y-4">
        {duplicateGroups.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">✨</span>
            <p className="text-text-light-primary dark:text-text-dark-primary font-medium">
              No duplicates found!
            </p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Your link library is clean.
            </p>
          </div>
        ) : (
          <>
            {/* Header with stats and options */}
            <div className="flex items-center justify-between pb-2 border-b border-border-light dark:border-border-dark">
              <div>
                <p className="text-text-light-primary dark:text-text-dark-primary font-medium">
                  Found {duplicateGroups.length} duplicate group{duplicateGroups.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {duplicateGroups.reduce((acc, g) => acc + g.links.length - 1, 0)} links can be merged
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeTags}
                  onChange={(e) => onMergeTagsChange(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  Merge tags from deleted links
                </span>
              </label>
            </div>

            {/* Duplicate groups list */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {duplicateGroups.map((group) => (
                <div
                  key={group.normalizedUrl}
                  className="p-4 rounded-card border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark-elevated"
                >
                  {/* Group header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary font-mono truncate">
                        {group.normalizedUrl}
                      </p>
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {group.links.length} duplicates
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMergeGroup(group)}
                    >
                      Merge
                    </Button>
                  </div>

                  {/* Links in group */}
                  <div className="space-y-2">
                    {group.links
                      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                      .map((link, index) => (
                        <label
                          key={link.id}
                          className={`flex items-center gap-3 p-2 rounded-button cursor-pointer transition-colors ${
                            selectedKeepIds[group.normalizedUrl] === link.id
                              ? 'bg-accent-blue/10 border border-accent-blue'
                              : 'bg-surface-light dark:bg-surface-dark border border-transparent hover:border-border-light dark:hover:border-border-dark'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`keep-${group.normalizedUrl}`}
                            checked={selectedKeepIds[group.normalizedUrl] === link.id}
                            onChange={() =>
                              setSelectedKeepIds((prev) => ({
                                ...prev,
                                [group.normalizedUrl]: link.id,
                              }))
                            }
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                                {link.title}
                              </span>
                              {index === 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-accent-green/10 text-accent-green">
                                  Newest
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary truncate">
                                {link.url}
                              </span>
                              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0">
                                • {formatDate(link.createdAt)}
                              </span>
                            </div>
                            {link.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {link.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.5 text-[10px] rounded-full bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {link.tags.length > 3 && (
                                  <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                                    +{link.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="flex justify-between pt-2 border-t border-border-light dark:border-border-dark">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={onMergeAll}
              >
                Merge All (Keep Newest)
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default LinkLibrary;
