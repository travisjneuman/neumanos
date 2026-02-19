/**
 * BacklinksPanel Component
 * Displays notes that link TO the current note (backlinks)
 * Uses [[Note Title]] wiki-style linking syntax
 * P1: Also shows unlinked mentions (implicit references)
 */

import { useMemo, useState } from 'react';
import { Link2, ChevronRight, ChevronDown, AlertTriangle, Plus } from 'lucide-react';
import { useNotesStore } from '../stores/useNotesStore';
import { findUnlinkedMentions, findBrokenLinks } from '../utils/backlinks';

interface BacklinksPanelProps {
  noteId: string;
  onNoteClick?: (noteId: string) => void;
}

export function BacklinksPanel({ noteId, onNoteClick }: BacklinksPanelProps) {
  const { getBacklinks, setActiveNote, notes, createNote, convertToWikiLink } = useNotesStore();
  const [showUnlinkedMentions, setShowUnlinkedMentions] = useState(true);
  const [showBrokenLinks, setShowBrokenLinks] = useState(true);

  const currentNote = notes[noteId];

  const backlinks = useMemo(() => {
    return getBacklinks(noteId);
  }, [noteId, getBacklinks]);

  // P1: Find unlinked mentions
  const unlinkedMentions = useMemo(() => {
    if (!currentNote) return [];
    return findUnlinkedMentions(noteId, currentNote.title, notes);
  }, [noteId, currentNote, notes]);

  // P1: Find broken links
  const brokenLinks = useMemo(() => {
    if (!currentNote) return [];
    return findBrokenLinks(currentNote.contentText, notes);
  }, [currentNote, notes]);

  const handleNoteClick = (id: string) => {
    if (onNoteClick) {
      onNoteClick(id);
    } else {
      setActiveNote(id);
    }
  };

  const handleCreateNote = (title: string) => {
    const newNote = createNote({
      title,
      content: '',
      folderId: currentNote?.folderId || null,
    });
    handleNoteClick(newNote.id);
  };

  const handleConvertToLink = (mentionNoteId: string, position: number, targetTitle: string) => {
    convertToWikiLink(mentionNoteId, position, targetTitle);
  };

  const hasBacklinks = backlinks.length > 0;
  const hasUnlinkedMentions = unlinkedMentions.length > 0;
  const hasBrokenLinks = brokenLinks.length > 0;

  if (!hasBacklinks && !hasUnlinkedMentions && !hasBrokenLinks) {
    return (
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
          <Link2 className="w-4 h-4" />
          <span className="font-medium">Backlinks</span>
        </div>
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          No notes link to this note yet. Use [[Note Title]] to create links.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border-light dark:border-border-dark">
      {/* Linked References */}
      {hasBacklinks && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
            <Link2 className="w-4 h-4" />
            <span className="font-medium">Linked References</span>
            <span className="px-1.5 py-0.5 text-xs bg-accent-blue/10 text-accent-blue rounded">
              {backlinks.length}
            </span>
          </div>

          <div className="space-y-1">
            {backlinks.map((note) => (
              <button
                key={note.id}
                onClick={() => handleNoteClick(note.id)}
                className="w-full flex items-center gap-2 p-2 text-sm text-left rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors group"
              >
                <span className="text-lg">{note.icon || '📄'}</span>
                <span className="flex-1 truncate text-text-light-primary dark:text-text-dark-primary">
                  {note.title}
                </span>
                <ChevronRight className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* P1: Unlinked Mentions */}
      {hasUnlinkedMentions && (
        <div className={hasBrokenLinks ? 'mb-4' : ''}>
          <button
            onClick={() => setShowUnlinkedMentions(!showUnlinkedMentions)}
            className="w-full flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3 hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
          >
            {showUnlinkedMentions ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="font-medium">Unlinked Mentions</span>
            <span className="px-1.5 py-0.5 text-xs bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark rounded">
              {unlinkedMentions.length}
            </span>
          </button>

          {showUnlinkedMentions && (
            <div className="space-y-2">
              {unlinkedMentions.map((mention, index) => (
                <div
                  key={`${mention.noteId}-${index}`}
                  className="p-2 text-sm rounded-lg bg-surface-light-elevated/50 dark:bg-surface-dark-elevated/50 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleNoteClick(mention.noteId)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <span className="text-lg">{notes[mention.noteId]?.icon || '📄'}</span>
                      <span className="flex-1 truncate font-medium text-text-light-primary dark:text-text-dark-primary">
                        {mention.noteTitle}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConvertToLink(mention.noteId, mention.position, currentNote?.title || '');
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors flex-shrink-0"
                      title="Convert to [[wiki link]]"
                    >
                      <Link2 className="w-3 h-3" />
                      Link
                    </button>
                  </div>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary ml-8 line-clamp-2">
                    {mention.context}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* P1: Broken Links */}
      {hasBrokenLinks && (
        <div>
          <button
            onClick={() => setShowBrokenLinks(!showBrokenLinks)}
            className="w-full flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3 hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
          >
            {showBrokenLinks ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Broken Links</span>
            <span className="px-1.5 py-0.5 text-xs bg-accent-red/10 text-accent-red dark:bg-accent-red/20 dark:text-accent-red rounded">
              {brokenLinks.length}
            </span>
          </button>

          {showBrokenLinks && (
            <div className="space-y-2">
              {brokenLinks.map((link, index) => (
                <div
                  key={`${link.title}-${index}`}
                  className="p-2 text-sm rounded-lg bg-accent-red/5 dark:bg-accent-red/10 border border-accent-red/20 dark:border-accent-red/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-accent-red dark:text-accent-red flex-shrink-0" />
                    <span className="flex-1 font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      [[{link.title}]]
                    </span>
                    <button
                      onClick={() => handleCreateNote(link.title)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors flex-shrink-0"
                      title="Create this note"
                    >
                      <Plus className="w-3 h-3" />
                      Create
                    </button>
                  </div>
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary ml-6 line-clamp-2">
                    {link.context}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
