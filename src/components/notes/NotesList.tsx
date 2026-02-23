/**
 * NotesList Component
 *
 * Notes list container with filtering, sorting, and bulk operations.
 * Extracted from Notes.tsx as part of the Notes Page Revolution.
 *
 * Features:
 * - Filtered/sorted notes display
 * - Bulk selection and tag operations
 * - Template creation integration
 * - Export modal trigger
 * - Empty state with call-to-action
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { FileText, FileDown, Sparkles } from 'lucide-react';
import { useFoldersStore } from '../../stores/useFoldersStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useNoteSelectionStore } from '../../stores/useNoteSelectionStore';
import { BulkNotesActionBar } from './BulkNotesActionBar';
import { NoteListItem } from './NoteListItem';
import { tagMatchesFilter } from '../../utils/tagHierarchy';
import { logger } from '../../services/logger';
import type { Note } from '../../types/notes';

const log = logger.module('NotesList');

export interface NotesListProps {
  activeTags: string[];
  onOpenTemplateLibrary: () => void;
  onOpenExportModal: () => void;
  /** Context menu handler for notes */
  onNoteContextMenu?: (e: React.MouseEvent, note: Note) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  activeTags,
  onOpenTemplateLibrary,
  onOpenExportModal,
  onNoteContextMenu,
}) => {
  const activeFolderId = useFoldersStore((state) => state.activeFolderId);
  // Get raw notes and store config (stable references)
  const notesObj = useNotesStore((state) => state.notes);
  const sortConfig = useNotesStore((state) => state.sortConfig);
  const filter = useNotesStore((state) => state.filter);
  const activeNoteId = useNotesStore((state) => state.activeNoteId);
  const createNote = useNotesStore((state) => state.createNote);
  const moveNote = useNotesStore((state) => state.moveNote);
  const setParentNote = useNotesStore((state) => state.setParentNote);
  const canSetParentNote = useNotesStore((state) => state.canSetParentNote);

  // Selection store
  const selectionMode = useNoteSelectionStore((s) => s.isMultiSelectMode);
  const selectedNoteIds = useNoteSelectionStore((s) => s.selectedNoteIds);
  const lastSelectedNoteId = useNoteSelectionStore((s) => s.lastSelectedNoteId);
  const toggleSelect = useNoteSelectionStore((s) => s.toggleSelect);
  const selectRange = useNoteSelectionStore((s) => s.selectRange);
  const toggleMultiSelectMode = useNoteSelectionStore((s) => s.toggleMultiSelectMode);
  const enterMultiSelectMode = useNoteSelectionStore((s) => s.enterMultiSelectMode);

  // DnD state for note movement
  const [isDisablingClicks, setIsDisablingClicks] = useState(false);
  const disableTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configure drag sensors (require 5px movement to start dragging)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Drag handlers
  const handleDragStart = useCallback((_event: DragStartEvent) => {
    if (disableTimeoutRef.current) {
      clearTimeout(disableTimeoutRef.current);
    }
    setIsDisablingClicks(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.data.current?.type === 'note') {
        const noteId = active.data.current.noteId as string;
        const overId = over.id as string;

        // Handle note dropped on another note (create subnote)
        if (over.data.current?.type === 'note-target') {
          const targetNoteId = over.data.current.noteId as string;
          if (noteId !== targetNoteId && canSetParentNote(noteId, targetNoteId)) {
            setParentNote(noteId, targetNoteId);
            log.debug('Note nested as subnote via drag', { noteId, parentNoteId: targetNoteId });
          }
        }
        // Handle note dropped on a folder
        else if (!overId.startsWith('note-')) {
          const targetFolderId = overId === 'root-drop-zone' ? null : overId;
          moveNote(noteId, targetFolderId);
          log.debug('Note moved via drag', { noteId, targetFolderId });
        }
      }

      // Re-enable clicks after a delay
      disableTimeoutRef.current = setTimeout(() => {
        setIsDisablingClicks(false);
        disableTimeoutRef.current = null;
      }, 150);
    },
    [moveNote, setParentNote, canSetParentNote]
  );

  const toggleNoteSelection = useCallback((noteId: string) => {
    toggleSelect(noteId);
  }, [toggleSelect]);

  // Compute filtered/sorted notes with useMemo
  const notes = useMemo(() => {
    // Filter by folder
    // If activeFolderId is null, show ALL notes (not just notes with null folderId)
    let filtered =
      activeFolderId === null
        ? Object.values(notesObj) // Show all notes when "All Notes" is selected
        : Object.values(notesObj).filter((note) => note.folderId === activeFolderId);

    // Filter by tags (AND logic - note must have ALL selected tags or their children)
    if (activeTags.length > 0) {
      filtered = filtered.filter((note) =>
        activeTags.every((filterTag) =>
          note.tags.some((noteTag) => tagMatchesFilter(noteTag, filterTag))
        )
      );
    }

    // Apply filter (archived, pinned, favorites, etc.)
    switch (filter) {
      case 'favorites':
        filtered = filtered.filter((note) => note.isFavorite);
        break;
      case 'pinned':
        filtered = filtered.filter((note) => note.isPinned);
        break;
      case 'archived':
        filtered = filtered.filter((note) => note.isArchived);
        break;
      case 'unarchived':
        filtered = filtered.filter((note) => !note.isArchived);
        break;
    }

    // Sort notes
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    // Always pin pinned notes to top
    return sorted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [notesObj, activeFolderId, sortConfig, filter, activeTags]);

  // Visible note IDs for BulkNotesActionBar "Select All"
  const visibleNoteIds = useMemo(() => notes.map((n) => n.id), [notes]);

  // Handle Ctrl/Shift+click for multi-select (needs notes for range selection)
  const handleMultiSelectClick = useCallback(
    (noteId: string, event: React.MouseEvent) => {
      // Auto-enter selection mode on first modifier+click
      if (!selectionMode) {
        enterMultiSelectMode();
      }

      if (event.shiftKey && lastSelectedNoteId) {
        // Shift+click: Range selection
        const allIds = notes.map((n) => n.id);
        selectRange(lastSelectedNoteId, noteId, allIds);
      } else {
        // Ctrl/Cmd+click: Toggle individual selection
        toggleNoteSelection(noteId);
      }
    },
    [selectionMode, notes, lastSelectedNoteId, toggleNoteSelection, enterMultiSelectMode, selectRange]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="p-5 flex flex-col flex-1 min-h-0">
        {/* Notes header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-sm font-medium uppercase tracking-wide text-text-light-secondary dark:text-text-dark-secondary">
            Notes ({notes.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors flex items-center gap-1"
              title="Export notes (Cmd+Shift+E)"
            >
              <FileDown className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={toggleMultiSelectMode}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectionMode
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
            >
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
            <button
              onClick={onOpenTemplateLibrary}
              className="px-3 py-1.5 bg-accent-purple text-white rounded-lg hover:bg-accent-purple-hover transition-colors text-sm font-medium flex items-center gap-1"
              title="Create note from template"
            >
              <Sparkles className="w-4 h-4" />
              Template
            </button>
            <button
              onClick={() => createNote({ folderId: activeFolderId })}
              className="px-3 py-1.5 bg-gradient-button-primary text-white rounded-lg hover:shadow-glow-magenta transition-all text-sm font-medium"
            >
              + New
            </button>
          </div>
        </div>

        {/* Floating Bulk Actions Bar (renders at bottom of screen via portal) */}
        <BulkNotesActionBar visibleNoteIds={visibleNoteIds} />

        {/* Notes list - scrollable with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {notes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                isSelectionMode={selectionMode}
                isSelected={selectedNoteIds.has(note.id)}
                onToggleSelection={toggleNoteSelection}
                onMultiSelectClick={handleMultiSelectClick}
                isDraggable={!selectionMode}
                isDisablingClicks={isDisablingClicks}
                onContextMenu={onNoteContextMenu}
              />
            ))}

          {/* Empty state */}
          {notes.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 rounded-2xl">
                  <FileText className="w-16 h-16 text-accent-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-3">
                {activeTags.length > 0 ? 'No notes match these tags' : 'No notes in this folder'}
              </h3>
              <p className="text-text-light-secondary dark:text-text-dark-secondary mb-2 max-w-sm mx-auto">
                {activeTags.length > 0
                  ? 'Try removing some tags or create a new note'
                  : 'Start capturing your thoughts, ideas, and knowledge'}
              </p>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary mb-6">
                Tip: Use{' '}
                <kbd className="px-2 py-1 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-xs font-mono">
                  Cmd+N
                </kbd>{' '}
                to create notes quickly
              </p>
              <button
                onClick={() => createNote({ folderId: activeFolderId })}
                className="px-6 py-3 bg-gradient-button-primary text-white rounded-lg hover:shadow-glow-magenta transition-all font-medium inline-flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Create Your First Note
              </button>
            </div>
          )}
          </div>
        </DndContext>
      </div>

    </div>
  );
};
