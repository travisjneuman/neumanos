/**
 * Spreadsheet Import/Export Utilities
 *
 * Uses write-excel-file + read-excel-file (MIT) for XLSX.
 * Custom CSV implementation with RFC 4180 escaping.
 */

import type { SpreadsheetDoc, SpreadsheetSheet } from '../../types';
import { DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from './spreadsheetUtils';

/**
 * Export spreadsheet to XLSX format.
 * Uses write-excel-file which triggers native "Save as" dialog in browser.
 */
export async function exportToXlsx(doc: SpreadsheetDoc): Promise<void> {
  // Lazy load to reduce initial bundle size
  const writeXlsxFile = (await import('write-excel-file')).default;

  // Build sheet data for write-excel-file
  // Each sheet is an array of rows, each row is an array of cell objects
  const sheetsData = doc.sheets.map((sheet) =>
    sheet.data.map((row) =>
      row.map((cell) => {
        const num = parseFloat(cell);
        if (!isNaN(num) && cell === String(num)) {
          return { type: Number as NumberConstructor, value: num };
        }
        return { type: String as StringConstructor, value: cell || '' };
      })
    )
  );

  // Build column widths per sheet (convert px to approximate char width)
  const columns = doc.sheets.map((sheet) =>
    (sheet.columnWidths || []).map((w) => ({ width: Math.round((w ?? DEFAULT_COLUMN_WIDTH) / 7) }))
  );

  await writeXlsxFile(sheetsData, {
    sheets: doc.sheets.map((s) => s.name),
    columns,
    fileName: `${doc.title || 'spreadsheet'}.xlsx`,
  });
}

/**
 * Export spreadsheet to CSV format (active sheet only).
 * RFC 4180 compliant: fields with commas, quotes, or newlines are quoted.
 */
export function exportToCsv(doc: SpreadsheetDoc): Blob {
  const sheet = doc.sheets[doc.activeSheetIndex] || doc.sheets[0];

  const csvContent = sheet.data
    .map((row) =>
      row
        .map((cell) => {
          // Quote fields that contain commas, double quotes, or newlines
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    )
    .join('\n');

  return new Blob([csvContent], {
    type: 'text/csv;charset=utf-8',
  });
}

/**
 * Import from XLSX file.
 * Uses read-excel-file to parse XLSX and return sheet data.
 */
export async function importFromXlsx(file: File): Promise<SpreadsheetSheet[]> {
  const readXlsxFile = (await import('read-excel-file')).default;

  // read-excel-file reads one sheet at a time; read the first sheet
  const rows = await readXlsxFile(file);

  const data = rows.map((row) =>
    row.map((cell) => String(cell ?? ''))
  );

  const paddedData = padData(data, 100, 26);

  return [{
    id: crypto.randomUUID(),
    name: file.name.replace(/\.xlsx?$/i, ''),
    data: paddedData,
    columnWidths: Array(26).fill(DEFAULT_COLUMN_WIDTH),
    rowHeights: Array(paddedData.length).fill(DEFAULT_ROW_HEIGHT),
    cellStyles: {},
    mergedCells: [],
  }];
}

/**
 * Import from CSV file.
 * Parses CSV with proper RFC 4180 handling (quoted fields, escaped quotes).
 */
export async function importFromCsv(file: File): Promise<SpreadsheetSheet[]> {
  const text = await file.text();
  const data = parseCsv(text);
  const paddedData = padData(data, 100, 26);

  return [{
    id: crypto.randomUUID(),
    name: file.name.replace(/\.csv$/i, ''),
    data: paddedData,
    columnWidths: Array(26).fill(DEFAULT_COLUMN_WIDTH),
    rowHeights: Array(paddedData.length).fill(DEFAULT_ROW_HEIGHT),
    cellStyles: {},
    mergedCells: [],
  }];
}

/**
 * Parse CSV string into 2D string array.
 * Handles RFC 4180 quoted fields and escaped double-quotes.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"' && currentField === '') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r') i++; // Skip \n after \r
      } else if (char === '\r') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Pad data array to minimum dimensions
 */
function padData(data: string[][], minRows: number, minCols: number): string[][] {
  // Ensure minimum rows
  while (data.length < minRows) {
    data.push([]);
  }

  // Ensure minimum columns in each row
  const result = data.map((row) => {
    const paddedRow = [...row];
    while (paddedRow.length < minCols) {
      paddedRow.push('');
    }
    // Trim to max cols
    return paddedRow.slice(0, minCols);
  });

  // Trim to max rows
  return result.slice(0, minRows);
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read file from input element
 */
export function readFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.onchange = () => {
      const file = input.files?.[0] || null;
      resolve(file);
    };

    input.oncancel = () => resolve(null);

    input.click();
  });
}
