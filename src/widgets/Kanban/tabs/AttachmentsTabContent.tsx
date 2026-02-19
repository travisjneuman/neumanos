import React from 'react';
import FileUpload from '../../../components/FileUpload';
import AttachmentList from '../../../components/AttachmentList';
import type { TaskAttachment } from '../../../types';

type CoverMode = 'fit' | 'fill';

interface AttachmentsTabContentProps {
  attachments: TaskAttachment[];
  coverMode?: CoverMode;
  onUpload: (file: { filename: string; fileType: string; fileSize: number; dataUrl: string }) => void;
  onDelete: (attachmentId: string) => void;
  onPreview: (attachment: TaskAttachment) => void;
  onCoverModeChange: (mode: CoverMode) => void;
}

/**
 * Attachments Tab Content
 * Handles file uploads, attachment list, and cover mode settings.
 */
export const AttachmentsTabContent: React.FC<AttachmentsTabContentProps> = ({
  attachments,
  coverMode,
  onUpload,
  onDelete,
  onPreview,
  onCoverModeChange,
}) => {
  const hasImageAttachments = attachments.some(a => a.fileType.startsWith('image/'));

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div>
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Upload Files
        </h4>
        <FileUpload onUpload={onUpload} />
      </div>

      {/* Attachment List */}
      <div>
        <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
          Attachments ({attachments.length})
        </h4>
        <AttachmentList
          attachments={attachments}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      </div>

      {/* Card Cover Mode Selector (only show when image attachments exist) */}
      {hasImageAttachments && (
        <div>
          <h4 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Card Cover Display
          </h4>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
            Choose how the first image appears on the card
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onCoverModeChange('fit')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                coverMode === 'fit' || !coverMode
                  ? 'bg-accent-blue text-white'
                  : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
            >
              Fit (show full image)
            </button>
            <button
              onClick={() => onCoverModeChange('fill')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                coverMode === 'fill'
                  ? 'bg-accent-blue text-white'
                  : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
              }`}
            >
              Fill (crop to fit)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
