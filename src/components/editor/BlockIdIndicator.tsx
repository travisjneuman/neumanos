/**
 * BlockIdIndicator Component
 *
 * Shows block ID on hover with copy-to-clipboard functionality
 * Used for headings and manual block IDs (^block-id)
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { createBlockReference } from '../../utils/blockReferences';

interface BlockIdIndicatorProps {
  blockId: string;
  noteTitle: string;
  className?: string;
}

export function BlockIdIndicator({ blockId, noteTitle, className = '' }: BlockIdIndicatorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const blockRef = createBlockReference(noteTitle, blockId);

    try {
      await navigator.clipboard.writeText(blockRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy block reference:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        group/block-id inline-flex items-center gap-1 px-1.5 py-0.5 
        text-xs rounded
        bg-surface-light/50 hover:bg-surface-light
        text-text-light-secondary hover:text-text-light-primary
        border border-border-light/30
        transition-all duration-200
        ${className}
      `}
      title="Click to copy block reference"
      aria-label={`Copy block reference: ${blockId}`}
    >
      <span className="font-mono">#{blockId}</span>
      {copied ? (
        <Check className="w-3 h-3 text-accent-green" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover/block-id:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
