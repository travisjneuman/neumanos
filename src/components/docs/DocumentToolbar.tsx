/**
 * DocumentToolbar Component
 *
 * Toolbar for the TipTap document editor with formatting controls.
 * Organized into logical groups: text formatting, paragraphs, lists, inserts.
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image,
  Link,
  Table,
  Minus,
  Undo,
  Redo,
  Palette,
  Download,
} from 'lucide-react';
import { exportDocument, EXPORT_FORMATS, type ExportFormat } from './documentExport';

interface DocumentToolbarProps {
  editor: Editor;
  documentTitle: string;
  onAddImage: () => void;
  onSetLink: () => void;
  onInsertTable: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : isActive
          ? 'bg-accent-primary/10 text-accent-primary'
          : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark hover:text-text-light-primary dark:hover:text-text-dark-primary'
      }`}
      aria-pressed={isActive}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="w-px h-6 bg-border-light dark:bg-border-dark mx-1" />
  );
}

// Color presets for text color
const TEXT_COLORS = [
  { name: 'Default', value: null },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
];

// Highlight colors
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FEF08A' },
  { name: 'Green', value: '#BBF7D0' },
  { name: 'Blue', value: '#BFDBFE' },
  { name: 'Purple', value: '#DDD6FE' },
  { name: 'Pink', value: '#FBCFE8' },
];

export function DocumentToolbar({
  editor,
  documentTitle,
  onAddImage,
  onSetLink,
  onInsertTable,
}: DocumentToolbarProps) {
  // Handle document export
  const handleExport = useCallback(
    (format: ExportFormat) => {
      exportDocument(editor, documentTitle, format);
    },
    [editor, documentTitle]
  );

  // Set text color
  const setColor = useCallback(
    (color: string | null) => {
      if (color === null) {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
    },
    [editor]
  );

  // Set highlight color
  const setHighlight = useCallback(
    (color: string) => {
      editor.chain().focus().toggleHighlight({ color }).run();
    },
    [editor]
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-t-lg mb-[-1px] overflow-x-auto scrollbar-thin">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      {/* Text Color Dropdown */}
      <div className="relative group">
        <ToolbarButton onClick={() => {}} title="Text Color">
          <Palette className="w-4 h-4" />
        </ToolbarButton>
        <div className="absolute top-full left-0 mt-1 p-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="flex gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => setColor(color.value)}
                className="w-5 h-5 rounded border border-border-light dark:border-border-dark hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value || 'transparent' }}
                title={color.name}
              >
                {color.value === null && (
                  <span className="text-xs">×</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Highlight Dropdown */}
      <div className="relative group">
        <ToolbarButton
          onClick={() => {}}
          isActive={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>
        <div className="absolute top-full left-0 mt-1 p-2 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="flex gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => setHighlight(color.value)}
                className="w-5 h-5 rounded border border-border-light dark:border-border-dark hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task List"
      >
        <CheckSquare className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Inserts */}
      <ToolbarButton onClick={onSetLink} isActive={editor.isActive('link')} title="Link">
        <Link className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onAddImage} title="Image">
        <Image className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={onInsertTable} title="Table">
        <Table className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Export Dropdown */}
      <div className="relative group">
        <ToolbarButton onClick={() => {}} title="Export Document">
          <Download className="w-4 h-4" />
        </ToolbarButton>
        <div className="absolute top-full right-0 mt-1 py-1 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[150px]">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              onClick={() => handleExport(format.id)}
              className="w-full px-3 py-1.5 text-left text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors flex items-center gap-2"
            >
              <span className="flex-1">{format.label}</span>
              <span className="text-text-light-tertiary dark:text-text-dark-tertiary text-xs">
                {format.extension}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DocumentToolbar;
