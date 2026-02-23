/**
 * TipTap Comment Mark Extension
 *
 * Custom mark that highlights commented text and stores a comment ID attribute.
 * Used to link text ranges in the editor to comment threads in the store.
 */

import { Mark, mergeAttributes } from '@tiptap/react';

export interface CommentMarkOptions {
  HTMLAttributes: Record<string, string>;
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    commentMark: {
      /**
       * Set a comment mark on the current selection
       */
      setComment: (commentId: string) => ReturnType;
      /**
       * Remove a comment mark by ID
       */
      unsetComment: (commentId: string) => ReturnType;
    };
  }
}

export const CommentMark = Mark.create<CommentMarkOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) return {};
          return { 'data-comment-id': attributes.commentId };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'doc-comment-highlight',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (commentId: string) =>
        ({ chain }) => {
          return chain()
            .setMark(this.name, { commentId })
            .run();
        },
      unsetComment:
        (commentId: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          // Find and remove all comment marks with this ID
          doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type.name === this.name && mark.attrs.commentId === commentId) {
                if (dispatch) {
                  tr.removeMark(pos, pos + node.nodeSize, mark);
                }
              }
            });
          });
          return true;
        },
    };
  },
});
