import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Settings as SettingsIcon,
  Clock,
  CheckSquare,
  FileText,
  HardDrive,
  Bot,
  Sliders,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import {
  exportBrainFile,
  importBrainFile,
  validateBrainFile,
  formatFileSize,
} from '../services/brainBackup';
import {
  loadPreferences,
  getBackupHistory,
  shouldShowBackupReminder,
  getTimeSinceLastBackup,
  addHistoryEntry,
  type BackupPreferences,
  type BackupHistoryEntry,
} from '../services/backupPreferences';
import { PageContent } from '../components/PageContent';
import { indexedDBService } from '../services/indexedDB';
import { exportToICS, importFromICS, downloadICS, readICSFile } from '../services/icsImportExport';
import { requestNotificationPermission } from '../services/eventReminders';
import { useCalendarStore } from '../stores/useCalendarStore';
import { BackupSettings } from '../components/BackupSettings';
import { PresetManager } from '../components/PresetManager';
import { logger } from '../services/logger';
import { ImportData } from '../widgets/Settings/ImportData';
import { DailyNotesSettings } from '../widgets/Settings/DailyNotesSettings';
import { TemplateSettings } from '../widgets/Settings/TemplateSettings';
import { ExportSettings } from '../widgets/Settings/ExportSettings';
import { AboutSettings } from '../widgets/Settings/AboutSettings';
import { AccountSettings } from '../widgets/Settings/AccountSettings';
import { SiteWideSettings } from '../widgets/Settings/SiteWideSettings';
import { ThemeSettings } from '../widgets/Settings/ThemeSettings';
import { TaskManagementSettings } from '../widgets/Settings/TaskManagementSettings';
import { QuickActionsSection } from '../widgets/Settings/QuickActionsSection';
import { AutoSaveSettings } from '../widgets/Settings/AutoSaveSettings';
import { BackupHistorySection } from '../widgets/Settings/BackupHistorySection';
import { BackupOptionsSection } from '../widgets/Settings/BackupOptionsSection';
import { TimeTrackingPanelSettings } from '../widgets/Settings/TimeTrackingPanelSettings';
import CustomFieldsSettings from '../components/CustomFieldsSettings';
import MemberSettings from '../components/MemberSettings';
import { AutoTrackingSettings } from '../components/AutoTrackingSettings';
import { AITerminalSettingsSection } from '../widgets/Settings/AITerminalSettingsSection';
import { StorageInfoSection } from '../widgets/Settings/StorageInfoSection';
import { DashboardSettingsSection } from '../widgets/Settings/DashboardSettingsSection';
import { CalendarNotificationsSection } from '../widgets/Settings/CalendarNotificationsSection';
import { CalendarImportExportSection } from '../widgets/Settings/CalendarImportExportSection';
import { WidgetSettingsSection } from '../widgets/Settings/WidgetSettingsSection';
import { ProjectSettings } from '../widgets/Settings/ProjectSettings';

const log = logger.module('Settings');

/**
 * Settings Tab Configuration
 */
const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'projects', label: 'Projects', icon: FolderTree },
  { id: 'time', label: 'Time Tracking', icon: Clock },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'notes', label: 'Notes & Calendar', icon: FileText },
  { id: 'backup', label: 'Backup & Data', icon: HardDrive },
  { id: 'ai', label: 'AI Terminal', icon: Bot },
  { id: 'advanced', label: 'Advanced', icon: Sliders },
] as const;

type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

/**
 * Settings Page - Modern Tab-Based Layout
 * Local-first privacy with comprehensive settings management
 */
export const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as SettingsTabId) || 'general';

  // State management
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);

  // Preferences
  const [preferences, setPreferences] = useState<BackupPreferences | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntry[]>([]);
  const [timeSinceLastBackup, setTimeSinceLastBackup] = useState<string | null>(null);
  const [backupReminder, setBackupReminder] = useState<{ show: boolean; daysSinceLastBackup?: number; message?: string } | null>(null);

  // Storage Info
  const [storageInfo, setStorageInfo] = useState<{
    usageFormatted: string;
    availableFormatted: string;
    quotaFormatted: string;
    percentUsed: number;
  } | null>(null);

  // New Browser Warning
  const [showNewBrowserWarning, setShowNewBrowserWarning] = useState(false);

  // Dashboard Settings modal
  const [showPresetManager, setShowPresetManager] = useState(false);

  // Calendar Import/Export
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const [isImportingCalendar, setIsImportingCalendar] = useState(false);
  const events = useCalendarStore((s) => s.events);
  const importEvents = useCalendarStore((s) => s.importEvents);

  // Notification Permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [requestingPermission, setRequestingPermission] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    // Load preferences
    const prefs = await loadPreferences();
    setPreferences(prefs);

    // Load backup history
    const history = await getBackupHistory();
    setBackupHistory(history);

    // Get time since last backup
    const timeSince = await getTimeSinceLastBackup();
    setTimeSinceLastBackup(timeSince);

    // Check backup reminder
    const reminder = await shouldShowBackupReminder();
    setBackupReminder(reminder);

    // Load storage quota info
    try {
      const quota = await indexedDBService.getQuota();
      setStorageInfo(quota);

      // Check if this is a new browser (no data in IndexedDB)
      const keys = await indexedDBService.getAllKeys();
      const hasAnyData = keys.length > 0;

      // Show new browser warning if no data AND not dismissed
      const dismissed = localStorage.getItem('new-browser-warning-dismissed');
      if (!hasAnyData && !dismissed) {
        setShowNewBrowserWarning(true);
      }
    } catch (error) {
      log.error('Failed to load storage info', { error });
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    document.title = 'Settings - NeumanOS';
    loadAllData();
  }, [loadAllData]);

  // Handle tab change
  const setTab = (tabId: SettingsTabId) => {
    setSearchParams({ tab: tabId });
  };

  // Export handler
  const handleExport = async (compressed: boolean = true) => {
    try {
      setIsExporting(true);
      setMessage(null);

      const result = await exportBrainFile({ compressed, prettyPrint: !compressed });

      // Add to history
      await addHistoryEntry({
        filename: result.filename,
        size: result.size,
        compressed: result.compressed,
        type: 'manual',
        status: 'success',
      });

      await loadAllData(); // Refresh

      const sizeInfo = formatFileSize(result.size);
      const compressionNote = compressed ? ' (compressed)' : '';
      setMessage({
        type: 'success',
        text: `Brain data exported successfully! File size: ${sizeInfo}${compressionNote}`
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Export failed: ${error}` });
    } finally {
      setIsExporting(false);
    }
  };

  // Import handler
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage(null);

      const validation = await validateBrainFile(file);
      if (!validation.valid) {
        setMessage({ type: 'error', text: validation.message });
        return;
      }

      if (validation.info) {
        setMessage({
          type: 'info',
          text: `Found ${validation.info.itemCount} items (${validation.info.fileSize}) from ${new Date(validation.info.exportDate).toLocaleString()}. Importing...`,
        });
      }

      const result = await importBrainFile(file);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Import failed: ${error}` });
    } finally {
      setIsImporting(false);
    }
  };

  // Calendar handlers
  const handleExportCalendar = async () => {
    try {
      setIsExportingCalendar(true);
      setMessage(null);

      const result = exportToICS(events);

      if (!result.success || !result.data) {
        setMessage({ type: 'error', text: result.error || 'Export failed' });
        return;
      }

      downloadICS(result.data, `calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`);

      const eventCount = Object.values(events).reduce((acc, arr) => acc + arr.length, 0);
      setMessage({
        type: 'success',
        text: `Calendar exported successfully! ${eventCount} events saved to .ics file.`
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Calendar export failed: ${error}` });
    } finally {
      setIsExportingCalendar(false);
    }
  };

  const handleICSFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingCalendar(true);
      setMessage(null);

      const icsData = await readICSFile(file);
      const result = importFromICS(icsData);

      if (!result.success || !result.events) {
        setMessage({ type: 'error', text: result.error || 'Import failed' });
        return;
      }

      const count = importEvents(result.events);

      setMessage({
        type: 'success',
        text: `Calendar imported successfully! ${count} events added.`
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Calendar import failed: ${error}` });
    } finally {
      setIsImportingCalendar(false);
      // Reset input value to allow re-importing same file
      event.target.value = '';
    }
  };

  // Notification permission handler
  const handleRequestNotificationPermission = async () => {
    try {
      setRequestingPermission(true);
      const granted = await requestNotificationPermission();
      setNotificationPermission(granted ? 'granted' : 'denied');
      setMessage({
        type: granted ? 'success' : 'warning',
        text: granted
          ? 'Notifications enabled! You will now receive event reminders.'
          : 'Notification permission denied. You can enable it later in your browser settings.',
      });
    } catch (error) {
      log.error('Failed to request notification permission', { error });
      setMessage({ type: 'error', text: 'Failed to request notification permission' });
    } finally {
      setRequestingPermission(false);
    }
  };

  if (!preferences) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <PageContent page="settings">
      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark border border-status-success-border dark:border-status-success-border-dark'
                : message.type === 'error'
                ? 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark'
                : message.type === 'warning'
                ? 'bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark border border-status-warning-border dark:border-status-warning-border-dark'
                : 'bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark border border-status-info-border dark:border-status-info-border-dark'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backup Reminder Banner */}
      {backupReminder?.show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-status-warning-bg dark:bg-status-warning-bg-dark text-status-warning-text dark:text-status-warning-text-dark border border-status-warning-border dark:border-status-warning-border-dark flex items-start gap-3"
        >
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold">{backupReminder.message}</p>
            <button
              onClick={() => handleExport(preferences.compressionEnabled)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Create Backup Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Tab Navigation Sidebar */}
        <nav className="w-56 flex-shrink-0 hidden md:block">
          <div className="sticky top-4 space-y-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-primary/10 text-accent-primary font-medium'
                      : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated hover:text-text-light-primary dark:hover:text-text-dark-primary'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{tab.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile Tab Selector */}
        <div className="md:hidden mb-4 w-full">
          <select
            value={currentTab}
            onChange={(e) => setTab(e.target.value as SettingsTabId)}
            className="w-full px-4 py-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {SETTINGS_TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* General Settings */}
              {currentTab === 'general' && (
                <>
                  <AccountSettings />
                  <ThemeSettings />
                  <SiteWideSettings />
                  <DashboardSettingsSection onOpenPresetManager={() => setShowPresetManager(true)} />
                  <div className="bento-card p-6">
                    <WidgetSettingsSection />
                  </div>
                </>
              )}

              {/* Projects Settings */}
              {currentTab === 'projects' && <ProjectSettings />}

              {/* Time Tracking Settings */}
              {currentTab === 'time' && (
                <>
                  <div className="bento-card p-6">
                    <TimeTrackingPanelSettings />
                  </div>
                  <div className="bento-card p-6">
                    <AutoTrackingSettings />
                  </div>
                </>
              )}

              {/* Task Settings */}
              {currentTab === 'tasks' && (
                <TaskManagementSettings />
              )}

              {/* Notes & Calendar Settings */}
              {currentTab === 'notes' && (
                <>
                  <div className="bento-card p-6">
                    <DailyNotesSettings />
                  </div>
                  <div className="bento-card p-6">
                    <TemplateSettings />
                  </div>
                  <div className="bento-card p-6">
                    <ExportSettings />
                  </div>

                  <CalendarImportExportSection
                    isExporting={isExportingCalendar}
                    isImporting={isImportingCalendar}
                    onExport={handleExportCalendar}
                    onImport={handleICSFileSelect}
                  />

                  <CalendarNotificationsSection
                    notificationPermission={notificationPermission}
                    requestingPermission={requestingPermission}
                    onRequestPermission={handleRequestNotificationPermission}
                  />
                </>
              )}

              {/* Backup & Data Settings */}
              {currentTab === 'backup' && (
                <>
                  {/* Privacy Notice */}
                  <div className="p-4 rounded-lg bg-status-success-bg dark:bg-status-success-bg-dark border border-status-success-border dark:border-status-success-border-dark">
                    <p className="text-sm text-status-success-text dark:text-status-success-text-dark">
                      <strong>🔒 100% Private:</strong> All data stored locally in your browser using IndexedDB (50GB+ capacity).
                      No cloud dependencies, no tracking, no third-party services.
                    </p>
                  </div>

                  {/* New Browser Warning */}
                  {showNewBrowserWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-lg bg-status-warning-bg dark:bg-status-warning-bg-dark border-2 border-status-warning-border dark:border-status-warning-border-dark"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-3xl flex-shrink-0">⚠️</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-status-warning-text dark:text-status-warning-text-dark mb-2">
                            First Time in This Browser?
                          </h3>
                          <p className="text-sm text-status-warning-text dark:text-status-warning-text-dark mb-3">
                            Your data is stored locally in each browser. Export from your other browser and import here.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setShowNewBrowserWarning(false)}
                              className="px-4 py-2 bg-status-warning text-white rounded-lg font-medium transition-colors"
                            >
                              Got It
                            </button>
                            <button
                              onClick={() => {
                                setShowNewBrowserWarning(false);
                                localStorage.setItem('new-browser-warning-dismissed', 'true');
                              }}
                              className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark"
                            >
                              Don't Show Again
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <QuickActionsSection
                    timeSinceLastBackup={timeSinceLastBackup}
                    isExporting={isExporting}
                    isImporting={isImporting}
                    onExport={() => handleExport(preferences.compressionEnabled)}
                    onFileSelect={handleFileSelect}
                  />

                  <BackupHistorySection backupHistory={backupHistory} />

                  <BackupOptionsSection
                    preferences={preferences}
                    onRefresh={loadAllData}
                    onMessage={setMessage}
                  />

                  <AutoSaveSettings
                    onMessage={setMessage}
                    onRefresh={loadAllData}
                  />

                  <div className="bento-card p-6">
                    <BackupSettings />
                  </div>

                  <div className="bento-card p-6">
                    <ImportData />
                  </div>
                </>
              )}

              {/* AI Terminal Settings */}
              {currentTab === 'ai' && (
                <AITerminalSettingsSection />
              )}

              {/* Advanced Settings */}
              {currentTab === 'advanced' && (
                <>
                  <div className="bento-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">🏷️</span>
                      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                        Custom Fields
                      </h2>
                    </div>
                    <CustomFieldsSettings />
                  </div>

                  <div className="bento-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">👥</span>
                      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                        Team Members
                      </h2>
                    </div>
                    <MemberSettings />
                  </div>

                  <StorageInfoSection storageInfo={storageInfo} />

                  <div className="bento-card p-6">
                    <AboutSettings />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Preset Manager Modal */}
      <PresetManager
        isOpen={showPresetManager}
        onClose={() => setShowPresetManager(false)}
      />
    </PageContent>
  );
};
