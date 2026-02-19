/**
 * SpreadsheetEditor Component
 *
 * Main spreadsheet editor using FormulaEngine (MIT) for formula evaluation.
 * Manages formula evaluation, cell data, and editing state.
 */

import { useCallback, useMemo, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { FormulaEngine, type FormulaResult } from '../../services/formulaEngine';
import type { SpreadsheetDoc, SpreadsheetSheet, SpreadsheetChart, CellStyle } from '../../types';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { SpreadsheetFormulaBar } from './SpreadsheetFormulaBar';
import { SpreadsheetToolbar } from './SpreadsheetToolbar';
import { SpreadsheetSheetTabs } from './SpreadsheetSheetTabs';
import { SpreadsheetChartDialog } from './SpreadsheetChartDialog';
import { SpreadsheetChartRenderer } from './SpreadsheetChartRenderer';
import {
  createRef,
  colToLetter,
  isFormula,
  type CellSelection,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
} from './spreadsheetUtils';
import {
  exportToXlsx,
  exportToCsv,
  importFromXlsx,
  importFromCsv,
  downloadBlob,
  readFile,
} from './spreadsheetExport';

interface SpreadsheetEditorProps {
  /** The spreadsheet document */
  doc: SpreadsheetDoc;
  /** Called when the document changes (debounced) */
  onSave: (updates: Partial<SpreadsheetDoc>) => void;
}

export function SpreadsheetEditor({ doc, onSave }: SpreadsheetEditorProps) {
  const [activeSheetIndex, setActiveSheetIndex] = useState(doc.activeSheetIndex);
  const [selection, setSelection] = useState<CellSelection | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [editingChart, setEditingChart] = useState<SpreadsheetChart | null>(null);

  // Get active sheet
  const activeSheet = doc.sheets[activeSheetIndex] || doc.sheets[0];

  // Stateless formula engine — no data sync needed
  const engine = useMemo(() => new FormulaEngine(), []);

  // Debounced save
  const debouncedSave = useDebouncedCallback((updates: Partial<SpreadsheetDoc>) => {
    onSave(updates);
  }, 1000);

  // Get evaluated cell value via formula engine
  const getCellValue = useCallback(
    (row: number, col: number): FormulaResult => {
      const raw = activeSheet.data[row]?.[col] || '';
      if (!isFormula(raw)) {
        // Return raw for non-formulas; let the grid format it
        if (raw === '') return null;
        const num = parseFloat(raw);
        if (!isNaN(num) && raw === String(num)) return num;
        return raw;
      }
      return engine.evaluate(
        raw,
        activeSheet.data,
        activeSheetIndex,
        doc.sheets.map((s) => s.data)
      );
    },
    [engine, activeSheet, activeSheetIndex, doc.sheets]
  );

  // Get raw cell value (formula or value)
  const getRawCellValue = useCallback(
    (row: number, col: number): string => {
      return activeSheet.data[row]?.[col] || '';
    },
    [activeSheet]
  );

  // Update cell value — just update data model, engine is stateless
  const setCellValue = useCallback(
    (row: number, col: number, value: string) => {
      const newData = activeSheet.data.map((r, ri) =>
        ri === row
          ? r.map((c, ci) => (ci === col ? value : c))
          : r
      );

      const newSheets = doc.sheets.map((sheet, i) =>
        i === activeSheetIndex ? { ...sheet, data: newData } : sheet
      );

      debouncedSave({ sheets: newSheets });
    },
    [activeSheetIndex, activeSheet, doc.sheets, debouncedSave]
  );

  // Update cell style
  const setCellStyle = useCallback(
    (row: number, col: number, style: Partial<CellStyle>) => {
      const ref = createRef(row, col);
      const currentStyle = activeSheet.cellStyles?.[ref] || {};
      const newStyle = { ...currentStyle, ...style };

      const newCellStyles = {
        ...activeSheet.cellStyles,
        [ref]: newStyle,
      };

      const newSheets = doc.sheets.map((sheet, i) =>
        i === activeSheetIndex ? { ...sheet, cellStyles: newCellStyles } : sheet
      );

      debouncedSave({ sheets: newSheets });
    },
    [activeSheetIndex, activeSheet, doc.sheets, debouncedSave]
  );

  // Handle selection change
  const handleSelectionChange = useCallback((newSelection: CellSelection | null) => {
    setSelection(newSelection);
    // Exit edit mode when selection changes
    if (editingCell) {
      setEditingCell(null);
    }
  }, [editingCell]);

  // Handle start edit
  const handleStartEdit = useCallback(
    (row: number, col: number, initialValue?: string) => {
      setEditingCell({ row, col });
      setSelection({
        anchorRow: row,
        anchorCol: col,
        focusRow: row,
        focusCol: col,
      });
      const rawValue = getRawCellValue(row, col);
      setEditValue(initialValue !== undefined ? initialValue : rawValue);
    },
    [getRawCellValue]
  );

  // Handle edit value change
  const handleEditChange = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  // Handle commit edit
  const handleCommitEdit = useCallback(() => {
    if (editingCell) {
      setCellValue(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
    }
  }, [editingCell, editValue, setCellValue]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    if (selection) {
      setEditValue(getRawCellValue(selection.focusRow, selection.focusCol));
    }
  }, [selection, getRawCellValue]);

  // Formula bar handlers
  const selectedRow = selection?.focusRow ?? null;
  const selectedCol = selection?.focusCol ?? null;
  const formulaBarValue =
    editingCell
      ? editValue
      : selectedRow !== null && selectedCol !== null
        ? getRawCellValue(selectedRow, selectedCol)
        : '';

  const handleFormulaBarChange = useCallback(
    (value: string) => {
      if (selectedRow !== null && selectedCol !== null) {
        setEditValue(value);
        if (!editingCell) {
          setEditingCell({ row: selectedRow, col: selectedCol });
        }
      }
    },
    [selectedRow, selectedCol, editingCell]
  );

  const handleFormulaBarCommit = useCallback(() => {
    if (selectedRow !== null && selectedCol !== null) {
      setCellValue(selectedRow, selectedCol, editValue);
      setEditingCell(null);
    }
  }, [selectedRow, selectedCol, editValue, setCellValue]);

  // Sheet management — just manipulate the data model directly
  const handleAddSheet = useCallback(() => {
    const newSheet: SpreadsheetSheet = {
      id: crypto.randomUUID(),
      name: `Sheet ${doc.sheets.length + 1}`,
      data: Array.from({ length: 100 }, () => Array(26).fill('')),
      columnWidths: Array(26).fill(DEFAULT_COLUMN_WIDTH),
      rowHeights: Array(100).fill(DEFAULT_ROW_HEIGHT),
      cellStyles: {},
      mergedCells: [],
    };

    const newSheets = [...doc.sheets, newSheet];
    onSave({ sheets: newSheets, activeSheetIndex: newSheets.length - 1 });
    setActiveSheetIndex(newSheets.length - 1);
  }, [doc.sheets, onSave]);

  const handleRenameSheet = useCallback(
    (index: number, name: string) => {
      const newSheets = doc.sheets.map((sheet, i) =>
        i === index ? { ...sheet, name } : sheet
      );
      onSave({ sheets: newSheets });
    },
    [doc.sheets, onSave]
  );

  const handleDeleteSheet = useCallback(
    (index: number) => {
      if (doc.sheets.length <= 1) return; // Can't delete last sheet

      const newSheets = doc.sheets.filter((_, i) => i !== index);
      const newActiveIndex = Math.min(activeSheetIndex, newSheets.length - 1);

      onSave({ sheets: newSheets, activeSheetIndex: newActiveIndex });
      setActiveSheetIndex(newActiveIndex);
    },
    [doc.sheets, activeSheetIndex, onSave]
  );

  const handleSelectSheet = useCallback(
    (index: number) => {
      setActiveSheetIndex(index);
      onSave({ activeSheetIndex: index });
      setSelection(null);
      setEditingCell(null);
    },
    [onSave]
  );

  // Toolbar handlers for formatting
  const handleFormatChange = useCallback(
    (format: Partial<CellStyle>) => {
      if (!selection) return;

      const { anchorRow, anchorCol, focusRow, focusCol } = selection;
      const startRow = Math.min(anchorRow, focusRow);
      const endRow = Math.max(anchorRow, focusRow);
      const startCol = Math.min(anchorCol, focusCol);
      const endCol = Math.max(anchorCol, focusCol);

      // Apply to all selected cells
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          setCellStyle(row, col, format);
        }
      }
    },
    [selection, setCellStyle]
  );

  // Get current cell style for toolbar
  const currentCellStyle = useMemo(() => {
    if (!selection) return {};
    const ref = createRef(selection.focusRow, selection.focusCol);
    return activeSheet.cellStyles?.[ref] || {};
  }, [selection, activeSheet.cellStyles]);

  // Get selection range string for chart dialog
  const getSelectionRange = useCallback((): string | undefined => {
    if (!selection) return undefined;
    const { anchorRow, anchorCol, focusRow, focusCol } = selection;
    const startRow = Math.min(anchorRow, focusRow);
    const endRow = Math.max(anchorRow, focusRow);
    const startCol = Math.min(anchorCol, focusCol);
    const endCol = Math.max(anchorCol, focusCol);
    return `${colToLetter(startCol)}${startRow + 1}:${colToLetter(endCol)}${endRow + 1}`;
  }, [selection]);

  // Chart handlers
  const handleInsertChart = useCallback(() => {
    setEditingChart(null);
    setShowChartDialog(true);
  }, []);

  const handleSaveChart = useCallback(
    (chart: SpreadsheetChart) => {
      const existingCharts = activeSheet.charts || [];
      let newCharts: SpreadsheetChart[];

      if (editingChart) {
        // Update existing chart
        newCharts = existingCharts.map((c) =>
          c.id === chart.id ? chart : c
        );
      } else {
        // Add new chart
        newCharts = [...existingCharts, chart];
      }

      const newSheets = doc.sheets.map((sheet, i) =>
        i === activeSheetIndex ? { ...sheet, charts: newCharts } : sheet
      );

      onSave({ sheets: newSheets });
      setShowChartDialog(false);
      setEditingChart(null);
    },
    [activeSheet, activeSheetIndex, doc.sheets, editingChart, onSave]
  );

  const handleEditChart = useCallback((chart: SpreadsheetChart) => {
    setEditingChart(chart);
    setShowChartDialog(true);
  }, []);

  const handleDeleteChart = useCallback(
    (chartId: string) => {
      const existingCharts = activeSheet.charts || [];
      const newCharts = existingCharts.filter((c) => c.id !== chartId);

      const newSheets = doc.sheets.map((sheet, i) =>
        i === activeSheetIndex ? { ...sheet, charts: newCharts } : sheet
      );

      onSave({ sheets: newSheets });
    },
    [activeSheet, activeSheetIndex, doc.sheets, onSave]
  );

  const handleMoveChart = useCallback(
    (chartId: string, position: SpreadsheetChart['position']) => {
      const existingCharts = activeSheet.charts || [];
      const newCharts = existingCharts.map((c) =>
        c.id === chartId ? { ...c, position } : c
      );

      const newSheets = doc.sheets.map((sheet, i) =>
        i === activeSheetIndex ? { ...sheet, charts: newCharts } : sheet
      );

      debouncedSave({ sheets: newSheets });
    },
    [activeSheet, activeSheetIndex, doc.sheets, debouncedSave]
  );

  // Import/Export handlers
  const handleExport = useCallback(
    async (format: 'xlsx' | 'csv') => {
      try {
        if (format === 'xlsx') {
          await exportToXlsx(doc);
        } else {
          const blob = exportToCsv(doc);
          const filename = `${doc.title || 'spreadsheet'}.csv`;
          downloadBlob(blob, filename);
        }
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [doc]
  );

  const handleImport = useCallback(async () => {
    try {
      const file = await readFile('.xlsx,.csv');
      if (!file) return;

      const sheets = file.name.endsWith('.csv')
        ? await importFromCsv(file)
        : await importFromXlsx(file);

      if (sheets.length > 0) {
        // Replace current sheets with imported ones
        onSave({ sheets, activeSheetIndex: 0 });
        setActiveSheetIndex(0);
        setSelection(null);
        setEditingCell(null);
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [onSave]);

  return (
    <div className="flex flex-col h-full bg-surface-light dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      {/* Toolbar */}
      <SpreadsheetToolbar
        currentStyle={currentCellStyle}
        onFormatChange={handleFormatChange}
        hasSelection={selection !== null}
        onInsertChart={handleInsertChart}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Formula Bar */}
      <SpreadsheetFormulaBar
        selectedRow={selectedRow}
        selectedCol={selectedCol}
        cellValue={formulaBarValue}
        onChange={handleFormulaBarChange}
        onCommit={handleFormulaBarCommit}
        onCancel={handleCancelEdit}
        isEditing={editingCell !== null}
      />

      {/* Grid with Charts overlay */}
      <div className="relative flex-1 overflow-hidden">
        <SpreadsheetGrid
          data={activeSheet.data}
          getCellValue={getCellValue}
          cellStyles={activeSheet.cellStyles || {}}
          columnWidths={activeSheet.columnWidths || Array(26).fill(DEFAULT_COLUMN_WIDTH)}
          rowHeights={activeSheet.rowHeights || Array(100).fill(DEFAULT_ROW_HEIGHT)}
          selection={selection}
          editingCell={editingCell}
          editValue={editValue}
          onSelectionChange={handleSelectionChange}
          onStartEdit={handleStartEdit}
          onEditChange={handleEditChange}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={handleCancelEdit}
        />

        {/* Embedded Charts */}
        {activeSheet.charts?.map((chart) => (
          <SpreadsheetChartRenderer
            key={chart.id}
            chart={chart}
            data={activeSheet.data}
            onDelete={handleDeleteChart}
            onEdit={handleEditChart}
            onMove={handleMoveChart}
          />
        ))}
      </div>

      {/* Sheet Tabs */}
      <SpreadsheetSheetTabs
        sheets={doc.sheets}
        activeIndex={activeSheetIndex}
        onSelect={handleSelectSheet}
        onAdd={handleAddSheet}
        onRename={handleRenameSheet}
        onDelete={handleDeleteSheet}
      />

      {/* Chart Dialog */}
      {showChartDialog && (
        <SpreadsheetChartDialog
          onSave={handleSaveChart}
          onCancel={() => {
            setShowChartDialog(false);
            setEditingChart(null);
          }}
          editChart={editingChart}
          selectionRange={getSelectionRange()}
        />
      )}
    </div>
  );
}

export default SpreadsheetEditor;
