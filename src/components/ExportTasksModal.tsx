/**
 * Export Tasks Modal Component
 * Provides UI for exporting tasks to markdown with various options
 */

import { useState, useMemo } from 'react';
import { X, Download, FileDown, AlertCircle } from 'lucide-react';
import { useKanbanStore } from '../stores/useKanbanStore';
import { Button } from './ui';
import {
  exportTaskToMarkdown,
  exportTasksToMarkdown,
  createMarkdownZip,
  downloadBlob,
  getExportFilename,
} from '../utils/markdownExport';
import { logger } from '../services/logger';

const log = logger.module('ExportTasksModal');

interface ExportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportScope = 'single' | 'column' | 'board';
type ExportFormat = 'separate' | 'single';

export function ExportTasksModal({ isOpen, onClose }: ExportTasksModalProps) {
  const tasks = useKanbanStore((state) => state.tasks);
  const columns = useKanbanStore((state) => state.columns);
  const [exportScope, setExportScope] = useState<ExportScope>('board');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('separate');
  const [selectedColumn, setSelectedColumn] = useState<string>('todo');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate task counts for preview
  const taskCounts = useMemo(() => {
    const allTasks = tasks;
    const columnTasks = allTasks.filter((t) => t.status === selectedColumn);
    const filteredAll = includeArchived
      ? allTasks
      : allTasks.filter((t) => !t.archivedAt);
    const filteredColumn = includeArchived
      ? columnTasks
      : columnTasks.filter((t) => !t.archivedAt);

    return {
      single: 0, // Not implemented in this modal
      column: filteredColumn.length,
      board: filteredAll.length,
    };
  }, [tasks, selectedColumn, includeArchived]);

  // Get column name for display
  const getColumnName = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    return column?.title || columnId;
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportProgress(null);

    try {
      const allTasks = includeArchived
        ? tasks
        : tasks.filter((t) => !t.archivedAt);

      if (exportScope === 'column') {
        // Column export
        const columnTasks = allTasks.filter((t) => t.status === selectedColumn);

        if (columnTasks.length === 0) {
          throw new Error('No tasks in selected column');
        }

        setExportProgress(`Exporting ${columnTasks.length} tasks...`);

        if (exportFormat === 'single') {
          // Single file export
          const markdown = exportTasksToMarkdown(columnTasks);
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const filename = `${selectedColumn}-tasks.md`;
          downloadBlob(blob, filename);
        } else {
          // Separate files by status
          const files = columnTasks.map((task) => ({
            path: `tasks/${task.title.replace(/[<>:"/\\|?*]/g, '-')}.md`,
            content: exportTaskToMarkdown(task),
          }));
          const zip = await createMarkdownZip(files);
          downloadBlob(zip, `${selectedColumn}-tasks-${Date.now()}.zip`);
        }

        log.info('Column tasks exported', {
          count: columnTasks.length,
          column: selectedColumn,
        });
      } else {
        // Board export (all tasks)
        if (allTasks.length === 0) {
          throw new Error('No tasks to export');
        }

        setExportProgress(`Exporting ${allTasks.length} tasks...`);

        if (exportFormat === 'single') {
          // Single file with all tasks
          const markdown = exportTasksToMarkdown(allTasks);
          const blob = new Blob([markdown], { type: 'text/markdown' });
          downloadBlob(blob, 'all-tasks.md');
        } else {
          // Separate files by status
          const files: Array<{ path: string; content: string }> = [];

          // Group by status
          const statuses = ['backlog', 'todo', 'inprogress', 'review', 'done'];
          statuses.forEach((status) => {
            const statusTasks = allTasks.filter((t) => t.status === status);
            if (statusTasks.length > 0) {
              const markdown = exportTasksToMarkdown(statusTasks);
              files.push({
                path: `tasks/by-status/${status}.md`,
                content: markdown,
              });
            }
          });

          // Also add all tasks in single file
          const allMarkdown = exportTasksToMarkdown(allTasks);
          files.push({
            path: 'tasks/all-tasks.md',
            content: allMarkdown,
          });

          const zip = await createMarkdownZip(files);
          const filename = getExportFilename();
          downloadBlob(zip, filename);
        }

        log.info('Board tasks exported', {
          count: allTasks.length,
          format: exportFormat,
        });
      }

      // Success message
      setExportProgress(`Successfully exported tasks!`);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      log.error('Export failed', { error: err });
      setError(message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  // Preview text for current selection
  const getPreviewText = () => {
    const count = taskCounts[exportScope];
    if (count === 0) {
      if (exportScope === 'column')
        return `No tasks in ${getColumnName(selectedColumn)}`;
      return 'No tasks to export';
    }

    const taskText = count === 1 ? 'task' : 'tasks';
    const scopeLabel =
      exportScope === 'column'
        ? ` from ${getColumnName(selectedColumn)}`
        : ' from all columns';
    return `${count} ${taskText} will be exported${scopeLabel}`;
  };

  const canExport = taskCounts[exportScope] > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-accent-blue" />
            <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              Export Tasks
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded-button transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
              What to export?
            </label>
            <div className="space-y-2">
              {/* Column Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  exportScope === 'column'
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="column"
                  checked={exportScope === 'column'}
                  onChange={(e) =>
                    setExportScope(e.target.value as ExportScope)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    Current column
                  </div>
                  <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Export tasks from a specific column
                  </div>
                  {exportScope === 'column' && (
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {columns.map((column) => (
                        <option key={column.id} value={column.id}>
                          {column.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              {/* Board Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  exportScope === 'board'
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                }`}
              >
                <input
                  type="radio"
                  name="exportScope"
                  value="board"
                  checked={exportScope === 'board'}
                  onChange={(e) =>
                    setExportScope(e.target.value as ExportScope)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    Entire board
                  </div>
                  <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Export all tasks across all columns
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
              Export format
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="separate"
                  checked={exportFormat === 'separate'}
                  onChange={(e) =>
                    setExportFormat(e.target.value as ExportFormat)
                  }
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    Separate files by status
                  </div>
                  <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Creates individual files: backlog.md, todo.md, etc.
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value="single"
                  checked={exportFormat === 'single'}
                  onChange={(e) =>
                    setExportFormat(e.target.value as ExportFormat)
                  }
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    Single file (all tasks)
                  </div>
                  <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    One markdown file with table of contents
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              Export options
            </label>

            {/* Include Archived */}
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Include archived tasks
                </div>
                <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Export archived tasks along with active tasks
                </div>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-2 text-sm">
              <Download className="w-4 h-4 text-accent-blue" />
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {getPreviewText()}
              </span>
            </div>
            <div className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {exportFormat === 'separate'
                ? 'ZIP file will contain separate files grouped by status'
                : 'Single markdown file with all tasks'}
            </div>
          </div>

          {/* Progress Indicator */}
          {exportProgress && (
            <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/30">
              <div className="flex items-center gap-2 text-sm text-accent-blue">
                <div className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                <span>{exportProgress}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-accent-red/10 border border-accent-red/30">
              <div className="flex items-start gap-2 text-sm text-accent-red">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!canExport}
            loading={isExporting}
            leftIcon={<FileDown className="w-4 h-4" />}
          >
            Export Tasks
          </Button>
        </div>
      </div>
    </div>
  );
}
