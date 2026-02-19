/**
 * Terminal Help Modal
 * In-app help for AI Terminal and Phantom Shell
 */

import React, { useState } from 'react';

interface TerminalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpTab = 'quickstart' | 'providers' | 'shell' | 'troubleshooting';

export const TerminalHelpModal: React.FC<TerminalHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('quickstart');

  if (!isOpen) return null;

  const tabs: { id: HelpTab; label: string; icon: string }[] = [
    { id: 'quickstart', label: 'Quick Start', icon: '🚀' },
    { id: 'providers', label: 'AI Providers', icon: '🤖' },
    { id: 'shell', label: 'Shell Commands', icon: '⌨️' },
    { id: 'troubleshooting', label: 'Help', icon: '❓' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-dark border border-border-dark rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-dark">
          <h2 className="text-base font-semibold text-text-dark-primary">Terminal Help</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-dark-elevated rounded transition-colors text-sm"
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-dark">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent-primary border-b-2 border-accent-primary bg-surface-dark-elevated'
                  : 'text-text-dark-secondary hover:text-text-dark-primary hover:bg-surface-dark-elevated'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 text-xs text-text-dark-secondary">
          {activeTab === 'quickstart' && <QuickStartTab />}
          {activeTab === 'providers' && <ProvidersTab />}
          {activeTab === 'shell' && <ShellTab />}
          {activeTab === 'troubleshooting' && <TroubleshootingTab />}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border-dark text-[10px] text-text-dark-tertiary text-center">
          <a
            href="https://github.com/travisjneuman/neumanos/blob/main/docs/user/terminal-complete-guide.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            View Full Documentation →
          </a>
        </div>
      </div>
    </div>
  );
};

const QuickStartTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Two Modes</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="text-base mb-0.5">💬 AI Chat</div>
          <p className="text-[10px] text-text-dark-tertiary">
            Converse with AI models. Ask questions, get help with code, brainstorm ideas.
          </p>
        </div>
        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="text-base mb-0.5">⌨️ Phantom Shell</div>
          <p className="text-[10px] text-text-dark-tertiary">
            Run npm/node commands in browser. Build projects without installing anything.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Getting Started</h3>
      <ol className="list-decimal list-inside space-y-1 text-[11px]">
        <li>Click ⚙️ to open <strong>Provider Settings</strong></li>
        <li>Add an API key (we recommend <strong>OpenRouter</strong> - free!)</li>
        <li>Start chatting or switch to Shell tab</li>
      </ol>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Keyboard Shortcuts</h3>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>Open/Close Terminal</span>
          <kbd className="px-1 bg-surface-dark rounded">Ctrl+Shift+A</kbd>
        </div>
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>Send Message</span>
          <kbd className="px-1 bg-surface-dark rounded">Enter</kbd>
        </div>
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>New Line</span>
          <kbd className="px-1 bg-surface-dark rounded">Shift+Enter</kbd>
        </div>
        <div className="flex justify-between p-1.5 bg-surface-dark-elevated rounded">
          <span>Command History</span>
          <kbd className="px-1 bg-surface-dark rounded">↑ ↓</kbd>
        </div>
      </div>
    </section>
  </div>
);

const ProvidersTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Provider Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-left border-b border-border-dark">
              <th className="p-1.5">Provider</th>
              <th className="p-1.5">Free</th>
              <th className="p-1.5">Browser</th>
              <th className="p-1.5">Best For</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            <tr className="bg-accent-green/10">
              <td className="p-1.5 font-medium">OpenRouter</td>
              <td className="p-1.5">✅ Yes</td>
              <td className="p-1.5">✅ Direct</td>
              <td className="p-1.5">Best overall - 200+ models</td>
            </tr>
            <tr>
              <td className="p-1.5">Groq</td>
              <td className="p-1.5">✅ Yes</td>
              <td className="p-1.5">⚠️ Limited</td>
              <td className="p-1.5">Fastest responses</td>
            </tr>
            <tr>
              <td className="p-1.5">HuggingFace</td>
              <td className="p-1.5">✅ Yes</td>
              <td className="p-1.5">✅ Direct</td>
              <td className="p-1.5">Open source models</td>
            </tr>
            <tr className="bg-accent-blue/10">
              <td className="p-1.5 font-medium">Anthropic</td>
              <td className="p-1.5">❌ No</td>
              <td className="p-1.5">✅ Direct</td>
              <td className="p-1.5">Best quality (Claude)</td>
            </tr>
            <tr>
              <td className="p-1.5">OpenAI</td>
              <td className="p-1.5">❌ No</td>
              <td className="p-1.5">⚠️ Proxy</td>
              <td className="p-1.5">GPT-4, o1</td>
            </tr>
            <tr>
              <td className="p-1.5">DeepSeek</td>
              <td className="p-1.5">❌ No</td>
              <td className="p-1.5">⚠️ Proxy</td>
              <td className="p-1.5">Great value, coding</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">
        What Does "Proxy Required" Mean?
      </h3>
      <div className="p-2 bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg text-[10px]">
        <p className="mb-1">
          Some providers (OpenAI, xAI, DeepSeek) block direct browser requests for security (CORS).
        </p>
        <p className="font-medium text-accent-yellow mb-0.5">Easy Solution:</p>
        <p>
          Use <strong>OpenRouter</strong> instead - it provides access to GPT-4, Claude, and 200+ other
          models through one API that works directly in your browser.
        </p>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Free API Keys</h3>
      <ul className="space-y-0.5 text-[10px]">
        <li>
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
            OpenRouter →
          </a>{' '}
          <span className="text-text-dark-tertiary">Free tier, 200+ models</span>
        </li>
        <li>
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
            Groq →
          </a>{' '}
          <span className="text-text-dark-tertiary">Free tier, fastest inference</span>
        </li>
        <li>
          <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
            HuggingFace →
          </a>{' '}
          <span className="text-text-dark-tertiary">Free tier, open models</span>
        </li>
      </ul>
    </section>
  </div>
);

const ShellTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Built-in Commands</h3>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/help</span> - Show commands
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/version</span> - Boot WebContainer
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/clear</span> - Clear screen
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/new name</span> - New project
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/ai prompt</span> - Ask AI
        </div>
        <div className="p-1.5 bg-surface-dark-elevated rounded font-mono">
          <span className="text-accent-primary">/projects</span> - List projects
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">What Works vs Doesn't</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <div className="font-medium text-accent-green mb-0.5 text-[11px]">✅ Works</div>
          <ul className="text-[10px] space-y-0.5">
            <li><code>npm install</code>, <code>npm run dev</code></li>
            <li><code>node script.js</code></li>
            <li><code>npx create-react-app</code></li>
            <li><code>ls</code>, <code>cd</code>, <code>cat</code>, <code>mkdir</code></li>
          </ul>
        </div>
        <div className="p-2 bg-accent-red/10 border border-accent-red/20 rounded-lg">
          <div className="font-medium text-accent-red mb-0.5 text-[11px]">❌ Doesn't Work</div>
          <ul className="text-[10px] space-y-0.5">
            <li><code>git</code> - Use GitHub widget</li>
            <li><code>docker</code> - Not available</li>
            <li><code>python</code> - Use Node.js</li>
            <li><code>ping</code>, <code>curl</code> - No system calls</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">First Time?</h3>
      <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
        <li>Switch to <strong>Shell</strong> tab</li>
        <li>Run <code className="bg-surface-dark-elevated px-1 rounded">/version</code> to boot WebContainer (2-5 sec)</li>
        <li>Try <code className="bg-surface-dark-elevated px-1 rounded">node -v</code> to verify it works</li>
        <li>Run <code className="bg-surface-dark-elevated px-1 rounded">/new myapp</code> to create a project</li>
      </ol>
    </section>
  </div>
);

const TroubleshootingTab: React.FC = () => (
  <div className="space-y-3">
    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Common Issues</h3>

      <div className="space-y-2">
        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            "Proxy Required" on OpenAI/xAI
          </div>
          <p className="text-[10px] text-text-dark-tertiary mb-1">
            These providers block browser requests. Use OpenRouter instead - it can access GPT-4 and works directly.
          </p>
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-primary hover:underline">
            Get OpenRouter Key →
          </a>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            "WebContainer not ready"
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            Run <code className="bg-surface-dark px-1 rounded">/version</code> first. WebContainer takes 2-5 seconds to boot.
          </p>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            "ping" / "git" / "docker" doesn't work
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            WebContainer only supports Node.js. For git, use the GitHub widget. For networking, use
            <code className="bg-surface-dark px-1 rounded ml-1">node -e "fetch('url')"</code>
          </p>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            "Invalid API key"
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            Check: correct provider selected, key copied correctly (no spaces), key not expired/revoked.
          </p>
        </div>

        <div className="p-2 bg-surface-dark-elevated rounded-lg">
          <div className="font-medium text-text-dark-primary mb-0.5 text-[11px]">
            "Rate limit exceeded"
          </div>
          <p className="text-[10px] text-text-dark-tertiary">
            Wait a few minutes, or configure multiple providers for automatic fallback.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold text-text-dark-primary mb-1.5">Still Need Help?</h3>
      <ul className="space-y-0.5 text-[10px]">
        <li>
          <a
            href="https://github.com/travisjneuman/neumanos/blob/main/docs/user/terminal-complete-guide.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            📖 Full Documentation
          </a>
        </li>
        <li>
          <a
            href="https://github.com/travisjneuman/neumanos/blob/main/docs/user/backend-proxy-setup.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            🔧 Backend Proxy Setup (Advanced)
          </a>
        </li>
        <li>
          <a
            href="https://github.com/travisjneuman/neumanos/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            🐛 Report an Issue
          </a>
        </li>
      </ul>
    </section>
  </div>
);

export default TerminalHelpModal;
