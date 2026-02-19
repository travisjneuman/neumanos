/**
 * ExportDialog Component
 * Modal for exporting Gantt timeline in various formats (PNG, PDF, Excel)
 */

import { useState } from 'react';
import { X, Download, FileImage, FileText, FileSpreadsheet } from 'lucide-react';
import type { Task } from '../../types';
import { exportGanttToPNG, exportGanttToPDF, exportGanttToExcel } from '../../utils/ganttExport';

export type ExportFormat = 'png' | 'pdf' | 'excel';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  timelineElement: HTMLElement | null;
  dateRange: { start: Date; end: Date };
  projectName?: string;
}

export function ExportDialog({
  isOpen,
  onClose,
  tasks,
  timelineElement,
  dateRange,
  projectName = 'Project Timeline',
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('png');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [includeDependencies, setIncludeDependencies] = useState(true);
  const [includeSubtasks, setIncludeSubtasks] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!timelineElement) {
      setError('Timeline element not found. Please try again.');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      switch (selectedFormat) {
        case 'png':
          await exportGanttToPNG(timelineElement, `${projectName}.png`);
          break;

        case 'pdf':
          await exportGanttToPDF(tasks, timelineElement, {
            orientation,
            includeDependencies,
            projectName,
            dateRange,
          });
          break;

        case 'excel':
          await exportGanttToExcel(tasks, `${projectName}.xlsx`, {
            includeSubtasks,
            includeCustomFields: true,
          });
          break;
      }

      // Close dialog on success
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Export Timeline
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedFormat('png')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  selectedFormat === 'png'
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
                }`}
              >
                <FileImage className="w-6 h-6" />
                <span className="text-xs font-medium">PNG</span>
              </button>

              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs font-medium">PDF</span>
              </button>

              <button
                onClick={() => setSelectedFormat('excel')}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span className="text-xs font-medium">Excel</span>
              </button>
            </div>
          </div>

          {/* PDF Options */}
          {selectedFormat === 'pdf' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Orientation
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                      orientation === 'portrait'
                        ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                        : 'border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-primary/50'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                      orientation === 'landscape'
                        ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                        : 'border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-primary/50'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDependencies}
                  onChange={(e) => setIncludeDependencies(e.target.checked)}
                  className="w-4 h-4 rounded border-border-light dark:border-border-dark accent-accent-primary"
                />
                <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  Include task summary page
                </span>
              </label>
            </div>
          )}

          {/* Excel Options */}
          {selectedFormat === 'excel' && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSubtasks}
                  onChange={(e) => setIncludeSubtasks(e.target.checked)}
                  className="w-4 h-4 rounded border-border-light dark:border-border-dark accent-accent-primary"
                />
                <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  Include subtasks (indented)
                </span>
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-status-error-bg dark:bg-status-error-bg-dark border border-status-error-border dark:border-status-error-border-dark rounded-lg">
              <p className="text-sm text-status-error-text dark:text-status-error-text-dark">{error}</p>
            </div>
          )}

          {/* Format Description */}
          <div className="p-3 bg-surface-light-hover dark:bg-surface-dark-hover rounded-lg">
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {selectedFormat === 'png' &&
                'Export as high-resolution image (2x DPI) of the current timeline view.'}
              {selectedFormat === 'pdf' &&
                'Export as multi-page PDF document with project metadata and optional task summary.'}
              {selectedFormat === 'excel' &&
                'Export task data as Excel spreadsheet with all fields. Can be imported into MS Project.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-hover dark:hover:bg-surface-dark-hover rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-primary text-white dark:text-dark-background rounded-lg hover:bg-accent-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
