/**
 * Import/Export Panel
 *
 * Comprehensive settings panel for data import, export, and automated backups.
 * Supports: Notion ZIP, Obsidian vault, Todoist CSV imports;
 * per-module exports (Markdown, CSV, ICS); and automated backups.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  FolderOpen,
  FileText,
  CheckSquare,
  Calendar,
  Clock,
  BarChart3,
  Check,
  AlertTriangle,
  HardDrive,
  RefreshCw,
  Trash2,
  Archive,
} from 'lucide-react';
import {
  importNotionZip,
  importNotionFiles,
  type ParsedNotionEntry,
  type NotionImportProgress,
} from '../../services/import/notionImporter';
import {
  importObsidianVault,
  collectFolderPaths as collectObsidianFolders,
  remapWikiLinks as remapObsidianLinks,
  type ParsedObsidianNote,
  type ObsidianImportProgress,
} from '../../services/import/obsidianImporter';
import {
  parseTodoistCSV,
  type ParsedTodoistTask,
} from '../../services/import/todoistImporter';
import {
  exportNotesAsMarkdown,
  exportTasksAsCSV,
  exportCalendarAsICS,
  exportTimeEntriesAsCSV,
  exportHabitsAsCSV,
} from '../../services/export/moduleExporter';
import {
  loadAutoBackupConfig,
  saveAutoBackupConfig,
  selectBackupFolder,
  getBackupFolderName,
  runAutoBackup,
  clearBackupFolder,
  isFileSystemAccessSupported,
  downloadBackup,
  type AutoBackupConfig,
} from '../../services/backup/autoBackup';
import { useNotesStore } from '../../stores/useNotesStore';
import { useFoldersStore } from '../../stores/useFoldersStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { logger } from '../../services/logger';

const log = logger.module('ImportExportPanel');

interface MessageState {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

interface ImportExportPanelProps {
  onMessage: (message: MessageState | null) => void;
}

type ImportSource = 'notion' | 'obsidian' | 'todoist' | null;
type ImportStage = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ onMessage }) => {
  // Import state
  const [importSource, setImportSource] = useState<ImportSource>(null);
  const [importStage, setImportStage] = useState<ImportStage>('idle');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; file: string } | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  // Notion import state
  const [notionEntries, setNotionEntries] = useState<ParsedNotionEntry[]>([]);
  const [notionErrors, setNotionErrors] = useState<string[]>([]);

  // Obsidian import state
  const [obsidianNotes, setObsidianNotes] = useState<ParsedObsidianNote[]>([]);
  const [obsidianErrors, setObsidianErrors] = useState<string[]>([]);
  const [obsidianStats, setObsidianStats] = useState<{ wikiLinks: number; attachmentsSkipped: number }>({ wikiLinks: 0, attachmentsSkipped: 0 });

  // Todoist import state
  const [todoistTasks, setTodoistTasks] = useState<ParsedTodoistTask[]>([]);
  const [todoistErrors, setTodoistErrors] = useState<string[]>([]);
  const [todoistProjects, setTodoistProjects] = useState<string[]>([]);

  // Export state
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Backup state
  const [backupConfig, setBackupConfig] = useState<AutoBackupConfig | null>(null);
  const [backupFolderName, setBackupFolderName] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // File input refs
  const notionFileRef = useRef<HTMLInputElement>(null);
  const obsidianFolderRef = useRef<HTMLInputElement>(null);
  const todoistFileRef = useRef<HTMLInputElement>(null);

  // Store actions
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const createFolder = useFoldersStore((s) => s.createFolder);
  const folders = useFoldersStore((s) => s.folders);
  const addTask = useKanbanStore((s) => s.addTask);

  // Load backup config on mount
  useEffect(() => {
    loadAutoBackupConfig().then(setBackupConfig);
    getBackupFolderName().then(setBackupFolderName);
  }, []);

  const resetImport = useCallback(() => {
    setImportSource(null);
    setImportStage('idle');
    setImportProgress(null);
    setImportedCount(0);
    setNotionEntries([]);
    setNotionErrors([]);
    setObsidianNotes([]);
    setObsidianErrors([]);
    setObsidianStats({ wikiLinks: 0, attachmentsSkipped: 0 });
    setTodoistTasks([]);
    setTodoistErrors([]);
    setTodoistProjects([]);
  }, []);

  // --- NOTION IMPORT ---
  const handleNotionFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportSource('notion');
    setImportStage('parsing');
    onMessage(null);

    try {
      const file = files[0];
      let result;

      if (file.name.endsWith('.zip')) {
        result = await importNotionZip(file, (p: NotionImportProgress) => {
          setImportProgress({ current: p.current, total: p.total, file: p.currentFile });
        });
      } else {
        result = await importNotionFiles(files, (p: NotionImportProgress) => {
          setImportProgress({ current: p.current, total: p.total, file: p.currentFile });
        });
      }

      setNotionEntries(result.entries);
      setNotionErrors([...result.summary.errors, ...result.summary.warnings]);
      setImportStage('preview');
    } catch (err) {
      log.error('Notion import parsing failed', { error: err });
      onMessage({ type: 'error', text: `Failed to parse Notion export: ${err}` });
      setImportStage('idle');
      setImportSource(null);
    }

    if (notionFileRef.current) notionFileRef.current.value = '';
  };

  const handleNotionConfirmImport = async () => {
    setImportStage('importing');
    let count = 0;

    try {
      const noteEntries = notionEntries.filter((e) => e.type === 'note');
      const taskEntries = notionEntries.filter((e) => e.type === 'task');

      // Create folders from note paths
      const folderPathMap = new Map<string, string>();
      const folderPaths = new Set<string>();
      for (const entry of noteEntries) {
        if (entry.folderPath) {
          const parts = entry.folderPath.split('/');
          for (let i = 1; i <= parts.length; i++) {
            folderPaths.add(parts.slice(0, i).join('/'));
          }
        }
      }

      for (const path of [...folderPaths].sort()) {
        const parts = path.split('/');
        const name = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');
        const parentId = parentPath ? folderPathMap.get(parentPath) ?? null : null;

        const existing = Object.values(folders).find((f) => f.name === name && f.parentId === parentId);
        if (existing) {
          folderPathMap.set(path, existing.id);
        } else {
          const newFolder = createFolder({ name, parentId });
          folderPathMap.set(path, newFolder.id);
        }
      }

      // Create notes
      for (const entry of noteEntries) {
        const folderId = entry.folderPath ? folderPathMap.get(entry.folderPath) ?? null : null;
        createNote({
          title: entry.title,
          contentText: entry.content,
          tags: entry.tags,
          folderId,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        });
        count++;
        setImportedCount(count);
      }

      // Create tasks
      for (const entry of taskEntries) {
        const statusMap: Record<string, 'backlog' | 'todo' | 'inprogress' | 'review' | 'done'> = {
          'not started': 'todo',
          'in progress': 'inprogress',
          'done': 'done',
          'complete': 'done',
          'completed': 'done',
        };
        const status = entry.status
          ? statusMap[entry.status.toLowerCase()] || 'todo'
          : 'todo';

        addTask({
          title: entry.title,
          description: entry.content,
          status,
          priority: entry.priority || 'medium',
          tags: entry.tags,
          dueDate: entry.dueDate || null,
          startDate: null,
          projectIds: [],
        });
        count++;
        setImportedCount(count);
      }

      setImportStage('complete');
      onMessage({
        type: 'success',
        text: `Imported ${noteEntries.length} notes and ${taskEntries.length} tasks from Notion.`,
      });
    } catch (err) {
      log.error('Notion import failed during creation', { error: err });
      onMessage({
        type: 'error',
        text: `Import partially failed: ${count} items imported. Error: ${err}`,
      });
      setImportStage('complete');
    }
  };

  // --- OBSIDIAN IMPORT ---
  const handleObsidianFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportSource('obsidian');
    setImportStage('parsing');
    onMessage(null);

    try {
      const result = await importObsidianVault(files, (p: ObsidianImportProgress) => {
        setImportProgress({ current: p.current, total: p.total, file: p.currentFile });
      });

      setObsidianNotes(result.notes);
      setObsidianErrors([...result.summary.errors, ...result.summary.warnings]);
      setObsidianStats({
        wikiLinks: result.summary.wikiLinksFound,
        attachmentsSkipped: result.summary.attachmentsSkipped,
      });
      setImportStage('preview');
    } catch (err) {
      log.error('Obsidian import parsing failed', { error: err });
      onMessage({ type: 'error', text: `Failed to parse Obsidian vault: ${err}` });
      setImportStage('idle');
      setImportSource(null);
    }

    if (obsidianFolderRef.current) obsidianFolderRef.current.value = '';
  };

  const handleObsidianConfirmImport = async () => {
    setImportStage('importing');
    let count = 0;

    try {
      // Create folder hierarchy
      const folderPaths = collectObsidianFolders(obsidianNotes);
      const pathToFolderIdMap = new Map<string, string>();

      for (const path of folderPaths) {
        const parts = path.split('/');
        const name = parts[parts.length - 1];
        const parentPath = parts.slice(0, -1).join('/');
        const parentId = parentPath ? pathToFolderIdMap.get(parentPath) ?? null : null;

        const existing = Object.values(folders).find((f) => f.name === name && f.parentId === parentId);
        if (existing) {
          pathToFolderIdMap.set(path, existing.id);
        } else {
          const newFolder = createFolder({ name, parentId });
          pathToFolderIdMap.set(path, newFolder.id);
        }
      }

      // Create notes
      const titleToIdMap = new Map<string, string>();
      for (const note of obsidianNotes) {
        const folderId = note.folderPath ? pathToFolderIdMap.get(note.folderPath) ?? null : null;
        const newNote = createNote({
          title: note.title,
          contentText: note.content,
          tags: note.tags,
          folderId,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        });
        titleToIdMap.set(note.title.toLowerCase(), newNote.id);
        count++;
        setImportedCount(count);
      }

      // Remap wiki-links
      const linkedNotesMap = remapObsidianLinks(obsidianNotes, titleToIdMap);
      linkedNotesMap.forEach((linkedNoteIds, noteTitle) => {
        const noteId = titleToIdMap.get(noteTitle.toLowerCase());
        if (noteId) {
          updateNote(noteId, { linkedNotes: linkedNoteIds });
        }
      });

      setImportStage('complete');
      onMessage({
        type: 'success',
        text: `Imported ${count} notes, ${folderPaths.length} folders, ${linkedNotesMap.size} wiki-links remapped from Obsidian.`,
      });
    } catch (err) {
      log.error('Obsidian import failed during creation', { error: err });
      onMessage({
        type: 'error',
        text: `Import partially failed: ${count} notes imported. Error: ${err}`,
      });
      setImportStage('complete');
    }
  };

  // --- TODOIST IMPORT ---
  const handleTodoistFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSource('todoist');
    setImportStage('parsing');
    onMessage(null);

    try {
      const text = await file.text();
      const result = parseTodoistCSV(text);

      setTodoistTasks(result.tasks);
      setTodoistErrors([...result.summary.errors, ...result.summary.warnings]);
      setTodoistProjects(result.summary.projectsDetected);
      setImportStage('preview');
    } catch (err) {
      log.error('Todoist import parsing failed', { error: err });
      onMessage({ type: 'error', text: `Failed to parse Todoist CSV: ${err}` });
      setImportStage('idle');
      setImportSource(null);
    }

    if (todoistFileRef.current) todoistFileRef.current.value = '';
  };

  const handleTodoistConfirmImport = async () => {
    setImportStage('importing');
    let count = 0;

    try {
      for (const task of todoistTasks) {
        addTask({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          tags: task.tags,
          dueDate: task.dueDate,
          startDate: null,
          projectIds: [],
        });
        count++;
        setImportedCount(count);
      }

      setImportStage('complete');
      onMessage({
        type: 'success',
        text: `Imported ${count} tasks from Todoist.`,
      });
    } catch (err) {
      log.error('Todoist import failed during creation', { error: err });
      onMessage({
        type: 'error',
        text: `Import partially failed: ${count} of ${todoistTasks.length} tasks imported. Error: ${err}`,
      });
      setImportStage('complete');
    }
  };

  // --- EXPORT HANDLERS ---
  const handleExport = async (type: string, exportFn: () => Promise<{ filename: string }> | { filename: string }) => {
    try {
      setIsExporting(type);
      onMessage(null);
      const result = await exportFn();
      onMessage({ type: 'success', text: `Exported to ${result.filename}` });
    } catch (err) {
      log.error(`Export failed: ${type}`, { error: err });
      onMessage({ type: 'error', text: `Export failed: ${err}` });
    } finally {
      setIsExporting(null);
    }
  };

  // --- BACKUP HANDLERS ---
  const handleSelectBackupFolder = async () => {
    const selected = await selectBackupFolder();
    if (selected) {
      const name = await getBackupFolderName();
      setBackupFolderName(name);
      onMessage({ type: 'success', text: `Backup folder set to: ${name}` });
    }
  };

  const handleRunBackup = async () => {
    setIsBackingUp(true);
    try {
      if (isFileSystemAccessSupported() && backupFolderName) {
        const filename = await runAutoBackup();
        if (filename) {
          onMessage({ type: 'success', text: `Backup saved: ${filename}` });
          const config = await loadAutoBackupConfig();
          setBackupConfig(config);
        } else {
          onMessage({ type: 'warning', text: 'Backup failed. You may need to re-select the backup folder.' });
        }
      } else {
        const filename = await downloadBackup();
        if (filename) {
          onMessage({ type: 'success', text: `Backup downloaded: ${filename}` });
        }
      }
    } catch (err) {
      onMessage({ type: 'error', text: `Backup failed: ${err}` });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleClearBackupFolder = async () => {
    await clearBackupFolder();
    setBackupFolderName(null);
    if (backupConfig) {
      const updated = { ...backupConfig, enabled: false };
      await saveAutoBackupConfig(updated);
      setBackupConfig(updated);
    }
    onMessage({ type: 'info', text: 'Backup folder cleared.' });
  };

  const handleUpdateBackupConfig = async (updates: Partial<AutoBackupConfig>) => {
    if (!backupConfig) return;
    const updated = { ...backupConfig, ...updates };
    await saveAutoBackupConfig(updated);
    setBackupConfig(updated);
  };

  // Determine total items for import
  const totalImportItems = importSource === 'notion'
    ? notionEntries.length
    : importSource === 'obsidian'
      ? obsidianNotes.length
      : todoistTasks.length;

  return (
    <div className="space-y-6">
      {/* IMPORT SECTION */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <Upload className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Import Data
          </h2>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
          Import notes and tasks from other productivity tools.
        </p>

        {/* Import Source Selection (when idle) */}
        {importStage === 'idle' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Notion Import */}
            <label className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:border-accent-primary/50 cursor-pointer transition-colors text-center">
              <Archive className="w-8 h-8 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <div>
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Notion</p>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
                  ZIP or CSV export
                </p>
              </div>
              <input
                ref={notionFileRef}
                type="file"
                accept=".zip,.csv,.md"
                multiple
                className="hidden"
                onChange={handleNotionFileSelect}
              />
            </label>

            {/* Obsidian Import */}
            <label className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:border-accent-primary/50 cursor-pointer transition-colors text-center">
              <FolderOpen className="w-8 h-8 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <div>
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Obsidian</p>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
                  Vault folder (.md files)
                </p>
              </div>
              <input
                ref={obsidianFolderRef}
                type="file"
                // @ts-expect-error - webkitdirectory is non-standard
                webkitdirectory=""
                multiple
                className="hidden"
                onChange={handleObsidianFolderSelect}
              />
            </label>

            {/* Todoist Import */}
            <label className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:border-accent-primary/50 cursor-pointer transition-colors text-center">
              <CheckSquare className="w-8 h-8 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <div>
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">Todoist</p>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
                  CSV export
                </p>
              </div>
              <input
                ref={todoistFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleTodoistFileSelect}
              />
            </label>
          </div>
        )}

        {/* Parsing State */}
        {importStage === 'parsing' && importProgress && (
          <div className="text-center py-8">
            <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-2 mb-4 overflow-hidden">
              <motion.div
                className="h-2 rounded-full bg-accent-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Parsing {importProgress.current} of {importProgress.total} files...
            </p>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1 truncate">
              {importProgress.file}
            </p>
          </div>
        )}

        {/* Preview State */}
        <AnimatePresence>
          {importStage === 'preview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Notion Preview */}
              {importSource === 'notion' && (
                <ImportPreview
                  title="Notion Import Preview"
                  stats={[
                    { label: 'Notes', value: notionEntries.filter((e) => e.type === 'note').length, icon: FileText },
                    { label: 'Tasks', value: notionEntries.filter((e) => e.type === 'task').length, icon: CheckSquare },
                  ]}
                  errors={notionErrors}
                  samples={notionEntries.slice(0, 5).map((e) => ({
                    title: e.title,
                    subtitle: `${e.type} ${e.tags.length > 0 ? `| Tags: ${e.tags.join(', ')}` : ''}`,
                  }))}
                  totalItems={notionEntries.length}
                  onConfirm={handleNotionConfirmImport}
                  onCancel={resetImport}
                  confirmLabel={`Import ${notionEntries.length} Items`}
                />
              )}

              {/* Obsidian Preview */}
              {importSource === 'obsidian' && (
                <ImportPreview
                  title="Obsidian Import Preview"
                  stats={[
                    { label: 'Notes', value: obsidianNotes.length, icon: FileText },
                    { label: 'Wiki Links', value: obsidianStats.wikiLinks, icon: FileText },
                    { label: 'Attachments Skipped', value: obsidianStats.attachmentsSkipped, icon: FileText },
                  ]}
                  errors={obsidianErrors}
                  samples={obsidianNotes.slice(0, 5).map((n) => ({
                    title: n.title,
                    subtitle: `${n.folderPath || 'Root'} ${n.tags.length > 0 ? `| Tags: ${n.tags.join(', ')}` : ''}`,
                  }))}
                  totalItems={obsidianNotes.length}
                  onConfirm={handleObsidianConfirmImport}
                  onCancel={resetImport}
                  confirmLabel={`Import ${obsidianNotes.length} Notes`}
                />
              )}

              {/* Todoist Preview */}
              {importSource === 'todoist' && (
                <ImportPreview
                  title="Todoist Import Preview"
                  stats={[
                    { label: 'Tasks', value: todoistTasks.length, icon: CheckSquare },
                    { label: 'Projects', value: todoistProjects.length, icon: FolderOpen },
                  ]}
                  errors={todoistErrors}
                  samples={todoistTasks.slice(0, 5).map((t) => ({
                    title: t.title,
                    subtitle: `${t.priority} priority ${t.projectName ? `| ${t.projectName}` : ''} ${t.dueDate ? `| Due: ${t.dueDate}` : ''}`,
                  }))}
                  totalItems={todoistTasks.length}
                  onConfirm={handleTodoistConfirmImport}
                  onCancel={resetImport}
                  confirmLabel={`Import ${todoistTasks.length} Tasks`}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Importing State */}
        {importStage === 'importing' && (
          <div className="text-center py-8">
            <div className="w-full bg-border-light dark:bg-border-dark rounded-full h-2 mb-4 overflow-hidden">
              <motion.div
                className="h-2 rounded-full bg-accent-green"
                initial={{ width: 0 }}
                animate={{ width: `${(importedCount / Math.max(totalImportItems, 1)) * 100}%` }}
              />
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Creating item {importedCount} of {totalImportItems}...
            </p>
          </div>
        )}

        {/* Complete State */}
        {importStage === 'complete' && (
          <div className="text-center py-8">
            <Check className="w-12 h-12 mx-auto mb-4 text-accent-green" />
            <p className="text-sm text-text-light-primary dark:text-text-dark-primary font-medium mb-2">
              Import Complete
            </p>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
              {importedCount} items imported successfully
            </p>
            <button
              onClick={resetImport}
              className="px-4 py-2.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark"
            >
              Import More
            </button>
          </div>
        )}
      </div>

      {/* EXPORT SECTION */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <Download className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Export by Module
          </h2>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
          Export individual modules in standard formats for use with other tools.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ExportButton
            icon={FileText}
            label="Notes"
            format="Markdown ZIP"
            isExporting={isExporting === 'notes'}
            onClick={() => handleExport('notes', exportNotesAsMarkdown)}
          />
          <ExportButton
            icon={CheckSquare}
            label="Tasks"
            format="CSV"
            isExporting={isExporting === 'tasks'}
            onClick={() => handleExport('tasks', () => exportTasksAsCSV())}
          />
          <ExportButton
            icon={Calendar}
            label="Calendar"
            format="ICS"
            isExporting={isExporting === 'calendar'}
            onClick={() => handleExport('calendar', () => exportCalendarAsICS())}
          />
          <ExportButton
            icon={Clock}
            label="Time Entries"
            format="CSV"
            isExporting={isExporting === 'time'}
            onClick={() => handleExport('time', () => exportTimeEntriesAsCSV())}
          />
          <ExportButton
            icon={BarChart3}
            label="Habits"
            format="CSV"
            isExporting={isExporting === 'habits'}
            onClick={() => handleExport('habits', () => exportHabitsAsCSV())}
          />
        </div>
      </div>

      {/* AUTO BACKUP SECTION */}
      <div className="bento-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <HardDrive className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Automated Backups
          </h2>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
          {isFileSystemAccessSupported()
            ? 'Automatically save backups to a folder on your computer.'
            : 'Your browser does not support folder selection. Use the download button for manual backups.'}
        </p>

        {/* Backup Folder Selection */}
        {isFileSystemAccessSupported() && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">Backup Folder</p>
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {backupFolderName || 'Not configured'}
                </p>
              </div>
              <button
                onClick={handleSelectBackupFolder}
                className="px-4 py-2.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              {backupFolderName && (
                <button
                  onClick={handleClearBackupFolder}
                  className="px-4 py-2.5 text-status-error hover:bg-status-error-bg dark:hover:bg-status-error-bg-dark rounded-lg transition-colors"
                  title="Clear backup folder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Backup Frequency */}
            {backupConfig && backupFolderName && (
              <div className="space-y-4">
                {/* Enable toggle */}
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                    Enable automatic backups
                  </span>
                  <input
                    type="checkbox"
                    checked={backupConfig.enabled}
                    onChange={(e) => handleUpdateBackupConfig({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-primary focus:ring-accent-primary"
                  />
                </label>

                {/* Frequency */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Backup every
                  </span>
                  <select
                    value={backupConfig.frequencyMinutes}
                    onChange={(e) => handleUpdateBackupConfig({ frequencyMinutes: parseInt(e.target.value, 10) })}
                    className="px-3 py-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="360">6 hours</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>

                {/* Max backups */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Keep last
                  </span>
                  <select
                    value={backupConfig.maxBackups}
                    onChange={(e) => handleUpdateBackupConfig({ maxBackups: parseInt(e.target.value, 10) })}
                    className="px-3 py-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary"
                  >
                    <option value="3">3 backups</option>
                    <option value="5">5 backups</option>
                    <option value="10">10 backups</option>
                    <option value="20">20 backups</option>
                  </select>
                </div>

                {/* Last backup info */}
                {backupConfig.lastBackupTime && (
                  <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                    Last backup: {new Date(backupConfig.lastBackupTime).toLocaleString()}
                    {backupConfig.lastBackupFilename && ` (${backupConfig.lastBackupFilename})`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Backup Button */}
        <button
          onClick={handleRunBackup}
          disabled={isBackingUp}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isBackingUp ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isBackingUp
            ? 'Backing up...'
            : isFileSystemAccessSupported() && backupFolderName
              ? 'Backup Now'
              : 'Download Backup'}
        </button>
      </div>
    </div>
  );
};

// --- Sub-components ---

interface ImportPreviewProps {
  title: string;
  stats: Array<{ label: string; value: number; icon: React.FC<{ className?: string }> }>;
  errors: string[];
  samples: Array<{ title: string; subtitle: string }>;
  totalItems: number;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({
  title,
  stats,
  errors,
  samples,
  totalItems,
  onConfirm,
  onCancel,
  confirmLabel,
}) => (
  <div>
    <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
      {title}
    </h3>

    {/* Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg text-center">
            <Icon className="w-4 h-4 mx-auto mb-1 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <p className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">{stat.value}</p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{stat.label}</p>
          </div>
        );
      })}
    </div>

    {/* Errors/Warnings */}
    {errors.length > 0 && (
      <div className="mb-4 p-3 rounded-lg bg-status-warning-bg dark:bg-status-warning-bg-dark border border-status-warning-border dark:border-status-warning-border-dark">
        {errors.map((err, i) => (
          <p key={i} className="text-xs text-status-warning-text dark:text-status-warning-text-dark flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {err}
          </p>
        ))}
      </div>
    )}

    {/* Samples */}
    {samples.length > 0 && (
      <div className="mb-6">
        <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          Sample Items (first {Math.min(samples.length, 5)})
        </h4>
        <div className="space-y-2">
          {samples.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
              <FileText className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">{item.title}</p>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary truncate">{item.subtitle}</p>
              </div>
            </div>
          ))}
          {totalItems > 5 && (
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary text-center">
              ...and {totalItems - 5} more
            </p>
          )}
        </div>
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-3">
      <button
        onClick={onConfirm}
        disabled={totalItems === 0}
        className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        <Check className="w-4 h-4" />
        {confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2.5 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark"
      >
        Cancel
      </button>
    </div>
  </div>
);

interface ExportButtonProps {
  icon: React.FC<{ className?: string }>;
  label: string;
  format: string;
  isExporting: boolean;
  onClick: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ icon: Icon, label, format, isExporting, onClick }) => (
  <button
    onClick={onClick}
    disabled={isExporting}
    className="flex items-center gap-3 px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg transition-colors border border-transparent hover:border-border-light dark:hover:border-border-dark disabled:opacity-50 text-left"
  >
    <Icon className="w-5 h-5 text-accent-primary flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">{label}</p>
      <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">{format}</p>
    </div>
    {isExporting ? (
      <RefreshCw className="w-4 h-4 animate-spin text-text-light-tertiary dark:text-text-dark-tertiary" />
    ) : (
      <Download className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
    )}
  </button>
);
