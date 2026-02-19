/**
 * About Settings Widget
 * Displays app information, version, diagnostic reports, and support links
 */

import { useState, useEffect, lazy, Suspense } from 'react';

// Lazy load SupportModal to prevent bundle bloat
const SupportModal = lazy(() => import('../../components/SupportModal').then(m => ({ default: m.SupportModal })));
import { getDiagnosticReport, formatDiagnosticReport, downloadDiagnosticReport } from '../../utils/diagnostics';
import { logger } from '../../services/logger';
import { HelpCircle, Download, FileText, ExternalLink } from 'lucide-react';
import { BUILD_HASH, formatBuildTimestamp } from '../../utils/buildInfo';

const log = logger.module('AboutSettings');

export function AboutSettings() {
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [diagnosticText, setDiagnosticText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleViewDiagnosticReport = async () => {
    try {
      setIsGenerating(true);
      const report = await getDiagnosticReport();
      const formatted = formatDiagnosticReport(report);
      setDiagnosticText(formatted);
      setShowDiagnosticModal(true);
      log.info('Diagnostic report viewed from About Settings');
    } catch (error) {
      log.error('Failed to generate diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to generate diagnostic report' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDiagnosticReport = async () => {
    try {
      setIsGenerating(true);
      const report = await getDiagnosticReport();
      downloadDiagnosticReport(report);
      setMessage({ type: 'success', text: 'Diagnostic report downloaded' });
      log.info('Diagnostic report downloaded from About Settings');
    } catch (error) {
      log.error('Failed to download diagnostic report', { error });
      setMessage({ type: 'error', text: 'Failed to download report' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-dismiss success messages
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">ℹ️</span>
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          About NeumanOS
        </h2>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-status-success-bg dark:bg-status-success-bg-dark text-status-success-text dark:text-status-success-text-dark border border-status-success-border dark:border-status-success-border-dark'
              : 'bg-status-error-bg dark:bg-status-error-bg-dark text-status-error-text dark:text-status-error-text-dark border border-status-error-border dark:border-status-error-border-dark'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* App Information */}
      <div className="mb-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
        <h3 className="text-base font-medium text-text-light-primary dark:text-text-dark-primary mb-3">
          Application Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-light-secondary dark:text-text-dark-secondary">Name:</span>
            <span className="font-medium text-text-light-primary dark:text-text-dark-primary">NeumanOS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-light-secondary dark:text-text-dark-secondary">Build:</span>
            <span className="font-mono text-text-light-primary dark:text-text-dark-primary">{BUILD_HASH}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-light-secondary dark:text-text-dark-secondary">Build Date:</span>
            <span className="text-text-light-primary dark:text-text-dark-primary">{formatBuildTimestamp()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-light-secondary dark:text-text-dark-secondary">Description:</span>
            <span className="text-text-light-primary dark:text-text-dark-primary text-right max-w-xs">
              Privacy-first, local-only productivity dashboard
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 space-y-3">
        <h3 className="text-base font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          Support Actions
        </h3>

        {/* Help & Support */}
        <button
          onClick={() => setShowSupportModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-lg font-medium shadow-soft hover:shadow-medium transition-all duration-200"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Help & Support</span>
        </button>

        {/* View Diagnostic Report */}
        <button
          onClick={handleViewDiagnosticReport}
          disabled={isGenerating}
          className="w-full flex items-center gap-3 px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium border border-border-light dark:border-border-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-5 h-5" />
          <span>{isGenerating ? 'Generating...' : 'View Diagnostic Report'}</span>
        </button>

        {/* Download Diagnostic Report */}
        <button
          onClick={handleDownloadDiagnosticReport}
          disabled={isGenerating}
          className="w-full flex items-center gap-3 px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium border border-border-light dark:border-border-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>{isGenerating ? 'Generating...' : 'Download Diagnostic Report'}</span>
        </button>
      </div>

      {/* External Links */}
      <div className="space-y-3">
        <h3 className="text-base font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          Links
        </h3>

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

        <div className="px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark">
          <div className="text-sm space-y-1">
            <div className="font-medium text-text-light-primary dark:text-text-dark-primary">License</div>
            <div className="text-text-light-secondary dark:text-text-dark-secondary">
              MIT License - Free and open source software
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-status-success-bg dark:bg-status-success-bg-dark rounded-lg border border-status-success-border dark:border-status-success-border-dark">
          <div className="text-sm space-y-1">
            <div className="font-medium text-status-success-text dark:text-status-success-text-dark">Privacy Policy</div>
            <div className="text-status-success-text dark:text-status-success-text-dark">
              All data stored locally. No telemetry, no analytics, no third-party services.
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <Suspense fallback={null}>
          <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
        </Suspense>
      )}

      {/* Diagnostic Report Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowDiagnosticModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-surface-light dark:bg-surface-dark rounded-card shadow-modal border border-black/10 dark:border-white/10 max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
              <h3 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                Diagnostic Report
              </h3>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1 text-text-light-secondary hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:text-text-dark-primary transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap">
                {diagnosticText}
              </pre>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border-light dark:border-border-dark">
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="w-full px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
