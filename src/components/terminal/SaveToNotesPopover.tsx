/**
 * SaveToNotesPopover Component
 *
 * Modal for saving AI Terminal messages to Notes.
 * Centered within the AI Terminal sidebar to avoid overflow issues.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, FileText, FolderPlus, FolderSearch, ChevronRight, Loader2, X } from 'lucide-react';
import type { Message } from '../../stores/useTerminalStore';
import {
  saveMessageToDailyNote,
  saveMessageToNote,
  createNoteWithMessage,
  getRecentDestinations,
  getPrecedingPrompt,
} from '../../services/aiTerminalNotes';
import { toast } from '../../stores/useToastStore';
import { NoteDestinationPicker } from './NoteDestinationPicker';

interface SaveToNotesPopoverProps {
  /** The message to save */
  message: Message;
  /** Optional: The prompt that preceded this message (for AI responses) */
  promptMessage?: Message;
  /** Called when modal should close */
  onClose: () => void;
  /** Called after successful save */
  onSaveComplete: () => void;
}

export const SaveToNotesPopover: React.FC<SaveToNotesPopoverProps> = ({
  message,
  promptMessage,
  onClose,
  onSaveComplete,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get recent destinations
  const recentNotes = getRecentDestinations();

  // Auto-get the prompt for AI responses if not provided
  const effectivePromptMessage = promptMessage ?? (message.role === 'assistant' ? getPrecedingPrompt(message) : undefined);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus input when showing new note form
  useEffect(() => {
    if (showNewNoteInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNewNoteInput]);

  // Handle save to daily notes
  const handleSaveToDailyNote = useCallback(async () => {
    setIsSaving(true);
    try {
      const { note, saveResult } = saveMessageToDailyNote(message, effectivePromptMessage);
      if (saveResult.skipped) {
        toast.info(`Already saved to "${note.title}"`);
      } else {
        toast.success(`Saved to "${note.title}"`);
      }
      onSaveComplete();
    } catch (error) {
      toast.error('Failed to save to daily notes');
      console.error('Failed to save to daily notes:', error);
    } finally {
      setIsSaving(false);
    }
  }, [message, effectivePromptMessage, onSaveComplete]);

  // Handle save to recent note
  const handleSaveToRecentNote = useCallback(async (noteId: string, noteTitle: string) => {
    setIsSaving(true);
    try {
      const result = saveMessageToNote({
        message,
        promptMessage: effectivePromptMessage,
        targetNoteId: noteId,
        position: 'append',
      });
      if (result.skipped) {
        toast.info(`Already saved to "${noteTitle}"`);
      } else {
        toast.success(`Saved to "${noteTitle}"`);
      }
      onSaveComplete();
    } catch (error) {
      toast.error('Failed to save to note');
      console.error('Failed to save to note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [message, effectivePromptMessage, onSaveComplete]);

  // Handle create new note
  const handleCreateNewNote = useCallback(async () => {
    if (!newNoteTitle.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    setIsSaving(true);
    try {
      const note = createNoteWithMessage({
        message,
        promptMessage: effectivePromptMessage,
        title: newNoteTitle.trim(),
      });
      toast.success(`Created "${note.title}"`);
      onSaveComplete();
    } catch (error) {
      toast.error('Failed to create note');
      console.error('Failed to create note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [message, effectivePromptMessage, newNoteTitle, onSaveComplete]);

  // Handle enter key in new note input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateNewNote();
    }
  }, [handleCreateNewNote]);

  // Handle selecting a note from the destination picker
  const handlePickerSelectNote = useCallback(async (noteId: string, noteTitle: string) => {
    setIsSaving(true);
    try {
      const result = saveMessageToNote({
        message,
        promptMessage: effectivePromptMessage,
        targetNoteId: noteId,
        position: 'append',
      });
      if (result.skipped) {
        toast.info(`Already saved to "${noteTitle}"`);
      } else {
        toast.success(`Saved to "${noteTitle}"`);
      }
      setShowDestinationPicker(false);
      onSaveComplete();
    } catch (error) {
      toast.error('Failed to save to note');
      console.error('Failed to save to note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [message, effectivePromptMessage, onSaveComplete]);

  // Handle creating a new note from the destination picker
  const handlePickerCreateNote = useCallback(async (title: string, folderId: string | null) => {
    setIsSaving(true);
    try {
      const note = createNoteWithMessage({
        message,
        promptMessage: effectivePromptMessage,
        title,
        folderId,
      });
      toast.success(`Created "${note.title}"`);
      setShowDestinationPicker(false);
      onSaveComplete();
    } catch (error) {
      toast.error('Failed to create note');
      console.error('Failed to create note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [message, effectivePromptMessage, onSaveComplete]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
      style={{ pointerEvents: 'auto' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Save to notes"
    >
      <div
        ref={modalRef}
        className="w-[calc(100%-32px)] max-w-[280px] bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl border border-border-light dark:border-border-dark overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="menu"
        aria-label="Save to notes options"
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-alt flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            Save to Notes
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-text-light-tertiary dark:text-text-dark-tertiary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      {/* New Note Input */}
      {showNewNoteInput ? (
        <div className="p-3 border-b border-border-light dark:border-border-dark">
          <input
            ref={inputRef}
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter note title..."
            className="w-full px-3 py-2 text-sm rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-tertiary dark:placeholder-text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            disabled={isSaving}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowNewNoteInput(false)}
              className="flex-1 px-3 py-1.5 text-xs rounded-md bg-surface-light-alt dark:bg-surface-dark-alt hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover text-text-light-secondary dark:text-text-dark-secondary transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNewNote}
              disabled={isSaving || !newNoteTitle.trim()}
              className="flex-1 px-3 py-1.5 text-xs rounded-md bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="py-1">
            {/* Today's AI Notes - Default action */}
            <button
              onClick={handleSaveToDailyNote}
              disabled={isSaving}
              className="w-full px-3 py-2 text-left hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors flex items-center gap-3 disabled:opacity-50"
              role="menuitem"
            >
              <Calendar className="w-4 h-4 text-accent-blue" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Today's AI Notes
                </div>
                <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary truncate">
                  Daily note in AI Terminal folder
                </div>
              </div>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />}
            </button>

            {/* New Note */}
            <button
              onClick={() => setShowNewNoteInput(true)}
              disabled={isSaving}
              className="w-full px-3 py-2 text-left hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors flex items-center gap-3 disabled:opacity-50"
              role="menuitem"
            >
              <FolderPlus className="w-4 h-4 text-accent-green" />
              <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                New Note...
              </span>
            </button>
          </div>

          {/* Recent Notes */}
          {recentNotes.length > 0 && (
            <>
              <div className="px-3 py-1.5 border-t border-border-light dark:border-border-dark">
                <span className="text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary uppercase tracking-wide">
                  Recent
                </span>
              </div>
              <div className="py-1 max-h-32 overflow-y-auto">
                {recentNotes.slice(0, 3).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleSaveToRecentNote(note.id, note.title)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 text-left hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors flex items-center gap-3 disabled:opacity-50"
                    role="menuitem"
                  >
                    <FileText className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                      {note.icon && <span className="mr-1">{note.icon}</span>}
                      {note.title}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Footer - More Options */}
      {!showNewNoteInput && (
        <div className="border-t border-border-light dark:border-border-dark py-1">
          <button
            onClick={() => setShowDestinationPicker(true)}
            disabled={isSaving}
            className="w-full px-3 py-2 text-left hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover transition-colors flex items-center gap-3 disabled:opacity-50"
            role="menuitem"
          >
            <FolderSearch className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Choose Folder/Note...
            </span>
            <ChevronRight className="w-4 h-4 ml-auto text-text-light-tertiary dark:text-text-dark-tertiary" />
          </button>
        </div>
      )}

      {/* Destination Picker Modal */}
      <NoteDestinationPicker
        isOpen={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelectNote={handlePickerSelectNote}
        onCreateNote={handlePickerCreateNote}
        title="Choose Destination"
        isSaving={isSaving}
      />
      </div>
    </div>
  );
};

export default SaveToNotesPopover;
