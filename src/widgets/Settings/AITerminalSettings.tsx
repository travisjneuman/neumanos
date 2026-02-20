/**
 * AI Terminal Settings Component
 *
 * Multi-provider AI configuration information and setup instructions.
 * Actual provider configuration is done via the AI Terminal's settings modal.
 */

import React from 'react';
export const AITerminalSettings: React.FC = () => {
  return (
    <div className="bento-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🤖</span>
        <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          AI Terminal
        </h2>
      </div>

      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        Multi-provider AI assistant with 8 providers including free options. Automatic fallback ensures reliability.
      </p>

      {/* Quick Info */}
      <div className="mb-6 p-4 bg-status-info-bg dark:bg-status-info-bg-dark border border-status-info-border dark:border-status-info-border-dark rounded-lg">
        <p className="text-sm text-status-info-text dark:text-status-info-text-dark mb-2">
          <strong>🎯 New Multi-Provider System</strong>
        </p>
        <ul className="text-xs text-status-info-text dark:text-status-info-text-dark space-y-1">
          <li>• Choose from 8 AI providers (OpenRouter, Groq, HuggingFace, Mistral, Gemini, OpenAI, Claude, Grok)</li>
          <li>• Free models available (OpenRouter, Groq, HuggingFace, Mistral)</li>
          <li>• Automatic fallback if primary provider fails</li>
          <li>• Encrypted API key storage with password protection</li>
          <li>• Usage tracking per provider</li>
        </ul>
      </div>

      {/* Configure Providers Button */}
      <div className="space-y-4">
        <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
          Click the AI Terminal button in the bottom-right corner, then click ⚙️ Settings to configure providers.
        </p>

        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
          <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
            How to set up:
          </p>
          <ol className="text-sm text-text-light-secondary dark:text-text-dark-secondary space-y-1 list-decimal list-inside">
            <li>Open the AI Terminal (🤖 button in bottom-right)</li>
            <li>Click the ⚙️ Settings button in the terminal header</li>
            <li>Add API keys for your preferred providers</li>
            <li>Select your model using the 🔀 button</li>
            <li>Start chatting!</li>
          </ol>
        </div>

        {/* Free Provider Quick Links */}
        <div className="p-4 bg-status-success-bg dark:bg-status-success-bg-dark border border-status-success-border dark:border-status-success-border-dark rounded-lg">
          <p className="text-sm font-semibold text-status-success-text dark:text-status-success-text-dark mb-2">
            Free Provider API Keys:
          </p>
          <ul className="text-sm text-status-success-text dark:text-status-success-text-dark space-y-1">
            <li>
              • <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">OpenRouter</a> - Access 200+ models (Llama 3.3, Gemini 2.0)
            </li>
            <li>
              • <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Groq</a> - Lightning-fast inference
            </li>
            <li>
              • <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">HuggingFace</a> - Thousands of open models
            </li>
            <li>
              • <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Mistral</a> - European AI provider
            </li>
          </ul>
        </div>

      </div>

      {/* Features List */}
      <div className="mt-6 p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg">
        <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          What can the AI Terminal do?
        </p>
        <ul className="text-sm text-text-light-secondary dark:text-text-dark-secondary space-y-1">
          <li>💬 Answer questions on any topic</li>
          <li>💻 Generate and explain code (React, TypeScript, JavaScript)</li>
          <li>🔧 Help debug errors and issues</li>
          <li>📝 Assist with productivity and planning</li>
          <li>🔄 Automatic fallback if provider fails</li>
          <li>📊 Track usage across all providers</li>
        </ul>
      </div>
    </div>
  );
};
