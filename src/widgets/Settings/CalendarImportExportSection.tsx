import React, { useRef } from 'react';

interface CalendarImportExportSectionProps {
  isExporting: boolean;
  isImporting: boolean;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Calendar Import/Export Section
 * Provides buttons to export calendar to ICS and import from ICS files.
 */
export const CalendarImportExportSection: React.FC<CalendarImportExportSectionProps> = ({
  isExporting,
  isImporting,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        📅 Calendar Import/Export
      </h2>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        Import events from Google Calendar or export your events to .ics format.
      </p>

      <div className="space-y-3">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="w-full px-4 py-3 bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-soft hover:shadow-medium transition-all duration-200"
        >
          {isExporting ? '⏳ Exporting...' : '📤 Export Calendar (.ics)'}
        </button>

        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="w-full px-4 py-3 bg-accent-secondary hover:bg-accent-secondary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-soft hover:shadow-medium transition-all duration-200"
        >
          {isImporting ? '⏳ Importing...' : '📥 Import Calendar (.ics)'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ics,.ical"
          onChange={onImport}
          className="hidden"
        />
      </div>
    </div>
  );
};
