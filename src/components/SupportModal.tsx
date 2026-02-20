/**
 * Support Modal - Help & Support System
 * Provides issue reporting, help resources, and documentation access
 *
 * Features:
 * - Report Issue tab: Mailto integration with diagnostic report
 * - Get Help tab: Keyboard shortcuts, FAQs, system status
 * - Documentation tab: Version info, external links
 */

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { getDiagnosticReport, formatDiagnosticReport, copyDiagnosticReportToClipboard, downloadDiagnosticReport, type DiagnosticReport } from '../utils/diagnostics';
import { logger } from '../services/logger';
import { Mail, HelpCircle, Book, Copy, Download, ChevronDown, ChevronRight, ExternalLink, Keyboard } from 'lucide-react';
import { BUILD_HASH, formatBuildTimestamp } from '../utils/buildInfo';
import { useShortcutsStore } from '../stores/useShortcutsStore';
import { formatShortcut } from '../services/shortcuts';

const log = logger.module('SupportModal');

type TabType = 'report' | 'help' | 'docs';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Which tab to show when modal opens. Defaults to 'report'. */
  initialTab?: TabType;
}

interface FAQ {
  question: string;
  answer: string;
}

const SUPPORT_EMAIL = 'os@neuman.dev';

const FAQS: FAQ[] = [
  // Getting Started
  {
    question: 'Where is my data stored?',
    answer: 'All your data is stored locally in your browser\'s IndexedDB storage. Nothing leaves your device unless you explicitly export it. This means your notes, tasks, and settings stay private and work offline.',
  },
  {
    question: 'How do I backup my data?',
    answer: 'Go to Settings → Backup & Restore, then click "Export Brain" to download a .brain file. You can restore this file on any browser by clicking "Import Brain". For automatic backups, set up Auto-Save to a cloud folder like Dropbox or Google Drive.',
  },
  {
    question: 'What happens if I clear my browser data?',
    answer: 'Clearing browser data will delete your locally stored information. Always export a backup before clearing browser data or switching browsers. You can restore from a .brain file anytime.',
  },
  // Notes
  {
    question: 'How do I export notes to markdown?',
    answer: 'Open the Notes page, click the Export button in the header (or press Cmd/Ctrl+Shift+E), then select your export scope and click Export. Your notes will be downloaded as .md files in a ZIP archive.',
  },
  {
    question: 'What are wiki links and how do I use them?',
    answer: 'Wiki links are connections between notes using [[Note Title]] syntax. Type [[ in the note editor to see a list of all notes. Clicking a wiki link navigates to that note. Use the Graph View to visualize all connections between your notes.',
  },
  {
    question: 'Can I organize notes into folders?',
    answer: 'Yes! Notes can be organized into folders. Click the folder icon in the Notes sidebar to create folders. You can also use tags for cross-cutting organization—add tags to any note and filter by them.',
  },
  // Tasks
  {
    question: 'How do I create recurring tasks?',
    answer: 'Create or edit a task, then scroll to the "Recurrence" section. Select your recurrence pattern (Daily, Weekly, Monthly, Yearly, or Custom), set the interval, and optionally set an end date.',
  },
  {
    question: 'What is the Kanban board?',
    answer: 'The Kanban board displays tasks in columns (To Do, In Progress, Done). Drag tasks between columns to update their status. You can also create custom columns and filter by project, priority, or tags.',
  },
  {
    question: 'How do task dependencies work?',
    answer: 'When editing a task, you can add dependencies—tasks that must be completed before this one. The Critical Path feature (toggle in task view) highlights which tasks are blocking others.',
  },
  // Dashboard & Widgets
  {
    question: 'How do I customize the dashboard widgets?',
    answer: 'Click the Dashboard link in the sidebar, then click the gear icon (⚙) to open Widget Manager. Toggle widgets on/off, reorder them by dragging, and click the settings icon on individual widgets to configure them.',
  },
  {
    question: 'What widgets are available?',
    answer: 'Over 44 widgets including: Weather, News feeds, Calculator, World Clock, Pomodoro Timer, Quick Notes, Calendar, Task Summary, Time Tracking stats, Bookmarks, and many more. New widgets are added regularly.',
  },
  // Time Tracking & Calendar
  {
    question: 'How does time tracking work?',
    answer: 'Go to Time Tracking in the sidebar. Start the timer when you begin work, assign it to a project, and stop when done. View daily/weekly stats, generate reports, and export to CSV for invoicing.',
  },
  {
    question: 'Can I import calendar events?',
    answer: 'Yes! The Calendar page supports ICS file import. Click the import button and select your .ics file. You can also export your events to ICS format for use in other calendar apps.',
  },
  // Shortcuts & Tips
  {
    question: 'What keyboard shortcuts are available?',
    answer: 'Press F1 or Ctrl+/ to open Help. On the Notes page, Ctrl+K focuses search. In the notes editor, use Ctrl+B for bold, Ctrl+I for italic, Ctrl+Shift+E to export, and type / for slash commands. Ctrl+B toggles the sidebar, Ctrl+D creates a daily note.',
  },
  {
    question: 'How do I use slash commands in notes?',
    answer: 'Type "/" in the note editor to see available commands: /heading, /bullet, /checkbox, /code, /quote, /divider, and more. This is the fastest way to format your notes.',
  },
];

/**
 * Keyboard Shortcuts Section - displays all registered shortcuts from the shortcuts store
 */
function KeyboardShortcutsSection() {
  const shortcuts = useShortcutsStore((s) => s.getAllShortcuts());

  // Group shortcuts by context
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const context = shortcut.context || 'global';
      if (!acc[context]) acc[context] = [];
      acc[context].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof shortcuts>
  );

  const contextLabels: Record<string, string> = {
    global: 'Global',
    kanban: 'Tasks/Kanban',
    notes: 'Notes',
    calendar: 'Calendar',
    diagram: 'Diagrams',
    modal: 'Modals',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="w-4 h-4 text-accent-blue" />
        <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
          Keyboard Shortcuts
        </h3>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedShortcuts).map(([context, contextShortcuts]) => (
          <div key={context}>
            <h4 className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
              {contextLabels[context] || context}
            </h4>
            <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
              {contextShortcuts.map((shortcut, index) => (
                <div
                  key={shortcut.id}
                  className={`flex items-center justify-between px-3 py-2 ${
                    index !== contextShortcuts.length - 1
                      ? 'border-b border-border-light dark:border-border-dark'
                      : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                      {shortcut.label}
                    </span>
                    {shortcut.description && (
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        {shortcut.description}
                      </span>
                    )}
                  </div>
                  <kbd className="px-2 py-1 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary">
                    {formatShortcut(shortcut.keys)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        {shortcuts.length === 0 && (
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
            No shortcuts registered yet. Shortcuts will appear here as you use the app.
          </p>
        )}
      </div>

      {/* Editor shortcuts (hardcoded since they're from Lexical) */}
      <div className="mt-4">
        <h4 className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2 uppercase tracking-wide">
          Notes Editor
        </h4>
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
          {[
            { keys: ['mod', 'b'], label: 'Bold' },
            { keys: ['mod', 'i'], label: 'Italic' },
            { keys: ['mod', 'u'], label: 'Underline' },
            { keys: ['mod', 'shift', 'e'], label: 'Export notes' },
            { keys: ['/'], label: 'Slash commands menu' },
            { keys: ['[['], label: 'Wiki link autocomplete' },
          ].map((shortcut, index, arr) => (
            <div
              key={shortcut.label}
              className={`flex items-center justify-between px-3 py-2 ${
                index !== arr.length - 1 ? 'border-b border-border-light dark:border-border-dark' : ''
              }`}
            >
              <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                {shortcut.label}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary">
                {formatShortcut(shortcut.keys)}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SupportModal({ isOpen, onClose, initialTab = 'report' }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [issueType, setIssueType] = useState<string>('bug');
  const [description, setDescription] = useState<string>('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [showDiagnosticPreview, setShowDiagnosticPreview] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Generate diagnostic report when modal opens or when tab changes to report
  useEffect(() => {
    if (isOpen && activeTab === 'report' && !diagnosticReport) {
      generateDiagnosticReport();
    }
  }, [isOpen, activeTab]);

  const generateDiagnosticReport = async () => {
    try {
      setIsGeneratingReport(true);
      const report = await getDiagnosticReport();
      setDiagnosticReport(report);
      log.info('Diagnostic report generated for support modal');
    } catch (error) {
      log.error('Failed to generate diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to generate diagnostic report' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSendEmail = () => {
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Please provide a description of the issue' });
      return;
    }

    try {
      const subject = encodeURIComponent(`[${issueType}] - NeumanOS Support Request`);

      let bodyText = `Issue Type: ${issueType}\n`;
      bodyText += `Build: ${BUILD_HASH} (${formatBuildTimestamp()})\n\n`;
      bodyText += `Description:\n${description}\n\n`;

      if (includeDiagnostics && diagnosticReport) {
        bodyText += '---\nDiagnostic Report:\n\n';
        bodyText += formatDiagnosticReport(diagnosticReport);
      }

      const body = encodeURIComponent(bodyText);

      window.open(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
      setMessage({ type: 'success', text: 'Email client opened. Please send the email to complete your report.' });
      log.info('Mailto link opened for support request', { issueType, includeDiagnostics });
    } catch (error) {
      log.error('Failed to open email client', { error });
      setMessage({ type: 'error', text: 'Failed to open email client. Please copy the diagnostic report manually.' });
    }
  };

  const handleCopyDiagnosticReport = async () => {
    if (!diagnosticReport) {
      setMessage({ type: 'error', text: 'No diagnostic report available' });
      return;
    }

    try {
      await copyDiagnosticReportToClipboard(diagnosticReport);
      setMessage({ type: 'success', text: 'Diagnostic report copied to clipboard' });
    } catch (error) {
      log.error('Failed to copy diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
    }
  };

  const handleDownloadDiagnosticReport = () => {
    if (!diagnosticReport) {
      setMessage({ type: 'error', text: 'No diagnostic report available' });
      return;
    }

    try {
      downloadDiagnosticReport(diagnosticReport);
      setMessage({ type: 'success', text: 'Diagnostic report downloaded' });
    } catch (error) {
      log.error('Failed to download diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to download report' });
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Reset state when modal closes, set initial tab when it opens
  useEffect(() => {
    if (!isOpen) {
      setMessage(null);
      setDescription('');
      setIssueType('bug');
      setIncludeDiagnostics(true);
      setExpandedFaq(null);
    } else {
      // Set the active tab to initialTab when modal opens
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Support" maxWidth="2xl">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'report'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Report Issue</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'help'
              ? 'text-accent-primary border-b-2 border-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            <span>Get Help</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'docs'
              ? 'text-accent-blue border-b-2 border-accent-blue'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            <span>Documentation</span>
          </div>
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark border border-status-success-border dark:border-status-success-border-dark'
              : message.type === 'error'
              ? 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark'
              : 'bg-status-info-bg dark:bg-status-info-bg-dark text-status-info-text dark:text-status-info-text-dark border border-status-info-border dark:border-status-info-border-dark'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Experiencing a problem? Send us a diagnostic report to help us troubleshoot.
          </p>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              Issue Type
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="performance">Performance Issue</option>
              <option value="data-loss">Data Loss/Corruption</option>
              <option value="ui-feedback">UI/UX Feedback</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
              Description <span className="text-status-error">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue you're experiencing..."
              rows={6}
              className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          {/* Include Diagnostic Report */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="include-diagnostics"
              checked={includeDiagnostics}
              onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border-light dark:border-border-dark"
            />
            <div className="flex-1">
              <label htmlFor="include-diagnostics" className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary cursor-pointer">
                Include diagnostic report (recommended)
              </label>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                Provides system info, storage stats, and error logs to help us troubleshoot. No personal data included.
              </p>
            </div>
          </div>

          {/* Diagnostic Preview */}
          {includeDiagnostics && diagnosticReport && (
            <div>
              <button
                onClick={() => setShowDiagnosticPreview(!showDiagnosticPreview)}
                className="flex items-center gap-2 text-sm font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
              >
                {showDiagnosticPreview ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>Preview Diagnostic Report</span>
              </button>

              {showDiagnosticPreview && (
                <div className="mt-2 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
                  <pre className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap overflow-auto max-h-64">
                    {formatDiagnosticReport(diagnosticReport)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={handleSendEmail}
              disabled={isGeneratingReport}
              className="flex-1 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Open Email Client</span>
              </div>
            </button>

            <button
              onClick={handleCopyDiagnosticReport}
              disabled={!diagnosticReport || isGeneratingReport}
              className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy diagnostic report to clipboard"
              aria-label="Copy diagnostic report to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadDiagnosticReport}
              disabled={!diagnosticReport || isGeneratingReport}
              className="px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors border border-border-light dark:border-border-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download diagnostic report"
              aria-label="Download diagnostic report"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <KeyboardShortcutsSection />

          {/* FAQs */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {FAQS.map((faq, index) => (
                <div
                  key={index}
                  className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-left flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {faq.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary shrink-0" />
                    )}
                  </button>

                  {expandedFaq === index && (
                    <div className="px-4 py-3 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
                      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Build Info */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              Build Information
            </h3>
            <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">Current Build:</span>
                  <span className="font-mono text-text-light-primary dark:text-text-dark-primary">{BUILD_HASH}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">Build Date:</span>
                  <span className="text-text-light-primary dark:text-text-dark-primary">{formatBuildTimestamp()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* External Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              External Documentation
            </h3>
            <div className="space-y-2">
              <a
                href="https://github.com/travisjneuman/neumanos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  GitHub Repository
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>

              <a
                href="https://github.com/travisjneuman/neumanos/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  User Manual (README)
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>

              <a
                href="https://github.com/travisjneuman/neumanos/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark rounded-lg border border-border-light dark:border-border-dark transition-colors group"
              >
                <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  Issue Tracker
                </span>
                <ExternalLink className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Privacy & License */}
          <div>
            <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
              Privacy & License
            </h3>
            <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                    Privacy Policy
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    All data stored locally in your browser. No telemetry, no analytics, no third-party services.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                    License
                  </div>
                  <p className="text-text-light-secondary dark:text-text-dark-secondary">
                    MIT License - Free and open source software
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
