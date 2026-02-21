import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Tag } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';

// Predefined tag colors for consistent display
const TAG_COLORS: Record<string, string> = {
  meeting: '#F59E0B',
  coding: '#06B6D4',
  review: '#8B5CF6',
  design: '#EC4899',
  research: '#10B981',
  planning: '#3B82F6',
  testing: '#EF4444',
  documentation: '#F97316',
  deployment: '#14B8A6',
  support: '#A855F7',
  admin: '#6B7280',
  learning: '#84CC16',
};

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (TAG_COLORS[lower]) return TAG_COLORS[lower];
  // Generate a consistent color from the tag name
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  compact?: boolean;
}

/**
 * TagInput Component
 * Input with autocomplete from existing tags across all time entries.
 * Shows tags as colored chips that can be removed.
 */
export function TagInput({ tags, onChange, placeholder = 'Add tags...', compact = false }: TagInputProps) {
  const entries = useTimeTrackingStore((s) => s.entries);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collect all unique tags from existing entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags?.forEach((tag) => tagSet.add(tag));
    });
    // Also add predefined tags
    Object.keys(TAG_COLORS).forEach((tag) => tagSet.add(tag));
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return allTags.filter((t) => !tags.includes(t)).slice(0, 8);
    const query = inputValue.toLowerCase();
    return allTags
      .filter((t) => t.toLowerCase().includes(query) && !tags.includes(t))
      .slice(0, 8);
  }, [inputValue, allTags, tags]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const sizeClasses = compact
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5';

  const inputSizeClasses = compact
    ? 'text-[10px] min-w-[60px]'
    : 'text-xs min-w-[80px]';

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus-within:ring-2 focus-within:ring-accent-primary">
        {/* Tag Chips */}
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 ${sizeClasses} font-medium rounded-full text-white`}
            style={{ backgroundColor: getTagColor(tag) }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className={`flex-1 ${inputSizeClasses} bg-transparent outline-none text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary`}
        />

        {tags.length === 0 && !inputValue && (
          <Tag className="w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary absolute right-2" />
        )}
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                addTag(suggestion);
                setShowSuggestions(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getTagColor(suggestion) }}
              />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TagChips Component
 * Read-only display of tags as colored chips.
 */
export function TagChips({ tags, compact = false }: { tags: string[]; compact?: boolean }) {
  if (!tags || tags.length === 0) return null;

  const sizeClasses = compact
    ? 'text-[9px] px-1.5 py-0'
    : 'text-[10px] px-2 py-0.5';

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center ${sizeClasses} font-medium rounded-full text-white`}
          style={{ backgroundColor: getTagColor(tag) }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export { getTagColor };
