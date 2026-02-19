import { useState, useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, TextNode } from 'lexical';
import type { Note } from '../../types/notes';
import { useFoldersStore } from '../../stores/useFoldersStore';
import AutocompleteDropdown from './AutocompleteDropdown';

interface WikiLinkAutocompletePluginProps {
  notes: Note[];
  currentFolderId?: string | null;
}

/**
 * WikiLinkAutocompletePlugin
 *
 * Lexical plugin that provides autocomplete for wiki-style links ([[Note Title]]).
 *
 * Features:
 * - Detects [[ pattern in editor
 * - Shows autocomplete dropdown
 * - Inserts selected note title as [[Title]]
 * - Positions dropdown near cursor
 */
export default function WikiLinkAutocompletePlugin({
  notes,
  currentFolderId,
}: WikiLinkAutocompletePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [query, setQuery] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const getPath = useFoldersStore((state) => state.getPath);

  // Get folder path helper
  const getFolderPath = useCallback(
    (folderId: string | null): string => {
      if (!folderId) return 'Root';
      const path = getPath(folderId);
      if (!path || path.length === 0) return 'Root';
      return path.map(folder => folder.name).join(' / ');
    },
    [getPath]
  );

  // Get cursor position for dropdown placement
  const getCursorPosition = useCallback((): { top: number; left: number } | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position dropdown below cursor (or above if no space)
    const top = rect.bottom + window.scrollY + 4;
    const left = rect.left + window.scrollX;

    // Check if dropdown would go off-screen vertically
    const dropdownHeight = 300; // Approximate max height
    const viewportHeight = window.innerHeight;

    if (rect.bottom + dropdownHeight > viewportHeight) {
      // Show above cursor instead
      return {
        top: rect.top + window.scrollY - dropdownHeight - 4,
        left,
      };
    }

    return { top, left };
  }, []);

  // Listen for text changes and detect [[ pattern
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setQuery(null);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        if (!(anchorNode instanceof TextNode)) {
          setQuery(null);
          return;
        }

        const text = anchorNode.getTextContent();
        const offset = selection.anchor.offset;

        // Look for [[ pattern before cursor
        const textBeforeCursor = text.slice(0, offset);
        const match = textBeforeCursor.match(/\[\[([^\]]*?)$/);

        if (match) {
          const searchQuery = match[1];
          setQuery(searchQuery);
          const pos = getCursorPosition();
          setPosition(pos);
        } else {
          setQuery(null);
        }
      });
    });
  }, [editor, getCursorPosition]);

  // Handle note selection
  const handleSelect = useCallback(
    (title: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        if (!(anchorNode instanceof TextNode)) return;

        const text = anchorNode.getTextContent();
        const offset = selection.anchor.offset;

        // Find the [[ before cursor
        const textBeforeCursor = text.slice(0, offset);
        const match = textBeforeCursor.match(/\[\[([^\]]*?)$/);

        if (!match) return;

        const matchStart = textBeforeCursor.lastIndexOf('[[');
        const beforeMatch = text.slice(0, matchStart);
        const afterCursor = text.slice(offset);

        // Replace [[query with [[Title]]
        const newText = `${beforeMatch}[[${title}]]${afterCursor}`;

        // Update node text
        anchorNode.setTextContent(newText);

        // Move cursor to after ]]
        const newOffset = matchStart + title.length + 4; // [[ + title + ]]
        selection.anchor.offset = newOffset;
        selection.focus.offset = newOffset;
      });

      setQuery(null);
    },
    [editor]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    setQuery(null);
  }, []);

  if (query === null) return null;

  return (
    <AutocompleteDropdown
      query={query}
      notes={notes}
      position={position}
      onSelect={handleSelect}
      onCancel={handleCancel}
      currentFolderId={currentFolderId}
      getFolderPath={getFolderPath}
    />
  );
}
