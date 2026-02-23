/**
 * MathBlockNode - Custom Lexical DecoratorNode for KaTeX Math Blocks
 *
 * Renders LaTeX math expressions using KaTeX.
 * Click to edit source, blur or Escape to render.
 * Supports display (block) mode.
 *
 * Security: katex.renderToString() produces sanitized HTML from LaTeX math
 * expressions only. It does not evaluate arbitrary HTML/JS.
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

export interface MathBlockPayload {
  source?: string;
  key?: NodeKey;
}

export type SerializedMathBlockNode = Spread<
  {
    source: string;
  },
  SerializedLexicalNode
>;

/**
 * Renders KaTeX HTML from a LaTeX source string.
 * Uses dynamic import to keep the initial bundle small.
 */
function KaTeXRenderer({ source }: { source: string }) {
  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const katex = (await import('katex')).default;
        // Import KaTeX CSS if not already loaded
        if (!document.querySelector('link[href*="katex"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css';
          document.head.appendChild(link);
        }
        if (cancelled) return;
        // katex.renderToString produces sanitized math HTML, safe for innerHTML
        const rendered = katex.renderToString(source, {
          displayMode: true,
          throwOnError: false,
          output: 'html',
        });
        setHtml(rendered);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to render math');
        setHtml('');
      }
    }

    if (source.trim()) {
      render();
    } else {
      setHtml('');
      setError(null);
    }

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400 font-mono p-2 bg-red-50 dark:bg-red-950/30 rounded">
        KaTeX error: {error}
      </div>
    );
  }

  if (!source.trim()) {
    return (
      <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
        Empty math block
      </div>
    );
  }

  // eslint-disable-next-line react/no-danger -- katex.renderToString output is sanitized math markup
  return (
    <div
      className="katex-display-wrapper overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * MathBlockComponent - React component rendered by the DecoratorNode
 */
function MathBlockComponent({
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
        if (node && $isMathBlockNode(node)) {
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
        title="Remove math block"
      >
        ✕
      </button>

      {/* Label */}
      <div className="px-4 py-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border-b border-border-light dark:border-border-dark flex items-center gap-2">
        <span className="text-xs font-mono text-text-light-secondary dark:text-text-dark-secondary">
          Math (LaTeX)
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
            placeholder="Enter LaTeX expression... e.g. E = mc^2"
            className="w-full bg-transparent border border-border-light dark:border-border-dark rounded p-3 font-mono text-sm outline-none resize-none text-text-light-primary dark:text-text-dark-primary placeholder:opacity-40 focus:ring-2 focus:ring-accent-blue focus:border-transparent min-h-[4rem]"
            rows={Math.max(2, editableSource.split('\n').length)}
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
          <KaTeXRenderer source={source} />
        </div>
      )}
    </div>
  );
}

export class MathBlockNode extends DecoratorNode<React.ReactElement> {
  __source: string;

  static getType(): string {
    return 'math-block';
  }

  static clone(node: MathBlockNode): MathBlockNode {
    return new MathBlockNode(node.__source, node.__key);
  }

  static importJSON(serializedNode: SerializedMathBlockNode): MathBlockNode {
    return $createMathBlockNode({ source: serializedNode.source });
  }

  exportJSON(): SerializedMathBlockNode {
    return {
      type: 'math-block',
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
    div.className = 'math-block-node';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <MathBlockComponent
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

export function $createMathBlockNode(payload: MathBlockPayload): MathBlockNode {
  return new MathBlockNode(payload.source ?? '', payload.key);
}

export function $isMathBlockNode(
  node: LexicalNode | null | undefined
): node is MathBlockNode {
  return node instanceof MathBlockNode;
}
