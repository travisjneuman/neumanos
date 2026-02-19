/**
 * SpreadsheetGrid Component
 *
 * Virtualized grid for spreadsheet rendering. Only renders visible cells
 * plus a buffer for smooth scrolling. Handles cell selection, editing,
 * and keyboard navigation.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FormulaResult } from '../../services/formulaEngine';
import type { CellStyle } from '../../types';
import {
  colToLetter,
  createRef,
  formatCellValue,
  isCellSelected,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  type CellSelection,
} from './spreadsheetUtils';

// Buffer rows/cols outside viewport for smooth scrolling
const BUFFER = 3;

interface SpreadsheetGridProps {
  /** 2D array of raw cell data (formulas or values) */
  data: string[][];
  /** Function to get evaluated cell value from FormulaEngine */
  getCellValue: (row: number, col: number) => FormulaResult;
  /** Cell styles keyed by reference (e.g., "A1") */
  cellStyles: Record<string, CellStyle>;
  /** Column widths array */
  columnWidths: number[];
  /** Row heights array */
  rowHeights: number[];
  /** Current selection */
  selection: CellSelection | null;
  /** Currently editing cell */
  editingCell: { row: number; col: number } | null;
  /** Edit value for the editing cell */
  editValue: string;
  /** Called when selection changes */
  onSelectionChange: (selection: CellSelection | null) => void;
  /** Called when editing starts */
  onStartEdit: (row: number, col: number, value?: string) => void;
  /** Called when edit value changes */
  onEditChange: (value: string) => void;
  /** Called when edit is committed */
  onCommitEdit: () => void;
  /** Called when edit is cancelled */
  onCancelEdit: () => void;
}

export function SpreadsheetGrid({
  data,
  getCellValue,
  cellStyles,
  columnWidths,
  rowHeights,
  selection,
  editingCell,
  editValue,
  onSelectionChange,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
}: SpreadsheetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const rowCount = data.length;
  const colCount = data[0]?.length || 0;

  // Calculate cumulative offsets for positioning
  const rowOffsets = useMemo(() => {
    const offsets: number[] = [0];
    for (let i = 0; i < rowCount; i++) {
      offsets.push(offsets[i] + (rowHeights[i] || DEFAULT_ROW_HEIGHT));
    }
    return offsets;
  }, [rowHeights, rowCount]);

  const colOffsets = useMemo(() => {
    const offsets: number[] = [0];
    for (let i = 0; i < colCount; i++) {
      offsets.push(offsets[i] + (columnWidths[i] || DEFAULT_COLUMN_WIDTH));
    }
    return offsets;
  }, [columnWidths, colCount]);

  const totalHeight = rowOffsets[rowCount] || 0;
  const totalWidth = colOffsets[colCount] || 0;

  // Row header width (for row numbers)
  const rowHeaderWidth = 50;
  // Column header height
  const colHeaderHeight = 24;

  // Find visible row/col range
  const findVisibleRange = useCallback(
    (
      offsets: number[],
      scrollPos: number,
      viewportDim: number
    ): { start: number; end: number } => {
      let start = 0;
      let end = offsets.length - 2;

      // Binary search for start
      let lo = 0;
      let hi = offsets.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (offsets[mid + 1] > scrollPos) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      start = Math.max(0, lo - BUFFER);

      // Find end
      const viewEnd = scrollPos + viewportDim;
      lo = start;
      hi = offsets.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (offsets[mid] >= viewEnd) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      end = Math.min(offsets.length - 2, lo + BUFFER);

      return { start, end };
    },
    []
  );

  const visibleRows = useMemo(
    () => findVisibleRange(rowOffsets, scrollTop, viewportSize.height - colHeaderHeight),
    [rowOffsets, scrollTop, viewportSize.height, findVisibleRange]
  );

  const visibleCols = useMemo(
    () => findVisibleRange(colOffsets, scrollLeft, viewportSize.width - rowHeaderWidth),
    [colOffsets, scrollLeft, viewportSize.width, findVisibleRange]
  );

  // Update viewport size on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setViewportSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (e.shiftKey && selection) {
        // Extend selection
        onSelectionChange({
          ...selection,
          focusRow: row,
          focusCol: col,
        });
      } else {
        // New selection
        onSelectionChange({
          anchorRow: row,
          anchorCol: col,
          focusRow: row,
          focusCol: col,
        });
      }
    },
    [selection, onSelectionChange]
  );

  // Handle cell double-click to edit
  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      onStartEdit(row, col);
    },
    [onStartEdit]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selection) return;

      const { focusRow, focusCol } = selection;

      // If editing, let the input handle it
      if (editingCell) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommitEdit();
          // Move to next row
          if (focusRow < rowCount - 1) {
            onSelectionChange({
              anchorRow: focusRow + 1,
              anchorCol: focusCol,
              focusRow: focusRow + 1,
              focusCol: focusCol,
            });
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancelEdit();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          onCommitEdit();
          // Move to next column
          if (e.shiftKey) {
            if (focusCol > 0) {
              onSelectionChange({
                anchorRow: focusRow,
                anchorCol: focusCol - 1,
                focusRow: focusRow,
                focusCol: focusCol - 1,
              });
            }
          } else {
            if (focusCol < colCount - 1) {
              onSelectionChange({
                anchorRow: focusRow,
                anchorCol: focusCol + 1,
                focusRow: focusRow,
                focusCol: focusCol + 1,
              });
            }
          }
        }
        return;
      }

      // Navigation when not editing
      let newRow = focusRow;
      let newCol = focusCol;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRow = Math.max(0, focusRow - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRow = Math.min(rowCount - 1, focusRow + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newCol = Math.max(0, focusCol - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newCol = Math.min(colCount - 1, focusCol + 1);
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            newCol = Math.max(0, focusCol - 1);
          } else {
            newCol = Math.min(colCount - 1, focusCol + 1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          onStartEdit(focusRow, focusCol);
          return;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          onStartEdit(focusRow, focusCol, '');
          return;
        default:
          // Start typing to edit
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onStartEdit(focusRow, focusCol, e.key);
            return;
          }
      }

      if (newRow !== focusRow || newCol !== focusCol) {
        if (e.shiftKey) {
          // Extend selection
          onSelectionChange({
            ...selection,
            focusRow: newRow,
            focusCol: newCol,
          });
        } else {
          // Move selection
          onSelectionChange({
            anchorRow: newRow,
            anchorCol: newCol,
            focusRow: newRow,
            focusCol: newCol,
          });
        }
      }
    },
    [
      selection,
      editingCell,
      rowCount,
      colCount,
      onSelectionChange,
      onStartEdit,
      onCommitEdit,
      onCancelEdit,
    ]
  );

  // Render a cell
  const renderCell = (row: number, col: number) => {
    const ref = createRef(row, col);
    const style = cellStyles[ref] || {};
    const isSelected = isCellSelected(row, col, selection);
    const isEditing =
      editingCell?.row === row && editingCell?.col === col;
    const isFocus =
      selection?.focusRow === row && selection?.focusCol === col;

    // Get display value
    let displayValue = '';
    if (!isEditing) {
      const cellValue = getCellValue(row, col);
      displayValue = formatCellValue(cellValue, style.numberFormat);
    }

    const cellStyle: React.CSSProperties = {
      position: 'absolute',
      left: colOffsets[col],
      top: rowOffsets[row],
      width: columnWidths[col] || DEFAULT_COLUMN_WIDTH,
      height: rowHeights[row] || DEFAULT_ROW_HEIGHT,
      backgroundColor: style.backgroundColor,
      color: style.textColor,
      fontWeight: style.bold ? 'bold' : undefined,
      fontStyle: style.italic ? 'italic' : undefined,
      textDecoration: style.underline ? 'underline' : undefined,
      textAlign: style.alignment || 'left',
      verticalAlign: style.verticalAlignment || 'middle',
      borderTop: style.borderTop
        ? `1px ${style.borderTop.style} ${style.borderTop.color}`
        : undefined,
      borderRight: style.borderRight
        ? `1px ${style.borderRight.style} ${style.borderRight.color}`
        : undefined,
      borderBottom: style.borderBottom
        ? `1px ${style.borderBottom.style} ${style.borderBottom.color}`
        : undefined,
      borderLeft: style.borderLeft
        ? `1px ${style.borderLeft.style} ${style.borderLeft.color}`
        : undefined,
    };

    return (
      <div
        key={ref}
        className={`
          cell flex items-center px-1 text-sm overflow-hidden whitespace-nowrap border-r border-b border-border-light dark:border-border-dark
          ${isSelected ? 'bg-accent-primary/10' : 'bg-surface-light dark:bg-surface-dark-elevated'}
          ${isFocus ? 'ring-2 ring-accent-primary ring-inset z-10' : ''}
        `}
        style={cellStyle}
        onClick={(e) => handleCellClick(row, col, e)}
        onDoubleClick={() => handleCellDoubleClick(row, col)}
      >
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="w-full h-full bg-surface-light dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary outline-none"
            style={{ textAlign: style.alignment || 'left' }}
          />
        ) : (
          <span className="truncate">{displayValue}</span>
        )}
      </div>
    );
  };

  // Render column headers
  const renderColumnHeaders = () => {
    const headers: React.ReactNode[] = [];
    for (let col = visibleCols.start; col <= visibleCols.end; col++) {
      headers.push(
        <div
          key={`col-${col}`}
          className="absolute flex items-center justify-center text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary bg-surface-light-alt dark:bg-surface-dark border-r border-b border-border-light dark:border-border-dark"
          style={{
            left: colOffsets[col],
            top: 0,
            width: columnWidths[col] || DEFAULT_COLUMN_WIDTH,
            height: colHeaderHeight,
          }}
        >
          {colToLetter(col)}
        </div>
      );
    }
    return headers;
  };

  // Render row headers
  const renderRowHeaders = () => {
    const headers: React.ReactNode[] = [];
    for (let row = visibleRows.start; row <= visibleRows.end; row++) {
      headers.push(
        <div
          key={`row-${row}`}
          className="absolute flex items-center justify-center text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary bg-surface-light-alt dark:bg-surface-dark border-r border-b border-border-light dark:border-border-dark"
          style={{
            left: 0,
            top: rowOffsets[row],
            width: rowHeaderWidth,
            height: rowHeights[row] || DEFAULT_ROW_HEIGHT,
          }}
        >
          {row + 1}
        </div>
      );
    }
    return headers;
  };

  // Render visible cells
  const renderCells = () => {
    const cells: React.ReactNode[] = [];
    for (let row = visibleRows.start; row <= visibleRows.end; row++) {
      for (let col = visibleCols.start; col <= visibleCols.end; col++) {
        cells.push(renderCell(row, col));
      }
    }
    return cells;
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-auto bg-surface-light dark:bg-surface-dark-elevated focus:outline-none"
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
    >
      {/* Top-left corner cell */}
      <div
        className="sticky top-0 left-0 z-30 bg-surface-light-alt dark:bg-surface-dark border-r border-b border-border-light dark:border-border-dark"
        style={{ width: rowHeaderWidth, height: colHeaderHeight }}
      />

      {/* Column headers (sticky top) */}
      <div
        className="sticky top-0 z-20"
        style={{ marginLeft: rowHeaderWidth, height: colHeaderHeight }}
      >
        <div className="relative" style={{ width: totalWidth, height: colHeaderHeight }}>
          {renderColumnHeaders()}
        </div>
      </div>

      {/* Row headers (sticky left) */}
      <div
        className="sticky left-0 z-20"
        style={{ width: rowHeaderWidth, marginTop: -colHeaderHeight }}
      >
        <div className="relative" style={{ width: rowHeaderWidth, height: totalHeight }}>
          {renderRowHeaders()}
        </div>
      </div>

      {/* Cell grid */}
      <div
        className="relative"
        style={{
          width: totalWidth,
          height: totalHeight,
          marginLeft: rowHeaderWidth,
          marginTop: -totalHeight,
        }}
      >
        {renderCells()}
      </div>
    </div>
  );
}
