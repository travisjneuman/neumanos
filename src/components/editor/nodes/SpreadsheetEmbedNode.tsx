/**
 * Spreadsheet Embed Node for Lexical Editor
 * DecoratorNode that renders a read-only mini table preview
 */

import React, { useCallback } from 'react';
import { DecoratorNode } from 'lexical';
import { useDocsStore } from '../../../stores/useDocsStore';
import { useNavigate } from 'react-router-dom';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
} from 'lexical';
import type { SpreadsheetDoc } from '../../../types';

export type SerializedSpreadsheetEmbedNode = Spread<
  { docId: string },
  SerializedLexicalNode
>;

export class SpreadsheetEmbedNode extends DecoratorNode<React.ReactElement> {
  __docId: string;

  static getType(): string {
    return 'spreadsheet-embed';
  }

  static clone(node: SpreadsheetEmbedNode): SpreadsheetEmbedNode {
    return new SpreadsheetEmbedNode(node.__docId, node.__key);
  }

  static importJSON(
    serializedNode: SerializedSpreadsheetEmbedNode
  ): SpreadsheetEmbedNode {
    return new SpreadsheetEmbedNode(serializedNode.docId);
  }

  exportJSON(): SerializedSpreadsheetEmbedNode {
    return {
      docId: this.__docId,
      type: 'spreadsheet-embed',
      version: 1,
    };
  }

  constructor(docId: string, key?: NodeKey) {
    super(key);
    this.__docId = docId;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'inline-block align-middle';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  decorate(): React.ReactElement {
    return (
      <SpreadsheetEmbedComponent docId={this.__docId} nodeKey={this.__key} />
    );
  }
}

const MAX_PREVIEW_ROWS = 5;
const MAX_PREVIEW_COLS = 5;

const SpreadsheetEmbedComponent = React.memo(function SpreadsheetEmbedComponent({
  docId,
  nodeKey: _nodeKey,
}: {
  docId: string;
  nodeKey: NodeKey;
}) {
  const doc = useDocsStore((state) =>
    state.docs.find((d) => d.id === docId && d.type === 'sheet')
  ) as SpreadsheetDoc | undefined;
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/create/${docId}`);
    },
    [navigate, docId]
  );

  if (!doc) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
        Spreadsheet not found
      </span>
    );
  }

  const sheet = doc.sheets[0];
  if (!sheet) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated text-xs text-text-light-secondary dark:text-text-dark-secondary">
        Empty spreadsheet
      </span>
    );
  }

  // Find the actual data bounds (skip trailing empty rows/cols)
  let maxRow = 0;
  let maxCol = 0;
  for (let r = 0; r < Math.min(sheet.data.length, MAX_PREVIEW_ROWS); r++) {
    for (let c = 0; c < Math.min(sheet.data[r]?.length || 0, MAX_PREVIEW_COLS); c++) {
      if (sheet.data[r][c]) {
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  const rowCount = Math.min(maxRow + 1, MAX_PREVIEW_ROWS);
  const colCount = Math.min(maxCol + 1, MAX_PREVIEW_COLS);

  // If no data at all, show minimal preview
  if (rowCount === 0 || colCount === 0) {
    return (
      <span
        onClick={handleNavigate}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated hover:border-accent-blue/50 transition-colors cursor-pointer text-sm my-0.5"
        title="Open spreadsheet"
      >
        <svg className="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
        <span className="text-text-light-primary dark:text-text-dark-primary font-medium">
          {doc.title}
        </span>
        <span className="text-text-light-tertiary dark:text-text-dark-tertiary text-xs">
          (empty)
        </span>
      </span>
    );
  }

  const rows = sheet.data.slice(0, rowCount);

  return (
    <span
      onClick={handleNavigate}
      className="inline-block my-1 rounded-lg border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated hover:border-accent-blue/50 transition-colors cursor-pointer overflow-hidden"
      title="Open spreadsheet"
    >
      <span className="flex items-center gap-2 px-3 py-1.5 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
        <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
          {doc.title}
        </span>
      </span>
      <table className="text-xs border-collapse">
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.slice(0, colCount).map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-2 py-1 border-r border-b border-border-light/50 dark:border-border-dark/50 max-w-[120px] truncate ${
                    rIdx === 0
                      ? 'font-medium text-text-light-primary dark:text-text-dark-primary bg-surface-light dark:bg-surface-dark/50'
                      : 'text-text-light-secondary dark:text-text-dark-secondary'
                  }`}
                >
                  {cell || '\u00A0'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
});

export function $createSpreadsheetEmbedNode(docId: string): SpreadsheetEmbedNode {
  return new SpreadsheetEmbedNode(docId);
}

export function $isSpreadsheetEmbedNode(
  node: LexicalNode | null | undefined
): node is SpreadsheetEmbedNode {
  return node instanceof SpreadsheetEmbedNode;
}
