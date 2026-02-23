/**
 * DocumentCommentPanel Component
 *
 * Displays comment threads for the current document.
 * Shows in margin/sidebar with reply, resolve, and delete capabilities.
 */

import { useState, useCallback } from 'react';
import {
  MessageSquare,
  Check,
  Trash2,
  CornerDownRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { useDocCommentsStore, type DocComment } from '../../stores/useDocCommentsStore';
import type { Editor } from '@tiptap/react';

interface DocumentCommentPanelProps {
  documentId: string;
  editor: Editor;
  onClose: () => void;
}

export function DocumentCommentPanel({
  documentId,
  editor,
  onClose,
}: DocumentCommentPanelProps) {
  const {
    getComments,
    getThread,
    replyToComment,
    resolveComment,
    unresolveComment,
    deleteComment,
    activeCommentId,
    setActiveComment,
  } = useDocCommentsStore();

  const allComments = getComments(documentId);
  // Only show top-level comments (not replies)
  const topLevelComments = allComments.filter((c) => !c.parentId);
  const [showResolved, setShowResolved] = useState(false);

  const visibleComments = showResolved
    ? topLevelComments
    : topLevelComments.filter((c) => !c.resolved);

  const handleScrollToComment = useCallback(
    (commentId: string) => {
      setActiveComment(commentId);

      // Find the comment mark in the editor and scroll to it
      const { doc } = editor.state;
      let targetPos: number | null = null;

      doc.descendants((node, pos) => {
        if (targetPos !== null) return false;
        node.marks.forEach((mark) => {
          if (mark.type.name === 'comment' && mark.attrs.commentId === commentId) {
            targetPos = pos;
          }
        });
      });

      if (targetPos !== null) {
        editor.commands.setTextSelection(targetPos);
        editor.commands.scrollIntoView();
      }
    },
    [editor, setActiveComment]
  );

  const handleDeleteThread = useCallback(
    (commentId: string) => {
      // Remove the comment mark from editor
      editor.commands.unsetComment(commentId);
      // Delete from store
      deleteComment(documentId, commentId);
    },
    [editor, documentId, deleteComment]
  );

  return (
    <div className="w-72 flex-shrink-0 bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Comments
          </h3>
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            ({visibleComments.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showResolved
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
            }`}
            title={showResolved ? 'Hide resolved' : 'Show resolved'}
          >
            {showResolved ? 'Hide resolved' : 'Show all'}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto">
        {visibleComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-text-light-tertiary dark:text-text-dark-tertiary">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Select text and click the comment button</p>
          </div>
        ) : (
          visibleComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              documentId={documentId}
              isActive={activeCommentId === comment.id}
              thread={getThread(documentId, comment.id)}
              onScrollTo={handleScrollToComment}
              onReply={(content) => replyToComment(documentId, comment.id, content)}
              onResolve={() => resolveComment(documentId, comment.id)}
              onUnresolve={() => unresolveComment(documentId, comment.id)}
              onDelete={() => handleDeleteThread(comment.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentThreadProps {
  comment: DocComment;
  documentId: string;
  isActive: boolean;
  thread: DocComment[];
  onScrollTo: (commentId: string) => void;
  onReply: (content: string) => void;
  onResolve: () => void;
  onUnresolve: () => void;
  onDelete: () => void;
}

function CommentThread({
  comment,
  isActive,
  thread,
  onScrollTo,
  onReply,
  onResolve,
  onUnresolve,
  onDelete,
}: CommentThreadProps) {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(replyText.trim());
    setReplyText('');
    setShowReply(false);
  };

  const replies = thread.slice(1); // First item is the parent

  return (
    <div
      className={`border-b border-border-light/50 dark:border-border-dark/50 transition-colors ${
        isActive
          ? 'bg-accent-primary/5 border-l-2 border-l-accent-primary'
          : comment.resolved
            ? 'opacity-60'
            : ''
      }`}
    >
      {/* Main comment */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-surface-light-alt/50 dark:hover:bg-surface-dark-elevated/50"
        onClick={() => onScrollTo(comment.id)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
            {comment.author}
          </span>
          <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary leading-relaxed">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReply(!showReply);
            }}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-primary rounded transition-colors"
            title="Reply"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
          </button>
          {comment.resolved ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnresolve();
              }}
              className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-amber-500 rounded transition-colors"
              title="Unresolve"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
              className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-green rounded transition-colors"
              title="Resolve"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-red rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {comment.resolved && (
            <span className="ml-auto text-[10px] text-accent-green font-medium">
              Resolved
            </span>
          )}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="pl-6 border-l-2 border-border-light/30 dark:border-border-dark/30 ml-4">
          {replies.map((reply) => (
            <div key={reply.id} className="px-3 py-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                  {reply.author}
                </span>
                <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                  {formatRelativeTime(reply.createdAt)}
                </span>
              </div>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReply && (
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitReply();
                if (e.key === 'Escape') setShowReply(false);
              }}
              placeholder="Write a reply..."
              autoFocus
              className="flex-1 px-2 py-1.5 text-xs bg-surface-light-alt dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />
            <button
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
              className="px-2 py-1.5 text-xs bg-accent-primary text-white rounded hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Format a timestamp to relative time (e.g., "2m ago", "1h ago") */
function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
