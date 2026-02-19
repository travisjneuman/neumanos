import React, { useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const variantIcons: Record<string, string> = {
  danger: '🚨',
  warning: '⚠️',
  info: 'ℹ️',
};

/**
 * ConfirmDialog component for in-app confirmations
 * Replaces browser confirm() dialogs
 *
 * Keyboard shortcuts:
 * - Enter or D: Confirm/Delete
 * - Escape or C: Cancel (Escape is handled by Modal)
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}) => {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  // Global keyboard handler for the dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // D or Enter to confirm (D for "Delete")
      if (e.key === 'd' || e.key === 'D' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
      }

      // C to cancel (C for "Cancel")
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    // Use capture phase to get the event before other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleConfirm, onClose]);

  // Map dialog variant to button variant
  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        {/* Icon + Message */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-3xl">{variantIcons[variant]}</div>
          <div className="text-text-light-secondary dark:text-text-dark-secondary flex-1">{message}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
            <span className="ml-1.5 text-xs opacity-60">(C)</span>
          </Button>
          <Button variant={buttonVariant} onClick={handleConfirm} autoFocus>
            {confirmText}
            <span className="ml-1.5 text-xs opacity-60">(D)</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
