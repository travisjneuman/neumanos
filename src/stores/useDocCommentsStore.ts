/**
 * Document Comments Store
 *
 * Manages inline comments for the Document Editor (Tiptap).
 * Comments are stored per-document and linked to text ranges via comment IDs.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DocComment {
  id: string;
  documentId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
  /** Parent comment ID for replies */
  parentId?: string;
}

interface DocCommentsState {
  /** All comments indexed by document ID */
  commentsByDoc: Record<string, DocComment[]>;

  /** Currently active (focused) comment ID */
  activeCommentId: string | null;

  /** Add a new comment */
  addComment: (documentId: string, commentId: string, content: string) => void;

  /** Reply to an existing comment */
  replyToComment: (documentId: string, parentId: string, content: string) => void;

  /** Resolve a comment thread */
  resolveComment: (documentId: string, commentId: string) => void;

  /** Unresolve a comment thread */
  unresolveComment: (documentId: string, commentId: string) => void;

  /** Delete a comment (and its replies) */
  deleteComment: (documentId: string, commentId: string) => void;

  /** Update comment content */
  updateComment: (documentId: string, commentId: string, content: string) => void;

  /** Get all comments for a document */
  getComments: (documentId: string) => DocComment[];

  /** Get a comment thread (parent + replies) */
  getThread: (documentId: string, commentId: string) => DocComment[];

  /** Set active comment */
  setActiveComment: (commentId: string | null) => void;
}

export const useDocCommentsStore = create<DocCommentsState>()(
  persist(
    (set, get) => ({
      commentsByDoc: {},
      activeCommentId: null,

      addComment: (documentId, commentId, content) => {
        const comment: DocComment = {
          id: commentId,
          documentId,
          content,
          author: 'You',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolved: false,
        };

        set((state) => {
          const existing = state.commentsByDoc[documentId] || [];
          return {
            commentsByDoc: {
              ...state.commentsByDoc,
              [documentId]: [...existing, comment],
            },
            activeCommentId: commentId,
          };
        });
      },

      replyToComment: (documentId, parentId, content) => {
        const reply: DocComment = {
          id: crypto.randomUUID(),
          documentId,
          content,
          author: 'You',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolved: false,
          parentId,
        };

        set((state) => {
          const existing = state.commentsByDoc[documentId] || [];
          return {
            commentsByDoc: {
              ...state.commentsByDoc,
              [documentId]: [...existing, reply],
            },
          };
        });
      },

      resolveComment: (documentId, commentId) => {
        set((state) => {
          const existing = state.commentsByDoc[documentId] || [];
          return {
            commentsByDoc: {
              ...state.commentsByDoc,
              [documentId]: existing.map((c) =>
                c.id === commentId ? { ...c, resolved: true, updatedAt: new Date().toISOString() } : c
              ),
            },
          };
        });
      },

      unresolveComment: (documentId, commentId) => {
        set((state) => {
          const existing = state.commentsByDoc[documentId] || [];
          return {
            commentsByDoc: {
              ...state.commentsByDoc,
              [documentId]: existing.map((c) =>
                c.id === commentId ? { ...c, resolved: false, updatedAt: new Date().toISOString() } : c
              ),
            },
          };
        });
      },

      deleteComment: (documentId, commentId) => {
        set((state) => {
          const existing = state.commentsByDoc[documentId] || [];
          // Remove the comment and all its replies
          return {
            commentsByDoc: {
              ...state.commentsByDoc,
              [documentId]: existing.filter(
                (c) => c.id !== commentId && c.parentId !== commentId
              ),
            },
            activeCommentId:
              state.activeCommentId === commentId ? null : state.activeCommentId,
          };
        });
      },

      updateComment: (documentId, commentId, content) => {
        set((state) => {
          const existing = state.commentsByDoc[documentId] || [];
          return {
            commentsByDoc: {
              ...state.commentsByDoc,
              [documentId]: existing.map((c) =>
                c.id === commentId
                  ? { ...c, content, updatedAt: new Date().toISOString() }
                  : c
              ),
            },
          };
        });
      },

      getComments: (documentId) => {
        return get().commentsByDoc[documentId] || [];
      },

      getThread: (documentId, commentId) => {
        const comments = get().commentsByDoc[documentId] || [];
        const parent = comments.find((c) => c.id === commentId);
        if (!parent) return [];
        const replies = comments.filter((c) => c.parentId === commentId);
        return [parent, ...replies.sort((a, b) => a.createdAt.localeCompare(b.createdAt))];
      },

      setActiveComment: (commentId) => {
        set({ activeCommentId: commentId });
      },
    }),
    {
      name: 'doc-comments-storage',
    }
  )
);
