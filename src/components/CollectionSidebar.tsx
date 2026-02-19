/**
 * Collection Sidebar
 *
 * Sidebar for Link Library showing:
 * - Quick filters (All, Favorites, Archived)
 * - Hierarchical folder tree
 * - User-created collections
 * - Collection & folder CRUD operations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useLinkLibraryStore } from '../stores/useLinkLibraryStore';
import { useLinkFoldersStore } from '../stores/useLinkFoldersStore';
import { LinkFolderTree } from './links/LinkFolderTree';
import { ConfirmDialog } from './ConfirmDialog';

interface CollectionSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CollectionSidebar: React.FC<CollectionSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const {
    collections,
    links,
    activeCollectionId,
    setActiveCollection,
    addCollection,
    updateCollection,
    deleteCollection,
    getLinksInFolder,
    moveLinksToFolder,
    deleteLinks,
  } = useLinkLibraryStore();

  const {
    folders,
    activeFolderId,
    getTree,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleExpanded,
    reorderFolders,
    setActiveFolder,
  } = useLinkFoldersStore();

  // Collection state
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [addingFolderParentId, setAddingFolderParentId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteAction, setDeleteAction] = useState<'move-to-parent' | 'delete'>('move-to-parent');

  // Calculate counts for quick filters
  const favoriteCount = Object.values(links).filter(
    (l) => l.isFavorite && !l.isArchived && !l.deletedAt
  ).length;
  const archivedCount = Object.values(links).filter(
    (l) => l.isArchived && !l.deletedAt
  ).length;
  const deletedCount = Object.values(links).filter((l) => l.deletedAt).length;

  // Get folder tree with computed expandedFolderIds
  const folderTree = useMemo(() => getTree(), [folders, getTree]);
  const expandedFolderIds = useMemo(() => {
    const expanded = new Set<string>();
    Object.values(folders).forEach((f) => {
      if (f.isExpanded) expanded.add(f.id);
    });
    return expanded;
  }, [folders]);

  // Get sorted collections
  const sortedCollections = Object.values(collections).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  // ========================================================================
  // Collection Handlers
  // ========================================================================

  const handleAddCollection = useCallback(() => {
    if (newCollectionName.trim()) {
      addCollection({
        name: newCollectionName.trim(),
        linkIds: [],
        isExpanded: true,
      });
      setNewCollectionName('');
      setIsAddingCollection(false);
    }
  }, [newCollectionName, addCollection]);

  const handleEditCollection = useCallback(
    (id: string) => {
      if (editingName.trim()) {
        updateCollection(id, { name: editingName.trim() });
        setEditingCollectionId(null);
        setEditingName('');
      }
    },
    [editingName, updateCollection]
  );

  const handleDeleteCollection = useCallback((id: string) => {
    setCollectionToDelete(id);
  }, []);

  const confirmDeleteCollection = useCallback(() => {
    if (collectionToDelete) {
      deleteCollection(collectionToDelete);
      if (activeCollectionId === collectionToDelete) {
        setActiveCollection(null);
      }
      setCollectionToDelete(null);
    }
  }, [collectionToDelete, deleteCollection, activeCollectionId, setActiveCollection]);

  const startEditingCollection = useCallback((id: string, currentName: string) => {
    setEditingCollectionId(id);
    setEditingName(currentName);
  }, []);

  // ========================================================================
  // Folder Handlers
  // ========================================================================

  const handleSelectFolder = useCallback(
    (folderId: string | null) => {
      setActiveFolder(folderId);
      // Clear collection selection when selecting a folder
      setActiveCollection(null);
    },
    [setActiveFolder, setActiveCollection]
  );

  const handleCreateSubfolder = useCallback((parentId: string | null) => {
    setAddingFolderParentId(parentId);
    setIsAddingFolder(true);
    setNewFolderName('');
  }, []);

  const handleAddFolder = useCallback(() => {
    if (newFolderName.trim()) {
      createFolder({
        name: newFolderName.trim(),
        parentId: addingFolderParentId,
        isExpanded: true,
        sortOrder: 0,
      });
      setNewFolderName('');
      setIsAddingFolder(false);
      setAddingFolderParentId(null);
    }
  }, [newFolderName, addingFolderParentId, createFolder]);

  const handleRenameFolder = useCallback((id: string, name: string) => {
    setEditingFolderId(id);
    setEditingFolderName(name);
  }, []);

  const handleSaveRenameFolder = useCallback(() => {
    if (editingFolderId && editingFolderName.trim()) {
      updateFolder(editingFolderId, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  }, [editingFolderId, editingFolderName, updateFolder]);

  const handleDeleteFolder = useCallback((id: string, name: string) => {
    setFolderToDelete({ id, name });
    setDeleteAction('move-to-parent');
  }, []);

  const confirmDeleteFolder = useCallback(() => {
    if (folderToDelete) {
      // Get the folder to find its parent
      const folder = folders[folderToDelete.id];
      const parentId = folder?.parentId ?? null;

      // Get links in this folder
      const linksInFolder = getLinksInFolder(folderToDelete.id);
      const linkIds = linksInFolder.map((l) => l.id);

      if (deleteAction === 'move-to-parent' && linkIds.length > 0) {
        // Move links to parent folder (or root if no parent)
        moveLinksToFolder(linkIds, parentId);
      } else if (deleteAction === 'delete' && linkIds.length > 0) {
        // Delete all links in this folder
        deleteLinks(linkIds);
      }

      // Delete the folder itself
      deleteFolder(folderToDelete.id, deleteAction);

      if (activeFolderId === folderToDelete.id) {
        setActiveFolder(null);
      }
      setFolderToDelete(null);
    }
  }, [
    folderToDelete,
    deleteAction,
    deleteFolder,
    activeFolderId,
    folders,
    getLinksInFolder,
    moveLinksToFolder,
    deleteLinks,
  ]);

  const handleToggleFolderExpanded = useCallback(
    (id: string) => {
      toggleExpanded(id);
    },
    [toggleExpanded]
  );

  const handleReorderFolders = useCallback(
    (parentId: string | null, orderedIds: string[]) => {
      reorderFolders(parentId, orderedIds);
    },
    [reorderFolders]
  );

  // ========================================================================
  // Render
  // ========================================================================

  if (isCollapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-4 border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          title="Expand sidebar"
        >
          <span className="text-lg">›</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 flex flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
          Library
        </h3>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            title="Collapse sidebar"
          >
            <span className="text-lg">‹</span>
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="p-2 border-b border-border-light dark:border-border-dark">
        <SidebarItem
          icon="⭐"
          label="Favorites"
          count={favoriteCount}
          isActive={activeCollectionId === 'favorites' && activeFolderId === null}
          onClick={() => {
            setActiveCollection('favorites');
            setActiveFolder(null);
          }}
        />
        <SidebarItem
          icon="📥"
          label="Archived"
          count={archivedCount}
          isActive={activeCollectionId === 'archived' && activeFolderId === null}
          onClick={() => {
            setActiveCollection('archived');
            setActiveFolder(null);
          }}
        />
        <SidebarItem
          icon="🗑️"
          label="Recently Deleted"
          count={deletedCount}
          isActive={activeCollectionId === 'deleted' && activeFolderId === null}
          onClick={() => {
            setActiveCollection('deleted');
            setActiveFolder(null);
          }}
        />
      </div>

      {/* Folders Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
            Folders
          </span>
        </div>

        <div className="px-2">
          <LinkFolderTree
            folders={folderTree}
            activeFolderId={activeFolderId}
            expandedFolderIds={expandedFolderIds}
            onSelect={handleSelectFolder}
            onToggleExpanded={handleToggleFolderExpanded}
            onDelete={handleDeleteFolder}
            onRename={handleRenameFolder}
            onCreateSubfolder={handleCreateSubfolder}
            onReorderFolders={handleReorderFolders}
          />
        </div>

        {/* Add Folder Form (inline) */}
        {isAddingFolder && (
          <div className="px-2 py-2 mt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFolder();
                  if (e.key === 'Escape') {
                    setIsAddingFolder(false);
                    setNewFolderName('');
                  }
                }}
                placeholder={
                  addingFolderParentId ? 'Subfolder name...' : 'Folder name...'
                }
                autoFocus
                className="flex-1 px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark
                           bg-surface-light dark:bg-surface-dark
                           text-text-light-primary dark:text-text-dark-primary
                           focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <button
                onClick={handleAddFolder}
                className="p-1 text-status-success hover:bg-status-success/10 rounded transition-colors"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setIsAddingFolder(false);
                  setNewFolderName('');
                }}
                className="p-1 text-status-error hover:bg-status-error/10 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Rename Folder Form (modal-like) */}
        {editingFolderId && (
          <div className="px-2 py-2 mt-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded mx-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRenameFolder();
                  if (e.key === 'Escape') {
                    setEditingFolderId(null);
                    setEditingFolderName('');
                  }
                }}
                autoFocus
                className="flex-1 px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark
                           bg-surface-light dark:bg-surface-dark
                           text-text-light-primary dark:text-text-dark-primary
                           focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              <button
                onClick={handleSaveRenameFolder}
                className="p-1 text-status-success hover:bg-status-success/10 rounded transition-colors"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setEditingFolderId(null);
                  setEditingFolderName('');
                }}
                className="p-1 text-status-error hover:bg-status-error/10 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Collections Header */}
        <div className="flex items-center justify-between px-4 py-2 mt-4 border-t border-border-light dark:border-border-dark">
          <span className="text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
            Collections
          </span>
          <button
            onClick={() => setIsAddingCollection(true)}
            className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            title="Add collection"
          >
            <span className="text-sm">+</span>
          </button>
        </div>

        {/* Add Collection Form */}
        {isAddingCollection && (
          <div className="px-2 py-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCollection();
                  if (e.key === 'Escape') {
                    setIsAddingCollection(false);
                    setNewCollectionName('');
                  }
                }}
                placeholder="Collection name..."
                autoFocus
                className="flex-1 px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark
                           bg-surface-light dark:bg-surface-dark
                           text-text-light-primary dark:text-text-dark-primary
                           focus:outline-none focus:ring-1 focus:ring-accent-blue"
              />
              <button
                onClick={handleAddCollection}
                className="p-1 text-status-success hover:bg-status-success/10 rounded transition-colors"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setIsAddingCollection(false);
                  setNewCollectionName('');
                }}
                className="p-1 text-status-error hover:bg-status-error/10 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Collections List */}
        <div className="px-2 pb-2">
          {sortedCollections.length === 0 && !isAddingCollection ? (
            <p className="px-2 py-4 text-sm text-center text-text-light-secondary dark:text-text-dark-secondary">
              No collections yet.
              <br />
              <button
                onClick={() => setIsAddingCollection(true)}
                className="text-accent-blue hover:underline mt-1"
              >
                Create one
              </button>
            </p>
          ) : (
            sortedCollections.map((collection) => (
              <div key={collection.id} className="group relative">
                {editingCollectionId === collection.id ? (
                  <div className="flex items-center gap-2 px-2 py-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditCollection(collection.id);
                        if (e.key === 'Escape') {
                          setEditingCollectionId(null);
                          setEditingName('');
                        }
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark
                                 bg-surface-light dark:bg-surface-dark
                                 text-text-light-primary dark:text-text-dark-primary
                                 focus:outline-none focus:ring-1 focus:ring-accent-blue"
                    />
                    <button
                      onClick={() => handleEditCollection(collection.id)}
                      className="p-1 text-status-success hover:bg-status-success/10 rounded transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingCollectionId(null);
                        setEditingName('');
                      }}
                      className="p-1 text-status-error hover:bg-status-error/10 rounded transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <SidebarItem
                    icon={collection.icon || '📁'}
                    label={collection.name}
                    count={collection.linkIds.length}
                    isActive={activeCollectionId === collection.id && activeFolderId === null}
                    onClick={() => {
                      setActiveCollection(collection.id);
                      setActiveFolder(null);
                    }}
                    onEdit={() => startEditingCollection(collection.id, collection.name)}
                    onDelete={() => handleDeleteCollection(collection.id)}
                    color={collection.color}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Collection Confirmation Dialog */}
      <ConfirmDialog
        isOpen={collectionToDelete !== null}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={confirmDeleteCollection}
        title="Delete Collection"
        message="Delete this collection? Links will not be deleted."
        confirmText="Delete"
        variant="danger"
      />

      {/* Delete Folder Confirmation Dialog */}
      <ConfirmDialog
        isOpen={folderToDelete !== null}
        onClose={() => setFolderToDelete(null)}
        onConfirm={confirmDeleteFolder}
        title="Delete Folder"
        message={
          <>
            <p className="mb-4">
              Delete folder "{folderToDelete?.name}"?
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteAction"
                  checked={deleteAction === 'move-to-parent'}
                  onChange={() => setDeleteAction('move-to-parent')}
                  className="text-accent-primary"
                />
                <span className="text-sm">Move links to parent folder</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteAction"
                  checked={deleteAction === 'delete'}
                  onChange={() => setDeleteAction('delete')}
                  className="text-accent-red"
                />
                <span className="text-sm text-accent-red">Delete all links in folder</span>
              </label>
            </div>
          </>
        }
        confirmText="Delete Folder"
        variant="danger"
      />
    </div>
  );
};

// ============================================================================
// Sidebar Item Component
// ============================================================================

interface SidebarItemProps {
  icon: string;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  color?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  count,
  isActive,
  onClick,
  onEdit,
  onDelete,
  color,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 px-3 py-2 rounded-button
        text-left transition-colors
        ${
          isActive
            ? 'bg-accent-blue/10 text-accent-blue'
            : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
        }
      `}
    >
      <span
        className="text-base"
        style={color ? { filter: `drop-shadow(0 0 2px ${color})` } : undefined}
      >
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium truncate">{label}</span>
      {typeof count === 'number' && (
        <span
          className={`text-xs ${
            isActive
              ? 'text-accent-blue/70'
              : 'text-text-light-secondary dark:text-text-dark-secondary'
          }`}
        >
          {count}
        </span>
      )}
      {/* Edit/Delete buttons for collections */}
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
              title="Edit"
            >
              <span className="text-xs">✏️</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded hover:bg-status-error/20 text-status-error transition-colors"
              title="Delete"
            >
              <span className="text-xs">🗑️</span>
            </button>
          )}
        </div>
      )}
    </button>
  );
};

export default CollectionSidebar;
