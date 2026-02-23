/**
 * SpreadsheetFormulaBar Component
 *
 * Displays the current cell reference and allows editing the cell value/formula.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { FunctionSquare } from 'lucide-react';
import { createRef, isFormula } from './spreadsheetUtils';
import {
  FormulaAutocompletePanel,
  FormulaHelpTooltip,
  useFormulaAutocomplete,
} from './SpreadsheetFormulaHelp';

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

  // Formula autocomplete
  const handleAutocompleteInsert = useCallback((text: string) => {
    setLocalValue(text);
    onChange(text);
  }, [onChange]);

  const { handleKeyDown: handleAutocompleteKeyDown } = useFormulaAutocomplete(
    localValue,
    isEditing,
    handleAutocompleteInsert
  );

  const handleFormulaSelect = useCallback(
    (formula: { name: string }) => {
      // Replace the partial token with the full function name
      const match = localValue.match(/([A-Z]+)\s*\(?$/i);
      if (match) {
        const before = localValue.slice(0, localValue.length - match[0].length);
        const newValue = before + formula.name + '(';
        setLocalValue(newValue);
        onChange(newValue);
      }
      inputRef.current?.focus();
    },
    [localValue, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Let autocomplete handle navigation keys first
    if (handleAutocompleteKeyDown(e)) return;

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
    <div className="relative flex items-center gap-2 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
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
          // Small delay to allow autocomplete click to register
          setTimeout(() => {
            if (localValue !== cellValue) {
              onChange(localValue);
              onCommit();
            }
          }, 150);
        }}
        placeholder={selectedRow !== null ? 'Enter value or formula (=)' : 'Select a cell'}
        disabled={selectedRow === null}
        className="flex-1 px-2 py-1 text-sm font-mono bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-1 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary disabled:opacity-50"
      />

      {/* Formula autocomplete suggestions */}
      <FormulaAutocompletePanel
        inputValue={localValue}
        isEditing={isEditing}
        onSelect={handleFormulaSelect}
      />

      {/* Formula help tooltip (shown when inside a function call) */}
      <FormulaHelpTooltip
        inputValue={localValue}
        isEditing={isEditing}
      />
    </div>
  );
}
