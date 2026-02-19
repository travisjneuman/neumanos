/**
 * SpreadsheetChartRenderer Component
 *
 * Renders embedded charts in the spreadsheet using Recharts.
 * Supports bar, line, pie, and scatter chart types.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { X, Edit2 } from 'lucide-react';
import type { SpreadsheetChart } from '../../types';
import { parseRef } from './spreadsheetUtils';

interface SpreadsheetChartRendererProps {
  /** Chart configuration */
  chart: SpreadsheetChart;
  /** 2D array of sheet data */
  data: string[][];
  /** Called when chart is deleted */
  onDelete: (chartId: string) => void;
  /** Called when chart is edited */
  onEdit: (chart: SpreadsheetChart) => void;
  /** Called when chart is moved/resized */
  onMove: (chartId: string, position: SpreadsheetChart['position']) => void;
}

const DEFAULT_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // magenta
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
];

/**
 * Parse a range string like "A1:C10" into start/end coordinates
 */
function parseRange(range: string): {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
} | null {
  const parts = range.split(':');
  if (parts.length !== 2) return null;

  const start = parseRef(parts[0]);
  const end = parseRef(parts[1]);

  if (!start || !end) return null;

  return {
    startRow: start.row,
    startCol: start.col,
    endRow: end.row,
    endCol: end.col,
  };
}

/**
 * Extract chart data from sheet data based on the range
 */
function extractChartData(
  sheetData: string[][],
  range: string,
  labelColumn?: number
): { chartData: Record<string, string | number>[]; headers: string[] } {
  const parsed = parseRange(range);
  if (!parsed) return { chartData: [], headers: [] };

  const { startRow, startCol, endRow, endCol } = parsed;

  // Extract headers from first row
  const headers: string[] = [];
  for (let col = startCol; col <= endCol; col++) {
    headers.push(sheetData[startRow]?.[col] || `Column ${col + 1}`);
  }

  // Extract data from subsequent rows
  const chartData: Record<string, string | number>[] = [];
  for (let row = startRow + 1; row <= endRow; row++) {
    const rowData: Record<string, string | number> = {};

    for (let col = startCol; col <= endCol; col++) {
      const header = headers[col - startCol] || `col${col}`;
      const value = sheetData[row]?.[col] || '';

      // Parse numeric values
      const numValue = parseFloat(value);
      if (col === startCol + (labelColumn ?? 0)) {
        // Label column stays as string
        rowData[header] = value;
      } else {
        rowData[header] = isNaN(numValue) ? 0 : numValue;
      }
    }

    chartData.push(rowData);
  }

  return { chartData, headers };
}

export function SpreadsheetChartRenderer({
  chart,
  data,
  onDelete,
  onEdit,
  onMove: _onMove, // Reserved for future drag-to-move feature
}: SpreadsheetChartRendererProps) {
  const { chartData, headers } = useMemo(
    () => extractChartData(data, chart.dataRange, chart.labelColumn),
    [data, chart.dataRange, chart.labelColumn]
  );

  const colors = chart.colors || DEFAULT_COLORS;
  const labelKey = headers[chart.labelColumn ?? 0] || headers[0];
  const dataKeys = headers.filter((h) => h !== labelKey);

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'var(--surface-light-elevated)',
      border: '1px solid var(--border-light)',
      borderRadius: '8px',
    },
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-text-light-tertiary dark:text-text-dark-tertiary text-sm">
          No data in range
        </div>
      );
    }

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              {chart.showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border-light dark:stroke-border-dark"
                />
              )}
              <XAxis
                dataKey={labelKey}
                tick={{ fontSize: 11 }}
                className="fill-text-light-secondary dark:fill-text-dark-secondary"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-text-light-secondary dark:fill-text-dark-secondary"
              />
              <Tooltip {...tooltipStyle} />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              {chart.showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border-light dark:stroke-border-dark"
                />
              )}
              <XAxis
                dataKey={labelKey}
                tick={{ fontSize: 11 }}
                className="fill-text-light-secondary dark:fill-text-dark-secondary"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-text-light-secondary dark:fill-text-dark-secondary"
              />
              <Tooltip {...tooltipStyle} />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        // For pie charts, use first data key
        const pieDataKey = dataKeys[0] || headers[1];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={chartData}
                dataKey={pieDataKey}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius="70%"
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        // For scatter, use first two numeric columns as x/y
        const xKey = dataKeys[0] || headers[1];
        const yKey = dataKeys[1] || dataKeys[0] || headers[2];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              {chart.showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border-light dark:stroke-border-dark"
                />
              )}
              <XAxis
                type="number"
                dataKey={xKey}
                name={xKey}
                tick={{ fontSize: 11 }}
                className="fill-text-light-secondary dark:fill-text-dark-secondary"
              />
              <YAxis
                type="number"
                dataKey={yKey}
                name={yKey}
                tick={{ fontSize: 11 }}
                className="fill-text-light-secondary dark:fill-text-dark-secondary"
              />
              <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              {chart.showLegend && <Legend wrapperStyle={{ fontSize: '11px' }} />}
              <Scatter name={chart.title} data={chartData} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="absolute bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg overflow-hidden group"
      style={{
        left: chart.position.x,
        top: chart.position.y,
        width: chart.position.width,
        height: chart.position.height,
      }}
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-light-alt dark:bg-surface-dark border-b border-border-light dark:border-border-dark cursor-move">
        <h3 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
          {chart.title}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(chart)}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-primary"
            title="Edit chart"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(chart.id)}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-status-error"
            title="Delete chart"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-2" style={{ height: chart.position.height - 40 }}>
        {renderChart()}
      </div>
    </div>
  );
}
