import { type ReactNode, type ElementType, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Printer, Download, Upload } from 'lucide-react';
import type { ViewMode } from '../../types';

interface CalendarHeaderProps {
  // Display
  displayText: string;
  icon?: ElementType; // Custom icon component (defaults to CalendarIcon)

  // Navigation
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  showNavigation?: boolean;

  // View Mode (optional - only shown if provided)
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;

  // Actions (optional - only shown if provided)
  onCreate?: () => void;
  createButtonText?: string; // Custom text (defaults to "New Event")
  onPrint?: () => void;
  onExport?: () => void;
  exportTooltip?: string; // Custom tooltip (defaults to "Export to .ics file")
  onImport?: (file: File) => void;
  importTooltip?: string; // Custom tooltip (defaults to "Import from .ics file")
  importAccept?: string; // File accept pattern (defaults to ".ics")

  // Status
  statusMessage?: ReactNode;
}

/**
 * CalendarHeader - Shared header component for calendar views
 * Used by both TimeEntryCalendar and MonthlyTimeReport for consistent styling
 */
export function CalendarHeader({
  displayText,
  icon: Icon = CalendarIcon,
  onPrevious,
  onNext,
  onToday,
  showNavigation = true,
  viewMode,
  onViewModeChange,
  onCreate,
  createButtonText = 'New Event',
  onPrint,
  onExport,
  exportTooltip = 'Export to .ics file',
  onImport,
  importTooltip = 'Import from .ics file',
  importAccept = '.ics',
  statusMessage,
}: CalendarHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark p-4">
      <div className="flex items-center justify-between mb-4">
        {/* Left: Navigation Arrows */}
        <div className="flex items-center gap-2">
          {showNavigation && (
            <>
              <button
                onClick={onPrevious}
                className="p-2 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-all duration-standard ease-smooth"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={onNext}
                className="p-2 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-all duration-standard ease-smooth"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Center: Period Display + Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              {displayText}
            </h2>
          </div>
          <button
            onClick={onToday}
            className="px-3 py-1 text-sm font-medium text-accent-primary hover:bg-accent-primary/10 rounded-button transition-all duration-standard ease-smooth"
          >
            Today
          </button>
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-2 px-3 py-1 text-sm font-medium bg-accent-primary text-white hover:opacity-90 rounded-button transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {createButtonText}
            </button>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="p-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded-button transition-all duration-standard ease-smooth no-print"
              title="Print calendar"
              aria-label="Print calendar"
            >
              <Printer className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded-button transition-all duration-standard ease-smooth no-print"
              title={exportTooltip}
              aria-label="Export"
            >
              <Download className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            </button>
          )}
          {onImport && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded-button transition-all duration-standard ease-smooth no-print"
                title={importTooltip}
                aria-label="Import"
              >
                <Upload className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={importAccept}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onImport) {
                    onImport(file);
                    // Reset input so same file can be selected again
                    e.target.value = '';
                  }
                }}
              />
            </>
          )}
        </div>

        {/* Right: Status message or placeholder */}
        <div className="w-[88px] flex items-center justify-end">
          {statusMessage}
        </div>
      </div>

      {/* View Mode Switcher (only shown when viewMode is provided) */}
      {viewMode && onViewModeChange && (
        <div className="flex justify-center">
          <div className="flex gap-1 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-button p-1">
            <button
              onClick={() => onViewModeChange('monthly')}
              className={`px-3 py-1 rounded-button text-sm transition-all duration-standard ease-smooth ${
                viewMode === 'monthly'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onViewModeChange('weekly')}
              className={`px-3 py-1 rounded-button text-sm transition-all duration-standard ease-smooth ${
                viewMode === 'weekly'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onViewModeChange('daily')}
              className={`px-3 py-1 rounded-button text-sm transition-all duration-standard ease-smooth ${
                viewMode === 'daily'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => onViewModeChange('agenda')}
              className={`px-3 py-1 rounded-button text-sm transition-all duration-standard ease-smooth ${
                viewMode === 'agenda'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
            >
              List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
