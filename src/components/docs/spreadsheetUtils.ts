/**
 * Spreadsheet Utility Functions
 *
 * Cell reference utilities and helper functions for the spreadsheet editor.
 */

/**
 * Convert column index to Excel-style letter(s).
 * 0 -> 'A', 25 -> 'Z', 26 -> 'AA', 27 -> 'AB', etc.
 */
export function colToLetter(col: number): string {
  let letter = '';
  let c = col;
  while (c >= 0) {
    letter = String.fromCharCode((c % 26) + 65) + letter;
    c = Math.floor(c / 26) - 1;
  }
  return letter;
}

/**
 * Convert Excel-style column letter(s) to index.
 * 'A' -> 0, 'Z' -> 25, 'AA' -> 26, 'AB' -> 27, etc.
 */
export function letterToCol(letter: string): number {
  let col = 0;
  for (let i = 0; i < letter.length; i++) {
    col = col * 26 + (letter.charCodeAt(i) - 64);
  }
  return col - 1;
}

/**
 * Parse cell reference string (e.g., "A1") to row/col indices.
 */
export function parseRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid cell reference: ${ref}`);
  }
  const col = letterToCol(match[1].toUpperCase());
  const row = parseInt(match[2], 10) - 1; // 1-indexed to 0-indexed
  return { row, col };
}

/**
 * Create cell reference string from row/col indices.
 * Row 0, Col 0 -> "A1"
 */
export function createRef(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`;
}

/**
 * Parse a range string (e.g., "A1:B3") to start/end coordinates.
 */
export function parseRange(range: string): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} {
  const [start, end] = range.split(':');
  const startCoords = parseRef(start);
  const endCoords = end ? parseRef(end) : startCoords;

  return {
    startRow: Math.min(startCoords.row, endCoords.row),
    startCol: Math.min(startCoords.col, endCoords.col),
    endRow: Math.max(startCoords.row, endCoords.row),
    endCol: Math.max(startCoords.col, endCoords.col),
  };
}

/**
 * Check if a cell is within a given range.
 */
export function isCellInRange(
  row: number,
  col: number,
  range: { startRow: number; startCol: number; endRow: number; endCol: number }
): boolean {
  return (
    row >= range.startRow &&
    row <= range.endRow &&
    col >= range.startCol &&
    col <= range.endCol
  );
}

/**
 * Selection state representing selected cells.
 */
export interface CellSelection {
  // The cell where selection started (anchor)
  anchorRow: number;
  anchorCol: number;
  // The cell where selection ends (can be different for range selection)
  focusRow: number;
  focusCol: number;
}

/**
 * Get the bounding box of a selection (normalize anchor/focus).
 */
export function getSelectionBounds(selection: CellSelection): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} {
  return {
    startRow: Math.min(selection.anchorRow, selection.focusRow),
    startCol: Math.min(selection.anchorCol, selection.focusCol),
    endRow: Math.max(selection.anchorRow, selection.focusRow),
    endCol: Math.max(selection.anchorCol, selection.focusCol),
  };
}

/**
 * Check if a cell is within the current selection.
 */
export function isCellSelected(
  row: number,
  col: number,
  selection: CellSelection | null
): boolean {
  if (!selection) return false;
  const bounds = getSelectionBounds(selection);
  return isCellInRange(row, col, bounds);
}

/**
 * Format a number according to a format string.
 * Simplified formatting - handles common cases.
 */
export function formatCellValue(
  value: unknown,
  format?: string
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // If it's a formula error (FormulaEngine returns { type: 'ERROR', value: '#DIV/0!' })
  if (typeof value === 'object' && value !== null && 'type' in value) {
    const errorObj = value as { type: string; value?: string };
    return errorObj.value ? String(errorObj.value) : String(errorObj.type);
  }

  // If it's not a number or no format, just stringify
  if (typeof value !== 'number' || !format) {
    return String(value);
  }

  // Handle common formats
  if (format.includes('$')) {
    // Currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }

  if (format.includes('%')) {
    // Percentage
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: format.includes('.') ? 2 : 0,
    }).format(value);
  }

  if (format.includes('.')) {
    // Decimal places
    const decimals = (format.match(/\.0*/)?.[0]?.length ?? 1) - 1;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  if (format.includes(',')) {
    // Thousands separator
    return new Intl.NumberFormat('en-US').format(value);
  }

  return String(value);
}

/**
 * Check if a value is a formula (starts with =).
 */
export function isFormula(value: string): boolean {
  return typeof value === 'string' && value.startsWith('=');
}

/**
 * Default column width in pixels.
 */
export const DEFAULT_COLUMN_WIDTH = 100;

/**
 * Default row height in pixels.
 */
export const DEFAULT_ROW_HEIGHT = 24;

/**
 * Number of rows in a new sheet.
 */
export const DEFAULT_ROW_COUNT = 100;

/**
 * Number of columns in a new sheet.
 */
export const DEFAULT_COLUMN_COUNT = 26;
