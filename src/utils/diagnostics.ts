/**
 * Diagnostic Reporting Utility
 * Collects system information, app state, storage stats, and performance metrics
 * for troubleshooting without compromising user privacy.
 *
 * Privacy-safe: NO PII, NO user content, only counts and stats
 */

import { indexedDBService } from '../services/indexedDB';
import { logger } from '../services/logger';
import { BUILD_HASH, BUILD_TIMESTAMP, formatBuildTimestamp } from './buildInfo';

const log = logger.module('Diagnostics');

/** Non-standard Navigator APIs available in some browsers */
interface NavigatorWithExtensions extends Navigator {
  deviceMemory?: number;
  connection?: { effectiveType?: string; downlink?: number; rtt?: number };
}

/** PerformanceTiming with numeric indexing for load metrics */
interface PerformanceTimingData {
  loadEventEnd: number;
  navigationStart: number;
}

/** Largest Contentful Paint entry */
interface LargestContentfulPaintEntry extends PerformanceEntry {
  renderTime: number;
}

/** First Input Delay entry */
interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

/**
 * Diagnostic report structure
 */
export interface DiagnosticReport {
  generated: string;
  system: SystemInfo;
  app: AppState;
  storage: StorageStatistics;
  errors: ErrorLog[];
  performance: PerformanceMetrics;
}

interface SystemInfo {
  browser: {
    name: string;
    version: string;
    userAgent: string;
  };
  os: {
    platform: string;
    language: string;
    timezone: string;
  };
  screen: {
    resolution: string;
    colorDepth: number;
    pixelRatio: number;
  };
  memory?: string;
  connection?: string;
}

interface AppState {
  build: string;
  buildTimestamp: string;
  buildDate: string; // Localized for display
  installDate?: string;
  lastBackupDate?: string;
  activeWidgets?: number;
  enabledFeatures?: string[];
}

interface StorageStatistics {
  indexedDBUsage: string;
  indexedDBQuota: string;
  percentUsed: string;
  notesCount: number;
  tasksCount: number;
  eventsCount: number;
  timeEntriesCount: number;
  foldersCount: number;
  tagsCount: number;
}

interface ErrorLog {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
}

interface PerformanceMetrics {
  pageLoadTime?: string;
  timeToInteractive?: string;
  largestContentfulPaint?: string;
  firstInputDelay?: string;
}

/**
 * Get comprehensive diagnostic report
 */
export async function getDiagnosticReport(): Promise<DiagnosticReport> {
  log.info('Generating diagnostic report');

  const report: DiagnosticReport = {
    generated: new Date().toISOString(),
    system: await getSystemInfo(),
    app: await getAppState(),
    storage: await getStorageStatistics(),
    errors: await getErrorLogs(),
    performance: getPerformanceMetrics(),
  };

  log.info('Diagnostic report generated', { size: JSON.stringify(report).length });
  return report;
}

/**
 * Collect system information
 */
async function getSystemInfo(): Promise<SystemInfo> {
  // Browser detection
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (ua.includes('Chrome')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edg')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || 'Unknown';
  }

  // OS detection
  let platform = 'Unknown';
  if (ua.includes('Win')) platform = 'Windows';
  else if (ua.includes('Mac')) platform = 'macOS';
  else if (ua.includes('Linux')) platform = 'Linux';
  else if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('iOS')) platform = 'iOS';

  // Memory (if available)
  let memory: string | undefined;
  if ('deviceMemory' in navigator) {
    memory = `${(navigator as NavigatorWithExtensions).deviceMemory} GB`;
  }

  // Connection (if available)
  let connection: string | undefined;
  if ('connection' in navigator) {
    const conn = (navigator as NavigatorWithExtensions).connection;
    connection = conn?.effectiveType || 'Unknown';
  }

  return {
    browser: {
      name: browserName,
      version: browserVersion,
      userAgent: ua,
    },
    os: {
      platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    screen: {
      resolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
    },
    memory,
    connection,
  };
}

/**
 * Collect app state (version, last backup, etc.)
 */
async function getAppState(): Promise<AppState> {
  // Build info injected at build time via Vite
  const build = BUILD_HASH;
  const buildTimestamp = BUILD_TIMESTAMP;
  const buildDate = formatBuildTimestamp();

  // Get install date (if tracked in localStorage)
  let installDate: string | undefined;
  try {
    const saved = localStorage.getItem('app-install-date');
    if (saved) {
      installDate = new Date(parseInt(saved)).toISOString();
    }
  } catch (error) {
    log.warn('Failed to get install date', { error });
  }

  // Get last backup date
  let lastBackupDate: string | undefined;
  try {
    const backupHistory = localStorage.getItem('backup-history');
    if (backupHistory) {
      const history = JSON.parse(backupHistory);
      if (Array.isArray(history) && history.length > 0) {
        lastBackupDate = new Date(history[0].timestamp).toISOString();
      }
    }
  } catch (error) {
    log.warn('Failed to get last backup date', { error });
  }

  // Get active widgets count
  let activeWidgets: number | undefined;
  try {
    const widgets = localStorage.getItem('dashboard-widgets');
    if (widgets) {
      const parsed = JSON.parse(widgets);
      activeWidgets = Array.isArray(parsed) ? parsed.length : 0;
    }
  } catch (error) {
    log.warn('Failed to get active widgets', { error });
  }

  return {
    build,
    buildTimestamp,
    buildDate,
    installDate,
    lastBackupDate,
    activeWidgets,
  };
}

/**
 * Collect storage statistics (privacy-safe: counts only, no content)
 */
async function getStorageStatistics(): Promise<StorageStatistics> {
  // Get IndexedDB quota
  const quota = await indexedDBService.getQuota();

  // Count notes (privacy-safe: only count, no content)
  let notesCount = 0;
  try {
    const notesData = await indexedDBService.getItem('notes');
    if (notesData) {
      const notes = JSON.parse(notesData);
      notesCount = Array.isArray(notes) ? notes.length : 0;
    }
  } catch (error) {
    log.warn('Failed to count notes', { error });
  }

  // Count tasks
  let tasksCount = 0;
  try {
    const tasksData = await indexedDBService.getItem('tasks');
    if (tasksData) {
      const tasks = JSON.parse(tasksData);
      tasksCount = Array.isArray(tasks) ? tasks.length : 0;
    }
  } catch (error) {
    log.warn('Failed to count tasks', { error });
  }

  // Count events
  let eventsCount = 0;
  try {
    const eventsData = await indexedDBService.getItem('events');
    if (eventsData) {
      const events = JSON.parse(eventsData);
      eventsCount = Object.values(events).flat().length;
    }
  } catch (error) {
    log.warn('Failed to count events', { error });
  }

  // Count time entries
  let timeEntriesCount = 0;
  try {
    const timeEntriesData = await indexedDBService.getItem('timeEntries');
    if (timeEntriesData) {
      const timeEntries = JSON.parse(timeEntriesData);
      timeEntriesCount = Object.values(timeEntries).flat().length;
    }
  } catch (error) {
    log.warn('Failed to count time entries', { error });
  }

  // Count folders
  let foldersCount = 0;
  try {
    const foldersData = await indexedDBService.getItem('folders');
    if (foldersData) {
      const folders = JSON.parse(foldersData);
      foldersCount = Array.isArray(folders) ? folders.length : 0;
    }
  } catch (error) {
    log.warn('Failed to count folders', { error });
  }

  // Count tags
  let tagsCount = 0;
  try {
    const tagsData = await indexedDBService.getItem('tags');
    if (tagsData) {
      const tags = JSON.parse(tagsData);
      tagsCount = Array.isArray(tags) ? tags.length : 0;
    }
  } catch (error) {
    log.warn('Failed to count tags', { error });
  }

  return {
    indexedDBUsage: quota.usageFormatted,
    indexedDBQuota: quota.quotaFormatted,
    percentUsed: `${quota.percentUsed.toFixed(1)}%`,
    notesCount,
    tasksCount,
    eventsCount,
    timeEntriesCount,
    foldersCount,
    tagsCount,
  };
}

/**
 * Get error logs (last 50 errors from logger)
 * Privacy-safe: no user-entered text in error messages
 */
async function getErrorLogs(): Promise<ErrorLog[]> {
  const errors: ErrorLog[] = [];

  try {
    // Get errors from localStorage (if logger stores them)
    const errorLog = localStorage.getItem('error-log');
    if (errorLog) {
      const parsed = JSON.parse(errorLog);
      if (Array.isArray(parsed)) {
        errors.push(
          ...parsed.slice(-50).map((entry: any) => ({
            timestamp: new Date(entry.timestamp).toISOString(),
            level: entry.level || 'error',
            message: sanitizeErrorMessage(entry.message),
            context: entry.context ? JSON.stringify(entry.context).substring(0, 200) : undefined,
          }))
        );
      }
    }
  } catch (error) {
    log.warn('Failed to get error logs', { error });
  }

  return errors;
}

/**
 * Sanitize error messages to remove user content
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential user content (anything in quotes, parentheses with user data patterns)
  let sanitized = message;

  // Remove quoted strings (likely user content)
  sanitized = sanitized.replace(/"[^"]*"/g, '"[REDACTED]"');
  sanitized = sanitized.replace(/'[^']*'/g, "'[REDACTED]'");

  return sanitized;
}

/**
 * Get performance metrics
 */
function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {};

  if ('performance' in window && 'timing' in performance) {
    const timing = performance.timing as unknown as PerformanceTimingData;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    if (loadTime > 0) {
      metrics.pageLoadTime = `${(loadTime / 1000).toFixed(2)}s`;
    }
  }

  // Get Core Web Vitals (if available)
  if ('PerformanceObserver' in window) {
    try {
      // LCP (Largest Contentful Paint)
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lcp = lcpEntries[lcpEntries.length - 1] as LargestContentfulPaintEntry;
        metrics.largestContentfulPaint = `${(lcp.renderTime / 1000).toFixed(2)}s`;
      }

      // FID (First Input Delay)
      const fidEntries = performance.getEntriesByType('first-input');
      if (fidEntries.length > 0) {
        const fid = fidEntries[0] as FirstInputEntry;
        metrics.firstInputDelay = `${fid.processingStart - fid.startTime}ms`;
      }
    } catch (error) {
      log.warn('Failed to get Core Web Vitals', { error });
    }
  }

  return metrics;
}

/**
 * Format diagnostic report as markdown
 */
export function formatDiagnosticReport(report: DiagnosticReport): string {
  const lines: string[] = [];

  // Header
  lines.push('# NeumanOS Diagnostic Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date(report.generated).toLocaleString()}`);
  lines.push('');

  // System Information
  lines.push('## System Information');
  lines.push('');
  lines.push(`- **Browser:** ${report.system.browser.name} ${report.system.browser.version}`);
  lines.push(`- **OS:** ${report.system.os.platform}`);
  lines.push(`- **Language:** ${report.system.os.language}`);
  lines.push(`- **Timezone:** ${report.system.os.timezone}`);
  lines.push(`- **Screen:** ${report.system.screen.resolution} (${report.system.screen.pixelRatio}x pixel ratio)`);
  if (report.system.memory) {
    lines.push(`- **Memory:** ${report.system.memory}`);
  }
  if (report.system.connection) {
    lines.push(`- **Connection:** ${report.system.connection}`);
  }
  lines.push('');

  // App State
  lines.push('## App State');
  lines.push('');
  lines.push(`- **Build:** ${report.app.build} (${report.app.buildDate})`);
  if (report.app.installDate) {
    lines.push(`- **Install Date:** ${new Date(report.app.installDate).toLocaleString()}`);
  }
  if (report.app.lastBackupDate) {
    lines.push(`- **Last Backup:** ${new Date(report.app.lastBackupDate).toLocaleString()}`);
  }
  if (report.app.activeWidgets !== undefined) {
    lines.push(`- **Active Widgets:** ${report.app.activeWidgets}`);
  }
  lines.push('');

  // Storage Statistics
  lines.push('## Storage Statistics');
  lines.push('');
  lines.push(`- **IndexedDB Usage:** ${report.storage.indexedDBUsage} / ${report.storage.indexedDBQuota} (${report.storage.percentUsed})`);
  lines.push(`- **Notes:** ${report.storage.notesCount}`);
  lines.push(`- **Tasks:** ${report.storage.tasksCount}`);
  lines.push(`- **Events:** ${report.storage.eventsCount}`);
  lines.push(`- **Time Entries:** ${report.storage.timeEntriesCount}`);
  lines.push(`- **Folders:** ${report.storage.foldersCount}`);
  lines.push(`- **Tags:** ${report.storage.tagsCount}`);
  lines.push('');

  // Recent Errors
  if (report.errors.length > 0) {
    lines.push('## Recent Errors');
    lines.push('');
    report.errors.slice(-10).forEach((error) => {
      lines.push(`- **[${error.level.toUpperCase()}]** ${new Date(error.timestamp).toLocaleString()}: ${error.message}`);
      if (error.context) {
        lines.push(`  - Context: ${error.context}`);
      }
    });
    lines.push('');
  }

  // Performance Metrics
  lines.push('## Performance Metrics');
  lines.push('');
  if (report.performance.pageLoadTime) {
    lines.push(`- **Page Load Time:** ${report.performance.pageLoadTime}`);
  }
  if (report.performance.largestContentfulPaint) {
    lines.push(`- **Largest Contentful Paint (LCP):** ${report.performance.largestContentfulPaint}`);
  }
  if (report.performance.firstInputDelay) {
    lines.push(`- **First Input Delay (FID):** ${report.performance.firstInputDelay}`);
  }
  if (
    !report.performance.pageLoadTime &&
    !report.performance.largestContentfulPaint &&
    !report.performance.firstInputDelay
  ) {
    lines.push('- No performance metrics available');
  }
  lines.push('');

  // Privacy notice
  lines.push('---');
  lines.push('');
  lines.push('*Privacy-safe report: No PII, no user content, only counts and stats.*');

  return lines.join('\n');
}

/**
 * Copy diagnostic report to clipboard
 */
export async function copyDiagnosticReportToClipboard(report: DiagnosticReport): Promise<void> {
  const markdown = formatDiagnosticReport(report);

  try {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(markdown);
      log.info('Diagnostic report copied to clipboard');
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = markdown;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      log.info('Diagnostic report copied to clipboard (fallback)');
    }
  } catch (error) {
    log.error('Failed to copy diagnostic report to clipboard', { error });
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Download diagnostic report as markdown file
 */
export function downloadDiagnosticReport(report: DiagnosticReport): void {
  const markdown = formatDiagnosticReport(report);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeString = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  const filename = `neumanos-diagnostics-${timestamp}-${timeString}.md`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  log.info('Diagnostic report downloaded', { filename });
}
