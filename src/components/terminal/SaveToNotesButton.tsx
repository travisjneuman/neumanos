/**
 * SaveToNotesButton Component
 *
 * Hover action button for saving AI Terminal messages to Notes.
 * Opens a centered modal within the AI Terminal sidebar using Portal.
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Check } from 'lucide-react';
import type { Message } from '../../stores/useTerminalStore';
import { SaveToNotesPopover } from './SaveToNotesPopover';

/**
 * Portal target ID for AI Terminal modals.
 * Must match the id attribute in AITerminal.tsx
 */
export const AI_TERMINAL_MODAL_ROOT_ID = 'ai-terminal-modal-root';

interface SaveToNotesButtonProps {
  /** The message to save */
  message: Message;
  /** Optional: The prompt that preceded this message (for AI responses) */
  promptMessage?: Message;
  /** Optional: Additional CSS classes */
  className?: string;
}

export const SaveToNotesButton: React.FC<SaveToNotesButtonProps> = ({
  message,
  promptMessage,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  }, []);

  const handleSaveComplete = useCallback(() => {
    setIsModalOpen(false);
    setJustSaved(true);
    // Reset the saved state after animation
    setTimeout(() => setJustSaved(false), 2000);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Find the portal target - must exist within AITerminal
  const portalTarget = typeof document !== 'undefined'
    ? document.getElementById(AI_TERMINAL_MODAL_ROOT_ID)
    : null;

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          p-1.5 rounded-md transition-all duration-200
          ${justSaved
            ? 'text-accent-green bg-accent-green/10'
            : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-blue hover:bg-accent-blue/10'
          }
          focus:outline-none focus:ring-2 focus:ring-accent-blue/50
          ${className}
        `}
        title={justSaved ? 'Saved to notes' : 'Save to notes'}
        aria-label={justSaved ? 'Saved to notes' : 'Save to notes'}
      >
        {justSaved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>

      {isModalOpen && portalTarget && createPortal(
        <SaveToNotesPopover
          message={message}
          promptMessage={promptMessage}
          onClose={handleClose}
          onSaveComplete={handleSaveComplete}
        />,
        portalTarget
      )}
    </>
  );
};

export default SaveToNotesButton;
