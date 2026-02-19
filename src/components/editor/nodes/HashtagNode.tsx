/**
 * HashtagNode - Custom Lexical Node for Hashtags
 *
 * Renders #tag and #[[multi word]] hashtags with:
 * - Visual styling with semantic color tokens
 * - Click handler to filter notes by tag
 * - Accessibility support
 */

import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
} from 'lexical';
import { TextNode } from 'lexical';

export type SerializedHashtagNode = Spread<
  {
    tag: string;
  },
  SerializedTextNode
>;

/**
 * HashtagNode - Custom text node for hashtags
 * Extends TextNode to preserve text editing capabilities
 */
export class HashtagNode extends TextNode {
  __tag: string;

  static getType(): string {
    return 'hashtag';
  }

  static clone(node: HashtagNode): HashtagNode {
    return new HashtagNode(node.__tag, node.__text, node.__key);
  }

  constructor(tag: string, text?: string, key?: NodeKey) {
    // Display text includes # prefix
    const displayText = tag.includes(' ') ? `#[[${tag}]]` : `#${tag}`;
    super(text ?? displayText, key);
    this.__tag = tag;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.className = 'hashtag';
    
    // Store tag as data attribute
    element.setAttribute('data-tag', this.__tag);
    
    // Accessibility
    element.setAttribute(
      'aria-label',
      `Hashtag ${this.__tag}. Click to filter notes.`
    );
    
    // Cursor pointer for clickable hashtags
    element.style.cursor = 'pointer';
    
    return element;
  }

  updateDOM(
    prevNode: HashtagNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    // Update data attribute if tag changed
    if (prevNode.__tag !== this.__tag) {
      dom.setAttribute('data-tag', this.__tag);
      dom.setAttribute(
        'aria-label',
        `Hashtag ${this.__tag}. Click to filter notes.`
      );
    }
    
    // Update text content if changed
    const isUpdated = super.updateDOM(prevNode as this, dom, config);
    return isUpdated;
  }

  static importJSON(serializedNode: SerializedHashtagNode): HashtagNode {
    const node = $createHashtagNode(serializedNode.tag);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedHashtagNode {
    return {
      ...super.exportJSON(),
      tag: this.__tag,
      type: 'hashtag',
      version: 1,
    };
  }

  getTag(): string {
    return this.__tag;
  }

  setTag(tag: string): void {
    const writable = this.getWritable();
    writable.__tag = tag;
  }
}

/**
 * Helper function to create HashtagNode
 */
export function $createHashtagNode(tag: string): HashtagNode {
  return new HashtagNode(tag);
}

/**
 * Type guard for HashtagNode
 */
export function $isHashtagNode(
  node: LexicalNode | null | undefined
): node is HashtagNode {
  return node instanceof HashtagNode;
}
