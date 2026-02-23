/**
 * NoteAttachmentsList - Panel showing attachments for the current note
 *
 * Displays file icon, name, size with download and delete actions.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNoteAttachmentsStore } from '../../stores/useNoteAttachmentsStore';
import type { NoteAttachment } from '../../stores/useNoteAttachmentsStore';
import { toast } from '../../stores/useToastStore';

interface NoteAttachmentsListProps {
  noteId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'img';
  if (fileType.startsWith('video/')) return 'vid';
  if (fileType.startsWith('audio/')) return 'aud';
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'doc';
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv'))
    return 'xls';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'ppt';
  if (fileType.includes('zip') || fileType.includes('compress') || fileType.includes('archive'))
    return 'zip';
  if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml'))
    return 'txt';
  return 'file';
}

function FileIcon({ type }: { type: string }) {
  const icon = getFileIcon(type);
  const colorMap: Record<string, string> = {
    img: 'text-green-500',
    vid: 'text-purple-500',
    aud: 'text-pink-500',
    pdf: 'text-red-500',
    doc: 'text-blue-500',
    xls: 'text-emerald-500',
    ppt: 'text-orange-500',
    zip: 'text-yellow-600',
    txt: 'text-gray-500',
    file: 'text-text-light-secondary dark:text-text-dark-secondary',
  };

  return (
    <div
      className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold uppercase bg-surface-light-elevated dark:bg-surface-dark-elevated ${colorMap[icon] || colorMap.file}`}
    >
      {icon}
    </div>
  );
}

function AttachmentRow({
  attachment,
  onDelete,
}: {
  attachment: NoteAttachment;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [attachment]);

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(attachment.id);
    setConfirmDelete(false);
  }, [attachment.id, confirmDelete, onDelete]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors group">
      <FileIcon type={attachment.fileType} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
          {attachment.fileName}
        </div>
        <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {formatFileSize(attachment.fileSize)}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="p-1.5 rounded hover:bg-accent-primary/10 text-accent-primary transition-colors"
          title="Download"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className={`p-1.5 rounded transition-colors ${
            confirmDelete
              ? 'bg-red-500/20 text-red-500'
              : 'hover:bg-red-500/10 text-text-light-secondary dark:text-text-dark-secondary hover:text-red-500'
          }`}
          title={confirmDelete ? 'Click again to confirm' : 'Delete'}
          onBlur={() => setConfirmDelete(false)}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const NoteAttachmentsList: React.FC<NoteAttachmentsListProps> = ({ noteId }) => {
  const attachments = useNoteAttachmentsStore((state) => state.getAttachmentsByNote(noteId));
  const deleteAttachment = useNoteAttachmentsStore((state) => state.deleteAttachment);
  const addAttachment = useNoteAttachmentsStore((state) => state.addAttachment);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDelete = useCallback(
    (id: string) => {
      deleteAttachment(id);
      toast.success('Attachment deleted', 'The file has been removed.');
    },
    [deleteAttachment],
  );

  const handleAddFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const result = await addAttachment(noteId, file);
        if (result) {
          toast.success('File attached', `"${file.name}" has been attached.`);
        } else {
          toast.error('Attachment failed', `Could not attach "${file.name}". Max 10MB.`);
        }
      }
    },
    [noteId, addAttachment],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handleAddFiles(files);
      }
    },
    [handleAddFiles],
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        await handleAddFiles(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleAddFiles],
  );

  if (attachments.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className="border-t border-border-light dark:border-border-dark">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          Attachments ({attachments.length})
        </span>
        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          &#9660;
        </span>
      </button>

      {isExpanded && (
        <div
          className={`px-4 pb-3 ${isDragOver ? 'bg-accent-primary/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {attachments.length > 0 && (
            <div className="space-y-1 mb-3">
              {attachments.map((attachment) => (
                <AttachmentRow
                  key={attachment.id}
                  attachment={attachment}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* Add attachment button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-primary hover:text-accent-primary transition-colors"
          >
            {isDragOver ? 'Drop files here' : 'Add attachment (or drag file here)'}
          </button>
        </div>
      )}
    </div>
  );
};
