/**
 * FileAttachmentPlugin - Lexical plugin for file attachments
 *
 * Handles drag-and-drop of non-image files, storing them as attachments.
 * Images are handled by the existing ImageUploadPlugin; this plugin
 * catches other file types and stores them via the attachments store.
 * Also listens for /attach slash command to trigger file picker.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useNoteAttachmentsStore } from '../../../stores/useNoteAttachmentsStore';
import { toast } from '../../../stores/useToastStore';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface FileAttachmentPluginProps {
  noteId: string;
}

export default function FileAttachmentPlugin({ noteId }: FileAttachmentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addAttachment = useNoteAttachmentsStore((state) => state.addAttachment);

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Filter out images (those are handled by ImageUploadPlugin)
      const nonImageFiles = files.filter((f) => !f.type.startsWith('image/'));
      if (nonImageFiles.length === 0) return;

      for (const file of nonImageFiles) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(
            'File too large',
            `"${file.name}" exceeds the 10MB limit.`,
          );
          continue;
        }

        const attachment = await addAttachment(noteId, file);
        if (attachment) {
          toast.success('File attached', `"${file.name}" has been attached to this note.`);
        } else {
          toast.error('Attachment failed', `Could not attach "${file.name}".`);
        }
      }
    },
    [noteId, addAttachment],
  );

  // Drag and drop handlers on the editor root
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        // Check if any non-image files
        const items = Array.from(e.dataTransfer.items || []);
        const hasNonImage = items.some((item) => !item.type.startsWith('image/'));
        if (hasNonImage) {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.target === rootElement) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files || []);
      await handleFiles(files);
    };

    rootElement.addEventListener('dragenter', handleDragEnter);
    rootElement.addEventListener('dragover', handleDragOver);
    rootElement.addEventListener('dragleave', handleDragLeave);
    rootElement.addEventListener('drop', handleDrop);

    return () => {
      rootElement.removeEventListener('dragenter', handleDragEnter);
      rootElement.removeEventListener('dragover', handleDragOver);
      rootElement.removeEventListener('dragleave', handleDragLeave);
      rootElement.removeEventListener('drop', handleDrop);
    };
  }, [editor, isDragging, handleFiles]);

  // Listen for /attach slash command
  useEffect(() => {
    return editor.registerTextContentListener((text) => {
      if (text.endsWith('/attach')) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const textContent = node.getTextContent();
            if (textContent.endsWith('/attach') && 'setTextContent' in node) {
              const newText = textContent.slice(0, -'/attach'.length);
              (node as unknown as { setTextContent(text: string): void }).setTextContent(newText);
            }
          }
        });

        // Trigger file picker
        if (!fileInputRef.current) {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.style.display = 'none';
          document.body.appendChild(input);
          fileInputRef.current = input;
        }

        const input = fileInputRef.current;
        input.onchange = async () => {
          const files = Array.from(input.files || []);
          if (files.length > 0) {
            await handleFiles(files);
          }
          input.value = '';
        };
        input.click();
      }
    });
  }, [editor, handleFiles]);

  // Cleanup file input on unmount
  useEffect(() => {
    return () => {
      if (fileInputRef.current && fileInputRef.current.parentNode) {
        fileInputRef.current.parentNode.removeChild(fileInputRef.current);
        fileInputRef.current = null;
      }
    };
  }, []);

  if (isDragging) {
    return (
      <div className="absolute inset-0 z-50 bg-accent-primary/10 border-2 border-dashed border-accent-primary rounded-lg flex items-center justify-center pointer-events-none">
        <div className="bg-surface-light dark:bg-surface-dark px-6 py-4 rounded-lg shadow-elevated">
          <p className="text-accent-primary text-lg font-semibold">Drop file to attach</p>
        </div>
      </div>
    );
  }

  return null;
}
