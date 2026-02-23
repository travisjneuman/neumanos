/**
 * DocumentEditor Component
 *
 * TipTap-based professional document editor for the Docs system.
 * Distinct from Notes (Lexical) - focused on polished, exportable documents.
 *
 * Features:
 * - Rich text formatting (bold, italic, underline, strikethrough)
 * - Headings (H1-H6)
 * - Lists (bullet, numbered, task)
 * - Tables with cell merging
 * - Images and links
 * - Text alignment
 * - Text colors and highlights
 * - Auto-save with debounce
 * - Page-based editing (simulated A4/Letter pages)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Typography from '@tiptap/extension-typography';
import { useDebouncedCallback } from 'use-debounce';
import { DocumentToolbar } from './DocumentToolbar';
import { FindReplaceBar } from './FindReplaceBar';
import { DocumentCommentPanel } from './DocumentCommentPanel';
import { CommentMark } from './tiptapCommentMark';
import { useDocCommentsStore } from '../../stores/useDocCommentsStore';
import { FileText, Scroll, MessageSquare } from 'lucide-react';

/** Page size presets (width x height in pixels at 96 DPI) */
type PageSize = 'letter' | 'a4' | 'legal';

const PAGE_SIZES: Record<PageSize, { width: number; height: number; label: string }> = {
  letter: { width: 816, height: 1056, label: 'Letter (8.5" × 11")' },
  a4: { width: 794, height: 1123, label: 'A4 (210mm × 297mm)' },
  legal: { width: 816, height: 1344, label: 'Legal (8.5" × 14")' },
};

interface DocumentEditorProps {
  /** Initial content as TipTap JSON string */
  content: string;
  /** Called when content changes (debounced) */
  onSave: (content: string) => void;
  /** Document title for accessibility */
  title: string;
  /** Document ID for linking comments */
  documentId?: string;
  /** Whether editor is read-only */
  readOnly?: boolean;
  /** Additional class names */
  className?: string;
  /** Enable page view mode (default: true) */
  pageView?: boolean;
  /** Page size preset (default: letter) */
  pageSize?: PageSize;
}

export function DocumentEditor({
  content,
  onSave,
  title,
  documentId,
  readOnly = false,
  className = '',
  pageView = true,
  pageSize = 'letter',
}: DocumentEditorProps) {
  // Track view mode toggle
  const [isPageView, setIsPageView] = useState(pageView);
  const [currentPageSize, setCurrentPageSize] = useState<PageSize>(pageSize);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState<'find' | 'replace'>('find');
  const [showComments, setShowComments] = useState(false);
  const pageDimensions = PAGE_SIZES[currentPageSize];
  const addComment = useDocCommentsStore((s) => s.addComment);

  // Parse initial content
  const initialContent = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch {
      // Fallback to empty document
      return {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      };
    }
  }, []);

  // Debounced save handler (1 second delay)
  const debouncedSave = useDebouncedCallback((json: string) => {
    onSave(json);
  }, 1000);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some defaults we'll configure separately
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start typing your document...',
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent-primary hover:underline cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border-light dark:border-border-dark',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border-light dark:border-border-dark p-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border-light dark:border-border-dark p-2 bg-surface-light-alt dark:bg-surface-dark font-semibold',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Typography,
      CommentMark.configure({
        HTMLAttributes: {},
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[500px] p-6',
        'aria-label': `Document editor for ${title}`,
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      debouncedSave(json);
    },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, []);

  // Handle image insertion via URL
  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // Handle link insertion
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Handle table insertion
  const insertTable = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  // Handle comment insertion
  const addCommentToSelection = useCallback(() => {
    if (!editor || !documentId) return;

    const { from, to } = editor.state.selection;
    if (from === to) return; // No text selected

    const commentText = window.prompt('Add a comment:');
    if (!commentText?.trim()) return;

    const commentId = crypto.randomUUID();
    editor.commands.setComment(commentId);
    addComment(documentId, commentId, commentText.trim());
    setShowComments(true);
  }, [editor, documentId, addComment]);

  // Keyboard shortcuts for Find & Replace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFindReplaceMode('find');
        setShowFindReplace(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setFindReplaceMode('replace');
        setShowFindReplace(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-text-light-tertiary dark:text-text-dark-tertiary">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className={`document-editor flex flex-col h-full ${className}`}>
      {/* Sticky Toolbar */}
      {!readOnly && (
        <div className="sticky top-0 z-20 flex items-center gap-2 bg-surface-light dark:bg-surface-dark">
          <div className="flex-1 min-w-0">
            <DocumentToolbar
              editor={editor}
              documentTitle={title}
              onAddImage={addImage}
              onSetLink={setLink}
              onInsertTable={insertTable}
            />
          </div>

          {/* Comment button */}
          {documentId && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={addCommentToSelection}
                title="Add comment to selection"
                className="p-1.5 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                title="Toggle comments panel"
                className={`p-1.5 rounded transition-colors ${
                  showComments
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex items-center gap-1 px-2 py-1.5 shrink-0 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg">
            <button
              onClick={() => setIsPageView(false)}
              title="Continuous scroll"
              className={`p-1.5 rounded transition-colors ${
                !isPageView
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
              }`}
              aria-pressed={!isPageView}
            >
              <Scroll className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPageView(true)}
              title="Page view"
              className={`p-1.5 rounded transition-colors ${
                isPageView
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
              }`}
              aria-pressed={isPageView}
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Page size selector (only in page view) */}
            {isPageView && (
              <select
                value={currentPageSize}
                onChange={(e) => setCurrentPageSize(e.target.value as PageSize)}
                className="ml-1 px-2 py-1 text-xs bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-text-light-secondary dark:text-text-dark-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                aria-label="Page size"
              >
                {Object.entries(PAGE_SIZES).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Find & Replace Bar */}
      {showFindReplace && editor && (
        <div className="sticky top-[48px] z-20 px-4 py-2 bg-surface-light dark:bg-surface-dark">
          <FindReplaceBar
            editor={editor}
            showReplace={findReplaceMode === 'replace'}
            onClose={() => setShowFindReplace(false)}
          />
        </div>
      )}

      {/* Editor content - Page view or continuous scroll */}
      <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-auto bg-neutral-200 dark:bg-neutral-800">
        {isPageView ? (
          /* Page view: Simulated paper pages */
          <div className="flex flex-col items-center py-8 px-4 min-h-full">
            <div
              className="bg-surface-light dark:bg-surface-dark-elevated shadow-lg transition-all duration-200"
              style={{
                width: `${pageDimensions.width}px`,
                minHeight: `${pageDimensions.height}px`,
              }}
            >
              {/* Page content with margins */}
              <div className="p-12">
                <EditorContent editor={editor} />
              </div>
            </div>
            {/* Page indicator */}
            <div className="mt-4 text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              {pageDimensions.label}
            </div>
          </div>
        ) : (
          /* Continuous scroll view */
          <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark min-h-full">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      {/* Comment Panel */}
      {showComments && documentId && editor && (
        <DocumentCommentPanel
          documentId={documentId}
          editor={editor}
          onClose={() => setShowComments(false)}
        />
      )}
      </div>
    </div>
  );
}

export default DocumentEditor;
