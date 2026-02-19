/**
 * SpreadsheetSheetTabs Component
 *
 * Tab bar for managing multiple sheets in a workbook.
 * Supports adding, renaming, deleting, and switching between sheets.
 */

import { useCallback, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';
import type { SpreadsheetSheet } from '../../types';

interface SpreadsheetSheetTabsProps {
  /** Array of sheets in the workbook */
  sheets: SpreadsheetSheet[];
  /** Index of the currently active sheet */
  activeIndex: number;
  /** Called when a sheet is selected */
  onSelect: (index: number) => void;
  /** Called when a new sheet should be added */
  onAdd: () => void;
  /** Called when a sheet should be renamed */
  onRename: (index: number, name: string) => void;
  /** Called when a sheet should be deleted */
  onDelete: (index: number) => void;
}

export function SpreadsheetSheetTabs({
  sheets,
  activeIndex,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: SpreadsheetSheetTabsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [sheetToDelete, setSheetToDelete] = useState<number | null>(null);

  const handleDoubleClick = useCallback((index: number, currentName: string) => {
    setEditingIndex(index);
    setEditName(currentName);
  }, []);

  const handleSaveRename = useCallback(() => {
    if (editingIndex !== null && editName.trim()) {
      onRename(editingIndex, editName.trim());
    }
    setEditingIndex(null);
    setEditName('');
  }, [editingIndex, editName, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveRename();
      } else if (e.key === 'Escape') {
        setEditingIndex(null);
        setEditName('');
      }
    },
    [handleSaveRename]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (sheets.length > 1) {
        setSheetToDelete(index);
      }
    },
    [sheets.length]
  );

  const confirmDelete = useCallback(() => {
    if (sheetToDelete !== null) {
      onDelete(sheetToDelete);
      setSheetToDelete(null);
    }
  }, [sheetToDelete, onDelete]);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-light-alt dark:bg-surface-dark border-t border-border-light dark:border-border-dark overflow-x-auto">
      {/* Sheet tabs */}
      {sheets.map((sheet, index) => {
        const isActive = index === activeIndex;
        const isEditing = index === editingIndex;

        return (
          <div
            key={sheet.id}
            className={`group flex items-center gap-1 px-3 py-1 rounded-t text-sm cursor-pointer transition-colors ${
              isActive
                ? 'bg-surface-light dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary border-t border-l border-r border-border-light dark:border-border-dark -mb-px'
                : 'bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
            }`}
            onClick={() => onSelect(index)}
            onDoubleClick={() => handleDoubleClick(index, sheet.name)}
          >
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="w-24 px-1 text-sm bg-transparent border-b border-accent-primary focus:outline-none"
              />
            ) : (
              <span className="max-w-32 truncate">{sheet.name}</span>
            )}

            {/* Delete button (only show for non-last sheet) */}
            {sheets.length > 1 && !isEditing && (
              <button
                onClick={(e) => handleDelete(e, index)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-status-error transition-opacity"
                title="Delete sheet"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Add sheet button */}
      <button
        onClick={onAdd}
        className="p-1.5 text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated rounded transition-colors"
        title="Add sheet"
      >
        <Plus className="w-4 h-4" />
      </button>

      <ConfirmDialog
        isOpen={sheetToDelete !== null}
        onClose={() => setSheetToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Sheet"
        message={sheetToDelete !== null ? `Delete "${sheets[sheetToDelete]?.name}"? This cannot be undone.` : ''}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
