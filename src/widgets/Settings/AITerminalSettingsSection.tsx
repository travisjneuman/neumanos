import React, { useState, useMemo, useEffect } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import type { QuickNoteMode } from '../../stores/useTerminalStore';
import { ProviderSettings } from '../../components/ProviderSettings';
import { createDefaultRouter, PROVIDER_METADATA } from '../../services/ai/providerRouter';

const QUICK_NOTE_MODES: { value: QuickNoteMode; label: string; description: string }[] = [
  {
    value: 'permanent',
    label: 'Permanent',
    description: 'One Quick Note forever. Manually move content when ready.',
  },
  {
    value: 'daily',
    label: 'Daily',
    description: 'New Quick Note each day. Old ones become regular notes.',
  },
  {
    value: 'auto-archive',
    label: 'Auto-Archive',
    description: 'Entries older than X days auto-move to Daily Notes.',
  },
];

const AUTO_ARCHIVE_OPTIONS = [
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

/**
 * AI Terminal Settings Section
 * Provides functional AI provider configuration directly in Settings.
 * Changes sync with AI Terminal since both use the same store.
 */
export const AITerminalSettingsSection: React.FC = () => {
  const apiKey = useTerminalStore((s) => s.apiKey);
  const providers = useTerminalStore((s) => s.providers);
  const activeProvider = useTerminalStore((s) => s.activeProvider);
  const activeModel = useTerminalStore((s) => s.activeModel);
  const encryptionPassword = useTerminalStore((s) => s.encryptionPassword);
  const isPasswordExpired = useTerminalStore((s) => s.isPasswordExpired);

  // Quick Note settings
  const quickNoteMode = useTerminalStore((s) => s.quickNoteMode);
  const autoArchiveDays = useTerminalStore((s) => s.autoArchiveDays);
  const setQuickNoteMode = useTerminalStore((s) => s.setQuickNoteMode);
  const setAutoArchiveDays = useTerminalStore((s) => s.setAutoArchiveDays);

  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [configuredCount, setConfiguredCount] = useState(0);

  // Create router for settings (shares store with AITerminal)
  const router = useMemo(() => createDefaultRouter(), []);

  // Initialize API keys and count configured providers
  useEffect(() => {
    const initializeAndCount = async () => {
      // Initialize API keys from encrypted storage
      if (encryptionPassword && !isPasswordExpired()) {
        const allProviderIds = Object.keys(PROVIDER_METADATA);
        for (const providerId of allProviderIds) {
          const providerConfig = providers[providerId];
          if (providerConfig && providerConfig.encryptedApiKey) {
            try {
              const decryptedKey = await useTerminalStore.getState().getProviderApiKey(providerId, encryptionPassword);
              if (decryptedKey) {
                router.setProviderApiKey(providerId, decryptedKey);
              }
            } catch (error) {
              console.error(`Failed to decrypt ${providerId} API key:`, error);
            }
          }
        }
      }

      // Count configured providers
      const configured = await router.getConfiguredProviders();
      setConfiguredCount(configured.length);
    };

    initializeAndCount();
  }, [encryptionPassword, isPasswordExpired, providers, router]);

  // Recount when providers change
  useEffect(() => {
    const countConfigured = async () => {
      const configured = await router.getConfiguredProviders();
      setConfiguredCount(configured.length);
    };
    countConfigured();
  }, [providers, router]);

  return (
    <div className="bento-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              AI Terminal
            </h2>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Multi-provider AI assistant with 8 providers
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowProviderSettings(true)}
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Configure Providers
        </button>
      </div>

      {/* Provider Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">Configured Providers</p>
          <p className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            {configuredCount} <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary">/ 8</span>
          </p>
        </div>
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">Active Provider</p>
          <p className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
            {activeProvider ? (
              <>
                {PROVIDER_METADATA[activeProvider]?.displayName || activeProvider}
                {activeModel && (
                  <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary block truncate">
                    {activeModel}
                  </span>
                )}
              </>
            ) : (
              <span className="text-text-light-secondary dark:text-text-dark-secondary">Not selected</span>
            )}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6 p-4 bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info-border dark:border-status-info-border-dark rounded-lg">
        <p className="text-sm text-status-info-text dark:text-status-info-text-dark mb-2">
          <strong>🎯 Multi-Provider System</strong>
        </p>
        <ul className="text-xs text-status-info-text dark:text-status-info-text-dark space-y-1">
          <li>• 8 AI providers (OpenRouter, Groq, HuggingFace, Mistral, Gemini, OpenAI, Claude, Grok)</li>
          <li>• Free models available on most providers</li>
          <li>• Automatic fallback if primary provider fails</li>
          <li>• Encrypted API key storage with password protection</li>
        </ul>
      </div>

      {/* Quick Note Settings */}
      <div className="mb-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚡</span>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Quick Note Settings
          </h3>
        </div>

        {/* Mode Selection */}
        <div className="mb-4">
          <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Quick Note Mode
          </label>
          <div className="space-y-2">
            {QUICK_NOTE_MODES.map((mode) => (
              <label
                key={mode.value}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  quickNoteMode === mode.value
                    ? 'bg-accent-yellow/10 border border-accent-yellow/30'
                    : 'bg-surface-light dark:bg-surface-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="quickNoteMode"
                  value={mode.value}
                  checked={quickNoteMode === mode.value}
                  onChange={(e) => setQuickNoteMode(e.target.value as QuickNoteMode)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {mode.label}
                  </span>
                  <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
                    {mode.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Auto-Archive Days (only shown in auto-archive mode) */}
        {quickNoteMode === 'auto-archive' && (
          <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark">
            <label className="block text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Archive entries older than
            </label>
            <select
              value={autoArchiveDays}
              onChange={(e) => setAutoArchiveDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-yellow"
            >
              {AUTO_ARCHIVE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-2">
              Entries older than {autoArchiveDays} days will be automatically moved to their respective Daily Notes.
            </p>
          </div>
        )}
      </div>

      {/* Free Provider Links */}
      <div className="p-4 bg-status-success-bg dark:bg-status-success-bg-dark border border-status-success-border dark:border-status-success-border-dark rounded-lg">
        <p className="text-sm font-semibold text-status-success-text dark:text-status-success-text-dark mb-2">
          Get Free API Keys:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm text-status-success-text dark:text-status-success-text-dark">
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            OpenRouter →
          </a>
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            Groq →
          </a>
          <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            HuggingFace →
          </a>
          <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
            Mistral →
          </a>
        </div>
      </div>

      {apiKey && (
        <div className="mt-4 p-4 bg-status-warning-bg dark:bg-status-warning-bg-dark border border-status-warning-border dark:border-status-warning-border-dark rounded-lg">
          <p className="text-sm text-status-warning-text dark:text-status-warning-text-dark">
            <strong>ℹ️ Legacy Gemini Key Detected:</strong> Your existing Gemini API key is still active.
          </p>
        </div>
      )}

      {/* Provider Settings Modal */}
      <ProviderSettings
        isOpen={showProviderSettings}
        onClose={() => setShowProviderSettings(false)}
        router={router}
      />
    </div>
  );
};
