/**
 * Notes Editor Component
 *
 * Rich text editor using Lexical
 * Auto-saves changes to Notes store (debounced)
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { AutoLinkNode } from '@lexical/link';
import { TRANSFORMERS, CHECK_LIST } from '@lexical/markdown';
import {
  $getRoot,
  $getSelection,
  FORMAT_TEXT_COMMAND,
  $isRangeSelection,
  $createParagraphNode,
  UNDO_COMMAND,
  REDO_COMMAND,
  $isParagraphNode
} from 'lexical';
import type { EditorState } from 'lexical';
import {
  registerRichText,
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode
} from '@lexical/rich-text';
import type { HeadingTagType } from '@lexical/rich-text';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  $isListNode
} from '@lexical/list';
import { registerCodeHighlighting } from '@lexical/code';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';

// URL matcher for AutoLinkPlugin
const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
    };
  },
];
import { motion } from 'framer-motion';
import { useNotesStore } from '../stores/useNotesStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { TagPicker } from '../components/TagPicker';
import { CustomFieldEditor } from '../components/CustomFieldEditor';
import { NOTE_CONSTANTS } from '../types/notes';
import { ImageNode, $createImageNode } from './NotesEditor/ImageNode';
import { TaskEmbedNode } from './NotesEditor/TaskEmbedNode';
import { EventEmbedNode } from './NotesEditor/EventEmbedNode';
import { SpreadsheetEmbedNode } from './NotesEditor/SpreadsheetEmbedNode';
import { CalloutNode, $createCalloutNode } from '../components/editor/nodes/CalloutNode';
import type { CalloutType } from '../components/editor/nodes/CalloutNode';
import { ToggleNode, $createToggleNode } from '../components/editor/nodes/ToggleNode';
import { indexedDBService } from '../services/indexedDB';
import { BacklinksPanel } from '../components/BacklinksPanel';
import { VersionHistoryPanel } from '../components/notes/VersionHistoryPanel';
import { useNoteVersionStore } from '../stores/useNoteVersionStore';
import { toast } from '../stores/useToastStore';
import WikiLinkAutocompletePlugin from '../components/editor/WikiLinkAutocompletePlugin';
import WikiLinkTransformPlugin from '../components/editor/WikiLinkTransformPlugin';
import HoverPreviewPlugin from '../components/editor/plugins/HoverPreviewPlugin';
import BlockReferencePlugin from '../components/editor/plugins/BlockReferencePlugin';
import HashtagPlugin from '../components/editor/plugins/HashtagPlugin';
import EmbedPlugin from '../components/editor/plugins/EmbedPlugin';
import { WikiLinkNode } from '../components/editor/WikiLinkNode';
import { HashtagNode } from '../components/editor/nodes/HashtagNode';

/**
 * Keyboard Shortcuts Plugin
 * Registers rich text keyboard shortcuts (Cmd+B, Cmd+I, Cmd+U)
 */
const KeyboardShortcutsPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerRichText(editor);
  }, [editor]);

  return null;
};

/**
 * Code Highlight Plugin
 * Registers Prism-based syntax highlighting for code blocks
 */
const CodeHighlightPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null;
};

/**
 * Word Count Plugin
 * Tracks word and character count from editor content
 */
const WordCountPlugin: React.FC<{ onUpdate: (words: number, chars: number) => void }> = ({ onUpdate }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerTextContentListener((textContent) => {
      const words = textContent.trim().split(/\s+/).filter(Boolean).length;
      const chars = textContent.length;
      onUpdate(words, chars);
    });
  }, [editor, onUpdate]);

  return null;
};

/**
 * Image Upload Plugin
 * Handles drag-and-drop and paste events for images
 */
const ImageUploadPlugin: React.FC<{ noteId: string }> = ({ noteId }) => {
  const [editor] = useLexicalComposerContext();
  const [isDragging, setIsDragging] = useState(false);

  const uploadImage = useCallback(async (file: File) => {
    try {
      // Store image in IndexedDB with compression
      const imageId = await indexedDBService.storeImage(noteId, file);

      // Retrieve compressed blob
      const blob = await indexedDBService.getImage(imageId);
      if (!blob) {
        console.error('Failed to retrieve stored image');
        return;
      }

      // Create blob URL for rendering
      const blobUrl = URL.createObjectURL(blob);

      // Insert image node into editor
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode({
            altText: file.name,
            src: blobUrl,
            imageId: imageId,
          });
          selection.insertNodes([imageNode]);
        }
      });

      console.log(`✅ Image uploaded: ${imageId} (${file.name})`);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  }, [editor, noteId]);

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    // Drag and drop handlers
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only hide if leaving the editor entirely
      if (e.target === editorElement) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      for (const file of imageFiles) {
        await uploadImage(file);
      }
    };

    // Paste handler
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length > 0) {
        e.preventDefault();

        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            await uploadImage(file);
          }
        }
      }
    };

    editorElement.addEventListener('dragenter', handleDragEnter);
    editorElement.addEventListener('dragover', handleDragOver);
    editorElement.addEventListener('dragleave', handleDragLeave);
    editorElement.addEventListener('drop', handleDrop);
    editorElement.addEventListener('paste', handlePaste);

    return () => {
      editorElement.removeEventListener('dragenter', handleDragEnter);
      editorElement.removeEventListener('dragover', handleDragOver);
      editorElement.removeEventListener('dragleave', handleDragLeave);
      editorElement.removeEventListener('drop', handleDrop);
      editorElement.removeEventListener('paste', handlePaste);
    };
  }, [editor, uploadImage]);

  // Drag overlay
  if (isDragging) {
    return (
      <div className="absolute inset-0 z-50 bg-accent-blue/10 border-2 border-dashed border-accent-blue rounded-lg flex items-center justify-center pointer-events-none">
        <div className="bg-surface-light dark:bg-surface-dark px-6 py-4 rounded-lg shadow-elevated">
          <p className="text-accent-blue text-lg font-semibold">Drop image here</p>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Slash Command Plugin
 * Detects '/' and shows command menu
 */
const SlashCommandPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const clearSlashCommand = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = selection.anchor.getNode();
        const text = node.getTextContent();
        // Remove the /command text from the current node
        const slashIndex = text.lastIndexOf('/');
        if (slashIndex >= 0 && 'setTextContent' in node) {
          (node as unknown as { setTextContent(t: string): void }).setTextContent(
            text.slice(0, slashIndex)
          );
        }
      }
    });
  }, [editor]);

  const insertCallout = useCallback((calloutType: CalloutType) => {
    clearSlashCommand();
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const calloutNode = $createCalloutNode({ calloutType });
        selection.insertNodes([calloutNode]);
      }
    });
  }, [editor, clearSlashCommand]);

  const insertToggle = useCallback(() => {
    clearSlashCommand();
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const toggleNode = $createToggleNode({ isOpen: true });
        selection.insertNodes([toggleNode]);
      }
    });
  }, [editor, clearSlashCommand]);

  const insertHR = useCallback(() => {
    clearSlashCommand();
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  }, [editor, clearSlashCommand]);

  const commands = [
    { label: 'Heading 1', icon: 'H1', action: () => {
      editor.update(() => {
        const selection = $getSelection();
        if (selection) {
          console.log('Heading 1');
        }
      });
    }},
    { label: 'Heading 2', icon: 'H2', action: () => console.log('Heading 2') },
    { label: 'Heading 3', icon: 'H3', action: () => console.log('Heading 3') },
    { label: 'Bullet List', icon: '•', action: () => console.log('Bullet List') },
    { label: 'Numbered List', icon: '1.', action: () => console.log('Numbered List') },
    { label: 'Code Block', icon: '</>', action: () => console.log('Code Block') },
    { label: 'Quote', icon: '"', action: () => console.log('Quote') },
    { label: 'Horizontal Rule', icon: '—', action: insertHR },
    { label: 'Callout (Info)', icon: 'ℹ️', action: () => insertCallout('info') },
    { label: 'Callout (Warning)', icon: '⚠️', action: () => insertCallout('warning') },
    { label: 'Callout (Tip)', icon: '💡', action: () => insertCallout('tip') },
    { label: 'Callout (Danger)', icon: '🚨', action: () => insertCallout('danger') },
    { label: 'Toggle Block', icon: '▶', action: insertToggle },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!selection) {
          setShowMenu(false);
          return;
        }

        const text = selection.getTextContent();
        if (text.startsWith('/')) {
          setQuery(text.slice(1));
          setShowMenu(true);

          // Get cursor position for menu placement
          const nativeSelection = window.getSelection();
          if (nativeSelection && nativeSelection.rangeCount > 0) {
            const range = nativeSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setMenuPosition({
              top: rect.bottom + window.scrollY + 5,
              left: rect.left + window.scrollX,
            });
          }
        } else {
          setShowMenu(false);
        }
      });
    });
  }, [editor]);

  if (!showMenu || filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
        zIndex: 1000,
      }}
      className="bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg py-2 min-w-[200px]"
    >
      {filteredCommands.map((cmd, index) => (
        <button
          key={index}
          onClick={() => {
            cmd.action();
            setShowMenu(false);
          }}
          className="w-full px-4 py-2 text-left hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-colors flex items-center gap-3"
        >
          <span className="text-text-light-secondary dark:text-text-dark-secondary font-mono">
            {cmd.icon}
          </span>
          <span className="text-text-light-primary dark:text-text-dark-primary">
            {cmd.label}
          </span>
        </button>
      ))}
    </div>
  );
};

/**
 * View Mode Type
 */
type ViewMode = 'edit' | 'preview';

/**
 * Editor Toolbar Component
 */
const EditorToolbar: React.FC<{
  wordCount: number;
  charCount: number;
  noteId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}> = ({ wordCount, charCount, noteId, viewMode, onViewModeChange }) => {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const HIGHLIGHT_COLORS = [
    { label: 'Yellow', color: '#fef08a', darkColor: '#854d0e40' },
    { label: 'Green', color: '#bbf7d0', darkColor: '#14532d40' },
    { label: 'Blue', color: '#bfdbfe', darkColor: '#1e3a5f40' },
    { label: 'Pink', color: '#fbcfe8', darkColor: '#831843a0' },
    { label: 'Purple', color: '#e9d5ff', darkColor: '#581c87a0' },
  ] as const;

  const applyHighlight = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.formatText('highlight');
        // Apply background color via style
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ('setStyle' in node && typeof node.setStyle === 'function') {
            node.setStyle(`background-color: ${color}`);
          }
        });
      }
    });
    setShowHighlightPicker(false);
  }, [editor]);

  const removeHighlight = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ('setStyle' in node && typeof node.setStyle === 'function') {
            node.setStyle('');
          }
        });
      }
    });
    setShowHighlightPicker(false);
  }, [editor]);

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

        if ($isHeadingNode(element) && element.getTag() === headingSize) {
          // If already this heading, convert to paragraph
          const paragraph = $createParagraphNode();
          element.replace(paragraph, true);
        } else {
          // Convert to heading
          const heading = $createHeadingNode(headingSize);
          element.replace(heading, true);
        }
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

        if (!$isParagraphNode(element) && !$isListNode(element)) {
          const paragraph = $createParagraphNode();
          element.replace(paragraph, true);
        }
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

        if ($isQuoteNode(element)) {
          // If already a quote, convert to paragraph
          const paragraph = $createParagraphNode();
          element.replace(paragraph, true);
        } else if (!$isListNode(element)) {
          const quote = $createQuoteNode();
          element.replace(quote, true);
        }
      }
    });
  };

  const formatBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const formatNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const formatCheckList = () => {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  };

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input immediately
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Store image in IndexedDB with compression
      const imageId = await indexedDBService.storeImage(noteId, file);

      // Retrieve compressed blob
      const blob = await indexedDBService.getImage(imageId);
      if (!blob) {
        console.error('Failed to retrieve stored image');
        return;
      }

      // Create blob URL for rendering
      const blobUrl = URL.createObjectURL(blob);

      // Insert image node into editor
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode({
            altText: file.name,
            src: blobUrl,
            imageId: imageId,
          });
          selection.insertNodes([imageNode]);
        }
      });

      console.log(`✅ Image uploaded: ${imageId} (${file.name})`);
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error(
        'Failed to upload image',
        `${error instanceof Error ? error.message : 'Unknown error'}. Check file size (max 5MB) and storage quota.`
      );
    }
  };

  const btnClass = "p-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-all duration-standard text-text-light-primary dark:text-text-dark-primary";
  const dividerClass = "w-px h-6 bg-border-light dark:bg-border-dark";

  return (
    <div className="border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark-elevated p-3 flex items-center gap-2 flex-wrap">
      {/* Undo/Redo */}
      <button onClick={undo} className={btnClass} title="Undo (Cmd+Z)">
        ↶
      </button>
      <button onClick={redo} className={btnClass} title="Redo (Cmd+Shift+Z)">
        ↷
      </button>

      <div className={dividerClass} />

      {/* Text Format */}
      <button onClick={() => formatText('bold')} className={btnClass} title="Bold (Cmd+B)">
        <span className="font-bold">B</span>
      </button>
      <button onClick={() => formatText('italic')} className={btnClass} title="Italic (Cmd+I)">
        <span className="italic">I</span>
      </button>
      <button onClick={() => formatText('underline')} className={btnClass} title="Underline (Cmd+U)">
        <span className="underline">U</span>
      </button>
      <button onClick={() => formatText('strikethrough')} className={btnClass} title="Strikethrough">
        <span className="line-through">S</span>
      </button>
      <button onClick={() => formatText('code')} className={btnClass} title="Code">
        <span className="font-mono text-sm">&lt;/&gt;</span>
      </button>

      {/* Highlight Color */}
      <div className="relative">
        <button
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          className={btnClass}
          title="Highlight Color"
        >
          <span className="text-sm" style={{ backgroundColor: '#fef08a', padding: '0 4px', borderRadius: '2px' }}>A</span>
        </button>
        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg p-2 flex gap-1">
            {HIGHLIGHT_COLORS.map((hc) => (
              <button
                key={hc.label}
                onClick={() => applyHighlight(hc.color)}
                className="w-6 h-6 rounded border border-border-light dark:border-border-dark hover:scale-110 transition-transform"
                style={{ backgroundColor: hc.color }}
                title={hc.label}
              />
            ))}
            <button
              onClick={removeHighlight}
              className="w-6 h-6 rounded border border-border-light dark:border-border-dark hover:scale-110 transition-transform flex items-center justify-center text-xs text-text-light-secondary dark:text-text-dark-secondary"
              title="Remove highlight"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className={dividerClass} />

      {/* Headings */}
      <button onClick={() => formatHeading('h1')} className={btnClass} title="Heading 1">
        <span className="font-bold text-lg">H1</span>
      </button>
      <button onClick={() => formatHeading('h2')} className={btnClass} title="Heading 2">
        <span className="font-bold">H2</span>
      </button>
      <button onClick={() => formatHeading('h3')} className={btnClass} title="Heading 3">
        <span className="font-bold text-sm">H3</span>
      </button>
      <button onClick={formatParagraph} className={btnClass} title="Paragraph">
        <span className="text-sm">P</span>
      </button>

      <div className={dividerClass} />

      {/* Lists */}
      <button onClick={formatBulletList} className={btnClass} title="Bullet List">
        ≡
      </button>
      <button onClick={formatNumberedList} className={btnClass} title="Numbered List">
        ⋮
      </button>
      <button onClick={formatCheckList} className={btnClass} title="Checklist ([] )">
        ☑
      </button>
      <button onClick={formatQuote} className={btnClass} title="Quote">
        &ldquo;
      </button>

      <div className={dividerClass} />

      {/* Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={btnClass}
        title="Insert Image"
      >
        🖼️
      </button>

      <div className="flex-1" />

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 mr-4">
        <button
          onClick={() => onViewModeChange('edit')}
          className={`px-2 py-1 text-xs rounded transition-all duration-standard ${
            viewMode === 'edit'
              ? 'bg-accent-primary text-white'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
          }`}
          title="Edit Mode (Cmd+E)"
          aria-pressed={viewMode === 'edit'}
        >
          Edit
        </button>
        <button
          onClick={() => onViewModeChange('preview')}
          className={`px-2 py-1 text-xs rounded transition-all duration-standard ${
            viewMode === 'preview'
              ? 'bg-accent-primary text-white'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
          }`}
          title="Preview Mode (Cmd+E)"
          aria-pressed={viewMode === 'preview'}
        >
          Preview
        </button>
      </div>

      {/* Word count */}
      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
        {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} {charCount === 1 ? 'char' : 'chars'}
      </span>
    </div>
  );
};

/**
 * Read-Only Mode Plugin
 * Controls whether the editor is in read-only mode
 */
const ReadOnlyPlugin: React.FC<{ isReadOnly: boolean }> = ({ isReadOnly }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  return null;
};

/**
 * Auto-save Plugin
 * Debounces editor changes and saves to store
 */
const AutoSavePlugin: React.FC<{ noteId: string }> = ({ noteId }) => {
  const [isSaving, setIsSaving] = useState(false);
  const updateNote = useNotesStore((state) => state.updateNote);

  // Track timeout ID and last saved content to prevent redundant saves
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef<string>('');
  const lastTextRef = useRef<string>('');
  const lastVersionSaveRef = useRef<number>(0);

  const handleChange = useCallback((editorState: EditorState) => {
    // Extract plain text for search
    editorState.read(() => {
      const root = $getRoot();
      const contentText = root.getTextContent();
      const contentJson = JSON.stringify(editorState.toJSON());

      // Skip save if content hasn't actually changed
      if (contentJson === lastContentRef.current && contentText === lastTextRef.current) {
        return;
      }

      // Clear previous timeout to implement proper debouncing
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Debounced save with error handling
      timeoutIdRef.current = setTimeout(() => {
        setIsSaving(true);

        try {
          // Zustand is synchronous, but IndexedDB persistence could fail
          updateNote(noteId, {
            content: contentJson,
            contentText,
          });

          // Update refs with saved content
          lastContentRef.current = contentJson;
          lastTextRef.current = contentText;

          // Version history: save snapshot periodically when content changes significantly
          const now = Date.now();
          const versionStore = useNoteVersionStore.getState();
          if (
            now - lastVersionSaveRef.current >= NOTE_CONSTANTS.VERSION_SAVE_INTERVAL_MS &&
            versionStore.shouldSaveVersion(noteId, contentText)
          ) {
            const note = useNotesStore.getState().notes[noteId];
            if (note) {
              versionStore.saveVersion({
                noteId,
                title: note.title,
                content: contentJson,
                contentText,
              });
              lastVersionSaveRef.current = now;
            }
          }

          // Reset saving state after a brief delay
          setTimeout(() => setIsSaving(false), 300);
        } catch (error) {
          console.error('❌ Failed to save note:', error);
          setIsSaving(false);
          // Error will be handled by IndexedDB quota monitoring system
          // User will be alerted if quota is exceeded via Settings page
        }
      }, NOTE_CONSTANTS.AUTOSAVE_DEBOUNCE_MS);
    });
  }, [noteId, updateNote]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return (
    <>
      <OnChangePlugin onChange={handleChange} />
      {isSaving && (
        <div className="absolute top-2 right-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Saving...
        </div>
      )}
    </>
  );
};

/**
 * Lexical Editor Configuration
 */
const getEditorConfig = (initialContent?: string) => ({
  namespace: 'NotesEditor',
  editorState: initialContent || null,
  theme: {
    root: 'editor-root',
    paragraph: 'editor-paragraph leading-relaxed', // 1.625 line-height for readability
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'font-mono bg-surface-light-elevated dark:bg-surface-dark-elevated px-1.5 py-0.5 rounded text-sm',
    },
    heading: {
      h1: 'text-4xl font-bold mt-8 mb-4 leading-tight tracking-tight',
      h2: 'text-3xl font-bold mt-6 mb-3 leading-snug',
      h3: 'text-2xl font-semibold mt-5 mb-2 leading-normal',
    },
    list: {
      ul: 'list-disc list-inside my-4 space-y-1.5',
      ol: 'list-decimal list-inside my-4 space-y-1.5',
      listitem: 'my-1 leading-relaxed',
      checklist: 'editor-checklist my-4 space-y-1.5 list-none pl-0',
      listitemChecked: 'editor-checklist-item editor-checklist-item--checked line-through opacity-60',
      listitemUnchecked: 'editor-checklist-item editor-checklist-item--unchecked',
    },
    quote: 'border-l-4 border-accent-primary bg-surface-light-elevated dark:bg-surface-dark-elevated pl-4 py-3 italic my-4 rounded-r',
    code: 'bg-surface-dark dark:bg-surface-dark-elevated text-text-dark-primary p-4 rounded-lg font-mono text-sm my-4 overflow-x-auto shadow-sm',
    codeHighlight: {
      atrule: 'text-purple-400',
      attr: 'text-yellow-300',
      boolean: 'text-orange-400',
      builtin: 'text-cyan-400',
      cdata: 'text-gray-500',
      char: 'text-green-400',
      class: 'text-yellow-300',
      'class-name': 'text-yellow-300',
      comment: 'text-gray-500 italic',
      constant: 'text-orange-400',
      deleted: 'text-red-400',
      doctype: 'text-gray-500',
      entity: 'text-red-400',
      function: 'text-blue-400',
      important: 'text-orange-400 font-bold',
      inserted: 'text-green-400',
      keyword: 'text-purple-400',
      namespace: 'text-red-400',
      number: 'text-orange-400',
      operator: 'text-cyan-400',
      prolog: 'text-gray-500',
      property: 'text-cyan-400',
      punctuation: 'text-gray-400',
      regex: 'text-yellow-300',
      selector: 'text-green-400',
      string: 'text-green-400',
      symbol: 'text-orange-400',
      tag: 'text-red-400',
      url: 'text-cyan-400',
      variable: 'text-red-400',
    },
    link: 'text-accent-primary hover:underline transition-colors',
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    ImageNode,
    TaskEmbedNode,
    EventEmbedNode,
    SpreadsheetEmbedNode,
    WikiLinkNode,
    HashtagNode,
    HorizontalRuleNode,
    CalloutNode,
    ToggleNode,
  ],
  onError: (error: Error) => {
    console.error('Lexical error:', error);
  },
});

/**
 * Notes Editor Props
 */
interface NotesEditorProps {
  noteId: string;
  blockId?: string; // Optional block ID to scroll to (from URL hash)
}

/**
 * Tags Input Component
 * Simple tag management with pills
 */
const TagsInput: React.FC<{ noteId: string; tags: string[] }> = ({ noteId, tags }) => {
  const addTag = useNotesStore((state) => state.addTag);
  const removeTag = useNotesStore((state) => state.removeTag);

  const handleAddTag = (tag: string) => {
    addTag(noteId, tag);
  };

  const handleRemoveTag = (tag: string) => {
    removeTag(noteId, tag);
  };

  return (
    <div className="mt-3">
      <TagPicker
        selectedTags={tags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        maxTags={NOTE_CONSTANTS.MAX_TAGS}
      />
    </div>
  );
};

/**
 * Custom Fields Section Component
 * Renders custom fields defined in settings for notes
 */
const NoteCustomFields: React.FC<{ noteId: string; note: ReturnType<typeof useNotesStore.getState>['notes'][number] }> = ({ noteId, note }) => {
  const { customFieldDefinitions } = useSettingsStore();
  const noteFields = customFieldDefinitions.notes;

  if (noteFields.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
        Custom Fields
      </div>
      {noteFields.map((field) => {
        const currentValue = note.customFields?.[field.id];

        return (
          <div key={field.id}>
            <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
              {field.name}
              {field.required && (
                <span className="text-status-error-text dark:text-status-error-text-dark ml-1">*</span>
              )}
            </label>
            {field.description && (
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                {field.description}
              </p>
            )}
            <CustomFieldEditor
              field={field}
              value={currentValue}
              onChange={(value) => {
                const updatedCustomFields = {
                  ...note.customFields,
                  [field.id]: value,
                };
                useNotesStore.getState().updateNote(noteId, { customFields: updatedCustomFields });
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/**
 * Notes Editor Component
 */
export const NotesEditor: React.FC<NotesEditorProps> = ({ noteId, blockId }) => {
  const note = useNotesStore((state) => state.getNote(noteId));
  const notes = useNotesStore((state) => state.notes);
  const notesArray = useMemo(() => Object.values(notes), [notes]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  // Keyboard shortcut for toggling view mode (Cmd+E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'edit' ? 'preview' : 'edit'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Memoize editor config to prevent Lexical re-initialization
  // Only recreate when noteId changes, not when content changes
  const editorConfig = useMemo(
    () => getEditorConfig(note?.content),
    [noteId] // Key on noteId only, not note.content
  );

  const handleWordCountUpdate = useCallback((words: number, chars: number) => {
    setWordCount(words);
    setCharCount(chars);
  }, []);

  if (!note) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center text-text-light-secondary dark:text-text-dark-secondary">
        Note not found
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col min-h-0 bg-surface-light dark:bg-surface-dark"
    >
      {/* Note Title & Tags */}
      <div className="border-b border-border-light dark:border-border-dark px-6 py-4 flex-shrink-0">
        <input
          type="text"
          value={note.title}
          onChange={(e) =>
            useNotesStore.getState().updateNote(noteId, { title: e.target.value })
          }
          placeholder="Untitled Note"
          className="w-full text-3xl font-bold bg-transparent border-none outline-none text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
        />
        <TagsInput noteId={noteId} tags={note.tags} />

        {/* Custom Fields (P2 #3) */}
        <NoteCustomFields noteId={noteId} note={note} />
      </div>

      {/* Lexical Editor */}
      <LexicalComposer key={noteId} initialConfig={editorConfig}>
        <div className="flex-1 flex flex-col relative overflow-hidden shadow-card">
          {/* Toolbar */}
          <div className="flex-shrink-0">
            <EditorToolbar
              wordCount={wordCount}
              charCount={charCount}
              noteId={noteId}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className={`relative h-full border rounded-lg p-6 bg-surface-light dark:bg-surface-dark ${
              viewMode === 'preview'
                ? 'border-accent-primary/30'
                : 'border-border-light dark:border-border-dark'
            }`}>
              {/* Preview mode indicator */}
              {viewMode === 'preview' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-accent-primary/10 text-accent-primary rounded">
                  Preview Mode
                </div>
              )}
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={`editor-content outline-none w-full h-full text-text-light-primary dark:text-text-dark-primary text-base ${
                      viewMode === 'preview' ? 'cursor-default select-text' : ''
                    }`}
                  />
                }
                placeholder={
                  viewMode === 'edit' ? (
                    <div className="editor-placeholder absolute top-6 left-6 text-text-light-secondary dark:text-text-dark-secondary pointer-events-none opacity-60">
                      Start writing...
                    </div>
                  ) : null
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            <ReadOnlyPlugin isReadOnly={viewMode === 'preview'} />
            <HistoryPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <TablePlugin />
            <CodeHighlightPlugin />
            <HorizontalRulePlugin />
            <MarkdownShortcutPlugin transformers={[...TRANSFORMERS, CHECK_LIST]} />
            <AutoLinkPlugin matchers={MATCHERS} />
            <KeyboardShortcutsPlugin />
            <WordCountPlugin onUpdate={handleWordCountUpdate} />
            {viewMode === 'edit' && <SlashCommandPlugin />}
            {viewMode === 'edit' && <ImageUploadPlugin noteId={noteId} />}
            {viewMode === 'edit' && <EmbedPlugin />}
            <AutoSavePlugin noteId={noteId} />
            <WikiLinkAutocompletePlugin notes={notesArray} currentFolderId={note.folderId} />
            <WikiLinkTransformPlugin notes={notes} />
            <HoverPreviewPlugin notes={notes} />
            <BlockReferencePlugin targetBlockId={blockId} />
            {viewMode === 'edit' && (
              <HashtagPlugin
                onHashtagsChange={(tags) => {
                  useNotesStore.getState().updateNote(noteId, { tags });
                }}
              />
            )}
            </div>
          </div>
        </div>
      </LexicalComposer>

      {/* Backlinks Panel */}
      <div className="flex-shrink-0">
        <BacklinksPanel noteId={noteId} />
      </div>

      {/* Version History Panel */}
      <div className="flex-shrink-0">
        <VersionHistoryPanel noteId={noteId} />
      </div>
    </motion.div>
  );
};

/**
 * Empty State - No Note Selected
 */
export const NotesEditorEmpty: React.FC = () => {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center bg-surface-light-elevated dark:bg-surface-dark">
      <div className="text-center max-w-md px-8 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="p-8 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 rounded-3xl">
            <div className="text-6xl">📝</div>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4 tracking-tight">
          Welcome to Notes
        </h2>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4 leading-relaxed">
          Your private space for thoughts, ideas, and knowledge. Everything stays local and secure on your device.
        </p>
        <div className="space-y-2 text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          <p className="flex items-center justify-center gap-2">
            <kbd className="px-2 py-1 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded font-mono text-xs">Cmd+N</kbd>
            Create new note
          </p>
          <p className="flex items-center justify-center gap-2">
            <kbd className="px-2 py-1 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded font-mono text-xs">Cmd+K</kbd>
            Search notes
          </p>
        </div>
      </div>
    </div>
  );
};
