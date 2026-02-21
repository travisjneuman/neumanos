/**
 * Markdown to Lexical Conversion Utility
 *
 * Converts markdown strings to Lexical editor state JSON.
 * Used for importing AI Terminal messages into Notes.
 *
 * @module utils/markdownToLexical
 */

import { createEditor } from 'lexical';
import type { SerializedEditorState } from 'lexical';
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { logger } from '../services/logger';

const log = logger.module('MarkdownToLexical');

/**
 * Lexical nodes configuration for the converter
 * Must match the nodes used in NotesEditor.tsx
 */
const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableCellNode,
  TableRowNode,
];

/**
 * Convert markdown string to Lexical editor state JSON
 *
 * @param markdown - Markdown string to convert
 * @returns Serialized Lexical editor state as JSON string
 *
 * @example
 * ```ts
 * const markdown = '# Hello\n\nThis is **bold** text.';
 * const lexicalJson = markdownToLexical(markdown);
 * // Use lexicalJson as note.content
 * ```
 */
export function markdownToLexical(markdown: string): string {
  try {
    // Create a temporary editor with the same node configuration as NotesEditor
    const editor = createEditor({
      nodes: EDITOR_NODES,
      onError: (error) => {
        log.error('Lexical editor error during conversion', { error });
      },
    });

    // Convert markdown to Lexical state
    editor.update(
      () => {
        $convertFromMarkdownString(markdown, TRANSFORMERS);
      },
      { discrete: true } // Synchronous update
    );

    // Get the serialized state
    const editorState = editor.getEditorState();
    const serializedState = editorState.toJSON();

    log.debug('Converted markdown to Lexical', {
      markdownLength: markdown.length,
      nodeCount: countNodes(serializedState),
    });

    return JSON.stringify(serializedState);
  } catch (error) {
    log.error('Failed to convert markdown to Lexical', { error });
    // Return empty editor state as fallback
    return createEmptyEditorState();
  }
}

/**
 * Convert markdown to Lexical and append to existing content
 *
 * @param existingContent - Existing Lexical JSON content (note.content)
 * @param newMarkdown - New markdown to append
 * @param separator - Optional separator between existing and new content
 * @returns Combined Lexical editor state as JSON string
 */
export function appendMarkdownToLexical(
  existingContent: string,
  newMarkdown: string,
  separator: string = '\n\n---\n\n'
): string {
  try {
    // If no existing content, just convert the new markdown
    if (!existingContent || existingContent === '{}') {
      return markdownToLexical(newMarkdown);
    }

    // Parse existing Lexical state - just validate it's JSON
    try {
      JSON.parse(existingContent) as SerializedEditorState;
    } catch {
      // If existing content isn't valid JSON, treat as empty
      log.warn('Invalid existing Lexical content, starting fresh');
      return markdownToLexical(newMarkdown);
    }

    // Strategy: Convert existing to markdown, append, convert back
    // This is simpler than manipulating the AST directly
    const existingMarkdown = lexicalToMarkdown(existingContent);
    const combinedMarkdown = existingMarkdown + separator + newMarkdown;

    return markdownToLexical(combinedMarkdown);
  } catch (error) {
    log.error('Failed to append markdown to Lexical', { error });
    // Fallback: just return the new content
    return markdownToLexical(newMarkdown);
  }
}

/**
 * Convert Lexical editor state to markdown
 * Wrapper around existing export functionality
 *
 * @param lexicalJson - Lexical editor state as JSON string
 * @returns Markdown string
 */
export function lexicalToMarkdown(lexicalJson: string): string {
  try {
    if (!lexicalJson || lexicalJson === '{}') {
      return '';
    }

    const editor = createEditor({
      nodes: EDITOR_NODES,
      onError: (error) => {
        log.error('Lexical editor error during markdown export', { error });
      },
    });

    let markdown = '';

    editor.update(
      () => {
        const parsedState = JSON.parse(lexicalJson);
        const editorState = editor.parseEditorState(parsedState);
        editor.setEditorState(editorState);
      },
      { discrete: true }
    );

    editor.getEditorState().read(() => {
      markdown = $convertToMarkdownString(TRANSFORMERS);
    });

    return markdown;
  } catch (error) {
    log.error('Failed to convert Lexical to markdown', { error });
    return '';
  }
}

/**
 * Create an empty Lexical editor state JSON
 *
 * @returns Empty editor state as JSON string
 */
export function createEmptyEditorState(): string {
  const editor = createEditor({
    nodes: EDITOR_NODES,
    onError: () => {},
  });

  return JSON.stringify(editor.getEditorState().toJSON());
}

/**
 * Validate that a string is valid Lexical JSON
 *
 * @param content - Content to validate
 * @returns True if valid Lexical JSON, false otherwise
 */
export function isValidLexicalJson(content: string): boolean {
  try {
    if (!content) return false;

    const parsed = JSON.parse(content);

    // Check for Lexical state structure
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'root' in parsed
    );
  } catch {
    return false;
  }
}

/**
 * Count nodes in a serialized editor state (for debugging)
 */
function countNodes(state: SerializedEditorState): number {
  try {
    let count = 0;
    const countRecursive = (node: unknown) => {
      if (typeof node === 'object' && node !== null) {
        count++;
        if ('children' in node && Array.isArray((node as Record<string, unknown>).children)) {
          (node as { children: unknown[] }).children.forEach(countRecursive);
        }
      }
    };
    countRecursive(state.root);
    return count;
  } catch {
    return 0;
  }
}
