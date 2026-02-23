/**
 * BulkNotesActionBar Component
 *
 * Floating action bar at the bottom of the Notes page when notes are selected.
 * Provides bulk operations: add/remove tags, archive, delete, export.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Tag,
  Archive,
  Trash2,
  Download,
  CheckSquare,
} from 'lucide-react';
import { useNoteSelectionStore } from '../../stores/useNoteSelectionStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { PromptDialog } from '../PromptDialog';
import { ConfirmDialog } from '../ConfirmDialog';
import { exportNotesToMarkdown } from '../../services/noteExport';
import { logger } from '../../services/logger';

const log = logger.module('BulkNotesActionBar');

export interface BulkNotesActionBarProps {
  /** All visible note IDs for "Select All" */
  visibleNoteIds: string[];
}

export const BulkNotesActionBar: React.FC<BulkNotesActionBarProps> = ({
  visibleNoteIds,
}) => {
  const selectedNoteIds = useNoteSelectionStore((s) => s.selectedNoteIds);
  const clearSelection = useNoteSelectionStore((s) => s.clearSelection);
  const selectAll = useNoteSelectionStore((s) => s.selectAll);

  const notes = useNotesStore((s) => s.notes);
  const bulkAddTag = useNotesStore((s) => s.bulkAddTag);
  const bulkRemoveTag = useNotesStore((s) => s.bulkRemoveTag);
  const archiveNotes = useNotesStore((s) => s.archiveNotes);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  // Dialog states
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagAction, setTagAction] = useState<'add' | 'remove'>('add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

  const count = selectedNoteIds.size;

  // Escape key clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && count > 0) {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [count, clearSelection]);

  if (count === 0) return null;

  const selectedIds = Array.from(selectedNoteIds);

  const handleAddTag = () => {
    setTagAction('add');
    setTagDialogOpen(true);
  };

  const handleRemoveTag = () => {
    setTagAction('remove');
    setTagDialogOpen(true);
  };

  const confirmTagAction = (value: string) => {
    if (!value.trim()) return;
    if (tagAction === 'add') {
      bulkAddTag(selectedIds, value.trim());
    } else {
      bulkRemoveTag(selectedIds, value.trim());
    }
    setTagDialogOpen(false);
    clearSelection();
    log.debug('Bulk tag action', { action: tagAction, tag: value.trim(), count });
  };

  const handleArchive = () => {
    setArchiveDialogOpen(true);
  };

  const confirmArchive = () => {
    archiveNotes(selectedIds);
    setArchiveDialogOpen(false);
    clearSelection();
    log.debug('Bulk archived notes', { count });
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    selectedIds.forEach((id) => deleteNote(id));
    setDeleteDialogOpen(false);
    clearSelection();
    log.debug('Bulk deleted notes', { count });
  };

  const handleExport = () => {
    const selectedNotes = selectedIds
      .map((id) => notes[id])
      .filter(Boolean);
    exportNotesToMarkdown(selectedNotes);
    log.debug('Bulk exported notes', { count: selectedNotes.length });
  };

  const handleSelectAll = () => {
    selectAll(visibleNoteIds);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-xl shadow-2xl px-5 py-3 flex items-center gap-3 flex-wrap"
        >
          {/* Selection count */}
          <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap">
            {count} note{count !== 1 ? 's' : ''} selected
          </span>

          {/* Divider */}
          <div className="w-px h-6 bg-border-light dark:bg-border-dark" />

          {/* Select All */}
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-colors text-text-light-secondary dark:text-text-dark-secondary flex items-center gap-1.5"
            title="Select all visible notes"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            All
          </button>

          {/* Add Tag */}
          <button
            onClick={handleAddTag}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors flex items-center gap-1.5"
            title="Add tag to selected notes"
          >
            <Tag className="w-3.5 h-3.5" />
            Add Tag
          </button>

          {/* Remove Tag */}
          <button
            onClick={handleRemoveTag}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-orange/10 text-accent-orange hover:bg-accent-orange/20 transition-colors flex items-center gap-1.5"
            title="Remove tag from selected notes"
          >
            <Tag className="w-3.5 h-3.5" />
            Remove Tag
          </button>

          {/* Archive */}
          <button
            onClick={handleArchive}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 transition-colors flex items-center gap-1.5"
            title="Archive selected notes"
          >
            <Archive className="w-3.5 h-3.5" />
            Archive
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors flex items-center gap-1.5"
            title="Export selected notes as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors flex items-center gap-1.5"
            title="Delete selected notes"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-border-light dark:bg-border-dark" />

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            className="p-1.5 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-colors text-text-light-tertiary dark:text-text-dark-tertiary"
            title="Clear selection (Escape)"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Tag Dialog */}
      {tagDialogOpen && (
        <PromptDialog
          isOpen={true}
          onClose={() => setTagDialogOpen(false)}
          onConfirm={confirmTagAction}
          title={tagAction === 'add' ? 'Add Tag to Selected Notes' : 'Remove Tag from Selected Notes'}
          message={
            tagAction === 'add'
              ? `Enter tag name to add to ${count} note${count !== 1 ? 's' : ''}:`
              : `Enter tag name to remove from ${count} note${count !== 1 ? 's' : ''}:`
          }
          defaultValue=""
          placeholder="Tag name"
          confirmText={tagAction === 'add' ? 'Add Tag' : 'Remove Tag'}
        />
      )}

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        onConfirm={confirmArchive}
        title="Archive Selected Notes"
        message={`Are you sure you want to archive ${count} note${count !== 1 ? 's' : ''}?`}
        confirmText="Archive"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Selected Notes"
        message={`Are you sure you want to delete ${count} note${count !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};
