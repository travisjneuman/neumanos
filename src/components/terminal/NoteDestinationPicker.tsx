/**
 * NoteDestinationPicker Component
 *
 * Modal for selecting a destination folder or note for saving AI Terminal messages.
 * Supports folder browsing, note search, and creating new notes.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  X,
  Search,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Home,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react';
import { useFoldersStore } from '../../stores/useFoldersStore';
import { useNotesStore } from '../../stores/useNotesStore';
import type { FolderNode } from '../notes/FolderTreeNode';
import type { Note } from '../../types/notes';

export interface NoteDestinationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user selects an existing note */
  onSelectNote: (noteId: string, noteTitle: string) => void;
  /** Called when user wants to create a new note */
  onCreateNote: (title: string, folderId: string | null) => void;
  /** Title for the modal */
  title?: string;
  /** Whether an action is in progress */
  isSaving?: boolean;
}

type ViewMode = 'browse' | 'create';

export const NoteDestinationPicker: React.FC<NoteDestinationPickerProps> = ({
  isOpen,
  onClose,
  onSelectNote,
  onCreateNote,
  title = 'Choose Destination',
  isSaving = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const newNoteInputRef = useRef<HTMLInputElement>(null);

  const getTree = useFoldersStore((state) => state.getTree);
  const folderTree = useMemo(() => getTree(), [getTree]);

  // Get all notes - select raw object to avoid infinite loop, memoize conversion
  const notesRecord = useNotesStore((state) => state.notes);
  const allNotes = useMemo(() => Object.values(notesRecord), [notesRecord]);

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allNotes
      .filter(
        (note) =>
          !note.isArchived &&
          !note.isQuickNote &&
          (note.title.toLowerCase().includes(query) ||
            note.contentText.toLowerCase().includes(query))
      )
      .slice(0, 10); // Limit results for performance
  }, [allNotes, searchQuery]);

  // Get notes for a specific folder
  const getNotesInFolder = useCallback(
    (folderId: string | null) => {
      return allNotes
        .filter(
          (note) =>
            note.folderId === folderId && !note.isArchived && !note.isQuickNote
        )
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 20); // Limit for performance
    },
    [allNotes]
  );

  // Toggle folder expansion
  const toggleExpand = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Handle note selection
  const handleSelectNote = useCallback(
    (note: Note) => {
      onSelectNote(note.id, note.title);
    },
    [onSelectNote]
  );

  // Handle create new note
  const handleCreateNote = useCallback(() => {
    if (!newNoteTitle.trim()) return;
    onCreateNote(newNoteTitle.trim(), selectedFolderId);
  }, [newNoteTitle, selectedFolderId, onCreateNote]);

  // Handle enter key in create input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCreateNote();
      }
    },
    [handleCreateNote]
  );

  // Focus input when switching to create mode
  useEffect(() => {
    if (viewMode === 'create' && newNoteInputRef.current) {
      newNoteInputRef.current.focus();
    }
  }, [viewMode]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setViewMode('browse');
      setNewNoteTitle('');
      setSelectedFolderId(null);
    }
  }, [isOpen]);

  // Render a folder item in tree view
  const renderFolderItem = (node: FolderNode, depth: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const notesInFolder = getNotesInFolder(node.id);
    const hasNotes = notesInFolder.length > 0;
    const isSelected = selectedFolderId === node.id && viewMode === 'create';

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-accent-blue/20 text-accent-blue'
              : 'hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-text-light-primary dark:text-text-dark-primary'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            if (viewMode === 'create') {
              setSelectedFolderId(node.id);
            } else {
              toggleExpand(node.id);
            }
          }}
        >
          {hasChildren || hasNotes ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-surface-light dark:hover:bg-surface-dark rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 shrink-0 text-accent-yellow" />
          ) : (
            <Folder className="w-4 h-4 shrink-0 text-accent-yellow" />
          )}
          <span className="text-sm font-medium truncate flex-1">{node.name}</span>
          {notesInFolder.length > 0 && (
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {notesInFolder.length}
            </span>
          )}
        </div>

        {/* Folder children and notes */}
        {isExpanded && (
          <div>
            {/* Child folders */}
            {hasChildren &&
              node.children!.map((child) => renderFolderItem(child, depth + 1))}

            {/* Notes in this folder (only in browse mode) */}
            {viewMode === 'browse' &&
              notesInFolder.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-text-light-primary dark:text-text-dark-primary"
                  style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
                  onClick={() => handleSelectNote(note)}
                  role="option"
                >
                  <span className="w-5" />
                  <FileText className="w-4 h-4 shrink-0 text-text-light-tertiary dark:text-text-dark-tertiary" />
                  <span className="text-sm truncate flex-1">
                    {note.icon && <span className="mr-1">{note.icon}</span>}
                    {note.title}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
      style={{ pointerEvents: 'auto' }}
      onClick={onClose}
    >
      <div
        className="w-[calc(100%-24px)] max-w-[320px] max-h-[80%] bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-picker-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark shrink-0">
          <h2
            id="note-picker-title"
            className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-border-light dark:border-border-dark shrink-0">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'browse'
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
            onClick={() => setViewMode('browse')}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Existing Note
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'create'
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
            onClick={() => setViewMode('create')}
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            New Note
          </button>
        </div>

        {/* Search (Browse mode only) */}
        {viewMode === 'browse' && (
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-tertiary dark:placeholder-text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Create New Note Form */}
        {viewMode === 'create' && (
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark shrink-0 space-y-2">
            <input
              ref={newNoteInputRef}
              type="text"
              placeholder="Note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-tertiary dark:placeholder-text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
              disabled={isSaving}
            />
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Select a folder below, or leave unselected for root level
            </p>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0" role="listbox">
          {/* Search Results */}
          {viewMode === 'browse' && searchQuery.trim() && (
            <>
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-text-light-primary dark:text-text-dark-primary"
                    onClick={() => handleSelectNote(note)}
                    role="option"
                  >
                    <FileText className="w-4 h-4 shrink-0 text-text-light-tertiary dark:text-text-dark-tertiary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {note.icon && <span className="mr-1">{note.icon}</span>}
                        {note.title}
                      </div>
                      {note.contentText && (
                        <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary truncate">
                          {note.contentText.slice(0, 50)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-text-light-secondary dark:text-text-dark-secondary text-sm">
                  No notes found for "{searchQuery}"
                </div>
              )}
            </>
          )}

          {/* Folder Tree (when not searching) */}
          {(viewMode === 'create' || !searchQuery.trim()) && (
            <>
              {/* Root Level Option */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1 ${
                  selectedFolderId === null && viewMode === 'create'
                    ? 'bg-accent-blue/20 text-accent-blue'
                    : 'hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-text-light-primary dark:text-text-dark-primary'
                }`}
                onClick={() => {
                  if (viewMode === 'create') {
                    setSelectedFolderId(null);
                  }
                }}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">
                  {viewMode === 'create' ? 'Root Level (No Folder)' : 'All Notes'}
                </span>
              </div>

              {/* Root level notes (browse mode only, when not searching) */}
              {viewMode === 'browse' &&
                !searchQuery.trim() &&
                getNotesInFolder(null).map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-text-light-primary dark:text-text-dark-primary"
                    style={{ paddingLeft: '28px' }}
                    onClick={() => handleSelectNote(note)}
                    role="option"
                  >
                    <FileText className="w-4 h-4 shrink-0 text-text-light-tertiary dark:text-text-dark-tertiary" />
                    <span className="text-sm truncate flex-1">
                      {note.icon && <span className="mr-1">{note.icon}</span>}
                      {note.title}
                    </span>
                  </div>
                ))}

              {/* Folder Tree */}
              {folderTree.length > 0 ? (
                folderTree.map((node) => renderFolderItem(node, 0))
              ) : (
                <div className="text-center py-4 text-text-light-secondary dark:text-text-dark-secondary text-sm">
                  No folders yet
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Create Button (create mode only) */}
        {viewMode === 'create' && (
          <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border-light dark:border-border-dark shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNote}
              disabled={isSaving || !newNoteTitle.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create & Save
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDestinationPicker;
