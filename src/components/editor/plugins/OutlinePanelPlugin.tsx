/**
 * OutlinePanelPlugin - Lexical plugin that tracks heading nodes in real-time
 *
 * Listens for editor updates and extracts heading hierarchy for the outline panel.
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import type { LexicalEditor } from 'lexical';

export interface OutlineHeading {
  key: string;
  text: string;
  level: number;
}

function collectHeadings(editor: LexicalEditor): OutlineHeading[] {
  const entries: OutlineHeading[] = [];
  const state = editor.getEditorState();
  state.read(() => {
    const nodeMap = state._nodeMap;
    nodeMap.forEach((node) => {
      if ($isHeadingNode(node)) {
        const tag = node.getTag();
        const level = parseInt(tag.replace('h', ''), 10);
        const text = node.getTextContent();
        if (text.trim()) {
          entries.push({ key: node.getKey(), text, level });
        }
      }
    });
  });
  return entries;
}

export function scrollToHeading(editor: LexicalEditor, headingKey: string): void {
  const element = editor.getElementByKey(headingKey);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

interface OutlinePanelPluginProps {
  onHeadingsChange: (headings: OutlineHeading[]) => void;
}

export default function OutlinePanelPlugin({ onHeadingsChange }: OutlinePanelPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Initial collection
    onHeadingsChange(collectHeadings(editor));

    // Listen for updates
    const unregister = editor.registerUpdateListener(() => {
      onHeadingsChange(collectHeadings(editor));
    });

    return unregister;
  }, [editor, onHeadingsChange]);

  return null;
}
