/**
 * Export Settings Component
 *
 * Provides UI for exporting notes and tasks to portable markdown format:
 * - Export all notes with folder hierarchy
 * - Export all tasks grouped by status
 * - Export complete workspace (notes + tasks + metadata)
 */

import React, { useState } from 'react';
import { FileDown, Download, AlertCircle, Check } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useFoldersStore } from '../../stores/useFoldersStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import {
  exportNotesWithFolders,
  exportAllData,
  downloadBlob,
  getExportFilename,
  exportTasksToMarkdown,
  createMarkdownZip,
} from '../../utils/markdownExport';
import { logger } from '../../services/logger';

const log = logger.module('ExportSettings');

export const ExportSettings: React.FC = () => {
  const notes = useNotesStore((state) => state.notes);
  const folders = useFoldersStore((state) => state.folders);
  const tasks = useKanbanStore((state) => state.tasks);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate counts
  const notesArray = Object.values(notes);
  const foldersArray = Object.values(folders);
  const noteCount = notesArray.length;
  const taskCount = tasks.length;
  const folderCount = foldersArray.length;

  // Export all notes
  const handleExportAllNotes = async () => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(null);
    setExportProgress('Exporting notes...');

    try {
      const zip = await exportNotesWithFolders(notesArray, foldersArray);
      const filename = `notes-export-${Date.now()}.zip`;
      downloadBlob(zip, filename);

      log.info('All notes exported', { count: noteCount });
      setExportSuccess(`Exported ${noteCount} notes successfully!`);
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      log.error('Export all notes failed', { error: err });
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export all tasks
  const handleExportAllTasks = async () => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(null);
    setExportProgress('Exporting tasks...');

    try {
      const files: Array<{ path: string; content: string }> = [];

      // Group by status
      const statuses = ['backlog', 'todo', 'inprogress', 'review', 'done'];
      statuses.forEach((status) => {
        const statusTasks = tasks.filter((t) => t.status === status);
        if (statusTasks.length > 0) {
          const markdown = exportTasksToMarkdown(statusTasks);
          files.push({
            path: `tasks/by-status/${status}.md`,
            content: markdown,
          });
        }
      });

      // Also add all tasks in single file
      const allMarkdown = exportTasksToMarkdown(tasks);
      files.push({
        path: 'tasks/all-tasks.md',
        content: allMarkdown,
      });

      const zip = await createMarkdownZip(files);
      const filename = `tasks-export-${Date.now()}.zip`;
      downloadBlob(zip, filename);

      log.info('All tasks exported', { count: taskCount });
      setExportSuccess(`Exported ${taskCount} tasks successfully!`);
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      log.error('Export all tasks failed', { error: err });
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // Export everything
  const handleExportEverything = async () => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(null);
    setExportProgress(`Exporting ${noteCount + taskCount} items...`);

    try {
      const zip = await exportAllData(notesArray, tasks, foldersArray);
      const filename = getExportFilename();
      downloadBlob(zip, filename);

      log.info('Complete workspace exported', { noteCount, taskCount, folderCount });
      setExportSuccess(
        `Exported ${noteCount} notes and ${taskCount} tasks successfully!`
      );
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      log.error('Export everything failed', { error: err });
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-2">
          <FileDown className="w-5 h-5" />
          Data Export
        </h3>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Export your notes, tasks, and data to portable markdown format for backup, sharing, or migration.
        </p>
      </div>

      {/* Export Options */}
      <div className="space-y-4">
        {/* Export All Notes */}
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                Export All Notes
              </h4>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {noteCount} notes across {folderCount} folders
              </p>
            </div>
            <button
              onClick={handleExportAllNotes}
              disabled={isExporting || noteCount === 0}
              className="px-4 py-2 rounded-button bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Notes
            </button>
          </div>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Downloads ZIP with full folder hierarchy preserved
          </p>
        </div>

        {/* Export All Tasks */}
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                Export All Tasks
              </h4>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {taskCount} tasks{tasks.filter((t) => t.archivedAt).length > 0 && ` (${tasks.filter((t) => t.archivedAt).length} archived)`}
              </p>
            </div>
            <button
              onClick={handleExportAllTasks}
              disabled={isExporting || taskCount === 0}
              className="px-4 py-2 rounded-button bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Tasks
            </button>
          </div>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Downloads ZIP with tasks grouped by status
          </p>
        </div>

        {/* Export Everything */}
        <div className="p-4 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 rounded-lg border border-accent-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                Export Complete Workspace
              </h4>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {noteCount} notes, {taskCount} tasks, {folderCount} folders
              </p>
            </div>
            <button
              onClick={handleExportEverything}
              disabled={isExporting || (noteCount === 0 && taskCount === 0)}
              className="px-4 py-2 rounded-button bg-gradient-button-primary text-white text-sm font-medium transition-all hover:shadow-glow-magenta disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Everything
            </button>
          </div>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Complete workspace ZIP: notes/ + tasks/ + metadata.json
          </p>
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

      {/* Success Message */}
      {exportSuccess && (
        <div className="p-4 rounded-lg bg-accent-green/10 border border-accent-green/30">
          <div className="flex items-center gap-2 text-sm text-accent-green">
            <Check className="w-4 h-4" />
            <span>{exportSuccess}</span>
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

      {/* Export Format Details (Collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-text-light-primary dark:text-text-dark-primary hover:text-accent-blue transition-colors flex items-center gap-2">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          Export Format Details
        </summary>
        <div className="mt-3 pl-6 space-y-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <div>
            <h5 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Note Markdown Format
            </h5>
            <pre className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg text-xs font-mono overflow-x-auto">
{`---
title: "My Note"
created: "2025-01-01T00:00:00.000Z"
updated: "2025-01-01T00:00:00.000Z"
tags: ["work", "project"]
folder: "Work"
---

# Note content here
`}
            </pre>
          </div>
          <div>
            <h5 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              Task Markdown Format
            </h5>
            <pre className="p-3 bg-surface-light dark:bg-surface-dark rounded-lg text-xs font-mono overflow-x-auto">
{`---
title: "My Task"
status: "inprogress"
priority: "high"
created: "2025-01-01"
due-date: "2025-01-31"
---

## Description
Task description here

## Metadata
- **Status:** In Progress
- **Priority:** High
`}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
};
