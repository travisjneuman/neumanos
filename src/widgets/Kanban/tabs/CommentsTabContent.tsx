import React, { useState } from 'react';
import type { TaskComment } from '../../../types';

interface CommentsTabContentProps {
  comments: TaskComment[] | undefined;
  onAddComment: (text: string) => void;
}

/**
 * Comments Tab Content
 * Displays comment list and add comment form.
 */
export const CommentsTabContent: React.FC<CommentsTabContentProps> = ({
  comments,
  onAddComment,
}) => {
  const [newCommentText, setNewCommentText] = useState('');

  const handleSubmit = () => {
    if (newCommentText.trim()) {
      onAddComment(newCommentText.trim());
      setNewCommentText('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments && comments.length > 0 ? (
          comments
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((comment) => (
              <div key={comment.id} className="bg-surface-light-elevated dark:bg-surface-dark p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">{comment.author}</span>
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-text-light-primary dark:text-text-dark-primary whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))
        ) : (
          <div className="text-center py-2 text-text-light-secondary dark:text-text-dark-secondary text-xs">
            💬 No comments yet
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="space-y-2">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-3 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none resize-y"
          rows={3}
        />
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Post Comment
        </button>
      </div>
    </div>
  );
};
