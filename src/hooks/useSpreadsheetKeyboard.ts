/**
 * useSpreadsheetKeyboard
 *
 * Keyboard navigation hook for a spreadsheet grid. Provides a `handleKeyDown`
 * function to attach to the grid container element.
 *
 * Supported key bindings:
 *   Arrow keys      — Move active cell up / down / left / right
 *   Tab             — Move right; Shift+Tab — move left
 *   Enter           — Start editing active cell (nav mode), or confirm edit
 *                     and move down (edit mode)
 *   Escape          — Cancel editing, return to navigation mode
 *   Home            — Go to first cell in the current row
 *   End             — Go to last cell in the current row
 *   Ctrl+Home       — Go to cell A1 (row 0, col 0)
 *   Ctrl+End        — Go to last cell that contains data
 *   F2              — Enter edit mode on the active cell
 *   Delete/Backspace — Clear active cell content (nav mode only)
 */

import { useCallback } from 'react';

export interface UseSpreadsheetKeyboardOptions {
  /** Total number of rows in the grid */
  rows: number;
  /** Total number of columns in the grid */
  cols: number;
  /** Currently active (focused) cell */
  activeCell: { row: number; col: number };
  /** Update the active cell */
  setActiveCell: (cell: { row: number; col: number }) => void;
  /** Whether a cell is currently being edited */
  isEditing: boolean;
  /** Toggle edit mode. Called with `true` to start editing, `false` to commit. */
  setIsEditing: (editing: boolean) => void;
  /**
   * Optional cancel callback for Escape key.
   * When provided, Escape calls this instead of `setIsEditing(false)` so the
   * host can distinguish a cancellation from a commit.
   */
  onCancelEdit?: () => void;
  /** Optional callback to clear a cell's content */
  onCellClear?: (row: number, col: number) => void;
  /** Ref to the scrollable grid container (used for future scroll-into-view) */
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Find the last column in the given row that contains data.
 * Falls back to `cols - 1` when no data reference is available.
 */
function findLastDataCol(
  row: number,
  cols: number,
  getData?: (row: number, col: number) => string
): number {
  if (!getData) return cols - 1;
  for (let c = cols - 1; c >= 0; c--) {
    if (getData(row, c) !== '') return c;
  }
  return 0;
}

/**
 * Find the last row that contains any data across all columns.
 * Falls back to `rows - 1` when no data reference is available.
 */
function findLastDataRow(
  rows: number,
  cols: number,
  getData?: (row: number, col: number) => string
): number {
  if (!getData) return rows - 1;
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      if (getData(r, c) !== '') return r;
    }
  }
  return 0;
}

export function useSpreadsheetKeyboard({
  rows,
  cols,
  activeCell,
  setActiveCell,
  isEditing,
  setIsEditing,
  onCancelEdit,
  onCellClear,
  containerRef: _containerRef,
}: UseSpreadsheetKeyboardOptions) {
  const clampRow = (r: number) => Math.max(0, Math.min(rows - 1, r));
  const clampCol = (c: number) => Math.max(0, Math.min(cols - 1, c));

  const move = useCallback(
    (row: number, col: number) => {
      setActiveCell({ row: clampRow(row), col: clampCol(col) });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, cols, setActiveCell]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const { row, col } = activeCell;

      // ------------------------------------------------------------------ //
      // Edit mode — only a small subset of keys are handled here; the rest  //
      // fall through to the browser / input element.                        //
      // ------------------------------------------------------------------ //
      if (isEditing) {
        switch (e.key) {
          case 'Enter': {
            // Confirm edit and move one row down
            e.preventDefault();
            setIsEditing(false);
            move(row + 1, col);
            break;
          }
          case 'Escape': {
            // Cancel edit, stay on current cell
            e.preventDefault();
            if (onCancelEdit) {
              onCancelEdit();
            } else {
              setIsEditing(false);
            }
            break;
          }
          case 'Tab': {
            // Confirm edit and move left / right
            e.preventDefault();
            setIsEditing(false);
            if (e.shiftKey) {
              move(row, col - 1);
            } else {
              move(row, col + 1);
            }
            break;
          }
          default:
            // All other keys handled by the underlying <input>
            break;
        }
        return;
      }

      // ------------------------------------------------------------------ //
      // Navigation mode                                                     //
      // ------------------------------------------------------------------ //
      switch (e.key) {
        // Arrow navigation
        case 'ArrowUp': {
          e.preventDefault();
          move(row - 1, col);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          move(row + 1, col);
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          move(row, col - 1);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          move(row, col + 1);
          break;
        }

        // Tab navigation
        case 'Tab': {
          e.preventDefault();
          if (e.shiftKey) {
            move(row, col - 1);
          } else {
            move(row, col + 1);
          }
          break;
        }

        // Enter — start editing
        case 'Enter': {
          e.preventDefault();
          setIsEditing(true);
          break;
        }

        // F2 — enter edit mode
        case 'F2': {
          e.preventDefault();
          setIsEditing(true);
          break;
        }

        // Escape — no-op in nav mode (editing already off), but still prevent default
        case 'Escape': {
          e.preventDefault();
          break;
        }

        // Home / End
        case 'Home': {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+Home → A1
            move(0, 0);
          } else {
            // Home → first cell in current row
            move(row, 0);
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+End → last cell with data
            const lastRow = findLastDataRow(rows, cols);
            const lastCol = findLastDataCol(lastRow, cols);
            move(lastRow, lastCol);
          } else {
            // End → last cell in current row
            move(row, cols - 1);
          }
          break;
        }

        // Delete / Backspace — clear cell content
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          onCellClear?.(row, col);
          break;
        }

        default:
          break;
      }
    },
    [activeCell, isEditing, move, rows, cols, setIsEditing, onCancelEdit, onCellClear]
  );

  return { handleKeyDown };
}
