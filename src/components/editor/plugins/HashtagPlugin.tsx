/**
 * HashtagPlugin
 *
 * Lexical plugin that:
 * 1. Detects #tag and #[[multi word]] patterns in text
 * 2. Transforms them into HashtagNode instances
 * 3. Syncs extracted hashtags to note.tags array
 * 4. Handles clicks on hashtags to filter notes
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  TextNode,
  COMMAND_PRIORITY_LOW,
  CLICK_COMMAND,
} from 'lexical';
import { HashtagNode, $createHashtagNode, $isHashtagNode } from '../nodes/HashtagNode';
import { extractHashtags } from '../../../utils/hashtags';

interface HashtagPluginProps {
  onHashtagsChange?: (tags: string[]) => void;
  onHashtagClick?: (tag: string) => void;
}

export default function HashtagPlugin({ onHashtagsChange, onHashtagClick }: HashtagPluginProps) {
  const [editor] = useLexicalComposerContext();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transform TextNode containing hashtags into HashtagNodes
  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (textNode) => {
      // Skip if already a HashtagNode
      if ($isHashtagNode(textNode)) {
        return;
      }

      const text = textNode.getTextContent();
      
      // Match #tag or #[[multi word]] patterns
      const hashtagPattern = /#(\[\[.*?\]\]|[a-zA-Z][a-zA-Z0-9-]*)/g;
      let match;
      const matches: Array<{ start: number; end: number; tag: string }> = [];

      while ((match = hashtagPattern.exec(text)) !== null) {
        let tag = match[1].trim();
        
        // Extract content from [[brackets]]
        if (tag.startsWith('[[') && tag.endsWith(']]')) {
          tag = tag.slice(2, -2).trim();
        }

        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          tag,
        });
      }

      if (matches.length === 0) {
        return;
      }

      let currentOffset = 0;
      const nodesToInsert: Array<TextNode | HashtagNode> = [];

      matches.forEach((hashtagMatch) => {
        // Text before hashtag
        if (hashtagMatch.start > currentOffset) {
          const beforeText = text.slice(currentOffset, hashtagMatch.start);
          nodesToInsert.push(new TextNode(beforeText));
        }

        // Create HashtagNode
        const hashtagNode = $createHashtagNode(hashtagMatch.tag);
        nodesToInsert.push(hashtagNode);

        currentOffset = hashtagMatch.end;
      });

      // Text after last hashtag
      if (currentOffset < text.length) {
        const afterText = text.slice(currentOffset);
        nodesToInsert.push(new TextNode(afterText));
      }

      // Replace text node with nodes array
      if (nodesToInsert.length > 0) {
        textNode.replace(nodesToInsert[0]);
        for (let i = 1; i < nodesToInsert.length; i++) {
          nodesToInsert[i - 1].insertAfter(nodesToInsert[i]);
        }
      }
    });

    return removeTransform;
  }, [editor]);

  // Extract and sync hashtags to note.tags (debounced)
  const extractAndSyncHashtags = useCallback(() => {
    if (!onHashtagsChange) return;

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      
      // Extract all hashtags from content
      const tags = extractHashtags(textContent);
      
      // Notify parent component
      onHashtagsChange(tags);
    });
  }, [editor, onHashtagsChange]);

  // Listen to editor updates and extract hashtags (debounced)
  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(() => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce extraction by 300ms
      debounceTimerRef.current = setTimeout(() => {
        extractAndSyncHashtags();
      }, 300);
    });

    return () => {
      removeUpdateListener();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [editor, extractAndSyncHashtags]);

  // Handle clicks on hashtags
  useEffect(() => {
    if (!onHashtagClick) return;

    const removeClickListener = editor.registerCommand(
      CLICK_COMMAND,
      (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (target.classList.contains('hashtag')) {
          event.preventDefault();

          const tag = target.getAttribute('data-tag');
          if (tag) {
            onHashtagClick(tag);
          }

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return removeClickListener;
  }, [editor, onHashtagClick]);

  return null;
}
