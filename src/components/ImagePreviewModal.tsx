import { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import type { TaskAttachment } from '../types';

interface ImagePreviewModalProps {
  attachment: TaskAttachment;
  onClose: () => void;
}

/**
 * ImagePreviewModal Component
 *
 * Full-size image preview modal.
 *
 * Features:
 * - Full-size image display
 * - Close button (top-right)
 * - Download button
 * - Click outside to close
 * - Keyboard Escape to close
 * - Dark overlay
 */
export default function ImagePreviewModal({ attachment, onClose }: ImagePreviewModalProps) {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      {/* Modal Content */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-3 px-4 py-2 bg-surface-dark rounded-t-lg">
          <h3 className="text-sm font-medium text-text-dark-primary truncate">
            {attachment.filename}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 rounded hover:bg-surface-dark-elevated transition-colors text-text-dark-secondary hover:text-accent-blue"
              title="Download"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-surface-dark-elevated transition-colors text-text-dark-secondary hover:text-text-dark-primary"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center bg-surface-dark rounded-b-lg p-4">
          <img
            src={attachment.dataUrl}
            alt={attachment.filename}
            className="max-w-full max-h-[calc(90vh-80px)] object-contain rounded"
          />
        </div>
      </div>
    </div>
  );
}
