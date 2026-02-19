/**
 * Orphan Panel Component
 * Sidebar panel showing orphan nodes with connection suggestions
 */

import { useState } from 'react';
import { AlertCircle, Link as LinkIcon, X, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import type { OrphanNode } from '../../types/graph';

interface OrphanPanelProps {
  /** List of orphan nodes with suggestions */
  orphans: OrphanNode[];
  /** Callback when user wants to focus on an orphan */
  onFocusOrphan: (nodeId: string) => void;
  /** Callback when user wants to create a link */
  onCreateLink: (orphanId: string, targetId: string) => void;
  /** Callback when user wants to add a tag */
  onAddTag: (orphanId: string, tag: string) => void;
  /** Callback to close panel */
  onClose: () => void;
}

export function OrphanPanel({
  orphans,
  onFocusOrphan,
  onCreateLink,
  onAddTag,
  onClose,
}: OrphanPanelProps) {
  const [expandedOrphanId, setExpandedOrphanId] = useState<string | null>(null);

  const toggleExpanded = (nodeId: string) => {
    setExpandedOrphanId(expandedOrphanId === nodeId ? null : nodeId);
  };

  const getReasonLabel = (
    reason: 'similar-title' | 'same-folder' | 'recent-edit' | 'similar-content'
  ): string => {
    switch (reason) {
      case 'similar-title':
        return 'Similar title';
      case 'same-folder':
        return 'Same folder';
      case 'recent-edit':
        return 'Edited recently';
      case 'similar-content':
        return 'Similar content';
    }
  };

  const getReasonColor = (
    reason: 'similar-title' | 'same-folder' | 'recent-edit' | 'similar-content'
  ): string => {
    switch (reason) {
      case 'similar-title':
        return 'text-accent-primary';
      case 'same-folder':
        return 'text-accent-primary';
      case 'recent-edit':
        return 'text-accent-purple';
      case 'similar-content':
        return 'text-accent-yellow';
    }
  };

  if (orphans.length === 0) {
    return (
      <div className="flex flex-col h-full bg-surface-light-base dark:bg-surface-dark-base border-l border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Orphan Nodes
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded"
            aria-label="Close orphan panel"
          >
            <X className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-accent-primary opacity-50" />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              No orphan nodes found
            </p>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
              All notes are connected!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-light-base dark:bg-surface-dark-base border-l border-border-light dark:border-border-dark w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            Orphan Nodes
          </h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-accent-primary/10 text-accent-primary">
            {orphans.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-colors"
          aria-label="Close orphan panel"
        >
          <X className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
        </button>
      </div>

      {/* Orphan list */}
      <div className="flex-1 overflow-y-auto">
        {orphans.map((orphan) => {
          const isExpanded = expandedOrphanId === orphan.nodeId;
          const hasSuggestions = orphan.suggestions.length > 0;

          return (
            <div
              key={orphan.nodeId}
              className="border-b border-border-light dark:border-border-dark last:border-b-0"
            >
              {/* Orphan header */}
              <div className="p-3 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors">
                <div className="flex items-start gap-2">
                  {hasSuggestions && (
                    <button
                      onClick={() => toggleExpanded(orphan.nodeId)}
                      className="mt-0.5 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onFocusOrphan(orphan.nodeId)}
                      className="text-left w-full group"
                    >
                      <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate group-hover:text-accent-primary transition-colors">
                        {orphan.title}
                      </h4>
                    </button>
                    {hasSuggestions && (
                      <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
                        {orphan.suggestions.length} suggestion
                        {orphan.suggestions.length !== 1 ? 's' : ''}
                      </p>
                    )}
                    {!hasSuggestions && (
                      <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
                        No suggestions available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions (expanded) */}
              {isExpanded && hasSuggestions && (
                <div className="px-3 pb-3 pl-9 space-y-2">
                  {orphan.suggestions.map((suggestion, idx) => (
                    <div
                      key={`${suggestion.suggestedNoteId}-${idx}`}
                      className="p-2 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className={`text-xs font-medium ${getReasonColor(
                            suggestion.reason
                          )}`}
                        >
                          {getReasonLabel(suggestion.reason)}
                        </div>
                        <div className="ml-auto text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                          {Math.round(suggestion.confidence * 100)}%
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {suggestion.suggestedTag ? (
                          <button
                            onClick={() =>
                              onAddTag(orphan.nodeId, suggestion.suggestedTag!)
                            }
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
                          >
                            <Tag className="w-3 h-3" />
                            <span>Add tag: {suggestion.suggestedTag}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onCreateLink(
                                orphan.nodeId,
                                suggestion.suggestedNoteId
                              )
                            }
                            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>Create link</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated">
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          Orphan nodes have no connections. Click suggestions to add links or tags.
        </p>
      </div>
    </div>
  );
}
