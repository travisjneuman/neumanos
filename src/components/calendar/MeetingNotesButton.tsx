/**
 * MeetingNotesButton Component
 *
 * Provides bidirectional linking between calendar events and notes.
 * - "Create Meeting Notes" creates a pre-filled note linked to the event
 * - "Link Existing Note" opens a search dropdown to link an existing note
 * - Shows linked notes as clickable chips
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { FileText, Plus, Link2, X, Search } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useCalendarStore } from '../../stores/useCalendarStore';
import type { Note } from '../../types/notes';

interface MeetingNotesButtonProps {
  eventId: string;
  eventTitle: string;
}

export function MeetingNotesButton({ eventId, eventTitle }: MeetingNotesButtonProps) {
  const { createNote, getNote, notes } = useNotesStore();
  const { linkNoteToEvent, unlinkNoteFromEvent, getLinkedNotes } = useCalendarStore();
  const { linkEventToNote, unlinkEventFromNote } = useNotesStore();

  const [showNotePicker, setShowNotePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const linkedNoteIds = getLinkedNotes(eventId);

  // Resolve linked notes to actual Note objects
  const linkedNotes = useMemo(() => {
    return linkedNoteIds
      .map((id) => getNote(id))
      .filter((note): note is Note => note !== undefined);
  }, [linkedNoteIds, getNote]);

  // Search available notes (exclude already linked)
  const searchResults = useMemo(() => {
    if (!showNotePicker) return [];
    const allNotes = Object.values(notes).filter(
      (note) => !note.isArchived && !linkedNoteIds.includes(note.id)
    );
    if (!searchQuery.trim()) {
      return allNotes.slice(0, 10);
    }
    const query = searchQuery.toLowerCase();
    return allNotes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.contentText.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [showNotePicker, notes, linkedNoteIds, searchQuery]);

  // Focus search input when picker opens
  useEffect(() => {
    if (showNotePicker && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showNotePicker]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showNotePicker) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotePicker(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotePicker]);

  const handleCreateMeetingNotes = () => {
    const newNote = createNote({
      title: `Meeting Notes: ${eventTitle}`,
      contentText: '## Agenda\n\n## Notes\n\n## Action Items\n\n',
      tags: ['meeting'],
    });

    // Link both directions
    linkNoteToEvent(eventId, newNote.id);
    linkEventToNote(newNote.id, eventId);
  };

  const handleLinkNote = (noteId: string) => {
    linkNoteToEvent(eventId, noteId);
    linkEventToNote(noteId, eventId);
    setShowNotePicker(false);
    setSearchQuery('');
  };

  const handleUnlinkNote = (noteId: string) => {
    unlinkNoteFromEvent(eventId, noteId);
    unlinkEventFromNote(noteId, eventId);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
        Linked Notes
      </label>

      {/* Linked notes chips */}
      {linkedNotes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedNotes.map((note) => (
            <span
              key={note.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
            >
              <FileText className="w-3 h-3" />
              <span className="max-w-[150px] truncate">{note.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnlinkNote(note.id);
                }}
                className="ml-0.5 hover:text-status-error transition-colors"
                aria-label={`Unlink ${note.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleCreateMeetingNotes}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-button bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark hover:border-accent-primary/50 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary transition-all duration-standard ease-smooth"
        >
          <Plus className="w-3 h-3" />
          Create Meeting Notes
        </button>
        <button
          type="button"
          onClick={() => setShowNotePicker(!showNotePicker)}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-button bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark hover:border-accent-primary/50 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary transition-all duration-standard ease-smooth"
        >
          <Link2 className="w-3 h-3" />
          Link Existing
        </button>

        {/* Note picker dropdown */}
        {showNotePicker && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-border-light dark:border-border-dark">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-light-secondary dark:text-text-dark-secondary" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-[11px] bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-1 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
                  placeholder="Search notes..."
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-text-light-secondary dark:text-text-dark-secondary text-center">
                  No notes found
                </div>
              ) : (
                searchResults.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => handleLinkNote(note.id)}
                    className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-3 h-3 flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary" />
                    <span className="truncate">{note.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
