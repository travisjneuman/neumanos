/**
 * Markdown / Obsidian Import Section
 *
 * Allows importing a folder of markdown files as notes.
 * Parses frontmatter, wiki-links, and tags.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  FolderOpen,
  Upload,
  Check,
  AlertTriangle,
  Tag,
  Link2,
} from 'lucide-react';
import {
  importMarkdownFiles,
  type MarkdownImportResult,
  type MarkdownImportProgress,
} from '../../services/markdownImport';
import { useNotesStore } from '../../stores/useNotesStore';
import { logger } from '../../services/logger';

const log = logger.module('MarkdownImportSection');

interface MessageState {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

interface MarkdownImportSectionProps {
  onMessage: (message: MessageState | null) => void;
}

type ImportStage = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';

export const MarkdownImportSection: React.FC<MarkdownImportSectionProps> = ({
  onMessage,
}) => {
  const [stage, setStage] = useState<ImportStage>('idle');
  const [progress, setProgress] = useState<MarkdownImportProgress | null>(null);
  const [result, setResult] = useState<MarkdownImportResult | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNote = useNotesStore((s) => s.createNote);

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setStage('parsing');
      onMessage(null);

      const importResult = await importMarkdownFiles(files, (p) => {
        setProgress(p);
      });

      setResult(importResult);
      setStage('preview');
    } catch (error) {
      log.error('Markdown import failed', { error });
      onMessage({ type: 'error', text: `Import failed: ${error}` });
      setStage('idle');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!result) return;

    setStage('importing');
    let count = 0;

    try {
      for (const note of result.notes) {
        createNote({
          title: note.title,
          contentText: note.content,
          tags: note.tags,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          linkedNotes: note.linkedNotes,
        });
        count++;
        setImportedCount(count);
      }

      setStage('complete');
      onMessage({
        type: 'success',
        text: `Successfully imported ${count} notes from ${result.totalFiles} files.`,
      });
    } catch (error) {
      log.error('Note creation failed during import', { error });
      onMessage({
        type: 'error',
        text: `Import partially failed: ${count} of ${result.notes.length} notes imported. Error: ${error}`,
      });
      setStage('complete');
    }
  };

  const handleReset = () => {
    setStage('idle');
    setProgress(null);
    setResult(null);
    setImportedCount(0);
  };

  // Collect all unique tags and links from result
  const allTags = result
    ? [...new Set(result.notes.flatMap((n) => n.tags))]
    : [];
  const allLinks = result
    ? [...new Set(result.notes.flatMap((n) => n.linkedNotes))]
    : [];

  return (
    <div className="bento-card p-6">
      <div className="flex items-center gap-3 mb-1">
        <FileText className="w-5 h-5 text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          Markdown / Obsidian Import
        </h2>
      </div>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        Import a folder of .md files as notes. Supports YAML frontmatter, [[wiki-links]], and #tags.
      </p>

      {/* Idle State */}
      {stage === 'idle' && (
        <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-8 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
            Select a folder containing markdown (.md) files to import
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Select Folder
            <input
              ref={fileInputRef}
              type="file"
              // @ts-expect-error - webkitdirectory is not in standard types
              webkitdirectory=""
              multiple
              className="hidden"
              onChange={handleFolderSelect}
            />
          </label>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-3">
            Non-.md files will be skipped. Hidden files/folders are excluded.
          </p>
        </div>
      )}

      {/* Parsing State */}
      {stage === 'parsing' && progress && (
        <div className="text-center py-8">
          <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-2 mb-4 overflow-hidden">
            <motion.div
              className="h-2 rounded-full bg-accent-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Parsing {progress.current} of {progress.total} files...
          </p>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1 truncate">
            {progress.currentFile}
          </p>
        </div>
      )}

      {/* Preview State */}
      <AnimatePresence>
        {stage === 'preview' && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <SummaryCard
                label="Notes Found"
                value={result.notes.length}
                icon={FileText}
              />
              <SummaryCard
                label="Files Scanned"
                value={result.totalFiles}
                icon={FolderOpen}
              />
              <SummaryCard
                label="Unique Tags"
                value={allTags.length}
                icon={Tag}
              />
              <SummaryCard
                label="Wiki Links"
                value={allLinks.length}
                icon={Link2}
              />
            </div>

            {/* Warnings / Errors */}
            {(result.warnings.length > 0 || result.errors.length > 0) && (
              <div className="mb-4 p-3 rounded-lg bg-status-warning-bg dark:bg-status-warning-bg-dark border border-status-warning-border dark:border-status-warning-border-dark">
                {result.errors.map((err, i) => (
                  <p key={`err-${i}`} className="text-xs text-status-error-text dark:text-status-error-text-dark flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {err}
                  </p>
                ))}
                {result.warnings.map((warn, i) => (
                  <p key={`warn-${i}`} className="text-xs text-status-warning-text dark:text-status-warning-text-dark">
                    {warn}
                  </p>
                ))}
              </div>
            )}

            {/* Sample Notes */}
            {result.notes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
                  Sample Notes (first 5)
                </h3>
                <div className="space-y-2">
                  {result.notes.slice(0, 5).map((note, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg"
                    >
                      <FileText className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                          {note.title}
                        </p>
                        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary truncate">
                          {note.relativePath}
                          {note.tags.length > 0 && ` | Tags: ${note.tags.join(', ')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {result.notes.length > 5 && (
                    <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary text-center">
                      ...and {result.notes.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmImport}
                disabled={result.notes.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Import {result.notes.length} Notes
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Importing State */}
      {stage === 'importing' && result && (
        <div className="text-center py-8">
          <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-2 mb-4 overflow-hidden">
            <motion.div
              className="h-2 rounded-full bg-accent-green"
              initial={{ width: 0 }}
              animate={{ width: `${(importedCount / result.notes.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Creating note {importedCount} of {result.notes.length}...
          </p>
        </div>
      )}

      {/* Complete State */}
      {stage === 'complete' && (
        <div className="text-center py-8">
          <Check className="w-12 h-12 mx-auto mb-4 text-accent-green" />
          <p className="text-sm text-text-light-primary dark:text-text-dark-primary font-medium mb-2">
            Import Complete
          </p>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
            {importedCount} notes imported successfully
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark"
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
};

// Summary Card sub-component
interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.FC<{ className?: string }>;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon: Icon }) => (
  <div className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg text-center">
    <Icon className="w-4 h-4 mx-auto mb-1 text-text-light-tertiary dark:text-text-dark-tertiary" />
    <p className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
      {value}
    </p>
    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
      {label}
    </p>
  </div>
);
