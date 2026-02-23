/**
 * Auto Backup Service
 *
 * Uses File System Access API to save .brain backups to a user-selected folder.
 * Falls back to download prompts for browsers without File System Access support.
 * Stores directory handle in IndexedDB for persistence across sessions.
 */

import { logger } from '../logger';
import { indexedDBService } from '../indexedDB';
import { BUILD_HASH, BUILD_TIMESTAMP } from '../../utils/buildInfo';

const log = logger.module('AutoBackup');

const AUTO_BACKUP_DB_KEY = 'auto-backup-config';
const BACKUP_HANDLE_DB_KEY = 'auto-backup-folder-handle';

export interface AutoBackupConfig {
  enabled: boolean;
  frequencyMinutes: number; // How often to backup (in minutes)
  maxBackups: number; // Keep last N backups
  lastBackupTime: string | null; // ISO timestamp
  lastBackupFilename: string | null;
}

const DEFAULT_CONFIG: AutoBackupConfig = {
  enabled: false,
  frequencyMinutes: 60, // Every hour
  maxBackups: 5,
  lastBackupTime: null,
  lastBackupFilename: null,
};

/**
 * Check if File System Access API is available
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Load auto-backup configuration from IndexedDB
 */
export async function loadAutoBackupConfig(): Promise<AutoBackupConfig> {
  try {
    const stored = await indexedDBService.getItem(AUTO_BACKUP_DB_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (err) {
    log.warn('Failed to load auto-backup config', { error: err });
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save auto-backup configuration to IndexedDB
 */
export async function saveAutoBackupConfig(config: AutoBackupConfig): Promise<void> {
  try {
    await indexedDBService.setItem(AUTO_BACKUP_DB_KEY, JSON.stringify(config));
  } catch (err) {
    log.error('Failed to save auto-backup config', { error: err });
  }
}

/**
 * Prompt user to select a backup folder using File System Access API
 * Returns true if folder was selected and handle stored
 */
export async function selectBackupFolder(): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    return false;
  }

  try {
    // showDirectoryPicker is available (checked above)
    const dirHandle = await (window as unknown as { showDirectoryPicker: (opts?: Record<string, unknown>) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });

    // Store the handle in IndexedDB for persistence
    await storeFolderHandle(dirHandle);
    log.info('Backup folder selected', { name: dirHandle.name });
    return true;
  } catch (err) {
    // User cancelled the picker
    if (err instanceof Error && err.name === 'AbortError') {
      return false;
    }
    log.error('Failed to select backup folder', { error: err });
    return false;
  }
}

/**
 * Store directory handle in IndexedDB
 */
async function storeFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  // IndexedDB can store FileSystemDirectoryHandle objects directly
  const db = await openHandleDB();
  const tx = db.transaction('handles', 'readwrite');
  const store = tx.objectStore('handles');
  store.put(handle, BACKUP_HANDLE_DB_KEY);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/**
 * Retrieve stored directory handle from IndexedDB
 */
async function getStoredFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readonly');
    const store = tx.objectStore('handles');
    const request = store.get(BACKUP_HANDLE_DB_KEY);

    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

/**
 * Open dedicated IndexedDB for storing file handles
 * (handles cannot be serialized to JSON, need native IDB storage)
 */
function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('neumanos-file-handles', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get the name of the stored backup folder (for display)
 */
export async function getBackupFolderName(): Promise<string | null> {
  const handle = await getStoredFolderHandle();
  return handle?.name || null;
}

/**
 * Verify we still have permission to write to the backup folder
 */
async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const opts = { mode: 'readwrite' as const };
    // Check if permission is already granted
    if (await (handle as unknown as { queryPermission: (opts: { mode: string }) => Promise<string> }).queryPermission(opts) === 'granted') {
      return true;
    }
    // Request permission
    if (await (handle as unknown as { requestPermission: (opts: { mode: string }) => Promise<string> }).requestPermission(opts) === 'granted') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Create a .brain backup file content from all IndexedDB data
 */
async function createBackupContent(): Promise<string> {
  const allData = await indexedDBService.getAllData();
  const exportPackage = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    appBuild: BUILD_HASH,
    appBuildTimestamp: BUILD_TIMESTAMP,
    exportType: 'auto-backup',
    compressed: false,
    data: allData,
  };
  return JSON.stringify(exportPackage);
}

/**
 * Run an auto-backup to the stored folder
 * Returns the filename on success, null on failure
 */
export async function runAutoBackup(): Promise<string | null> {
  const handle = await getStoredFolderHandle();
  if (!handle) {
    log.warn('No backup folder configured');
    return null;
  }

  const hasPermission = await verifyPermission(handle);
  if (!hasPermission) {
    log.warn('No write permission to backup folder');
    return null;
  }

  try {
    const content = await createBackupContent();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `NeumanOS-auto-${timestamp}.brain`;

    // Write backup file
    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();

    // Compress with gzip
    const blob = new Blob([content]);
    const compressedStream = blob.stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBlob = await new Response(compressedStream).blob();
    await writable.write(compressedBlob);
    await writable.close();

    // Update config with last backup time
    const config = await loadAutoBackupConfig();
    config.lastBackupTime = new Date().toISOString();
    config.lastBackupFilename = filename;
    await saveAutoBackupConfig(config);

    // Clean up old backups
    await cleanupOldBackups(handle, config.maxBackups);

    log.info('Auto backup complete', { filename });
    return filename;
  } catch (err) {
    log.error('Auto backup failed', { error: err });
    return null;
  }
}

/**
 * Remove old backup files, keeping only the most recent N
 */
async function cleanupOldBackups(
  dirHandle: FileSystemDirectoryHandle,
  maxBackups: number
): Promise<void> {
  try {
    const backupFiles: string[] = [];

    // Use entries() which has broader type support
    for await (const [name, entry] of (dirHandle as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
      if (entry.kind === 'file' && name.startsWith('NeumanOS-auto-') && name.endsWith('.brain')) {
        backupFiles.push(name);
      }
    }

    // Sort by name (which includes timestamp, so lexicographic = chronological)
    backupFiles.sort();

    // Remove oldest files if we exceed maxBackups
    const toRemove = backupFiles.slice(0, Math.max(0, backupFiles.length - maxBackups));
    for (const filename of toRemove) {
      await dirHandle.removeEntry(filename);
      log.info('Removed old backup', { filename });
    }
  } catch (err) {
    log.warn('Failed to cleanup old backups', { error: err });
  }
}

/**
 * Trigger a manual download backup (fallback for browsers without File System Access)
 */
export async function downloadBackup(): Promise<string | null> {
  try {
    const content = await createBackupContent();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `NeumanOS-backup-${timestamp}.brain`;

    // Compress
    const blob = new Blob([content]);
    const compressedStream = blob.stream().pipeThrough(new CompressionStream('gzip'));
    const compressedBlob = await new Response(compressedStream).blob();

    // Download
    const url = URL.createObjectURL(compressedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return filename;
  } catch (err) {
    log.error('Download backup failed', { error: err });
    return null;
  }
}

/**
 * Check if a backup is due based on configuration
 */
export async function isBackupDue(): Promise<boolean> {
  const config = await loadAutoBackupConfig();
  if (!config.enabled) return false;

  if (!config.lastBackupTime) return true;

  const lastBackup = new Date(config.lastBackupTime).getTime();
  const now = Date.now();
  const intervalMs = config.frequencyMinutes * 60 * 1000;

  return (now - lastBackup) >= intervalMs;
}

/**
 * Clear the stored backup folder handle
 */
export async function clearBackupFolder(): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    const store = tx.objectStore('handles');
    store.delete(BACKUP_HANDLE_DB_KEY);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    log.warn('Failed to clear backup folder handle', { error: err });
  }
}
