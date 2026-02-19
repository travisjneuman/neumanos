/**
 * TagPicker Component
 *
 * Inline tag picker with autocomplete for adding tags to notes
 * Features:
 * - Dropdown with existing tags
 * - Create new tags inline
 * - Keyboard navigation
 * - Click-outside-to-close
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Tag as TagIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { useTags, useRecentTags } from '../hooks/useTags';
import { buildTagTree, normalizeTag, type TagNode } from '../utils/tagHierarchy';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useNotesStore } from '../stores/useNotesStore';
import { generateTagSuggestions } from '../utils/tagSuggestions';
import { TagSuggestions } from './TagSuggestions';

interface TagPickerProps {
  /** Currently selected tags */
  selectedTags: string[];
  /** Callback when tag is added */
  onAddTag: (tag: string) => void;
  /** Callback when tag is removed */
  onRemoveTag: (tag: string) => void;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Optional: content for smart suggestions */
  content?: string;
  /** Optional: show suggestions */
  showSuggestions?: boolean;
}

export function TagPicker({
  selectedTags,
  onAddTag,
  onRemoveTag,
  maxTags = 20,
  content = '',
  showSuggestions = true
}: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all existing tags and recent tags
  const allTags = useTags();
  const recentTags = useRecentTags(5);
  const tagColors = useSettingsStore((state) => state.tagColors);
  const notesSnapshot = useNotesStore((state) => state.notes);

  // Cache the notes array to prevent infinite re-renders
  const allNotes = useMemo(() => Object.values(notesSnapshot), [notesSnapshot]);

  // Generate smart tag suggestions
  const suggestions = useMemo(() => {
    if (!showSuggestions || !content) return [];
    return generateTagSuggestions(content, selectedTags, allNotes, 5);
  }, [showSuggestions, content, selectedTags, allNotes]);

  // Build tag tree from all tags
  const tagTree = useMemo(() => buildTagTree(allTags), [allTags]);

  // Filter tags based on search query and exclude already selected
  const filteredTags = allTags.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show recent tags if no search query
  const suggestedTags = searchQuery
    ? filteredTags.slice(0, 10)
    : recentTags.filter((tag) => !selectedTags.includes(tag));

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleAddTag = (tag: string) => {
    const normalizedTag = normalizeTag(tag);
    if (!normalizedTag) return;
    if (selectedTags.includes(normalizedTag)) return;
    if (selectedTags.length >= maxTags) return;

    onAddTag(normalizedTag);
    setSearchQuery('');
    setIsOpen(false);
  };

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
    const isSelected = selectedTags.includes(node.name);

    return (
      <div key={node.name}>
        <button
          onClick={() => {
            if (!hasChildren) {
              handleAddTag(node.name);
            }
          }}
          disabled={isSelected}
          className={`
            w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
            hover:bg-surface-light dark:hover:bg-surface-dark transition-colors
            ${isSelected ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ paddingLeft: `${node.level * 16 + 12}px` }}
        >
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
          <TagIcon className="w-3 h-3 text-accent-primary flex-shrink-0" />
          <span className="flex-1 text-text-light-primary dark:text-text-dark-primary truncate">
            {node.label}
          </span>
          {hasChildren && (
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0">
              ({node.children.length})
            </span>
          )}
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        handleAddTag(searchQuery);
      } else if (suggestedTags.length > 0) {
        handleAddTag(suggestedTags[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const canAddMore = selectedTags.length < maxTags;

  return (
    <div className="relative">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 items-center">
        {selectedTags.map((tag) => {
          const color = tagColors[tag];
          return (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                color
                  ? `bg-${color}/10 text-${color} dark:bg-${color}/20`
                  : 'bg-accent-primary/10 text-accent-primary'
              }`}
            >
              <TagIcon className="w-3 h-3" />
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className={`rounded p-0.5 transition-colors ${
                  color
                    ? `hover:bg-${color}/20 dark:hover:bg-${color}/30`
                    : 'hover:bg-accent-primary/20'
                }`}
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        {/* Add Tag Button */}
        {canAddMore && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-colors"
            aria-label="Add tag"
          >
            <Plus className="w-3 h-3" />
            Add tag
          </button>
        )}
      </div>

      {/* Smart Tag Suggestions (P2) */}
      {showSuggestions && !isOpen && suggestions.length > 0 && (
        <div className="mt-2">
          <TagSuggestions
            suggestions={suggestions}
            onAddTag={onAddTag}
          />
        </div>
      )}

      {/* Tag Picker Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-64 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-border-light dark:border-border-dark">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or create tag..."
              className="w-full px-3 py-2 text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
            />
          </div>

          {/* Tag Suggestions */}
          <div className="max-h-64 overflow-y-auto">
            {searchQuery ? (
              /* Flat filtered list when searching */
              <>
                {!filteredTags.includes(searchQuery) && (
                  <button
                    onClick={() => handleAddTag(searchQuery)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-light-primary dark:text-text-dark-primary"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-accent-primary" />
                      <span>
                        Create "<span className="font-medium">{searchQuery}</span>"
                      </span>
                    </div>
                  </button>
                )}

                {filteredTags.length > 0 ? (
                  filteredTags.slice(0, 10).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-light-primary dark:text-text-dark-primary"
                    >
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-accent-primary" />
                        {tag}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    No matching tags
                  </div>
                )}
              </>
            ) : (
              /* Hierarchical tree when not searching */
              <>
                {tagTree.length > 0 ? (
                  <div className="py-1">
                    {tagTree.map(node => renderTagNode(node))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    No tags yet
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
