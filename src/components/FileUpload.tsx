import { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: {
    filename: string;
    fileType: string;
    fileSize: number;
    dataUrl: string;
  }) => void;
  maxSizeMB?: number;
  accept?: string;
}

const MAX_FILE_SIZE_MB = 10;

/**
 * FileUpload Component
 *
 * Drag-and-drop and click-to-browse file upload with validation.
 *
 * Features:
 * - Drag-and-drop zone with visual feedback
 * - Click-to-browse file selection
 * - File size validation (default 10MB limit)
 * - Base64 encoding for IndexedDB storage
 * - Upload progress/loading state
 * - Error handling with clear messages
 */
export default function FileUpload({
  onUpload,
  maxSizeMB = MAX_FILE_SIZE_MB,
  accept,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Convert File to base64 data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file upload
  const handleFile = async (file: File) => {
    setError(null);

    // Validate file size
    if (file.size > maxSizeBytes) {
      setError(
        `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds ${maxSizeMB}MB limit. Please compress or choose a smaller file.`
      );
      return;
    }

    // Warning for large files (>5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.warn(`Large file upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    }

    setIsUploading(true);

    try {
      const dataUrl = await fileToDataUrl(file);

      onUpload({
        filename: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataUrl,
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Open file browser
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Drag-and-Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${
            isDragging
              ? 'border-accent-blue bg-accent-blue/10'
              : 'border-border-light dark:border-border-dark hover:border-accent-blue hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Upload file"
      >
        {/* Icon */}
        <div className="flex justify-center mb-3">
          <Upload
            className={`w-12 h-12 ${
              isDragging
                ? 'text-accent-blue'
                : 'text-text-light-secondary dark:text-text-dark-secondary'
            }`}
          />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            {isUploading ? 'Uploading...' : isDragging ? 'Drop file here' : 'Drag & drop file here'}
          </p>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            or click to browse
          </p>
          <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Max {maxSizeMB}MB
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          accept={accept}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-status-error/10 border border-status-error rounded-lg">
          <AlertCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5" />
          <p className="text-sm text-status-error">{error}</p>
        </div>
      )}
    </div>
  );
}
