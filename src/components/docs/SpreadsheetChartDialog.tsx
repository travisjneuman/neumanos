/**
 * SpreadsheetChartDialog Component
 *
 * Dialog for creating and editing charts in spreadsheets.
 * Allows selecting chart type, data range, and customization options.
 */

import { useCallback, useState } from 'react';
import { X, BarChart2, LineChart, PieChart, Activity } from 'lucide-react';
import type { SpreadsheetChart, SpreadsheetChartType } from '../../types';

interface SpreadsheetChartDialogProps {
  /** Called when chart is created/saved */
  onSave: (chart: SpreadsheetChart) => void;
  /** Called when dialog is cancelled */
  onCancel: () => void;
  /** Existing chart to edit (null for new chart) */
  editChart?: SpreadsheetChart | null;
  /** Current selection range for default data range */
  selectionRange?: string;
}

const CHART_TYPES: { type: SpreadsheetChartType; label: string; icon: typeof BarChart2 }[] = [
  { type: 'bar', label: 'Bar Chart', icon: BarChart2 },
  { type: 'line', label: 'Line Chart', icon: LineChart },
  { type: 'pie', label: 'Pie Chart', icon: PieChart },
  { type: 'scatter', label: 'Scatter Plot', icon: Activity },
];

const DEFAULT_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // magenta
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
];

export function SpreadsheetChartDialog({
  onSave,
  onCancel,
  editChart,
  selectionRange,
}: SpreadsheetChartDialogProps) {
  const [chartType, setChartType] = useState<SpreadsheetChartType>(
    editChart?.type || 'bar'
  );
  const [title, setTitle] = useState(editChart?.title || 'Chart');
  const [dataRange, setDataRange] = useState(
    editChart?.dataRange || selectionRange || 'A1:B10'
  );
  const [labelColumn, setLabelColumn] = useState<number | undefined>(
    editChart?.labelColumn
  );
  const [showLegend, setShowLegend] = useState(editChart?.showLegend ?? true);
  const [showGrid, setShowGrid] = useState(editChart?.showGrid ?? true);

  const handleSave = useCallback(() => {
    const chart: SpreadsheetChart = {
      id: editChart?.id || crypto.randomUUID(),
      type: chartType,
      title,
      dataRange,
      labelColumn,
      position: editChart?.position || {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
      },
      colors: DEFAULT_COLORS,
      showLegend,
      showGrid,
    };
    onSave(chart);
  }, [chartType, title, dataRange, labelColumn, showLegend, showGrid, editChart, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {editChart ? 'Edit Chart' : 'Insert Chart'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Chart Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Chart Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CHART_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                    chartType === type
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Chart Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chart title"
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>

          {/* Data Range */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Data Range
            </label>
            <input
              type="text"
              value={dataRange}
              onChange={(e) => setDataRange(e.target.value.toUpperCase())}
              placeholder="e.g., A1:C10"
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono"
            />
            <p className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Select cells containing your data (e.g., A1:C10)
            </p>
          </div>

          {/* Label Column */}
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Label Column (optional)
            </label>
            <input
              type="number"
              value={labelColumn ?? ''}
              onChange={(e) =>
                setLabelColumn(e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
              placeholder="First column (0)"
              min={0}
              className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
            <p className="mt-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Column to use for chart labels (0 = first column)
            </p>
          </div>

          {/* Options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Show Legend
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Show Grid
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-primary hover:bg-accent-primary/90 rounded-lg transition-colors"
          >
            {editChart ? 'Save Changes' : 'Insert Chart'}
          </button>
        </div>
      </div>
    </div>
  );
}
