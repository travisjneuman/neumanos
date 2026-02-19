import React, { useState, useRef } from 'react';
import { Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { importTogglCSV, readCSVFile, extractTogglProjects } from '../services/togglImport';
import type { TimeEntry } from '../types';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';

interface TimeEntryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  type: 'success' | 'error';
  message: string;
  count?: number;
}

/**
 * TimeEntryImportModal Component
 * Imports time tracking data from Toggl Track CSV exports
 */
export const TimeEntryImportModal: React.FC<TimeEntryImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get store actions
  const projects = useTimeTrackingStore((state) => state.projects);
  const addProject = useTimeTrackingStore((state) => state.addProject);
  const addManualEntry = useTimeTrackingStore((state) => state.addManualEntry);
  const loadProjects = useTimeTrackingStore((state) => state.loadProjects);
  const loadEntries = useTimeTrackingStore((state) => state.loadEntries);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      await handleTogglImport(file);
    } catch (error) {
      setImportResult({
        type: 'error',
        message: String(error),
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTogglImport = async (file: File) => {
    try {
      // Parse CSV
      const csvContent = await readCSVFile(file);
      const result = importTogglCSV(csvContent);

      if (!result.success || !result.entries) {
        setImportResult({
          type: 'error',
          message: result.error || 'Failed to parse CSV file',
        });
        return;
      }

      // Extract unique Toggl projects
      const togglProjects = extractTogglProjects(result.entries);

      // Create project mappings (Toggl project name → app project ID)
      const projectMappings: Record<string, string> = {};

      // For each Toggl project, find or create a matching app project
      for (const { togglProject, togglClient } of togglProjects) {
        // Check if project already exists (match by name)
        const existingProject = projects.find(
          (p) => p.name.toLowerCase() === togglProject.toLowerCase()
        );

        if (existingProject) {
          // Use existing project
          projectMappings[togglProject] = existingProject.id;
        } else {
          // Create new project
          const newProjectData = {
            name: togglProject,
            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`, // Random color
            billable: true, // Default to billable
            active: true,
            archived: false,
            client: togglClient || undefined,
          };

          await addProject(newProjectData);

          // Reload projects to get the new project ID
          await loadProjects();

          // Find the newly created project
          const updatedProjects = useTimeTrackingStore.getState().projects;
          const newProject = updatedProjects.find(
            (p) => p.name.toLowerCase() === togglProject.toLowerCase()
          );

          if (newProject) {
            projectMappings[togglProject] = newProject.id;
          }
        }
      }

      // Import all time entries with correct project IDs
      let importedCount = 0;
      for (const entry of result.entries) {
        const togglProjectName = entry._togglProject || '';
        const appProjectId = projectMappings[togglProjectName];

        // Create clean time entry without metadata
        const cleanEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'> = {
          projectId: appProjectId,
          description: entry.description,
          startTime: entry.startTime,
          endTime: entry.endTime,
          duration: entry.duration,
          tags: entry.tags || [],
          billable: entry.billable,
          notes: entry.notes,
          projectIds: [],
        };

        await addManualEntry(cleanEntry);
        importedCount++;
      }

      // Reload entries to show newly imported data
      await loadEntries();

      setImportResult({
        type: 'success',
        message: `Imported ${importedCount} time ${importedCount === 1 ? 'entry' : 'entries'} and created ${togglProjects.length} ${togglProjects.length === 1 ? 'project' : 'projects'} from Toggl`,
        count: importedCount,
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      setImportResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Import failed',
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setImportResult(null);
    setIsProcessing(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Time Entries from Toggl" maxWidth="md">
      <div className="space-y-4">
        {/* File Upload */}
        {!importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-purple flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Toggl Track CSV Import
                </h3>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  Import time entries and projects from your Toggl export
                </p>
              </div>
            </div>

            <div
              onClick={handleUploadClick}
              className="relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg hover:border-accent-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth cursor-pointer group"
            >
              <Upload className="w-10 h-10 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-accent-primary transition-colors" />
              <div className="text-center">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {isProcessing ? 'Processing...' : 'Click to upload CSV file'}
                </p>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  CSV file from Toggl Track export
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
            </div>

            <div className="bg-accent-blue/10 dark:bg-accent-blue/20 border border-accent-blue/20 dark:border-accent-blue/30 rounded-lg p-3">
              <p className="text-xs text-text-light-primary dark:text-text-dark-primary font-medium mb-1">
                How to export from Toggl:
              </p>
              <ol className="text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-1 list-decimal list-inside">
                <li>Go to Toggl Track: Settings → Data Export</li>
                <li>Select date range and click "Download CSV"</li>
                <li>Upload the CSV file here</li>
              </ol>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-2">
                Projects will be automatically created if they don't exist.
              </p>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            importResult.type === 'success'
              ? 'bg-accent-green/10 dark:bg-accent-green/20 border border-accent-green/20 dark:border-accent-green/30'
              : 'bg-accent-red/10 dark:bg-accent-red/20 border border-accent-red/20 dark:border-accent-red/30'
          }`}>
            {importResult.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-accent-green dark:text-accent-green flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-accent-red dark:text-accent-red flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                importResult.type === 'success'
                  ? 'text-text-light-primary dark:text-text-dark-primary'
                  : 'text-text-light-primary dark:text-text-dark-primary'
              }`}>
                {importResult.message}
              </p>
            </div>
          </div>
        )}

        {importResult && importResult.type === 'error' && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 rounded-button bg-gradient-button-primary hover:shadow-glow-magenta text-white font-medium transition-all duration-standard ease-smooth"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-button border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
