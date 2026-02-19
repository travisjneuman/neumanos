/**
 * SpreadsheetFormulaBar Component
 *
 * Displays the current cell reference and allows editing the cell value/formula.
 */

import { useEffect, useRef, useState } from 'react';
import { FunctionSquare } from 'lucide-react';
import { createRef, isFormula } from './spreadsheetUtils';

interface SpreadsheetFormulaBarProps {
  /** Currently selected cell row (0-indexed) */
  selectedRow: number | null;
  /** Currently selected cell column (0-indexed) */
  selectedCol: number | null;
  /** Current cell value or formula */
  cellValue: string;
  /** Called when the formula bar value changes */
  onChange: (value: string) => void;
  /** Called when Enter is pressed */
  onCommit: () => void;
  /** Called when Escape is pressed */
  onCancel: () => void;
  /** Whether the cell is currently being edited */
  isEditing: boolean;
}

export function SpreadsheetFormulaBar({
  selectedRow,
  selectedCol,
  cellValue,
  onChange,
  onCommit,
  onCancel,
  isEditing,
}: SpreadsheetFormulaBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(cellValue);

  // Sync local value with cell value when selection changes
  useEffect(() => {
    setLocalValue(cellValue);
  }, [cellValue, selectedRow, selectedCol]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(localValue);
      onCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(cellValue);
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  const cellRef = selectedRow !== null && selectedCol !== null
    ? createRef(selectedRow, selectedCol)
    : '';

  const hasFormula = isFormula(localValue);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
      {/* Cell reference display */}
      <div className="w-16 px-2 py-1 text-sm font-mono text-center bg-surface-light-alt dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded">
        {cellRef || '-'}
      </div>

      {/* Formula indicator */}
      <div
        className={`flex items-center justify-center w-6 h-6 rounded ${
          hasFormula
            ? 'bg-accent-primary/10 text-accent-primary'
            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
        }`}
        title={hasFormula ? 'This cell contains a formula' : 'Function'}
      >
        <FunctionSquare className="w-4 h-4" />
      </div>

      {/* Formula/value input */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (localValue !== cellValue) {
            onChange(localValue);
            onCommit();
          }
        }}
        placeholder={selectedRow !== null ? 'Enter value or formula (=)' : 'Select a cell'}
        disabled={selectedRow === null}
        className="flex-1 px-2 py-1 text-sm font-mono bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-1 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary disabled:opacity-50"
      />
    </div>
  );
}
