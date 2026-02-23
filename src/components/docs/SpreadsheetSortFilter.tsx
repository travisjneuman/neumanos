/**
 * SpreadsheetSortFilter Component
 *
 * Dialog for configuring sort and filter rules on spreadsheet data.
 */

import { useState } from 'react';
import { X, Plus, Trash2, ArrowUpDown, Filter } from 'lucide-react';
import type { FilterOperator } from '../../types';

interface SortRule {
  column: number;
  direction: 'asc' | 'desc';
}

interface FilterRule {
  column: number;
  operator: FilterOperator;
  value: string;
  value2?: string;
}

interface SpreadsheetSortFilterProps {
  data: string[][];
  sortRules: SortRule[];
  filterRules: FilterRule[];
  onSortChange: (rules: SortRule[]) => void;
  onFilterChange: (rules: FilterRule[]) => void;
  onClose: () => void;
}

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'not-contains', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'not-equals', label: 'Does not equal' },
  { value: 'greater-than', label: 'Greater than' },
  { value: 'less-than', label: 'Less than' },
  { value: 'between', label: 'Between' },
  { value: 'empty', label: 'Is empty' },
  { value: 'not-empty', label: 'Is not empty' },
];

function getColumnLabel(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export function SpreadsheetSortFilter({
  data,
  sortRules: initialSort,
  filterRules: initialFilter,
  onSortChange,
  onFilterChange,
  onClose,
}: SpreadsheetSortFilterProps) {
  const [activeTab, setActiveTab] = useState<'sort' | 'filter'>('sort');
  const [sortRules, setSortRules] = useState<SortRule[]>(initialSort);
  const [filterRules, setFilterRules] = useState<FilterRule[]>(initialFilter);

  const colCount = data.length > 0 ? Math.max(...data.map((r) => r.length), 1) : 1;

  const addSortRule = () => {
    setSortRules([...sortRules, { column: 0, direction: 'asc' }]);
  };

  const removeSortRule = (index: number) => {
    setSortRules(sortRules.filter((_, i) => i !== index));
  };

  const updateSortRule = (index: number, updates: Partial<SortRule>) => {
    setSortRules(sortRules.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const addFilterRule = () => {
    setFilterRules([...filterRules, { column: 0, operator: 'contains', value: '' }]);
  };

  const removeFilterRule = (index: number) => {
    setFilterRules(filterRules.filter((_, i) => i !== index));
  };

  const updateFilterRule = (index: number, updates: Partial<FilterRule>) => {
    setFilterRules(filterRules.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const handleApply = () => {
    onSortChange(sortRules);
    onFilterChange(filterRules);
    onClose();
  };

  const handleClear = () => {
    setSortRules([]);
    setFilterRules([]);
    onSortChange([]);
    onFilterChange([]);
    onClose();
  };

  const inputClass =
    'px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary';

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
      active
        ? 'bg-surface-light dark:bg-surface-dark-elevated text-accent-primary border-b-2 border-accent-primary'
        : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-[520px] max-h-[80vh] flex flex-col border border-border-light dark:border-border-dark">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Sort & Filter
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-2 border-b border-border-light dark:border-border-dark">
          <button onClick={() => setActiveTab('sort')} className={tabClass(activeTab === 'sort')}>
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
          </button>
          <button onClick={() => setActiveTab('filter')} className={tabClass(activeTab === 'filter')}>
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'sort' && (
            <>
              {sortRules.length === 0 && (
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  No sort rules. Click &quot;Add Rule&quot; to sort data.
                </p>
              )}
              {sortRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary w-12">
                    {i === 0 ? 'Sort by' : 'Then by'}
                  </span>
                  <select
                    value={rule.column}
                    onChange={(e) => updateSortRule(i, { column: parseInt(e.target.value) })}
                    className={inputClass + ' flex-1'}
                  >
                    {Array.from({ length: colCount }, (_, c) => (
                      <option key={c} value={c}>
                        Column {getColumnLabel(c)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={rule.direction}
                    onChange={(e) => updateSortRule(i, { direction: e.target.value as 'asc' | 'desc' })}
                    className={inputClass + ' w-24'}
                  >
                    <option value="asc">A → Z</option>
                    <option value="desc">Z → A</option>
                  </select>
                  <button
                    onClick={() => removeSortRule(i)}
                    className="p-1 rounded text-text-light-secondary dark:text-text-dark-secondary hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addSortRule}
                className="flex items-center gap-1 text-sm text-accent-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Rule
              </button>
            </>
          )}

          {activeTab === 'filter' && (
            <>
              {filterRules.length === 0 && (
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  No filter rules. Click &quot;Add Rule&quot; to filter data.
                </p>
              )}
              {filterRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 flex-wrap">
                  <select
                    value={rule.column}
                    onChange={(e) => updateFilterRule(i, { column: parseInt(e.target.value) })}
                    className={inputClass + ' w-24'}
                  >
                    {Array.from({ length: colCount }, (_, c) => (
                      <option key={c} value={c}>
                        Col {getColumnLabel(c)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={rule.operator}
                    onChange={(e) => updateFilterRule(i, { operator: e.target.value as FilterOperator })}
                    className={inputClass + ' w-36'}
                  >
                    {FILTER_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  {rule.operator !== 'empty' && rule.operator !== 'not-empty' && (
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => updateFilterRule(i, { value: e.target.value })}
                      placeholder="Value"
                      className={inputClass + ' flex-1 min-w-[80px]'}
                    />
                  )}
                  {rule.operator === 'between' && (
                    <input
                      type="text"
                      value={rule.value2 ?? ''}
                      onChange={(e) => updateFilterRule(i, { value2: e.target.value })}
                      placeholder="Value 2"
                      className={inputClass + ' w-20'}
                    />
                  )}
                  <button
                    onClick={() => removeFilterRule(i)}
                    className="p-1 rounded text-text-light-secondary dark:text-text-dark-secondary hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addFilterRule}
                className="flex items-center gap-1 text-sm text-accent-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Rule
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark"
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-alt dark:hover:bg-surface-dark"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 text-sm rounded bg-accent-primary text-white hover:bg-accent-primary/90"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
