/**
 * TableOfContentsPlugin - Lexical plugin for TOC support
 *
 * Handles /toc slash command detection and inserts TableOfContentsNode.
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  createCommand,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { $createTableOfContentsNode } from '../nodes/TableOfContentsNode';

export const INSERT_TOC_COMMAND: LexicalCommand<void> = createCommand('INSERT_TOC');

export default function TableOfContentsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      INSERT_TOC_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const tocNode = $createTableOfContentsNode();
            selection.insertNodes([tocNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return unregisterCommand;
  }, [editor]);

  // Listen for /toc slash command typed in the editor
  useEffect(() => {
    return editor.registerTextContentListener((text) => {
      if (text.endsWith('/toc')) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const textContent = node.getTextContent();
            if (textContent.endsWith('/toc') && 'setTextContent' in node) {
              const newText = textContent.slice(0, -'/toc'.length);
              (node as unknown as { setTextContent(text: string): void }).setTextContent(newText);
            }
          }
        });
        editor.dispatchCommand(INSERT_TOC_COMMAND, undefined);
      }
    });
  }, [editor]);

  return null;
}
