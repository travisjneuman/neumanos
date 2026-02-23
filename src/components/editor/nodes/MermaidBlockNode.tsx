/**
 * MermaidBlockNode - Custom Lexical DecoratorNode for Mermaid Diagrams
 *
 * Renders Mermaid diagram source into SVG.
 * Click to edit source, blur or Escape to render.
 * Supports dark mode detection.
 *
 * Security: mermaid.render() with securityLevel:'strict' produces sanitized SVG.
 * It does not evaluate arbitrary HTML/JS.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DecoratorNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
} from 'lexical';

export interface MermaidBlockPayload {
  source?: string;
  key?: NodeKey;
}

export type SerializedMermaidBlockNode = Spread<
  {
    source: string;
  },
  SerializedLexicalNode
>;

/** Generate a unique ID for each Mermaid render call */
let mermaidIdCounter = 0;
function nextMermaidId(): string {
  mermaidIdCounter += 1;
  return `mermaid-diagram-${mermaidIdCounter}`;
}

/**
 * Detects whether dark mode is active via the document element class or media query.
 */
function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.documentElement.classList.contains('dark')) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Renders a Mermaid diagram from source.
 * Uses dynamic import to keep the initial bundle small.
 */
function MermaidRenderer({ source }: { source: string }) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        const dark = isDarkMode();
        mermaid.initialize({
          startOnLoad: false,
          theme: dark ? 'dark' : 'default',
          securityLevel: 'strict',
        });
        if (cancelled) return;
        const id = nextMermaidId();
        const { svg: rendered } = await mermaid.render(id, source);
        if (cancelled) return;
        setSvg(rendered);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : 'Failed to render diagram'
        );
        setSvg('');
      }
    }

    if (source.trim()) {
      render();
    } else {
      setSvg('');
      setError(null);
    }

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400 font-mono p-2 bg-red-50 dark:bg-red-950/30 rounded whitespace-pre-wrap">
        Mermaid error: {error}
      </div>
    );
  }

  if (!source.trim()) {
    return (
      <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
        Empty diagram block
      </div>
    );
  }

  // eslint-disable-next-line react/no-danger -- mermaid.render with securityLevel:'strict' produces sanitized SVG
  return (
    <div
      className="mermaid-display-wrapper flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/**
 * MermaidBlockComponent - React component rendered by the DecoratorNode
 */
function MermaidBlockComponent({
  nodeKey,
  source,
}: {
  nodeKey: NodeKey;
  source: string;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(!source.trim());
  const [editableSource, setEditableSource] = useState(source);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateNode = useCallback(
    (newSource: string) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (node && $isMermaidBlockNode(node)) {
          const writable = node.getWritable();
          writable.__source = newSource;
        }
      });
    },
    [editor, nodeKey]
  );

  const handleEdit = useCallback(() => {
    if (!editor.isEditable()) return;
    setIsEditing(true);
  }, [editor]);

  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
    updateNode(editableSource);
  }, [editableSource, updateNode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinishEditing();
      }
    },
    [handleFinishEditing]
  );

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="my-4 border border-border-light dark:border-border-dark rounded-lg overflow-hidden group relative">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs z-10"
        title="Remove diagram block"
      >
        ✕
      </button>

      {/* Label */}
      <div className="px-4 py-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border-b border-border-light dark:border-border-dark flex items-center gap-2">
        <span className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
          Diagram (Mermaid)
        </span>
      </div>

      {isEditing ? (
        <div className="p-4 bg-surface-light dark:bg-surface-dark">
          <textarea
            ref={textareaRef}
            value={editableSource}
            onChange={(e) => setEditableSource(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={handleKeyDown}
            placeholder={"Enter Mermaid syntax... e.g.\ngraph TD\n  A-->B\n  B-->C"}
            className="w-full bg-transparent border border-border-light dark:border-border-dark rounded p-3 font-mono text-sm outline-none resize-none text-text-light-primary dark:text-text-dark-primary placeholder:opacity-40 focus:ring-2 focus:ring-accent-blue focus:border-transparent min-h-[6rem]"
            rows={Math.max(3, editableSource.split('\n').length)}
          />
          <div className="mt-2 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            Press <kbd className="px-1 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark font-mono">Esc</kbd> or click outside to render
          </div>
        </div>
      ) : (
        <div
          className="p-4 bg-surface-light dark:bg-surface-dark cursor-pointer hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          onClick={handleEdit}
          title="Click to edit"
        >
          <MermaidRenderer source={source} />
        </div>
      )}
    </div>
  );
}

export class MermaidBlockNode extends DecoratorNode<React.ReactElement> {
  __source: string;

  static getType(): string {
    return 'mermaid-block';
  }

  static clone(node: MermaidBlockNode): MermaidBlockNode {
    return new MermaidBlockNode(node.__source, node.__key);
  }

  static importJSON(
    serializedNode: SerializedMermaidBlockNode
  ): MermaidBlockNode {
    return $createMermaidBlockNode({ source: serializedNode.source });
  }

  exportJSON(): SerializedMermaidBlockNode {
    return {
      type: 'mermaid-block',
      version: 1,
      source: this.__source,
    };
  }

  constructor(source: string, key?: NodeKey) {
    super(key);
    this.__source = source;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = 'mermaid-block-node';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <MermaidBlockComponent
        nodeKey={this.__key}
        source={this.__source}
      />
    );
  }

  getTextContent(): string {
    return this.__source;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createMermaidBlockNode(
  payload: MermaidBlockPayload
): MermaidBlockNode {
  return new MermaidBlockNode(payload.source ?? '', payload.key);
}

export function $isMermaidBlockNode(
  node: LexicalNode | null | undefined
): node is MermaidBlockNode {
  return node instanceof MermaidBlockNode;
}
