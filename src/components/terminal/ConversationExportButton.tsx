/**
 * Conversation Export Button
 * Dropdown for exporting conversations in various formats
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import { downloadConversationExport, type ExportFormat } from '../../services/conversationExport';
import { Download, FileText, FileJson, FileType, X } from 'lucide-react';

interface ConversationExportButtonProps {
  className?: string;
}

const EXPORT_OPTIONS: Array<{ format: ExportFormat; label: string; icon: React.ReactNode; description: string }> = [
  {
    format: 'markdown',
    label: 'Markdown (.md)',
    icon: <FileText size={14} />,
    description: 'Formatted with headings and code blocks',
  },
  {
    format: 'json',
    label: 'JSON (.json)',
    icon: <FileJson size={14} />,
    description: 'Structured data with metadata',
  },
  {
    format: 'text',
    label: 'Plain Text (.txt)',
    icon: <FileType size={14} />,
    description: 'Simple text format',
  },
];

export const ConversationExportButton: React.FC<ConversationExportButtonProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const messages = useTerminalStore((s) => s.messages);
  const activeConversationId = useTerminalStore((s) => s.activeConversationId);
  const conversations = useTerminalStore((s) => s.conversations);
  const customSystemPrompt = useTerminalStore((s) => s.customSystemPrompt);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleExport = useCallback((format: ExportFormat) => {
    const conversation = activeConversationId ? conversations[activeConversationId] : null;
    const title = conversation?.title ?? `AI Chat ${new Date().toLocaleDateString()}`;

    downloadConversationExport(messages, title, format, customSystemPrompt);
    setIsOpen(false);
  }, [messages, activeConversationId, conversations, customSystemPrompt]);

  if (messages.length === 0) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-surface-dark-elevated rounded transition-all text-text-dark-secondary hover:text-accent-blue"
        title="Export Conversation"
        aria-label="Export conversation"
      >
        <Download size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-surface-dark-elevated border border-border-dark rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-dark">
            <span className="text-xs font-medium text-text-dark-primary">Export As</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 hover:bg-surface-dark rounded text-text-dark-secondary"
            >
              <X size={12} />
            </button>
          </div>
          <div className="p-1">
            {EXPORT_OPTIONS.map(({ format, label, icon, description }) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full flex items-start gap-2 px-3 py-2 rounded text-left hover:bg-surface-dark transition-all group"
              >
                <span className="text-text-dark-secondary group-hover:text-accent-blue mt-0.5 flex-shrink-0">
                  {icon}
                </span>
                <div>
                  <div className="text-xs font-medium text-text-dark-primary group-hover:text-accent-blue">
                    {label}
                  </div>
                  <div className="text-[10px] text-text-dark-tertiary">
                    {description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
