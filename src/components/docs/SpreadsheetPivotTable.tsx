/**
 * SpreadsheetPivotTable Component
 *
 * Dialog for configuring and previewing pivot table analysis.
 */

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { PivotTableConfig } from '../../types';
import { buildPivotTable } from '../../utils/spreadsheetDataOps';

interface SpreadsheetPivotTableProps {
  data: string[][];
  onClose: () => void;
}

function getColumnLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export function SpreadsheetPivotTable({ data, onClose }: SpreadsheetPivotTableProps) {
  const colCount = data.length > 0 ? Math.max(...data.map((r) => r.length), 1) : 1;

  const [config, setConfig] = useState<PivotTableConfig>({
    rowField: 0,
    valueField: colCount > 1 ? 1 : 0,
    aggregation: 'sum',
  });
  const [useColumnField, setUseColumnField] = useState(false);

  const pivotResult = useMemo(() => {
    const effectiveConfig: PivotTableConfig = {
      ...config,
      columnField: useColumnField ? config.columnField : undefined,
    };
    return buildPivotTable(data, effectiveConfig);
  }, [data, config, useColumnField]);

  const inputClass =
    'px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col border border-border-light dark:border-border-dark">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Pivot Table
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Config */}
        <div className="p-4 space-y-3 border-b border-border-light dark:border-border-dark">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Row Field
              </label>
              <select
                value={config.rowField}
                onChange={(e) => setConfig({ ...config, rowField: parseInt(e.target.value) })}
                className={inputClass + ' w-full'}
              >
                {Array.from({ length: colCount }, (_, c) => (
                  <option key={c} value={c}>
                    Column {getColumnLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Value Field
              </label>
              <select
                value={config.valueField}
                onChange={(e) => setConfig({ ...config, valueField: parseInt(e.target.value) })}
                className={inputClass + ' w-full'}
              >
                {Array.from({ length: colCount }, (_, c) => (
                  <option key={c} value={c}>
                    Column {getColumnLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Aggregation
              </label>
              <select
                value={config.aggregation}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    aggregation: e.target.value as PivotTableConfig['aggregation'],
                  })
                }
                className={inputClass + ' w-full'}
              >
                <option value="sum">Sum</option>
                <option value="count">Count</option>
                <option value="avg">Average</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                <input
                  type="checkbox"
                  checked={useColumnField}
                  onChange={(e) => {
                    setUseColumnField(e.target.checked);
                    if (e.target.checked && config.columnField === undefined) {
                      setConfig({ ...config, columnField: 0 });
                    }
                  }}
                  className="rounded"
                />
                Column Field (cross-tab)
              </label>
              {useColumnField && (
                <select
                  value={config.columnField ?? 0}
                  onChange={(e) => setConfig({ ...config, columnField: parseInt(e.target.value) })}
                  className={inputClass + ' w-full'}
                >
                  {Array.from({ length: colCount }, (_, c) => (
                    <option key={c} value={c}>
                      Column {getColumnLabel(c)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4">
          <p className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Preview ({pivotResult.rows.length} rows)
          </p>
          {pivotResult.rows.length > 0 ? (
            <div className="overflow-auto max-h-[300px] border border-border-light dark:border-border-dark rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-light-alt dark:bg-surface-dark">
                    {pivotResult.headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-1.5 text-left text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary border-b border-border-light dark:border-border-dark"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pivotResult.rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className="border-b border-border-light dark:border-border-dark last:border-b-0"
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-1 text-text-light-primary dark:text-text-dark-primary"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
              No data to pivot.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-alt dark:hover:bg-surface-dark"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
