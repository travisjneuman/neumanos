import { useState } from 'react';
import { Download, Trash2, Eye, FileText } from 'lucide-react';
import type { TaskAttachment } from '../types';

interface AttachmentListProps {
  attachments: TaskAttachment[];
  onDelete: (attachmentId: string) => void;
  onPreview?: (attachment: TaskAttachment) => void;
}

// File type icons based on MIME type
const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (
    fileType.includes('word') ||
    fileType.includes('document') ||
    fileType === 'text/plain' ||
    fileType === 'text/markdown'
  )
    return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv')
    return '📊';
  if (
    fileType.includes('zip') ||
    fileType.includes('tar') ||
    fileType.includes('rar') ||
    fileType.includes('gz')
  )
    return '📦';
  if (
    fileType.includes('javascript') ||
    fileType.includes('typescript') ||
    fileType.includes('python') ||
    fileType.includes('java') ||
    fileType.includes('cpp')
  )
    return '💻';
  return '📎';
};

// Format file size to human-readable
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Format upload date to relative time
const formatUploadDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

/**
 * AttachmentList Component
 *
 * Displays list of file attachments with actions.
 *
 * Features:
 * - Shows filename, size, type icon, upload date
 * - Image thumbnails (max 200px width)
 * - Download button (triggers browser download)
 * - Delete button (with confirmation)
 * - Preview button for images
 * - Empty state message
 */
export default function AttachmentList({ attachments, onDelete, onPreview }: AttachmentListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Handle download
  const handleDownload = (attachment: TaskAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle delete with confirmation
  const handleDelete = (attachmentId: string) => {
    if (confirmDelete === attachmentId) {
      onDelete(attachmentId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(attachmentId);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => {
        setConfirmDelete(null);
      }, 3000);
    }
  };

  // Handle preview
  const handlePreview = (attachment: TaskAttachment) => {
    if (attachment.fileType.startsWith('image/') && onPreview) {
      onPreview(attachment);
    } else if (attachment.fileType === 'application/pdf') {
      // Open PDF in new tab
      window.open(attachment.dataUrl, '_blank');
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No attachments yet</p>
        <p className="text-xs mt-1">Upload files using the form above</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => {
        const isImage = attachment.fileType.startsWith('image/');
        const isPdf = attachment.fileType === 'application/pdf';
        const icon = getFileIcon(attachment.fileType);

        return (
          <div
            key={attachment.id}
            className="border border-border-light dark:border-border-dark rounded-lg p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated hover:border-accent-blue transition-colors"
          >
            {/* Header: Icon + Filename + Actions */}
            <div className="flex items-start gap-3 mb-2">
              {/* Icon */}
              <div className="text-2xl shrink-0">{icon}</div>

              {/* Filename + Metadata */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                  {attachment.filename}
                </h4>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                  {formatFileSize(attachment.fileSize)} • {formatUploadDate(attachment.uploadedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Preview Button (Images & PDFs) */}
                {(isImage || isPdf) && (
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="p-1.5 rounded hover:bg-surface-light dark:hover:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue transition-colors"
                    title={isPdf ? 'Open in new tab' : 'Preview'}
                    aria-label={isPdf ? 'Open in new tab' : 'Preview'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}

                {/* Download Button */}
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1.5 rounded hover:bg-surface-light dark:hover:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue transition-colors"
                  title="Download"
                  aria-label="Download"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className={`p-1.5 rounded transition-colors ${
                    confirmDelete === attachment.id
                      ? 'bg-status-error text-white'
                      : 'hover:bg-surface-light dark:hover:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:text-status-error'
                  }`}
                  title={confirmDelete === attachment.id ? 'Click again to confirm' : 'Delete'}
                  aria-label={confirmDelete === attachment.id ? 'Click again to confirm' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Thumbnail */}
            {isImage && (
              <div className="mt-2">
                <img
                  src={attachment.dataUrl}
                  alt={attachment.filename}
                  className="max-w-full max-h-48 rounded border border-border-light dark:border-border-dark cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handlePreview(attachment)}
                  style={{ maxWidth: '200px' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
