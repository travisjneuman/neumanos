/**
 * Version History Panel Component
 *
 * Collapsible panel showing version history for a note.
 * Allows viewing and restoring previous versions.
 */

import React, { useState, useMemo } from 'react';
import { History, ChevronDown, ChevronRight, RotateCcw, Trash2, Clock } from 'lucide-react';
import { useNoteVersionStore } from '../../stores/useNoteVersionStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { ConfirmDialog } from '../ConfirmDialog';

interface VersionHistoryPanelProps {
  noteId: string;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ noteId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);

  const getVersions = useNoteVersionStore((state) => state.getVersions);
  const getVersion = useNoteVersionStore((state) => state.getVersion);
  const deleteVersion = useNoteVersionStore((state) => state.deleteVersion);
  const updateNote = useNotesStore((state) => state.updateNote);

  const versions = useMemo(() => getVersions(noteId), [noteId, getVersions]);

  const handleRestore = (versionId: string) => {
    const version = getVersion(noteId, versionId);
    if (!version) return;

    updateNote(noteId, {
      title: version.title,
      content: version.content,
      contentText: version.contentText,
    });

    setRestoreConfirm(null);
    setPreviewVersionId(null);
  };

  const previewVersion = previewVersionId
    ? getVersion(noteId, previewVersionId)
    : null;

  if (versions.length === 0) {
    return null; // Don't show panel if no versions
  }

  return (
    <div className="border-t border-border-light dark:border-border-dark">
      {/* Header toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <History className="w-4 h-4" />
        <span className="font-medium">Version History</span>
        <span className="px-1.5 py-0.5 text-xs bg-accent-blue/10 text-accent-blue rounded">
          {versions.length}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Preview pane */}
          {previewVersion && (
            <div className="mb-3 p-3 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Preview: {formatRelativeTime(previewVersion.savedAt)}
                </span>
                <button
                  onClick={() => setPreviewVersionId(null)}
                  className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                >
                  Close
                </button>
              </div>
              <div className="text-sm text-text-light-primary dark:text-text-dark-primary line-clamp-6 whitespace-pre-wrap font-mono text-xs">
                {previewVersion.contentText.slice(0, 500)}
                {previewVersion.contentText.length > 500 && '...'}
              </div>
            </div>
          )}

          {/* Version list */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`group flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                  previewVersionId === version.id
                    ? 'bg-accent-primary/10 border border-accent-primary/30'
                    : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                }`}
                onClick={() => setPreviewVersionId(
                  previewVersionId === version.id ? null : version.id
                )}
              >
                <Clock className="w-3.5 h-3.5 text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                    {formatRelativeTime(version.savedAt)}
                  </div>
                  <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                    {version.changeSummary} &middot; {version.wordCount} words
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRestoreConfirm(version.id);
                    }}
                    className="p-1 rounded hover:bg-accent-primary/20 text-accent-primary transition-colors"
                    title="Restore this version"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVersion(noteId, version.id);
                    }}
                    className="p-1 rounded hover:bg-accent-red/20 text-accent-red transition-colors"
                    title="Delete this version"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restore Confirmation */}
      {restoreConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setRestoreConfirm(null)}
          onConfirm={() => handleRestore(restoreConfirm)}
          title="Restore Version"
          message="Are you sure you want to restore this version? Your current content will be replaced. A version of the current content will be saved automatically."
          confirmText="Restore"
          variant="danger"
        />
      )}
    </div>
  );
};
