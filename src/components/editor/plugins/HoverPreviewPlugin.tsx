/**
 * HoverPreviewPlugin
 *
 * Shows note preview popover on hover over wiki links
 * - Debounces hover (500ms)
 * - Caches previews (LRU, max 20)
 * - Positions popover to avoid going off-screen
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import type { LexicalNode } from 'lexical';
import { $isWikiLinkNode } from '../WikiLinkNode';
import { NotePreviewPopover } from '../../NotePreviewPopover';
import { NOTE_CONSTANTS } from '../../../types/notes';
import type { Note, NotePreview } from '../../../types/notes';
import { createNotePreview, PreviewCache } from '../../../utils/notePreview';

interface HoverPreviewPluginProps {
  notes: Record<string, Note>;
}

export default function HoverPreviewPlugin({ notes }: HoverPreviewPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [preview, setPreview] = useState<NotePreview | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef(new PreviewCache());
  const isHoveringPopoverRef = useRef(false);

  // Handle mouse enter on wiki link
  const handleMouseEnter = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.classList.contains('wiki-link')) return;

      // Clear any existing hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // Debounce: Wait 500ms before showing preview
      hoverTimeoutRef.current = setTimeout(() => {
        showPreview(target);
      }, NOTE_CONSTANTS.HOVER_DEBOUNCE_MS);
    },
    [notes, editor]
  );

  // Handle mouse leave from wiki link
  const handleMouseLeave = useCallback(() => {
    // Clear hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Don't hide preview if hovering over popover itself
    setTimeout(() => {
      if (!isHoveringPopoverRef.current) {
        hidePreview();
      }
    }, 100);
  }, []);

  // Show preview for a wiki link element
  const showPreview = useCallback(
    (linkElement: HTMLElement) => {
      // Get link title and block ID from DOM
      let linkTitle = '';
      let blockId: string | undefined;

      editor.getEditorState().read(() => {
        const root = $getRoot();

        root.getChildren().forEach((node) => {
          if ('getChildren' in node && typeof node.getChildren === 'function') {
            (node.getChildren() as LexicalNode[]).forEach((child: LexicalNode) => {
              if ($isWikiLinkNode(child)) {
                const dom = editor.getElementByKey(child.getKey());
                if (dom === linkElement) {
                  linkTitle = child.getLinkTitle();
                  blockId = child.getBlockId();
                }
              }
            });
          }
        });
      });

      if (!linkTitle) return;

      // Find target note
      const notesArray = Object.values(notes);
      const linkTitleLower = linkTitle.toLowerCase();
      const targetNote = notesArray.find(
        (note) =>
          note.title.toLowerCase() === linkTitleLower ||
          note.title.toLowerCase().startsWith(linkTitleLower)
      );

      if (!targetNote) {
        // Broken link - no preview
        return;
      }

      // Check cache
      const cacheKey = PreviewCache.createKey(targetNote.id, blockId);
      const cachedPreview = cacheRef.current.get(cacheKey);

      if (cachedPreview) {
        // Use cached preview
        setPreview(cachedPreview);
        setPosition(getPopoverPosition(linkElement));
        setIsLoading(false);
        return;
      }

      // Generate new preview
      setIsLoading(true);
      setPosition(getPopoverPosition(linkElement));

      // Simulate async preview generation (could be slow for large notes)
      setTimeout(() => {
        const newPreview = createNotePreview(targetNote, blockId);
        cacheRef.current.set(cacheKey, newPreview);
        setPreview(newPreview);
        setIsLoading(false);
      }, 50);
    },
    [notes, editor]
  );

  // Hide preview
  const hidePreview = useCallback(() => {
    setPreview(null);
    setPosition(null);
    setIsLoading(false);
  }, []);

  // Get popover position near link element
  const getPopoverPosition = (element: HTMLElement): { top: number; left: number } => {
    const rect = element.getBoundingClientRect();

    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    };
  };

  // Attach event listeners
  useEffect(() => {
    const editorContainer = editor.getRootElement();
    if (!editorContainer) return;

    editorContainer.addEventListener('mouseenter', handleMouseEnter, true);
    editorContainer.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      editorContainer.removeEventListener('mouseenter', handleMouseEnter, true);
      editorContainer.removeEventListener('mouseleave', handleMouseLeave, true);

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [editor, handleMouseEnter, handleMouseLeave]);

  return (
    <NotePreviewPopover
      preview={preview}
      position={position}
      isLoading={isLoading}
      onMouseEnter={() => {
        isHoveringPopoverRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveringPopoverRef.current = false;
        hidePreview();
      }}
    />
  );
}
