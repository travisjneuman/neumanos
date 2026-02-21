/**
 * Token Usage Bar
 * Displays token usage for the current conversation and per-message
 */

import React, { useMemo } from 'react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import type { TokenUsage } from '../../stores/useTerminalStore';

interface TokenUsageBarProps {
  /** Show detailed per-message breakdown */
  detailed?: boolean;
}

/**
 * Format token count for display
 */
function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toLocaleString();
}

/**
 * Format cost for display
 */
function formatCost(cost: number): string {
  if (cost < 0.001) return '<$0.001';
  if (cost < 0.01) return `~$${cost.toFixed(3)}`;
  return `~$${cost.toFixed(2)}`;
}

/**
 * Inline token usage display for a single message
 */
export const MessageTokenBadge: React.FC<{ usage: TokenUsage }> = ({ usage }) => {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-text-dark-tertiary">
      <span title={`Prompt: ${usage.promptTokens} | Completion: ${usage.completionTokens}`}>
        {formatTokens(usage.totalTokens)} tokens
      </span>
      {usage.estimatedCost !== undefined && usage.estimatedCost > 0 && (
        <>
          <span className="opacity-40">|</span>
          <span>{formatCost(usage.estimatedCost)}</span>
        </>
      )}
    </span>
  );
};

/**
 * Conversation-level token usage summary bar
 */
export const TokenUsageBar: React.FC<TokenUsageBarProps> = ({ detailed = false }) => {
  const messages = useTerminalStore((s) => s.messages);

  const stats = useMemo(() => {
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let messagesWithUsage = 0;

    for (const msg of messages) {
      if (msg.tokenUsage) {
        totalPromptTokens += msg.tokenUsage.promptTokens;
        totalCompletionTokens += msg.tokenUsage.completionTokens;
        totalTokens += msg.tokenUsage.totalTokens;
        totalCost += msg.tokenUsage.estimatedCost ?? 0;
        messagesWithUsage++;
      }
    }

    return { totalPromptTokens, totalCompletionTokens, totalTokens, totalCost, messagesWithUsage };
  }, [messages]);

  if (stats.messagesWithUsage === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-surface-dark-elevated/50 border-t border-border-dark/50 text-[10px] text-text-dark-tertiary font-mono">
      <span title={`Prompt: ${formatTokens(stats.totalPromptTokens)} | Completion: ${formatTokens(stats.totalCompletionTokens)}`}>
        Tokens: {formatTokens(stats.totalTokens)}
      </span>
      {stats.totalCost > 0 && (
        <>
          <span className="opacity-30">|</span>
          <span>Cost: {formatCost(stats.totalCost)}</span>
        </>
      )}
      {detailed && (
        <>
          <span className="opacity-30">|</span>
          <span>In: {formatTokens(stats.totalPromptTokens)}</span>
          <span className="opacity-30">|</span>
          <span>Out: {formatTokens(stats.totalCompletionTokens)}</span>
        </>
      )}
    </div>
  );
};
