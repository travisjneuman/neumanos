/**
 * WikiLinkNode - Custom Lexical Node for Wiki-style Links
 *
 * Renders [[Note Title]] links with:
 * - Visual distinction between valid/broken links
 * - Click handler for broken links to create notes
 * - Semantic color tokens (no hardcoded colors)
 */

import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
} from 'lexical';
import { TextNode } from 'lexical';
import type { Note } from '../../types/notes';

export type SerializedWikiLinkNode = Spread<
  {
    linkTitle: string;
    isBroken: boolean;
    blockId?: string;
  },
  SerializedTextNode
>;

/**
 * WikiLinkNode - Custom text node for wiki-style links
 * Extends TextNode to preserve text editing capabilities
 */
export class WikiLinkNode extends TextNode {
  __linkTitle: string;
  __isBroken: boolean;
  __blockId: string | undefined;

  static getType(): string {
    return 'wiki-link';
  }

  static clone(node: WikiLinkNode): WikiLinkNode {
    return new WikiLinkNode(node.__linkTitle, node.__isBroken, node.__blockId, node.__text, node.__key);
  }

  constructor(linkTitle: string, isBroken: boolean, blockId?: string, text?: string, key?: NodeKey) {
    super(text ?? `[[${linkTitle}]]`, key);
    this.__linkTitle = linkTitle;
    this.__isBroken = isBroken;
    this.__blockId = blockId;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.className = this.__isBroken
      ? 'wiki-link wiki-link-broken'
      : 'wiki-link wiki-link-valid';

    // Store block ID as data attribute
    if (this.__blockId) {
      element.setAttribute('data-block-id', this.__blockId);
    }

    // Accessibility
    const linkTarget = this.__blockId
      ? `${this.__linkTitle}#${this.__blockId}`
      : this.__linkTitle;

    element.setAttribute(
      'aria-label',
      this.__isBroken
        ? `Broken link to ${linkTarget}. Click to create note.`
        : `Link to ${linkTarget}`
    );

    // Cursor pointer for clickable links
    element.style.cursor = 'pointer';

    return element;
  }

  updateDOM(
    prevNode: WikiLinkNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    // Update class if broken state changed
    if (prevNode.__isBroken !== this.__isBroken) {
      dom.className = this.__isBroken
        ? 'wiki-link wiki-link-broken'
        : 'wiki-link wiki-link-valid';

      // Update aria-label
      dom.setAttribute(
        'aria-label',
        this.__isBroken
          ? `Broken link to ${this.__linkTitle}. Click to create note.`
          : `Link to ${this.__linkTitle}`
      );
    }

    // Update text content if changed
    const isUpdated = super.updateDOM(prevNode as this, dom, config);
    return isUpdated;
  }

  static importJSON(serializedNode: SerializedWikiLinkNode): WikiLinkNode {
    const node = $createWikiLinkNode(
      serializedNode.linkTitle,
      serializedNode.isBroken,
      serializedNode.blockId
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedWikiLinkNode {
    return {
      ...super.exportJSON(),
      linkTitle: this.__linkTitle,
      isBroken: this.__isBroken,
      blockId: this.__blockId,
      type: 'wiki-link',
      version: 1,
    };
  }

  getLinkTitle(): string {
    return this.__linkTitle;
  }

  getIsBroken(): boolean {
    return this.__isBroken;
  }

  setIsBroken(isBroken: boolean): void {
    const writable = this.getWritable();
    writable.__isBroken = isBroken;
  }

  getBlockId(): string | undefined {
    return this.__blockId;
  }

  setBlockId(blockId: string | undefined): void {
    const writable = this.getWritable();
    writable.__blockId = blockId;
  }
}

/**
 * Helper function to create WikiLinkNode
 */
export function $createWikiLinkNode(
  linkTitle: string,
  isBroken: boolean,
  blockId?: string
): WikiLinkNode {
  return new WikiLinkNode(linkTitle, isBroken, blockId);
}

/**
 * Type guard for WikiLinkNode
 */
export function $isWikiLinkNode(
  node: LexicalNode | null | undefined
): node is WikiLinkNode {
  return node instanceof WikiLinkNode;
}

/**
 * Utility: Check if a link title is broken (doesn't resolve to a note)
 */
export function isLinkBroken(linkTitle: string, allNotes: Record<string, Note>): boolean {
  const notesArray = Object.values(allNotes);
  const titleLower = linkTitle.toLowerCase();

  // Link is NOT broken if we find an exact or partial match
  const noteExists = notesArray.some(
    (note) =>
      note.title.toLowerCase() === titleLower ||
      note.title.toLowerCase().startsWith(titleLower)
  );

  return !noteExists;
}
