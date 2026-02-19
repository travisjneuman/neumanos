/**
 * NotePreviewPopover Component
 *
 * Displays note preview on hover over wiki links
 * Shows title, content preview, tags, and last modified date
 */

import { useEffect, useRef, useState } from 'react';
import { Calendar, Tag } from 'lucide-react';
import type { NotePreview } from '../types/notes';
import { formatDistanceToNow } from 'date-fns';

interface NotePreviewPopoverProps {
  preview: NotePreview | null;
  position: { top: number; left: number } | null;
  isLoading?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function NotePreviewPopover({
  preview,
  position,
  isLoading = false,
  onMouseEnter,
  onMouseLeave,
}: NotePreviewPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to prevent going off-screen
  useEffect(() => {
    if (!position || !popoverRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const popover = popoverRef.current;
    const rect = popover.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let { top, left } = position;

    // Adjust horizontal position if going off right edge
    if (left + rect.width > viewport.width - 20) {
      left = viewport.width - rect.width - 20;
    }

    // Adjust horizontal position if going off left edge
    if (left < 20) {
      left = 20;
    }

    // Adjust vertical position if going off bottom edge
    if (top + rect.height > viewport.height - 20) {
      top = viewport.height - rect.height - 20;
    }

    // Adjust vertical position if going off top edge
    if (top < 20) {
      top = 20;
    }

    setAdjustedPosition({ top, left });
  }, [position, preview]);

  if (!position || (!preview && !isLoading)) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg pointer-events-auto"
      style={{
        top: adjustedPosition?.top ?? position.top,
        left: adjustedPosition?.left ?? position.left,
        maxWidth: '400px',
        maxHeight: '300px',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isLoading ? (
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="ml-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Loading preview...
          </span>
        </div>
      ) : preview ? (
        <div className="p-4 space-y-3 overflow-y-auto max-h-[300px]">
          {/* Title */}
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary line-clamp-2">
            {preview.title}
          </h3>

          {/* Content Preview */}
          <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap">
            {preview.blockContent ? (
              // Block preview with context
              <div className="border-l-2 border-primary/30 pl-2">
                {preview.blockContent}
              </div>
            ) : (
              // Regular note preview
              <div className="line-clamp-5">{preview.content}</div>
            )}
          </div>

          {/* Tags */}
          {preview.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-text-light-tertiary dark:text-text-dark-tertiary" />
              {preview.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-xs rounded bg-surface-dark/10 dark:bg-surface-light/10 text-text-light-secondary dark:text-text-dark-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Last Modified */}
          <div className="flex items-center gap-1.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Updated {formatDistanceToNow(new Date(preview.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
