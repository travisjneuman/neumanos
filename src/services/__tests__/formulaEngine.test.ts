import { describe, it, expect, beforeEach } from 'vitest';
import { FormulaEngine, type FormulaResult, type FormulaError } from '../formulaEngine';

function isError(result: FormulaResult): result is FormulaError {
  return typeof result === 'object' && result !== null && 'type' in result && result.type === 'ERROR';
}

describe('FormulaEngine', () => {
  let engine: FormulaEngine;

  // Helper: build a sheet from rows of values
  function sheet(rows: string[][]): string[][] {
    // Pad to at least 10x10
    const padded = rows.map((r) => {
      const row = [...r];
      while (row.length < 10) row.push('');
      return row;
    });
    while (padded.length < 10) {
      padded.push(Array(10).fill(''));
    }
    return padded;
  }

  function evaluate(formula: string, data: string[][] = sheet([])): FormulaResult {
    return engine.evaluate(formula, data, 0, [data]);
  }

  beforeEach(() => {
    engine = new FormulaEngine();
  });

  describe('non-formula values', () => {
    it('returns null for empty string', () => {
      expect(evaluate('')).toBe(null);
    });

    it('returns number for numeric string', () => {
      expect(evaluate('42')).toBe(42);
    });

    it('returns string for text', () => {
      expect(evaluate('hello')).toBe('hello');
    });

    it('returns boolean for TRUE/FALSE', () => {
      expect(evaluate('TRUE')).toBe(true);
      expect(evaluate('FALSE')).toBe(false);
    });
  });

  describe('basic arithmetic', () => {
    it('evaluates addition', () => {
      expect(evaluate('=1+2')).toBe(3);
    });

    it('evaluates multiplication', () => {
      expect(evaluate('=3*4')).toBe(12);
    });

    it('evaluates division', () => {
      const result = evaluate('=10/3');
      expect(typeof result).toBe('number');
      expect(result).toBeCloseTo(3.333, 2);
    });

    it('respects operator precedence', () => {
      expect(evaluate('=1+2*3')).toBe(7);
    });

    it('respects parentheses', () => {
      expect(evaluate('=(1+2)*3')).toBe(9);
    });
  });

  describe('cell references', () => {
    it('resolves a single cell reference', () => {
      const data = sheet([['42']]);
      expect(evaluate('=A1', data)).toBe(42);
    });

    it('resolves arithmetic with cell references', () => {
      const data = sheet([['10', '20']]);
      expect(evaluate('=A1+B1', data)).toBe(30);
    });

    it('resolves a cell containing text', () => {
      const data = sheet([['hello']]);
      expect(evaluate('=A1', data)).toBe('hello');
    });

    it('resolves empty cell as null', () => {
      const data = sheet([['']]);
      expect(evaluate('=A1', data)).toBe(null);
    });
  });

  describe('range functions', () => {
    it('SUM over a column range', () => {
      const data = sheet([['1'], ['2'], ['3'], ['4'], ['5']]);
      expect(evaluate('=SUM(A1:A5)', data)).toBe(15);
    });

    it('AVERAGE over a range', () => {
      const data = sheet([['10'], ['20'], ['30']]);
      expect(evaluate('=AVERAGE(A1:A3)', data)).toBe(20);
    });

    it('COUNT over a range with mixed values', () => {
      const data = sheet([['1'], ['hello'], ['3'], [''], ['5']]);
      expect(evaluate('=COUNT(A1:A5)', data)).toBe(3);
    });

    it('MIN and MAX over a range', () => {
      const data = sheet([['5'], ['2'], ['8'], ['1'], ['9']]);
      expect(evaluate('=MIN(A1:A5)', data)).toBe(1);
      expect(evaluate('=MAX(A1:A5)', data)).toBe(9);
    });
  });

  describe('logic functions', () => {
    it('IF with true condition', () => {
      expect(evaluate('=IF(TRUE,"yes","no")')).toBe('yes');
    });

    it('IF with false condition', () => {
      expect(evaluate('=IF(FALSE,"yes","no")')).toBe('no');
    });

    it('IF with cell reference comparison', () => {
      const data = sheet([['5']]);
      expect(evaluate('=IF(A1>0,"positive","zero")', data)).toBe('positive');
    });

    it('AND function', () => {
      expect(evaluate('=AND(TRUE,TRUE)')).toBe(true);
      expect(evaluate('=AND(TRUE,FALSE)')).toBe(false);
    });

    it('OR function', () => {
      expect(evaluate('=OR(FALSE,TRUE)')).toBe(true);
      expect(evaluate('=OR(FALSE,FALSE)')).toBe(false);
    });
  });

  describe('nested formula evaluation', () => {
    it('evaluates a cell that contains a formula', () => {
      const data = sheet([['=1+1', '=A1+3']]);
      // B1 references A1 which is itself a formula
      expect(evaluate('=B1', data)).toBe(5);
    });
  });

  describe('error handling', () => {
    it('returns error for division by zero', () => {
      const result = evaluate('=1/0');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.value).toBe('#DIV/0!');
      }
    });

    it('returns error for unknown function', () => {
      const result = evaluate('=UNKNOWNFUNC(1)');
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.value).toBe('#NAME?');
      }
    });
  });

  describe('edge cases', () => {
    it('formula without = prefix is treated as text', () => {
      expect(evaluate('SUM(1,2,3)')).toBe('SUM(1,2,3)');
    });

    it('numeric string coerced for arithmetic in cells', () => {
      const data = sheet([['3.14']]);
      expect(evaluate('=A1*2', data)).toBeCloseTo(6.28, 2);
    });

    it('handles empty range gracefully', () => {
      const data = sheet([]);
      const result = evaluate('=SUM(A1:A5)', data);
      // SUM of all nulls = 0
      expect(result).toBe(0);
    });
  });
});
