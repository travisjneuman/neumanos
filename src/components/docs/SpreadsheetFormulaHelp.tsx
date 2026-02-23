/**
 * SpreadsheetFormulaHelp Component
 *
 * Provides formula autocomplete suggestions and help tooltips
 * for the spreadsheet formula bar.
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';

/** Formula definition for autocomplete and help */
interface FormulaDefinition {
  name: string;
  category: string;
  syntax: string;
  description: string;
  example: string;
}

/** All supported formulas with help info */
const FORMULA_DEFINITIONS: FormulaDefinition[] = [
  // Math
  { name: 'SUM', category: 'Math', syntax: 'SUM(range)', description: 'Adds all numbers in a range', example: '=SUM(A1:A10)' },
  { name: 'AVERAGE', category: 'Math', syntax: 'AVERAGE(range)', description: 'Returns the average of numbers in a range', example: '=AVERAGE(B1:B20)' },
  { name: 'MIN', category: 'Math', syntax: 'MIN(range)', description: 'Returns the smallest number in a range', example: '=MIN(A1:A50)' },
  { name: 'MAX', category: 'Math', syntax: 'MAX(range)', description: 'Returns the largest number in a range', example: '=MAX(A1:A50)' },
  { name: 'COUNT', category: 'Math', syntax: 'COUNT(range)', description: 'Counts cells containing numbers', example: '=COUNT(A1:A100)' },
  { name: 'COUNTA', category: 'Math', syntax: 'COUNTA(range)', description: 'Counts non-empty cells', example: '=COUNTA(A1:A100)' },
  { name: 'ROUND', category: 'Math', syntax: 'ROUND(number, digits)', description: 'Rounds a number to specified digits', example: '=ROUND(3.14159, 2)' },
  { name: 'ABS', category: 'Math', syntax: 'ABS(number)', description: 'Returns the absolute value', example: '=ABS(-5)' },
  { name: 'MEDIAN', category: 'Math', syntax: 'MEDIAN(range)', description: 'Returns the median value', example: '=MEDIAN(A1:A20)' },
  { name: 'POWER', category: 'Math', syntax: 'POWER(base, exp)', description: 'Returns base raised to exponent', example: '=POWER(2, 8)' },

  // Conditional
  { name: 'SUMIF', category: 'Conditional', syntax: 'SUMIF(range, criteria, [sum_range])', description: 'Sums cells matching a criteria', example: '=SUMIF(A1:A10, ">5", B1:B10)' },
  { name: 'COUNTIF', category: 'Conditional', syntax: 'COUNTIF(range, criteria)', description: 'Counts cells matching a criteria', example: '=COUNTIF(A1:A10, "Yes")' },
  { name: 'AVERAGEIF', category: 'Conditional', syntax: 'AVERAGEIF(range, criteria, [avg_range])', description: 'Averages cells matching a criteria', example: '=AVERAGEIF(A1:A10, ">0", B1:B10)' },

  // Lookup
  { name: 'VLOOKUP', category: 'Lookup', syntax: 'VLOOKUP(value, range, col_index, [approx])', description: 'Searches the first column of a range and returns a value from another column', example: '=VLOOKUP("Apple", A1:C10, 3, FALSE)' },
  { name: 'HLOOKUP', category: 'Lookup', syntax: 'HLOOKUP(value, range, row_index, [approx])', description: 'Searches the first row of a range and returns a value from another row', example: '=HLOOKUP("Q1", A1:D5, 3, FALSE)' },
  { name: 'INDEX', category: 'Lookup', syntax: 'INDEX(range, row_num, [col_num])', description: 'Returns a value at a given row and column in a range', example: '=INDEX(A1:C10, 3, 2)' },
  { name: 'MATCH', category: 'Lookup', syntax: 'MATCH(value, range, [type])', description: 'Returns the position of a value in a range', example: '=MATCH("Apple", A1:A10, 0)' },

  // Logic
  { name: 'IF', category: 'Logic', syntax: 'IF(condition, value_if_true, value_if_false)', description: 'Returns one value if true, another if false', example: '=IF(A1>10, "High", "Low")' },
  { name: 'AND', category: 'Logic', syntax: 'AND(condition1, condition2, ...)', description: 'Returns TRUE if all conditions are true', example: '=AND(A1>0, B1<100)' },
  { name: 'OR', category: 'Logic', syntax: 'OR(condition1, condition2, ...)', description: 'Returns TRUE if any condition is true', example: '=OR(A1="Yes", B1="Yes")' },
  { name: 'NOT', category: 'Logic', syntax: 'NOT(condition)', description: 'Reverses the logic of a condition', example: '=NOT(A1>10)' },
  { name: 'IFERROR', category: 'Logic', syntax: 'IFERROR(value, error_value)', description: 'Returns error_value if value is an error', example: '=IFERROR(A1/B1, 0)' },

  // Text
  { name: 'CONCATENATE', category: 'Text', syntax: 'CONCATENATE(text1, text2, ...)', description: 'Joins text strings together', example: '=CONCATENATE(A1, " ", B1)' },
  { name: 'LEFT', category: 'Text', syntax: 'LEFT(text, num_chars)', description: 'Returns leftmost characters', example: '=LEFT(A1, 3)' },
  { name: 'RIGHT', category: 'Text', syntax: 'RIGHT(text, num_chars)', description: 'Returns rightmost characters', example: '=RIGHT(A1, 4)' },
  { name: 'MID', category: 'Text', syntax: 'MID(text, start, num_chars)', description: 'Returns characters from the middle', example: '=MID(A1, 2, 5)' },
  { name: 'LEN', category: 'Text', syntax: 'LEN(text)', description: 'Returns the length of text', example: '=LEN(A1)' },
  { name: 'TRIM', category: 'Text', syntax: 'TRIM(text)', description: 'Removes extra spaces', example: '=TRIM(A1)' },
  { name: 'UPPER', category: 'Text', syntax: 'UPPER(text)', description: 'Converts to uppercase', example: '=UPPER(A1)' },
  { name: 'LOWER', category: 'Text', syntax: 'LOWER(text)', description: 'Converts to lowercase', example: '=LOWER(A1)' },
  { name: 'SUBSTITUTE', category: 'Text', syntax: 'SUBSTITUTE(text, old, new)', description: 'Replaces occurrences of text', example: '=SUBSTITUTE(A1, "old", "new")' },
  { name: 'TEXT', category: 'Text', syntax: 'TEXT(value, format)', description: 'Formats a number as text', example: '=TEXT(0.75, "0.0%")' },

  // Date
  { name: 'TODAY', category: 'Date', syntax: 'TODAY()', description: 'Returns the current date', example: '=TODAY()' },
  { name: 'NOW', category: 'Date', syntax: 'NOW()', description: 'Returns the current date and time', example: '=NOW()' },
  { name: 'DATE', category: 'Date', syntax: 'DATE(year, month, day)', description: 'Creates a date from components', example: '=DATE(2024, 1, 15)' },
  { name: 'YEAR', category: 'Date', syntax: 'YEAR(date)', description: 'Returns the year from a date', example: '=YEAR(A1)' },
  { name: 'MONTH', category: 'Date', syntax: 'MONTH(date)', description: 'Returns the month from a date', example: '=MONTH(A1)' },
  { name: 'DAY', category: 'Date', syntax: 'DAY(date)', description: 'Returns the day from a date', example: '=DAY(A1)' },
];

/** Category colors for visual grouping */
const CATEGORY_COLORS: Record<string, string> = {
  Math: 'text-blue-500',
  Conditional: 'text-amber-500',
  Lookup: 'text-green-500',
  Logic: 'text-purple-500',
  Text: 'text-pink-500',
  Date: 'text-cyan-500',
};

interface FormulaAutocompletePanelProps {
  /** Current formula bar input value */
  inputValue: string;
  /** Whether the formula bar is actively being edited */
  isEditing: boolean;
  /** Callback when a formula suggestion is selected */
  onSelect: (formula: FormulaDefinition) => void;
}

/**
 * Extract the current function name being typed from a formula string.
 * Returns null if not currently typing a function name.
 */
function extractCurrentFunctionToken(input: string): string | null {
  if (!input.startsWith('=')) return null;

  // Find the last incomplete function name
  // Match the last sequence of uppercase letters before a '(' or at end of string
  const match = input.match(/([A-Z]+)\s*\(?$/i);
  if (match) return match[1].toUpperCase();

  return null;
}

export function FormulaAutocompletePanel({
  inputValue,
  isEditing,
  onSelect,
}: FormulaAutocompletePanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const currentToken = useMemo(
    () => extractCurrentFunctionToken(inputValue),
    [inputValue]
  );

  const suggestions = useMemo(() => {
    if (!currentToken || currentToken.length < 1) return [];
    return FORMULA_DEFINITIONS.filter((f) =>
      f.name.startsWith(currentToken)
    ).slice(0, 8);
  }, [currentToken]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isEditing || suggestions.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute top-full left-16 z-50 mt-1 w-96 max-h-64 overflow-y-auto rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-xl"
    >
      {suggestions.map((formula, index) => (
        <button
          key={formula.name}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent formula bar blur
            onSelect(formula);
          }}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 border-b border-border-light/50 dark:border-border-dark/50 last:border-b-0 transition-colors ${
            index === selectedIndex
              ? 'bg-accent-primary/10'
              : 'hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${CATEGORY_COLORS[formula.category] || 'text-text-light-tertiary'}`}>
              {formula.category}
            </span>
            <span className="font-mono text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              {formula.name}
            </span>
          </div>
          <span className="text-xs font-mono text-text-light-tertiary dark:text-text-dark-tertiary">
            {formula.syntax}
          </span>
          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            {formula.description}
          </span>
        </button>
      ))}
    </div>
  );
}

interface FormulaHelpTooltipProps {
  /** Current formula bar input value */
  inputValue: string;
  /** Whether the formula bar is actively being edited */
  isEditing: boolean;
}

/**
 * Extract the function name from the current formula to show help for.
 * Detects the most recently opened function (closest unmatched '(' from right).
 */
function extractActiveFunction(input: string): string | null {
  if (!input.startsWith('=')) return null;

  const expr = input.slice(1);
  let depth = 0;

  // Walk from right to find the function around the cursor
  for (let i = expr.length - 1; i >= 0; i--) {
    if (expr[i] === ')') depth++;
    if (expr[i] === '(') {
      if (depth > 0) {
        depth--;
      } else {
        // Found unmatched '(' — get the function name before it
        const before = expr.slice(0, i);
        const match = before.match(/([A-Z]+)\s*$/i);
        if (match) return match[1].toUpperCase();
        return null;
      }
    }
  }

  return null;
}

export function FormulaHelpTooltip({
  inputValue,
  isEditing,
}: FormulaHelpTooltipProps) {
  const funcName = useMemo(
    () => extractActiveFunction(inputValue),
    [inputValue]
  );

  const formula = useMemo(() => {
    if (!funcName) return null;
    return FORMULA_DEFINITIONS.find((f) => f.name === funcName) ?? null;
  }, [funcName]);

  if (!isEditing || !formula) return null;

  return (
    <div className="absolute top-full left-16 z-40 mt-1 w-80 p-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-lg">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xs font-medium ${CATEGORY_COLORS[formula.category] || ''}`}>
          {formula.category}
        </span>
        <span className="font-mono text-sm font-bold text-text-light-primary dark:text-text-dark-primary">
          {formula.name}
        </span>
      </div>
      <div className="font-mono text-xs text-accent-primary bg-accent-primary/5 px-2 py-1 rounded mb-1.5">
        {formula.syntax}
      </div>
      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1.5">
        {formula.description}
      </p>
      <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
        Example: <span className="font-mono">{formula.example}</span>
      </div>
    </div>
  );
}

/** Hook for managing formula autocomplete keyboard navigation */
export function useFormulaAutocomplete(
  inputValue: string,
  isEditing: boolean,
  onInsert: (text: string) => void
) {
  const currentToken = useMemo(
    () => extractCurrentFunctionToken(inputValue),
    [inputValue]
  );

  const suggestions = useMemo(() => {
    if (!currentToken || currentToken.length < 1) return [];
    return FORMULA_DEFINITIONS.filter((f) =>
      f.name.startsWith(currentToken)
    ).slice(0, 8);
  }, [currentToken]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isEditing || suggestions.length === 0) return false;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        return true;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        return true;
      }
      if (e.key === 'Tab' && suggestions.length > 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        if (selected && currentToken) {
          // Replace the current token with the full function name + opening paren
          const replacement = selected.name + '(';
          const before = inputValue.slice(0, inputValue.length - currentToken.length);
          onInsert(before + replacement);
        }
        return true;
      }

      return false;
    },
    [isEditing, suggestions, selectedIndex, currentToken, inputValue, onInsert]
  );

  return {
    suggestions,
    selectedIndex,
    handleKeyDown,
  };
}
