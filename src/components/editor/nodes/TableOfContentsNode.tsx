/**
 * TableOfContentsNode - DecoratorNode for interactive Table of Contents
 *
 * Renders an auto-updating TOC from document headings.
 * Click entries to scroll to the corresponding heading.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DecoratorNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  EditorConfig,
  LexicalEditor,
} from 'lexical';

interface TocEntry {
  key: string;
  text: string;
  level: number;
}

function collectHeadings(editor: LexicalEditor): TocEntry[] {
  const entries: TocEntry[] = [];
  const state = editor.getEditorState();
  state.read(() => {
    const root = editor.getEditorState()._nodeMap;
    root.forEach((node) => {
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

function scrollToHeading(editor: LexicalEditor, headingKey: string): void {
  const rootElement = editor.getRootElement();
  if (!rootElement) return;

  const element = editor.getElementByKey(headingKey);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * TOC React Component rendered by the DecoratorNode
 */
function TableOfContentsComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [headings, setHeadings] = useState<TocEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Initial collection
    setHeadings(collectHeadings(editor));

    // Listen for mutations on HeadingNode
    const unregister = editor.registerMutationListener(
      // We use a generic approach: listen for all updates
      // since registerMutationListener requires a node class
      editor.getEditorState().read(() => {
        // We need to get the HeadingNode class
        // Since we can't import it in the mutation listener setup,
        // we listen to update events instead
        return undefined as unknown as typeof DecoratorNode;
      }) as unknown as typeof DecoratorNode,
      () => {
        setHeadings(collectHeadings(editor));
      },
    );

    // Also listen to general updates for heading text changes
    const unregisterUpdate = editor.registerUpdateListener(() => {
      setHeadings(collectHeadings(editor));
    });

    return () => {
      if (typeof unregister === 'function') {
        unregister();
      }
      unregisterUpdate();
    };
  }, [editor]);

  const handleClick = useCallback(
    (headingKey: string) => {
      scrollToHeading(editor, headingKey);
    },
    [editor],
  );

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  if (headings.length === 0) {
    return (
      <div className="my-4 border border-border-light dark:border-border-dark rounded-lg p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated group relative">
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs"
          title="Remove table of contents"
        >
          X
        </button>
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
          Table of Contents — Add headings to your note to see them here.
        </div>
      </div>
    );
  }

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div className="my-4 border border-border-light dark:border-border-dark rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated group relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-semibold text-text-light-primary dark:text-text-dark-primary hover:text-accent-primary transition-colors"
        >
          <span
            className={`transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
          >
            &#9654;
          </span>
          Table of Contents
          <span className="text-xs font-normal text-text-light-tertiary dark:text-text-dark-tertiary">
            ({headings.length})
          </span>
        </button>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs text-text-light-secondary dark:text-text-dark-secondary"
          title="Remove table of contents"
        >
          X
        </button>
      </div>

      {/* Entries */}
      {!isCollapsed && (
        <nav className="px-4 py-3">
          <ul className="space-y-1">
            {headings.map((heading) => (
              <li
                key={heading.key}
                style={{ paddingLeft: `${(heading.level - minLevel) * 16}px` }}
              >
                <button
                  onClick={() => handleClick(heading.key)}
                  className="text-sm text-accent-primary hover:text-accent-primary/80 hover:underline transition-colors text-left w-full truncate"
                  title={heading.text}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

export type SerializedTableOfContentsNode = SerializedLexicalNode;

export class TableOfContentsNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return 'table-of-contents';
  }

  static clone(node: TableOfContentsNode): TableOfContentsNode {
    return new TableOfContentsNode(node.__key);
  }

  static importJSON(_serializedNode: SerializedTableOfContentsNode): TableOfContentsNode {
    return $createTableOfContentsNode();
  }

  exportJSON(): SerializedTableOfContentsNode {
    return {
      type: 'table-of-contents',
      version: 1,
    };
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'toc-node';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    return <TableOfContentsComponent nodeKey={this.__key} />;
  }

  getTextContent(): string {
    return '[Table of Contents]';
  }

  isInline(): boolean {
    return false;
  }
}

export function $createTableOfContentsNode(): TableOfContentsNode {
  return new TableOfContentsNode();
}

export function $isTableOfContentsNode(
  node: LexicalNode | null | undefined,
): node is TableOfContentsNode {
  return node instanceof TableOfContentsNode;
}
