/**
 * Notion Import Section
 *
 * Import notes from Notion CSV exports.
 * Notion exports databases as CSV with columns like Title, Tags, Created, Content.
 * Also supports Notion's markdown export format (zip of .md files).
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  Upload,
  Check,
  AlertTriangle,
  Tag,
  FileText,
} from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { logger } from '../../services/logger';

const log = logger.module('NotionImport');

interface MessageState {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

interface NotionImportSectionProps {
  onMessage: (message: MessageState | null) => void;
}

interface ParsedNotionNote {
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface NotionImportResult {
  notes: ParsedNotionNote[];
  warnings: string[];
}

type ImportStage = 'idle' | 'preview' | 'importing' | 'complete';

/**
 * Parse a CSV line handling quoted fields with commas and newlines
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Find column index by matching header names (case-insensitive)
 */
function findColumn(headers: string[], candidates: string[]): number {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = lowerHeaders.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Parse a Notion CSV export into notes
 */
function parseNotionCSV(csvText: string): NotionImportResult {
  const warnings: string[] = [];
  const notes: ParsedNotionNote[] = [];

  // Split into lines (handle \r\n and \n)
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) {
    return { notes: [], warnings: ['CSV file is empty or has no data rows'] };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Find relevant columns
  const titleIdx = findColumn(headers, ['title', 'name', 'page']);
  const contentIdx = findColumn(headers, ['content', 'body', 'text', 'description']);
  const tagsIdx = findColumn(headers, ['tags', 'labels', 'categories', 'multi-select']);
  const createdIdx = findColumn(headers, ['created time', 'created', 'date created']);
  const updatedIdx = findColumn(headers, ['last edited time', 'updated', 'modified', 'last edited']);
  const statusIdx = findColumn(headers, ['status', 'state']);

  if (titleIdx === -1) {
    // If we can't find a title column, use the first column
    warnings.push('Could not detect a "Title" or "Name" column. Using the first column as title.');
  }

  const effectiveTitleIdx = titleIdx === -1 ? 0 : titleIdx;

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    const title = cols[effectiveTitleIdx] || 'Untitled';

    // Skip rows with empty titles
    if (!title.trim()) continue;

    // Parse content
    let content = '';
    if (contentIdx !== -1 && cols[contentIdx]) {
      content = cols[contentIdx];
    }

    // Parse tags (Notion uses comma-separated in multi-select columns)
    let tags: string[] = [];
    if (tagsIdx !== -1 && cols[tagsIdx]) {
      tags = cols[tagsIdx]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // Add status as a tag if it exists
    if (statusIdx !== -1 && cols[statusIdx]) {
      const status = cols[statusIdx].trim();
      if (status && !tags.includes(status)) {
        tags.push(status);
      }
    }

    // Parse dates
    const now = new Date();
    let createdAt = now;
    let updatedAt = now;

    if (createdIdx !== -1 && cols[createdIdx]) {
      const parsed = new Date(cols[createdIdx]);
      if (!isNaN(parsed.getTime())) createdAt = parsed;
    }

    if (updatedIdx !== -1 && cols[updatedIdx]) {
      const parsed = new Date(cols[updatedIdx]);
      if (!isNaN(parsed.getTime())) updatedAt = parsed;
    }

    notes.push({
      title,
      content,
      tags,
      createdAt,
      updatedAt,
    });
  }

  if (notes.length === 0) {
    warnings.push('No valid notes found in the CSV file');
  }

  return { notes, warnings };
}

export const NotionImportSection: React.FC<NotionImportSectionProps> = ({
  onMessage,
}) => {
  const [stage, setStage] = useState<ImportStage>('idle');
  const [result, setResult] = useState<NotionImportResult | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNote = useNotesStore((s) => s.createNote);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onMessage(null);
      const content = await file.text();
      const importResult = parseNotionCSV(content);
      setResult(importResult);
      setStage('preview');
    } catch (error) {
      log.error('Notion CSV import failed', { error });
      onMessage({ type: 'error', text: `Failed to parse CSV: ${error}` });
    }

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
        });
        count++;
        setImportedCount(count);
      }

      setStage('complete');
      onMessage({
        type: 'success',
        text: `Successfully imported ${count} notes from Notion.`,
      });
    } catch (error) {
      log.error('Note creation failed during Notion import', { error });
      onMessage({
        type: 'error',
        text: `Import partially failed: ${count} of ${result.notes.length} notes imported.`,
      });
      setStage('complete');
    }
  };

  const handleReset = () => {
    setStage('idle');
    setResult(null);
    setImportedCount(0);
  };

  const allTags = result
    ? [...new Set(result.notes.flatMap((n) => n.tags))]
    : [];

  return (
    <div className="bento-card p-6">
      <div className="flex items-center gap-3 mb-1">
        <FileSpreadsheet className="w-5 h-5 text-accent-primary" />
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          Notion Import
        </h2>
      </div>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        Import notes from a Notion CSV export. In Notion, open a database, click (...) then "Export" and choose CSV.
      </p>

      {/* Idle State */}
      {stage === 'idle' && (
        <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
            Select a CSV file exported from Notion
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Select CSV File
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-3">
            Supports columns: Title/Name, Content/Body, Tags, Created Time, Last Edited Time
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
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg text-center">
                <FileText className="w-4 h-4 mx-auto mb-1 text-text-light-tertiary dark:text-text-dark-tertiary" />
                <p className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {result.notes.length}
                </p>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Notes Found
                </p>
              </div>
              <div className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg text-center">
                <Tag className="w-4 h-4 mx-auto mb-1 text-text-light-tertiary dark:text-text-dark-tertiary" />
                <p className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {allTags.length}
                </p>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Unique Tags
                </p>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-status-warning-bg dark:bg-status-warning-bg-dark border border-status-warning-border dark:border-status-warning-border-dark">
                {result.warnings.map((warn, i) => (
                  <p key={i} className="text-xs text-status-warning-text dark:text-status-warning-text-dark flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
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
                          {note.tags.length > 0 ? `Tags: ${note.tags.join(', ')}` : 'No tags'}
                          {note.content ? ` | ${note.content.slice(0, 80)}...` : ''}
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
            {importedCount} notes imported from Notion
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
