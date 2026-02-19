/**
 * PresentationExportDialog Component
 *
 * Dialog for exporting presentations to PDF or PPTX.
 */

import { useState } from 'react';
import { X, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from '../../stores/useToastStore';
import type { Slide, SlideTheme } from '../../types';
import { exportToPDF, exportToPPTX } from './presentationExport';

interface PresentationExportDialogProps {
  slides: Slide[];
  title: string;
  theme: SlideTheme;
  onClose: () => void;
}

type ExportFormat = 'pdf' | 'pptx';

export function PresentationExportDialog({
  slides,
  title,
  theme,
  onClose,
}: PresentationExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleExport = async () => {
    setIsExporting(true);
    setProgress({ current: 0, total: slides.length });

    try {
      if (format === 'pdf') {
        await exportToPDF(slides, title, (current, total) => {
          setProgress({ current, total });
        });
        toast.success('PDF exported successfully');
      } else {
        await exportToPPTX(slides, title, theme, (current, total) => {
          setProgress({ current, total });
        });
        toast.success('PPTX exported successfully');
      }
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Export Presentation
          </h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Choose a format to export your presentation:
          </p>

          {/* Format selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('pdf')}
              disabled={isExporting}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                format === 'pdf'
                  ? 'border-accent-primary bg-accent-primary/5'
                  : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileText className="w-8 h-8 text-status-error" />
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                PDF
              </span>
              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Best for viewing
              </span>
            </button>

            <button
              onClick={() => setFormat('pptx')}
              disabled={isExporting}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                format === 'pptx'
                  ? 'border-accent-primary bg-accent-primary/5'
                  : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileSpreadsheet className="w-8 h-8 text-accent-orange" />
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                PPTX
              </span>
              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Editable in PowerPoint
              </span>
            </button>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-light-secondary dark:text-text-dark-secondary">
                  Exporting...
                </span>
                <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                  {progress.current} / {progress.total} slides
                </span>
              </div>
              <div className="w-full h-2 bg-surface-light-alt dark:bg-surface-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            <p>
              {format === 'pdf'
                ? 'PDF files preserve the visual layout but cannot be edited.'
                : 'PPTX files can be opened and edited in Microsoft PowerPoint or compatible software.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
