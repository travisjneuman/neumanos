/**
 * Spreadsheet Data Operations
 *
 * Pure functions for sorting, filtering, pivot tables, and conditional formatting.
 * All functions operate on string[][] and return transformed views without mutation.
 */

import type { FilterOperator, FormatCondition, PivotTableConfig } from '../types';

/** Multi-column sort. Numeric values compared numerically, strings via localeCompare. */
export function sortData(
  data: string[][],
  rules: Array<{ column: number; direction: 'asc' | 'desc' }>
): string[][] {
  if (rules.length === 0 || data.length === 0) return data;

  const sorted = [...data].map((row) => [...row]);
  sorted.sort((a, b) => {
    for (const rule of rules) {
      const aVal = a[rule.column] ?? '';
      const bVal = b[rule.column] ?? '';
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      let cmp: number;

      if (!isNaN(aNum) && !isNaN(bNum)) {
        cmp = aNum - bNum;
      } else {
        cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (cmp !== 0) {
        return rule.direction === 'asc' ? cmp : -cmp;
      }
    }
    return 0;
  });

  return sorted;
}

/** Check if a single cell value matches a filter rule. */
function matchesFilter(
  cellValue: string,
  operator: FilterOperator,
  value: string,
  value2?: string
): boolean {
  const lower = cellValue.toLowerCase();
  const filterLower = value.toLowerCase();

  switch (operator) {
    case 'contains':
      return lower.includes(filterLower);
    case 'not-contains':
      return !lower.includes(filterLower);
    case 'equals':
      return lower === filterLower;
    case 'not-equals':
      return lower !== filterLower;
    case 'greater-than': {
      const a = parseFloat(cellValue);
      const b = parseFloat(value);
      return !isNaN(a) && !isNaN(b) && a > b;
    }
    case 'less-than': {
      const a = parseFloat(cellValue);
      const b = parseFloat(value);
      return !isNaN(a) && !isNaN(b) && a < b;
    }
    case 'between': {
      const a = parseFloat(cellValue);
      const lo = parseFloat(value);
      const hi = parseFloat(value2 ?? '');
      return !isNaN(a) && !isNaN(lo) && !isNaN(hi) && a >= lo && a <= hi;
    }
    case 'empty':
      return cellValue.trim() === '';
    case 'not-empty':
      return cellValue.trim() !== '';
    default:
      return true;
  }
}

/** Filter rows using AND logic across all rules. */
export function filterData(
  data: string[][],
  rules: Array<{ column: number; operator: FilterOperator; value: string; value2?: string }>
): string[][] {
  if (rules.length === 0) return data;

  return data.filter((row) =>
    rules.every((rule) => {
      const cellValue = row[rule.column] ?? '';
      return matchesFilter(cellValue, rule.operator, rule.value, rule.value2);
    })
  );
}

/** Build a pivot table from the data. */
export function buildPivotTable(
  data: string[][],
  config: PivotTableConfig
): { headers: string[]; rows: string[][] } {
  if (data.length === 0) return { headers: [], rows: [] };

  const { rowField, columnField, valueField, aggregation } = config;

  if (columnField === undefined) {
    // Simple grouping: group by rowField, aggregate valueField
    const groups = new Map<string, number[]>();

    for (const row of data) {
      const key = row[rowField] ?? '(empty)';
      const val = parseFloat(row[valueField] ?? '');
      if (!groups.has(key)) groups.set(key, []);
      if (!isNaN(val)) groups.get(key)!.push(val);
      else if (aggregation === 'count') groups.get(key)!.push(0);
    }

    const headers = ['Row', aggregation.toUpperCase()];
    const rows: string[][] = [];

    for (const [key, values] of groups) {
      rows.push([key, String(aggregate(values, aggregation))]);
    }

    return { headers, rows };
  }

  // Cross-tabulation: rows grouped by rowField, columns by columnField
  const colValues = new Set<string>();
  const grouped = new Map<string, Map<string, number[]>>();

  for (const row of data) {
    const rowKey = row[rowField] ?? '(empty)';
    const colKey = row[columnField] ?? '(empty)';
    const val = parseFloat(row[valueField] ?? '');

    colValues.add(colKey);
    if (!grouped.has(rowKey)) grouped.set(rowKey, new Map());
    const colMap = grouped.get(rowKey)!;
    if (!colMap.has(colKey)) colMap.set(colKey, []);
    if (!isNaN(val)) colMap.get(colKey)!.push(val);
    else if (aggregation === 'count') colMap.get(colKey)!.push(0);
  }

  const sortedCols = [...colValues].sort();
  const headers = ['Row', ...sortedCols];
  const rows: string[][] = [];

  for (const [rowKey, colMap] of grouped) {
    const row = [rowKey];
    for (const col of sortedCols) {
      const values = colMap.get(col) ?? [];
      row.push(values.length > 0 ? String(aggregate(values, aggregation)) : '0');
    }
    rows.push(row);
  }

  return { headers, rows };
}

function aggregate(values: number[], method: PivotTableConfig['aggregation']): number {
  if (values.length === 0) return 0;
  switch (method) {
    case 'sum':
      return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
    case 'count':
      return values.length;
    case 'avg':
      return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
  }
}

/** Evaluate whether a cell value matches a conditional format condition. */
export function evaluateCondition(cellValue: string, condition: FormatCondition): boolean {
  return matchesFilter(cellValue, condition.operator, condition.value, condition.value2);
}
