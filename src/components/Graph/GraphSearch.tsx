/**
 * Graph Search Component
 * Search bar with filters for graph visualization
 */

import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import type { GraphSearchFilters } from '../../types/graph';

interface GraphSearchProps {
  /** Available tags for filtering */
  availableTags: string[];
  /** Current filters */
  filters: GraphSearchFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: GraphSearchFilters) => void;
  /** Number of matching results */
  resultCount?: number;
}

export function GraphSearch({
  availableTags,
  filters,
  onFiltersChange,
  resultCount,
}: GraphSearchProps) {
  const [localQuery, setLocalQuery] = useState(filters.query || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounce query updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localQuery !== filters.query) {
        onFiltersChange({ ...filters, query: localQuery || undefined });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localQuery, filters, onFiltersChange]);

  const handleClearAll = () => {
    setLocalQuery('');
    onFiltersChange({
      query: undefined,
      tags: undefined,
      nodeType: 'both',
      connectedTo: undefined,
    });
  };

  const hasActiveFilters =
    filters.query ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.nodeType && filters.nodeType !== 'both') ||
    filters.connectedTo;

  return (
    <div className="flex flex-col gap-2">
      {/* Main search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light-base dark:bg-surface-dark-base text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            showAdvanced
              ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
              : 'border-border-light dark:border-border-dark bg-surface-light-base dark:bg-surface-dark-base text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-primary/50'
          }`}
          aria-label="Toggle advanced filters"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filters</span>
        </button>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="px-3 py-2 text-sm rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Result count */}
      {resultCount !== undefined && (
        <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </div>
      )}

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated">
          {/* Tag filter */}
          {availableTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                Filter by tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = filters.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        const currentTags = filters.tags || [];
                        const newTags = isSelected
                          ? currentTags.filter((t) => t !== tag)
                          : [...currentTags, tag];
                        onFiltersChange({
                          ...filters,
                          tags: newTags.length > 0 ? newTags : undefined,
                        });
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        isSelected
                          ? 'bg-accent-primary text-white'
                          : 'bg-surface-light-base dark:bg-surface-dark-base text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-accent-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Node type filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              Node type
            </label>
            <div className="flex gap-2">
              {(['both', 'note', 'tag'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    onFiltersChange({ ...filters, nodeType: type })
                  }
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    (filters.nodeType || 'both') === type
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-light-base dark:bg-surface-dark-base text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-accent-primary'
                  }`}
                >
                  {type === 'both'
                    ? 'All'
                    : type === 'note'
                    ? 'Notes only'
                    : 'Tags only'}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border-light dark:border-border-dark">
              {filters.query && (
                <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-accent-primary/10 text-accent-primary">
                  <span>Query: "{filters.query}"</span>
                  <button
                    onClick={() => {
                      setLocalQuery('');
                      onFiltersChange({ ...filters, query: undefined });
                    }}
                    className="hover:bg-accent-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {filters.tags?.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-accent-primary/10 text-accent-primary"
                >
                  <span>Tag: {tag}</span>
                  <button
                    onClick={() => {
                      const newTags = filters.tags!.filter((t) => t !== tag);
                      onFiltersChange({
                        ...filters,
                        tags: newTags.length > 0 ? newTags : undefined,
                      });
                    }}
                    className="hover:bg-accent-primary/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {filters.nodeType && filters.nodeType !== 'both' && (
                <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-accent-purple/10 text-accent-purple">
                  <span>
                    Type: {filters.nodeType === 'note' ? 'Notes' : 'Tags'}
                  </span>
                  <button
                    onClick={() =>
                      onFiltersChange({ ...filters, nodeType: 'both' })
                    }
                    className="hover:bg-accent-purple/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
