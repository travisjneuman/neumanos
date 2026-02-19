/**
 * BlockReferencePlugin
 *
 * Handles block-level link navigation:
 * - Scroll to block when block link is clicked
 * - Highlight target block for 3s
 * - Handle broken block links
 */

import { useEffect } from 'react';
import { NOTE_CONSTANTS } from '../../../types/notes';

interface BlockReferencePluginProps {
  /**
   * Block ID to scroll to (from URL hash)
   * Format: #block-id
   */
  targetBlockId?: string;
}

export default function BlockReferencePlugin({ targetBlockId }: BlockReferencePluginProps) {
  useEffect(() => {
    if (!targetBlockId) return;

    // Wait for editor to fully render
    const timeout = setTimeout(() => {
      scrollToBlock(targetBlockId);
    }, 100);

    return () => clearTimeout(timeout);
  }, [targetBlockId]);

  return null;
}

/**
 * Scroll to a block and highlight it
 *
 * Searches for block in two ways:
 * 1. Manual block IDs: Look for ^block-id in text
 * 2. Heading slugs: Look for headings and match slugified text
 */
function scrollToBlock(blockId: string): void {
  const editorContainer = document.querySelector('[contenteditable="true"]');
  if (!editorContainer) return;

  // Search for manual block ID (^block-id)
  const blockIdPattern = new RegExp(`\^${blockId}\b`);
  const walker = document.createTreeWalker(
    editorContainer,
    NodeFilter.SHOW_TEXT,
    null
  );

  let targetElement: HTMLElement | null = null;

  // Search text nodes for ^block-id
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (textNode.textContent && blockIdPattern.test(textNode.textContent)) {
      targetElement = textNode.parentElement;
      break;
    }
  }

  // If not found, search for heading with matching slug
  if (!targetElement) {
    const headings = editorContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const blockIdLower = blockId.toLowerCase();

    for (const heading of headings) {
      const headingText = heading.textContent || '';
      const headingSlug = slugify(headingText);

      if (headingSlug === blockIdLower) {
        targetElement = heading as HTMLElement;
        break;
      }
    }
  }

  if (!targetElement) {
    console.warn(`Block not found: ${blockId}`);
    return;
  }

  // Scroll to block
  targetElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });

  // Highlight block
  highlightBlock(targetElement);
}

/**
 * Highlight a block element for 3s
 */
function highlightBlock(element: HTMLElement): void {
  // Add highlight class
  element.classList.add('block-highlight');

  // Create style element if it doesn't exist
  if (!document.getElementById('block-highlight-styles')) {
    const style = document.createElement('style');
    style.id = 'block-highlight-styles';
    style.textContent = `
      .block-highlight {
        animation: block-highlight-flash 3s ease-out;
        position: relative;
      }

      @keyframes block-highlight-flash {
        0% {
          background-color: rgba(59, 130, 246, 0.3);
        }
        100% {
          background-color: transparent;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Remove highlight after duration
  setTimeout(() => {
    element.classList.remove('block-highlight');
  }, NOTE_CONSTANTS.BLOCK_HIGHLIGHT_DURATION_MS);
}

/**
 * Slugify heading text (same logic as blockReferences.ts)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
