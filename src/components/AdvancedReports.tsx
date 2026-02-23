import { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import {
  filterEntries,
  calculateTimeByProject,
  calculateTimeByDate,
  calculateTimeByTag,
  calculateBillableVsNonBillable,
  calculateRateAnalysis,
  calculateTrends,
  getAllTags,
  formatHours,
  type ReportType,
  type ReportFilters,
  type GroupByPeriod
} from '../utils/reportingCalculations';

/**
 * Advanced Reports Component
 *
 * Provides comprehensive time tracking analytics with:
 * - Multiple report types (Time by Project, Date, Billable vs Non-Billable, Rate Analysis, Trends)
 * - Interactive charts (Bar, Line, Pie)
 * - Flexible filtering and grouping
 * - Export capabilities (CSV, PDF, JSON)
 */

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'time-by-project', label: 'Time by Project' },
  { value: 'time-by-date', label: 'Time by Date' },
  { value: 'time-by-tag', label: 'Time by Tag' },
  { value: 'billable-vs-nonbillable', label: 'Billable vs Non-Billable' },
  { value: 'rate-analysis', label: 'Rate Analysis' },
  { value: 'trends', label: 'Trends' }
];

const COLORS = ['#E879F9', '#06B6D4', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'];

export function AdvancedReports() {
  const { entries, projects } = useTimeTrackingStore();

  const [reportType, setReportType] = useState<ReportType>('time-by-project');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    projectIds: [],
    tags: [],
    billableOnly: false,
    groupBy: 'day'
  });

  // Get all available tags from entries
  const availableTags = useMemo(() => getAllTags(entries), [entries]);

  // Set default date range (last 30 days)
  useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setFilters(f => ({
      ...f,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  });

  // Filter entries
  const filteredEntries = useMemo(
    () => filterEntries(entries, filters),
    [entries, filters]
  );

  // Calculate report data based on type
  const reportData = useMemo(() => {
    switch (reportType) {
      case 'time-by-project':
        return calculateTimeByProject(filteredEntries, projects);

      case 'time-by-date':
        return calculateTimeByDate(filteredEntries, projects, filters.groupBy || 'day');

      case 'time-by-tag':
        return calculateTimeByTag(filteredEntries);

      case 'billable-vs-nonbillable':
        return calculateBillableVsNonBillable(filteredEntries, projects);

      case 'rate-analysis':
        return calculateRateAnalysis(filteredEntries, projects);

      case 'trends':
        return calculateTrends(filteredEntries, projects, filters.groupBy === 'month' ? 'month' : 'week');

      default:
        return null;
    }
  }, [reportType, filteredEntries, projects, filters.groupBy]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData) return;

    let csv = '';

    if (reportType === 'time-by-project') {
      csv = 'Project,Hours,Amount,Entries,Percentage\n';
      (reportData as ReturnType<typeof calculateTimeByProject>).forEach(item => {
        csv += `"${item.projectName}",${item.totalHours},${item.totalAmount},${item.entryCount},${item.percentage.toFixed(2)}%\n`;
      });
    } else if (reportType === 'time-by-date') {
      csv = 'Date,Hours,Amount,Entries\n';
      (reportData as ReturnType<typeof calculateTimeByDate>).forEach(item => {
        csv += `${item.date},${item.totalHours},${item.totalAmount},${item.entryCount}\n`;
      });
    } else if (reportType === 'time-by-tag') {
      csv = 'Tag,Hours,Entries,Percentage\n';
      (reportData as ReturnType<typeof calculateTimeByTag>).forEach(item => {
        csv += `"${item.tag}",${item.totalHours},${item.entryCount},${item.percentage.toFixed(2)}%\n`;
      });
    } else if (reportType === 'billable-vs-nonbillable') {
      const data = reportData as ReturnType<typeof calculateBillableVsNonBillable>;
      csv = 'Type,Hours,Amount,Entries,Percentage\n';
      csv += `Billable,${data.billable.hours},${data.billable.amount},${data.billable.entryCount},${data.billable.percentage.toFixed(2)}%\n`;
      csv += `Non-Billable,${data.nonBillable.hours},N/A,${data.nonBillable.entryCount},${data.nonBillable.percentage.toFixed(2)}%\n`;
    } else if (reportType === 'rate-analysis') {
      const data = reportData as ReturnType<typeof calculateRateAnalysis>;
      csv = 'Metric,Value\n';
      csv += `Average Rate,${data.averageRate}\n`;
      csv += `Median Rate,${data.medianRate}\n`;
      csv += `Min Rate,${data.minRate}\n`;
      csv += `Max Rate,${data.maxRate}\n`;
    } else if (reportType === 'trends') {
      csv = 'Period,Hours,Amount,Entries,Growth Rate\n';
      (reportData as ReturnType<typeof calculateTrends>).forEach(item => {
        csv += `${item.period},${item.hours},${item.amount},${item.entryCount},${item.growthRate.toFixed(2)}%\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render chart based on report type
  const renderChart = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'time-by-project': {
        const data = reportData as ReturnType<typeof calculateTimeByProject>;
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="projectName" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface-dark, #1f2937)', border: '1px solid var(--color-border-dark, #374151)', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Bar dataKey="totalHours" fill="#E879F9" name="Hours" />
              <Bar dataKey="totalAmount" fill="#06B6D4" name="Amount ($)" />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'time-by-date': {
        const data = reportData as ReturnType<typeof calculateTimeByDate>;
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface-dark, #1f2937)', border: '1px solid var(--color-border-dark, #374151)', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="totalHours" stroke="#E879F9" name="Hours" />
              <Line type="monotone" dataKey="totalAmount" stroke="#06B6D4" name="Amount ($)" />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      case 'time-by-tag': {
        const data = reportData as ReturnType<typeof calculateTimeByTag>;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(e: any) => `${e.tag}: ${formatHours(e.totalHours as number)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalHours"
                  nameKey="tag"
                >
                  {data.map((item, index) => (
                    <Cell key={`cell-${index}`} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="tag" type="category" stroke="#9CA3AF" width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface-dark, #1f2937)', border: '1px solid var(--color-border-dark, #374151)', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="totalHours" name="Hours">
                  {data.map((item, index) => (
                    <Cell key={`cell-${index}`} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'billable-vs-nonbillable': {
        const data = reportData as ReturnType<typeof calculateBillableVsNonBillable>;
        const pieData = [
          { name: 'Billable', value: data.billable.hours },
          { name: 'Non-Billable', value: data.nonBillable.hours }
        ];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(e) => `${e.name}: ${formatHours(e.value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-4">
              <div className="rounded-lg bg-surface-elevated p-4">
                <h4 className="text-sm font-medium text-text-tertiary mb-2">Billable</h4>
                <p className="text-2xl font-bold text-text-primary">{formatHours(data.billable.hours)}</p>
                <p className="text-sm text-text-secondary">${data.billable.amount.toFixed(2)} revenue</p>
                <p className="text-xs text-text-tertiary">{data.billable.percentage.toFixed(1)}% of total time</p>
              </div>

              <div className="rounded-lg bg-surface-elevated p-4">
                <h4 className="text-sm font-medium text-text-tertiary mb-2">Non-Billable</h4>
                <p className="text-2xl font-bold text-text-primary">{formatHours(data.nonBillable.hours)}</p>
                <p className="text-sm text-text-secondary">{data.nonBillable.entryCount} entries</p>
                <p className="text-xs text-text-tertiary">{data.nonBillable.percentage.toFixed(1)}% of total time</p>
              </div>
            </div>
          </div>
        );
      }

      case 'rate-analysis': {
        const data = reportData as ReturnType<typeof calculateRateAnalysis>;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-surface-elevated p-4">
                <h4 className="text-xs font-medium text-text-tertiary mb-1">Average Rate</h4>
                <p className="text-xl font-bold text-text-primary">${data.averageRate.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4">
                <h4 className="text-xs font-medium text-text-tertiary mb-1">Median Rate</h4>
                <p className="text-xl font-bold text-text-primary">${data.medianRate.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4">
                <h4 className="text-xs font-medium text-text-tertiary mb-1">Min Rate</h4>
                <p className="text-xl font-bold text-text-primary">${data.minRate.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-surface-elevated p-4">
                <h4 className="text-xs font-medium text-text-tertiary mb-1">Max Rate</h4>
                <p className="text-xl font-bold text-text-primary">${data.maxRate.toFixed(2)}</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.rateDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="rate" stroke="#9CA3AF" label={{ value: 'Rate ($/hr)', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9CA3AF" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface-dark, #1f2937)', border: '1px solid var(--color-border-dark, #374151)', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="hours" fill="#8B5CF6" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }

      case 'trends': {
        const data = reportData as ReturnType<typeof calculateTrends>;
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface-dark, #1f2937)', border: '1px solid var(--color-border-dark, #374151)', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="hours" stroke="#E879F9" name="Hours" />
              <Line yAxisId="right" type="monotone" dataKey="growthRate" stroke="#10B981" name="Growth %" />
            </LineChart>
          </ResponsiveContainer>
        );
      }
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Advanced Reports</h2>
          <p className="text-sm text-text-secondary">Analyze your time tracking data with interactive charts</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!reportData}
          className="flex items-center gap-2 rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-surface-elevated p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              {REPORT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* Group By (for applicable reports) */}
          {(reportType === 'time-by-date' || reportType === 'trends') && (
            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                Group By
              </label>
              <select
                value={filters.groupBy}
                onChange={(e) => setFilters({ ...filters, groupBy: e.target.value as GroupByPeriod })}
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          )}

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                Tags
              </label>
              <select
                value=""
                onChange={(e) => {
                  const tag = e.target.value;
                  if (tag && !filters.tags?.includes(tag)) {
                    setFilters({ ...filters, tags: [...(filters.tags || []), tag] });
                  }
                }}
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated px-3 py-2 text-sm text-text-light-primary dark:text-text-dark-primary focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="">All tags</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-accent-primary/20 text-accent-primary"
                    >
                      {tag}
                      <button
                        onClick={() => setFilters({ ...filters, tags: filters.tags?.filter(t => t !== tag) })}
                        className="hover:bg-accent-primary/20 rounded-full p-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Billable Only */}
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="advancedBillableOnly"
              checked={filters.billableOnly || false}
              onChange={(e) => setFilters({ ...filters, billableOnly: e.target.checked })}
              className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-primary focus:ring-2 focus:ring-accent-primary"
            />
            <label htmlFor="advancedBillableOnly" className="text-sm text-text-light-primary dark:text-text-dark-primary">
              Billable only
            </label>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg bg-surface-elevated p-6">
        {reportData ? renderChart() : (
          <div className="flex h-64 items-center justify-center text-text-tertiary">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select filters to generate report</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-surface-elevated p-4">
            <h4 className="text-sm font-medium text-text-tertiary mb-1">Total Entries</h4>
            <p className="text-2xl font-bold text-text-primary">{filteredEntries.length}</p>
          </div>
          <div className="rounded-lg bg-surface-elevated p-4">
            <h4 className="text-sm font-medium text-text-tertiary mb-1">Total Time</h4>
            <p className="text-2xl font-bold text-text-primary">
              {formatHours(filteredEntries.reduce((sum, e) => sum + e.duration, 0) / 3600)}
            </p>
          </div>
          <div className="rounded-lg bg-surface-elevated p-4">
            <h4 className="text-sm font-medium text-text-tertiary mb-1">Date Range</h4>
            <p className="text-sm text-text-primary">
              {filters.startDate && filters.endDate
                ? `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
                : 'All Time'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
