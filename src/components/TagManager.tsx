/**
 * TagManager Component
 *
 * Modal for managing all tags across notes
 * Features:
 * - List all tags with note counts
 * - Rename tags globally
 * - Delete tags globally
 * - Tag statistics
 */

import { useState } from 'react';
import { X, Tag as TagIcon, Edit2, Trash2, TrendingUp, GitMerge, Palette } from 'lucide-react';
import { useTagCounts } from '../hooks/useTags';
import { useNotesStore } from '../stores/useNotesStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { TagColorPicker } from './TagColorPicker';

interface TagManagerProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
}

export function TagManager({ isOpen, onClose }: TagManagerProps) {
  const tagCounts = useTagCounts();
  const renameTag = useNotesStore((state) => state.renameTag);
  const mergeTags = useNotesStore((state) => state.mergeTags);
  const deleteTag = useNotesStore((state) => state.deleteTag);
  const tagColors = useSettingsStore((state) => state.tagColors);
  const setTagColor = useSettingsStore((state) => state.setTagColor);
  const removeTagColor = useSettingsStore((state) => state.removeTagColor);

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [deletingTag, setDeletingTag] = useState<string | null>(null);

  // Color picker state
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);

  // Merge state
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [mergingTo, setMergingTo] = useState<string | null>(null);
  const [targetTagName, setTargetTagName] = useState('');

  if (!isOpen) return null;

  const totalTags = tagCounts.length;
  const totalTaggedNotes = tagCounts.reduce((sum, tc) => sum + tc.count, 0);
  const mostUsedTag = tagCounts[0]; // Already sorted by count descending

  const handleStartEdit = (tag: string) => {
    setEditingTag(tag);
    setNewTagName(tag);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setNewTagName('');
  };

  const handleSaveEdit = () => {
    if (!editingTag || !newTagName.trim()) return;
    if (newTagName.trim() === editingTag) {
      handleCancelEdit();
      return;
    }

    renameTag(editingTag, newTagName.trim());
    handleCancelEdit();
  };

  const handleToggleMergeMode = () => {
    setMergeMode(!mergeMode);
    setSelectedTags(new Set());
  };

  const handleToggleTagSelection = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleStartMerge = () => {
    if (selectedTags.size < 2) return;
    setMergingTo('merge');
    setTargetTagName('');
  };

  const handleCancelMerge = () => {
    setMergingTo(null);
    setTargetTagName('');
  };

  const handleConfirmMerge = () => {
    if (!targetTagName.trim() || selectedTags.size < 1) return;
    mergeTags(Array.from(selectedTags), targetTagName.trim());
    setMergingTo(null);
    setTargetTagName('');
    setSelectedTags(new Set());
    setMergeMode(false);
  };

  const handleConfirmDelete = (tag: string) => {
    setDeletingTag(tag);
  };

  const handleCancelDelete = () => {
    setDeletingTag(null);
  };

  const handleDelete = () => {
    if (!deletingTag) return;
    deleteTag(deletingTag);
    setDeletingTag(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleOpenColorPicker = (tag: string) => {
    setColorPickerTag(tag);
  };

  const handleCloseColorPicker = () => {
    setColorPickerTag(null);
  };

  const handleSelectColor = (color: string) => {
    if (!colorPickerTag) return;
    if (color === '') {
      removeTagColor(colorPickerTag);
    } else {
      setTagColor(colorPickerTag, color);
    }
    setColorPickerTag(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tag-manager-title"
        >
          {/* Header */}
          <div className="p-4 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-accent-primary" />
                <h2
                  id="tag-manager-title"
                  className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary"
                >
                  Manage Tags
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-colors"
                aria-label="Close tag manager"
              >
                <X className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
            </div>

            {/* Merge Mode Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMergeMode}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                  mergeMode
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                <GitMerge className="w-4 h-4" />
                {mergeMode ? 'Cancel Merge' : 'Merge Tags'}
              </button>
              {mergeMode && selectedTags.size > 0 && (
                <button
                  onClick={handleStartMerge}
                  disabled={selectedTags.size < 1}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Merge {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-primary">
                {totalTags}
              </div>
              <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Total Tags
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-primary">
                {totalTaggedNotes}
              </div>
              <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Tagged Notes
              </div>
            </div>
            <div className="text-center">
              {mostUsedTag ? (
                <>
                  <div className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
                    {mostUsedTag.tag}
                  </div>
                  <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Most Used ({mostUsedTag.count})
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                    —
                  </div>
                  <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Most Used
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tag List */}
          <div className="flex-1 overflow-y-auto p-4">
            {tagCounts.length === 0 ? (
              <div className="text-center py-12 text-text-light-secondary dark:text-text-dark-secondary">
                <TagIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No tags yet</p>
                <p className="text-xs mt-1">Tags will appear here once you add them to notes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tagCounts.map(({ tag, count }) => (
                  <div
                    key={tag}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                  >
                    {editingTag === tag ? (
                      // Edit Mode
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="flex-1 px-2 py-1 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 text-xs font-medium rounded bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-xs font-medium rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          {mergeMode && (
                            <input
                              type="checkbox"
                              checked={selectedTags.has(tag)}
                              onChange={() => handleToggleTagSelection(tag)}
                              className="flex-shrink-0 w-4 h-4 rounded border-border-light dark:border-border-dark"
                              aria-label={`Select ${tag} for merging`}
                            />
                          )}
                          <div
                            className={`w-4 h-4 rounded flex-shrink-0 ${
                              tagColors[tag]
                                ? `bg-${tagColors[tag]}`
                                : 'bg-border-light dark:bg-border-dark'
                            }`}
                          />
                          <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                            {tag}
                          </span>
                          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            {count} {count === 1 ? 'note' : 'notes'}
                          </span>
                        </div>
                        {!mergeMode && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenColorPicker(tag)}
                              className="p-1.5 hover:bg-surface-light dark:hover:bg-surface-dark rounded transition-colors"
                              aria-label={`Set color for tag ${tag}`}
                            >
                              <Palette className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary" />
                            </button>
                            <button
                              onClick={() => handleStartEdit(tag)}
                              className="p-1.5 hover:bg-surface-light dark:hover:bg-surface-dark rounded transition-colors"
                              aria-label={`Rename tag ${tag}`}
                            >
                              <Edit2 className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary" />
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(tag)}
                              className="p-1.5 hover:bg-surface-light dark:hover:bg-surface-dark rounded transition-colors"
                              aria-label={`Delete tag ${tag}`}
                            >
                              <Trash2 className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-red" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium rounded bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTag && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" aria-hidden="true" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl max-w-md w-full p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-tag-title"
            >
              <h3
                id="delete-tag-title"
                className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2"
              >
                Delete Tag?
              </h3>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
                Are you sure you want to delete the tag <span className="font-medium text-text-light-primary dark:text-text-dark-primary">"{deletingTag}"</span>?
                This will remove it from all notes.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium rounded bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Color Picker Modal */}
      {colorPickerTag && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" aria-hidden="true" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl max-w-md w-full p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="color-picker-title"
            >
              <h3
                id="color-picker-title"
                className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4"
              >
                Set Tag Color
              </h3>
              <TagColorPicker
                selectedColor={tagColors[colorPickerTag]}
                onColorSelect={handleSelectColor}
                tagName={colorPickerTag}
              />
              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={handleCloseColorPicker}
                  className="px-4 py-2 text-sm font-medium rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Merge Confirmation Modal */}
      {mergingTo && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" aria-hidden="true" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl max-w-md w-full p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="merge-tags-title"
            >
              <h3
                id="merge-tags-title"
                className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2"
              >
                Merge Tags
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    Selected tags will be replaced with:
                  </p>
                  <div className="flex flex-wrap gap-2 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark">
                    {Array.from(selectedTags).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-accent-primary/10 text-accent-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                    Target Tag Name
                  </label>
                  <input
                    type="text"
                    value={targetTagName}
                    onChange={(e) => setTargetTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmMerge();
                      else if (e.key === 'Escape') handleCancelMerge();
                    }}
                    placeholder="Enter target tag name"
                    className="w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    All notes with selected tags will be updated to use this tag
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={handleCancelMerge}
                  className="px-4 py-2 text-sm font-medium rounded border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMerge}
                  disabled={!targetTagName.trim()}
                  className="px-4 py-2 text-sm font-medium rounded bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Merge Tags
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
