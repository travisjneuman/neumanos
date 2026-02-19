/**
 * FormulaEngine Service
 *
 * MIT-licensed formula evaluation engine replacing GPL HyperFormula.
 * Uses hot-formula-parser for parsing + cell/range resolution,
 * with @formulajs/formulajs for enhanced Excel function compatibility.
 */

import { Parser, type FormulaErrorId } from 'hot-formula-parser';
import * as formulajs from '@formulajs/formulajs';

// Re-export FormulaErrorId for consumers
export type { FormulaErrorId };

export type CellValue = string | number | boolean | null;

export interface FormulaError {
  type: 'ERROR';
  value: FormulaErrorId;
}

export type FormulaResult = CellValue | FormulaError;

/** Maximum evaluation depth before circular reference error */
const MAX_EVAL_DEPTH = 100;

/**
 * Stateless formula engine. Each evaluate() call resolves references
 * against the provided sheet data. No internal data model to sync.
 */
export class FormulaEngine {
  private parser: Parser;
  private sheets: string[][][];
  private activeSheetIndex: number;
  private evaluationDepth: number;

  constructor() {
    this.parser = new Parser();
    this.sheets = [];
    this.activeSheetIndex = 0;
    this.evaluationDepth = 0;
    this.setupCallbacks();
    this.registerFormulaJsFunctions();
  }

  /**
   * Wire up cell and range reference resolution callbacks.
   * These read from this.sheets/this.activeSheetIndex which are
   * set fresh on each evaluate() call.
   */
  private setupCallbacks(): void {
    // Resolve single cell references (e.g., A1, B3)
    this.parser.on('callCellValue', (cellCoord, done) => {
      this.evaluationDepth++;
      if (this.evaluationDepth > MAX_EVAL_DEPTH) {
        done('#REF!');
        return;
      }

      const row = cellCoord.row.index;
      const col = cellCoord.column.index;

      // Detect cross-sheet references from label (e.g., "Sheet2!A1")
      const sheetData = this.sheets[this.activeSheetIndex];
      if (!sheetData) {
        done(null);
        return;
      }

      const raw = sheetData[row]?.[col] ?? '';

      // If the referenced cell itself contains a formula, evaluate it recursively
      if (raw.startsWith('=')) {
        const { result, error } = this.parser.parse(raw.slice(1));
        done(error ? error : result);
        return;
      }

      done(this.coerceValue(raw));
    });

    // Resolve range references (e.g., A1:B5)
    this.parser.on('callRangeValue', (startCoord, endCoord, done) => {
      const sheetData = this.sheets[this.activeSheetIndex];
      if (!sheetData) {
        done([]);
        return;
      }

      const startRow = startCoord.row.index;
      const endRow = endCoord.row.index;
      const startCol = startCoord.column.index;
      const endCol = endCoord.column.index;

      const rangeValues: (string | number | boolean | null)[][] = [];

      for (let r = startRow; r <= endRow; r++) {
        const rowValues: (string | number | boolean | null)[] = [];
        for (let c = startCol; c <= endCol; c++) {
          const raw = sheetData[r]?.[c] ?? '';

          if (raw.startsWith('=')) {
            this.evaluationDepth++;
            if (this.evaluationDepth > MAX_EVAL_DEPTH) {
              rowValues.push(null);
              continue;
            }
            const { result, error } = this.parser.parse(raw.slice(1));
            rowValues.push(error ? null : (result as string | number | boolean | null));
          } else {
            rowValues.push(this.coerceValue(raw));
          }
        }
        rangeValues.push(rowValues);
      }

      done(rangeValues);
    });
  }

  /**
   * Register @formulajs/formulajs functions as overrides/additions.
   * hot-formula-parser already has 500+ built-in functions, but
   * formulajs provides better Excel compatibility for certain functions.
   */
  private registerFormulaJsFunctions(): void {
    const fnMap: Record<string, (...args: unknown[]) => unknown> = {
      // Logic
      IF: formulajs.IF,
      AND: formulajs.AND,
      OR: formulajs.OR,
      NOT: formulajs.NOT,
      IFERROR: formulajs.IFERROR,

      // Lookup
      VLOOKUP: formulajs.VLOOKUP,
      HLOOKUP: formulajs.HLOOKUP,
      INDEX: formulajs.INDEX,
      MATCH: formulajs.MATCH,

      // Text
      CONCATENATE: formulajs.CONCATENATE,
      LEFT: formulajs.LEFT,
      RIGHT: formulajs.RIGHT,
      MID: formulajs.MID,
      LEN: formulajs.LEN,
      TRIM: formulajs.TRIM,
      UPPER: formulajs.UPPER,
      LOWER: formulajs.LOWER,
      SUBSTITUTE: formulajs.SUBSTITUTE,
      TEXT: formulajs.TEXT,

      // Date
      TODAY: formulajs.TODAY,
      NOW: formulajs.NOW,
      DATE: formulajs.DATE,
      YEAR: formulajs.YEAR,
      MONTH: formulajs.MONTH,
      DAY: formulajs.DAY,
      HOUR: formulajs.HOUR,
      MINUTE: formulajs.MINUTE,

      // Stats
      MEDIAN: formulajs.MEDIAN,
      COUNTIF: formulajs.COUNTIF,
      SUMIF: formulajs.SUMIF,
      AVERAGEIF: formulajs.AVERAGEIF,
      COUNTA: formulajs.COUNTA,
    };

    for (const [name, fn] of Object.entries(fnMap)) {
      if (typeof fn === 'function') {
        this.parser.setFunction(name, (params: unknown) => {
          const args = Array.isArray(params) ? params : [params];
          return fn(...args);
        });
      }
    }
  }

  /**
   * Coerce a raw string cell value to a typed value.
   * Numeric strings become numbers, "TRUE"/"FALSE" become booleans,
   * empty strings become null (for math operations).
   */
  private coerceValue(raw: string): string | number | boolean | null {
    if (raw === '') return null;

    const upper = raw.toUpperCase();
    if (upper === 'TRUE') return true;
    if (upper === 'FALSE') return false;

    const num = parseFloat(raw);
    if (!isNaN(num) && raw === String(num)) return num;

    return raw;
  }

  /**
   * Evaluate a formula string against the provided sheet data.
   *
   * @param formula - Raw cell content (may or may not start with '=')
   * @param sheetData - The active sheet's 2D string array
   * @param sheetIndex - The active sheet index
   * @param allSheets - All sheets' data for cross-sheet references
   * @returns The evaluated result or a FormulaError
   */
  evaluate(
    formula: string,
    _sheetData: string[][],
    sheetIndex: number,
    allSheets: string[][][]
  ): FormulaResult {
    // Non-formula cells return as-is (coerced)
    if (!formula.startsWith('=')) {
      return this.coerceValue(formula);
    }

    // Set context for callbacks
    this.sheets = allSheets;
    this.activeSheetIndex = sheetIndex;
    this.evaluationDepth = 0;

    const { result, error } = this.parser.parse(formula.slice(1));

    // Reset context
    this.sheets = [];
    this.evaluationDepth = 0;

    if (error) {
      return { type: 'ERROR', value: error };
    }

    return result as CellValue;
  }
}
