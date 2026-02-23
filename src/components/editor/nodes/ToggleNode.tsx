/**
 * ToggleNode - Custom Lexical DecoratorNode for Collapsible/Toggle Blocks
 *
 * Click header to expand/collapse content
 * Persists open/closed state in serialized JSON
 */

import React, { useState, useCallback } from 'react';
import { DecoratorNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
} from 'lexical';

export interface TogglePayload {
  title?: string;
  content?: string;
  isOpen?: boolean;
  key?: NodeKey;
}

export type SerializedToggleNode = Spread<
  {
    title: string;
    content: string;
    isOpen: boolean;
  },
  SerializedLexicalNode
>;

/**
 * ToggleComponent - React component rendered by the DecoratorNode
 */
function ToggleComponent({
  nodeKey,
  title,
  content,
  isOpen: initialIsOpen,
}: {
  nodeKey: NodeKey;
  title: string;
  content: string;
  isOpen: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);

  const updateNode = useCallback(
    (newTitle: string, newContent: string, newIsOpen: boolean) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (node && $isToggleNode(node)) {
          const writable = node.getWritable();
          writable.__title = newTitle;
          writable.__content = newContent;
          writable.__isOpen = newIsOpen;
        }
      });
    },
    [editor, nodeKey]
  );

  const handleToggle = useCallback(() => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    updateNode(editableTitle, editableContent, newIsOpen);
  }, [isOpen, editableTitle, editableContent, updateNode]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setEditableTitle(newTitle);
      updateNode(newTitle, editableContent, isOpen);
    },
    [updateNode, editableContent, isOpen]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setEditableContent(newContent);
      updateNode(editableTitle, newContent, isOpen);
    },
    [updateNode, editableTitle, isOpen]
  );

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  return (
    <div className="my-4 border border-border-light dark:border-border-dark rounded-lg overflow-hidden group relative">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs z-10"
        title="Remove toggle"
      >
        ✕
      </button>

      {/* Toggle header */}
      <div
        className="flex items-center gap-2 px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated cursor-pointer select-none hover:bg-surface-light dark:hover:bg-surface-dark transition-colors"
      >
        <button
          onClick={handleToggle}
          className="flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary transition-transform"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </button>
        <input
          type="text"
          value={editableTitle}
          onChange={handleTitleChange}
          placeholder="Toggle title..."
          className="bg-transparent border-none outline-none font-medium flex-1 text-text-light-primary dark:text-text-dark-primary placeholder:opacity-40"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Toggle content */}
      {isOpen && (
        <div className="px-4 py-3 pl-10 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <textarea
            value={editableContent}
            onChange={handleContentChange}
            placeholder="Toggle content..."
            className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-text-light-primary dark:text-text-dark-primary placeholder:opacity-40 min-h-[2rem]"
            rows={Math.max(1, editableContent.split('\n').length)}
          />
        </div>
      )}
    </div>
  );
}

export class ToggleNode extends DecoratorNode<React.ReactElement> {
  __title: string;
  __content: string;
  __isOpen: boolean;

  static getType(): string {
    return 'toggle';
  }

  static clone(node: ToggleNode): ToggleNode {
    return new ToggleNode(node.__title, node.__content, node.__isOpen, node.__key);
  }

  static importJSON(serializedNode: SerializedToggleNode): ToggleNode {
    return $createToggleNode({
      title: serializedNode.title,
      content: serializedNode.content,
      isOpen: serializedNode.isOpen,
    });
  }

  exportJSON(): SerializedToggleNode {
    return {
      type: 'toggle',
      version: 1,
      title: this.__title,
      content: this.__content,
      isOpen: this.__isOpen,
    };
  }

  constructor(title: string, content: string, isOpen: boolean, key?: NodeKey) {
    super(key);
    this.__title = title;
    this.__content = content;
    this.__isOpen = isOpen;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'toggle-node';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <ToggleComponent
        nodeKey={this.__key}
        title={this.__title}
        content={this.__content}
        isOpen={this.__isOpen}
      />
    );
  }

  getTextContent(): string {
    return `${this.__title}\n${this.__content}`;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createToggleNode(payload: TogglePayload): ToggleNode {
  return new ToggleNode(
    payload.title ?? '',
    payload.content ?? '',
    payload.isOpen ?? false,
    payload.key
  );
}

export function $isToggleNode(node: LexicalNode | null | undefined): node is ToggleNode {
  return node instanceof ToggleNode;
}
