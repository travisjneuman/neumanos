/**
 * CalloutNode - Custom Lexical DecoratorNode for Callout/Admonition Blocks
 *
 * Types: info (blue), warning (yellow), tip (green), danger (red)
 * Renders as a styled container with icon + colored border/background
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

export type CalloutType = 'info' | 'warning' | 'tip' | 'danger';

export interface CalloutPayload {
  calloutType: CalloutType;
  title?: string;
  content?: string;
  key?: NodeKey;
}

export type SerializedCalloutNode = Spread<
  {
    calloutType: CalloutType;
    title: string;
    content: string;
  },
  SerializedLexicalNode
>;

const CALLOUT_CONFIG: Record<
  CalloutType,
  { icon: string; label: string; borderColor: string; bgColor: string; textColor: string }
> = {
  info: {
    icon: 'ℹ️',
    label: 'Info',
    borderColor: 'border-blue-400 dark:border-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    borderColor: 'border-yellow-400 dark:border-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    textColor: 'text-yellow-700 dark:text-yellow-300',
  },
  tip: {
    icon: '💡',
    label: 'Tip',
    borderColor: 'border-green-400 dark:border-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    textColor: 'text-green-700 dark:text-green-300',
  },
  danger: {
    icon: '🚨',
    label: 'Danger',
    borderColor: 'border-red-400 dark:border-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
  },
};

/**
 * CalloutComponent - React component rendered by the DecoratorNode
 */
function CalloutComponent({
  nodeKey,
  calloutType,
  title,
  content,
}: {
  nodeKey: NodeKey;
  calloutType: CalloutType;
  title: string;
  content: string;
}) {
  const [editor] = useLexicalComposerContext();
  const [editableTitle, setEditableTitle] = useState(title);
  const [editableContent, setEditableContent] = useState(content);
  const config = CALLOUT_CONFIG[calloutType];

  const updateNode = useCallback(
    (newTitle: string, newContent: string) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (node && $isCalloutNode(node)) {
          const writable = node.getWritable();
          writable.__title = newTitle;
          writable.__content = newContent;
        }
      });
    },
    [editor, nodeKey]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setEditableTitle(newTitle);
      updateNode(newTitle, editableContent);
    },
    [updateNode, editableContent]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setEditableContent(newContent);
      updateNode(editableTitle, newContent);
    },
    [updateNode, editableTitle]
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
    <div
      className={`my-4 border-l-4 rounded-r-lg p-4 ${config.borderColor} ${config.bgColor} group relative`}
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs"
        title="Remove callout"
      >
        ✕
      </button>

      {/* Title row */}
      <div className={`flex items-center gap-2 mb-2 ${config.textColor} font-semibold`}>
        <span>{config.icon}</span>
        <input
          type="text"
          value={editableTitle}
          onChange={handleTitleChange}
          placeholder={config.label}
          className={`bg-transparent border-none outline-none font-semibold flex-1 ${config.textColor} placeholder:opacity-50`}
        />
      </div>

      {/* Content */}
      <textarea
        value={editableContent}
        onChange={handleContentChange}
        placeholder="Type callout content here..."
        className={`w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-text-light-primary dark:text-text-dark-primary placeholder:opacity-40 min-h-[2rem]`}
        rows={Math.max(1, editableContent.split('\n').length)}
      />
    </div>
  );
}

export class CalloutNode extends DecoratorNode<React.ReactElement> {
  __calloutType: CalloutType;
  __title: string;
  __content: string;

  static getType(): string {
    return 'callout';
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__title, node.__content, node.__key);
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    return $createCalloutNode({
      calloutType: serializedNode.calloutType,
      title: serializedNode.title,
      content: serializedNode.content,
    });
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: 'callout',
      version: 1,
      calloutType: this.__calloutType,
      title: this.__title,
      content: this.__content,
    };
  }

  constructor(calloutType: CalloutType, title: string, content: string, key?: NodeKey) {
    super(key);
    this.__calloutType = calloutType;
    this.__title = title;
    this.__content = content;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'callout-node';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <CalloutComponent
        nodeKey={this.__key}
        calloutType={this.__calloutType}
        title={this.__title}
        content={this.__content}
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

export function $createCalloutNode(payload: CalloutPayload): CalloutNode {
  return new CalloutNode(
    payload.calloutType,
    payload.title ?? '',
    payload.content ?? '',
    payload.key
  );
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}
