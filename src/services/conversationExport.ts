/**
 * Conversation Export Service
 * Exports AI Terminal conversations to Markdown, JSON, or plain text
 */

import type { Message, Conversation } from '../stores/useTerminalStore';

/**
 * Export format options
 */
export type ExportFormat = 'markdown' | 'json' | 'text';

/**
 * Format a timestamp for export
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Export messages as Markdown
 */
function exportToMarkdown(
  messages: Message[],
  title: string,
  systemPrompt: string | null
): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`**Exported:** ${formatTimestamp(Date.now())}`);
  lines.push(`**Messages:** ${messages.length}`);
  lines.push('');

  if (systemPrompt) {
    lines.push('## System Prompt');
    lines.push('');
    lines.push(systemPrompt);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('## Conversation');
  lines.push('');

  for (const message of messages) {
    if (message.role === 'system') continue;

    const time = formatTimestamp(message.timestamp);
    const roleLabel = message.role === 'user' ? 'You' : 'AI';
    const modelInfo = message.provider && message.model
      ? ` (${message.provider}/${message.model})`
      : '';

    lines.push(`### ${roleLabel}${modelInfo}`);
    lines.push(`*${time}*`);
    lines.push('');
    lines.push(message.content);
    lines.push('');

    if (message.tokenUsage) {
      lines.push(`> Tokens: ${message.tokenUsage.totalTokens.toLocaleString()}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export messages as JSON
 */
function exportToJSON(
  messages: Message[],
  title: string,
  systemPrompt: string | null
): string {
  const exportData = {
    title,
    exportedAt: new Date().toISOString(),
    messageCount: messages.length,
    systemPrompt,
    messages: messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString(),
        provider: m.provider ?? null,
        model: m.model ?? null,
        tokenUsage: m.tokenUsage ?? null,
      })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export messages as plain text
 */
function exportToText(
  messages: Message[],
  title: string,
  systemPrompt: string | null
): string {
  const lines: string[] = [];

  lines.push(title);
  lines.push('='.repeat(title.length));
  lines.push('');
  lines.push(`Exported: ${formatTimestamp(Date.now())}`);
  lines.push(`Messages: ${messages.length}`);
  lines.push('');

  if (systemPrompt) {
    lines.push('System Prompt:');
    lines.push('-'.repeat(14));
    lines.push(systemPrompt);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  for (const message of messages) {
    if (message.role === 'system') continue;

    const time = formatTimestamp(message.timestamp);
    const roleLabel = message.role === 'user' ? 'You' : 'AI';

    lines.push(`[${time}] ${roleLabel}:`);
    lines.push(message.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Export a conversation in the specified format
 */
export function exportConversation(
  messages: Message[],
  title: string,
  format: ExportFormat,
  systemPrompt: string | null = null
): string {
  switch (format) {
    case 'markdown':
      return exportToMarkdown(messages, title, systemPrompt);
    case 'json':
      return exportToJSON(messages, title, systemPrompt);
    case 'text':
      return exportToText(messages, title, systemPrompt);
  }
}

/**
 * Get the file extension for an export format
 */
export function getExportExtension(format: ExportFormat): string {
  switch (format) {
    case 'markdown':
      return 'md';
    case 'json':
      return 'json';
    case 'text':
      return 'txt';
  }
}

/**
 * Get the MIME type for an export format
 */
export function getExportMimeType(format: ExportFormat): string {
  switch (format) {
    case 'markdown':
      return 'text/markdown';
    case 'json':
      return 'application/json';
    case 'text':
      return 'text/plain';
  }
}

/**
 * Download a conversation export as a file
 */
export function downloadConversationExport(
  messages: Message[],
  title: string,
  format: ExportFormat,
  systemPrompt: string | null = null
): void {
  const content = exportConversation(messages, title, format, systemPrompt);
  const extension = getExportExtension(format);
  const mimeType = getExportMimeType(format);

  // Sanitize filename
  const filename = `${title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}.${extension}`;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
