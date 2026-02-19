/**
 * TagFilter Component
 *
 * Tag-based filtering UI for notes sidebar
 * Features:
 * - Show active tag filters
 * - Add/remove tag filters
 * - Combine tags (AND logic)
 * - Clear all filters
 */

import React, { useState, useMemo } from 'react';
import { X, Tag as TagIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { useTagCounts } from '../hooks/useTags';
import { buildTagTree, type TagNode } from '../utils/tagHierarchy';
import { useSettingsStore } from '../stores/useSettingsStore';

interface TagFilterProps {
  /** Currently active tag filters */
  activeTags: string[];
  /** Callback when tag filter is added */
  onAddTag: (tag: string) => void;
  /** Callback when tag filter is removed */
  onRemoveTag: (tag: string) => void;
  /** Callback to clear all filters */
  onClearAll: () => void;
}

export function TagFilter({ activeTags, onAddTag, onRemoveTag, onClearAll }: TagFilterProps) {
  const tagCounts = useTagCounts();
  const tagColors = useSettingsStore((state) => state.tagColors);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  // Build tag tree with counts
  const tagCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    tagCounts.forEach(({ tag, count }) => {
      map[tag] = count;
    });
    return map;
  }, [tagCounts]);

  const allTags = useMemo(() => tagCounts.map(tc => tc.tag), [tagCounts]);
  const tagTree = useMemo(() => buildTagTree(allTags, tagCountMap), [allTags, tagCountMap]);

  const toggleExpand = (tag: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  // Recursive function to render tag tree
  const renderTagNode = (node: TagNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedTags.has(node.name);
    const isActive = activeTags.includes(node.name);

    return (
      <div key={node.name}>
        <button
          onClick={() => {
            if (!hasChildren && !isActive) {
              onAddTag(node.name);
            }
          }}
          disabled={isActive}
          className={`
            w-full flex items-center justify-between px-2 py-1.5 text-sm rounded transition-colors text-left group
            ${isActive
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            }
          `}
          style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.name);
                }}
                className="flex-shrink-0 cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
                )}
              </span>
            )}
            {!hasChildren && <span className="w-3" />}
            <span className={`truncate ${isActive ? '' : 'text-text-light-primary dark:text-text-dark-primary group-hover:text-accent-primary'}`}>
              {node.label}
            </span>
            {hasChildren && (
              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                ({node.children.length})
              </span>
            )}
          </div>
          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0 ml-2">
            {node.noteCount}
          </span>
        </button>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTagNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
          <h3 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            Filter by Tags
          </h3>
        </div>
        {activeTags.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active Filters */}
      {activeTags.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
            Active Filters ({activeTags.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {activeTags.map((tag) => {
              const color = tagColors[tag];
              return (
                <button
                  key={tag}
                  onClick={() => onRemoveTag(tag)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                    color
                      ? `bg-${color}/20 text-${color} hover:bg-${color}/30`
                      : 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30'
                  }`}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tags - Hierarchical Tree */}
      {tagTree.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
            Available Tags
          </div>
          <div className="max-h-64 overflow-y-auto">
            {tagTree.map(node => renderTagNode(node))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tagCounts.length === 0 && (
        <div className="text-center py-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
          No tags yet
        </div>
      )}

      {/* Info Text */}
      {activeTags.length > 1 && (
        <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Showing notes with <span className="font-medium">all</span> selected tags
        </div>
      )}
    </div>
  );
}
