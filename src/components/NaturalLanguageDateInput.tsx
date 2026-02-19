/**
 * NaturalLanguageDateInput Component
 *
 * Accessible, intelligent date input with natural language parsing
 * Features:
 * - Natural language parsing (e.g., "tomorrow", "next Friday")
 * - Autocomplete suggestions dropdown
 * - Keyboard navigation (arrows, enter, escape, tab)
 * - Real-time parsing feedback
 * - ARIA compliant for screen readers
 * - Smart filtering of suggestions
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { parseNaturalLanguageDate, formatDateForDisplay } from '../utils/naturalLanguageDates';
import {
  getSmartDateSuggestions,
  filterSuggestions,
  formatSuggestionDisplay,
  type DateSuggestion,
} from '../utils/dateSuggestions';
import { useInlineDateShortcuts } from '../hooks/useInlineDateShortcuts';
import { format } from 'date-fns';

interface NaturalLanguageDateInputProps {
  value: string | null; // YYYY-MM-DD or null
  onChange: (date: string | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function NaturalLanguageDateInput({
  value, // External controlled value (YYYY-MM-DD format)
  onChange,
  placeholder = 'Type a date (e.g., "tomorrow", "next Friday")',
  label,
  disabled = false,
  autoFocus = false,
  className = '',
}: NaturalLanguageDateInputProps) {
  const [inputValue, setInputValue] = useState(''); // Internal NL input state
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isInvalid, setIsInvalid] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const componentId = useRef(`nl-date-input-${Math.random().toString(36).substr(2, 9)}`).current;

  // Keyboard shortcuts (@tomorrow, +3d, etc.)
  useInlineDateShortcuts(inputRef, onChange);

  // Sync with external value changes (controlled component)
  useEffect(() => {
    if (value && value !== format(parsedDate || new Date(0), 'yyyy-MM-dd')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setParsedDate(date);
          // Don't update inputValue - let user keep their NL text
        }
      } catch {
        // Invalid date format
      }
    } else if (!value) {
      // Value cleared externally
      setInputValue('');
      setParsedDate(null);
      setIsInvalid(false);
    }
  }, [value, parsedDate]);

  // Get suggestions
  const allSuggestions = useMemo(() => getSmartDateSuggestions(), []);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    return filterSuggestions(allSuggestions, inputValue);
  }, [allSuggestions, inputValue]);

  // Parse input with debounce (150ms)
  const parseInput = useCallback((text: string) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      if (!text.trim()) {
        setParsedDate(null);
        setIsInvalid(false);
        onChange(null);
        return;
      }

      const parsed = parseNaturalLanguageDate(text);
      if (parsed) {
        setParsedDate(parsed);
        setIsInvalid(false);
        // Convert to YYYY-MM-DD format
        const formattedDate = format(parsed, 'yyyy-MM-dd');
        onChange(formattedDate);
      } else {
        setParsedDate(null);
        setIsInvalid(text.length > 0);
        onChange(null);
      }
    }, 150);

    setDebounceTimeout(timeout);
  }, [onChange, debounceTimeout]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    parseInput(newValue);
    setShowSuggestions(true);
    setHighlightedIndex(0);
  }, [parseInput]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: DateSuggestion) => {
    if (suggestion.label === 'Custom') {
      // Focus input for custom entry
      inputRef.current?.focus();
      return;
    }

    setInputValue(suggestion.nlText);
    setParsedDate(suggestion.date);
    setIsInvalid(false);
    setShowSuggestions(false);

    // Convert to YYYY-MM-DD format
    const formattedDate = format(suggestion.date, 'yyyy-MM-dd');
    onChange(formattedDate);
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      // Show suggestions on arrow down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowSuggestions(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[highlightedIndex]) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setInputValue('');
        setParsedDate(null);
        setIsInvalid(false);
        onChange(null);
        break;

      case 'Tab':
        // Accept current parse or move to next field
        setShowSuggestions(false);
        break;

      default:
        break;
    }
  }, [showSuggestions, filteredSuggestions, highlightedIndex, handleSuggestionClick, onChange]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue('');
    setParsedDate(null);
    setIsInvalid(false);
    setShowSuggestions(false);
    onChange(null);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Keyboard shortcut: Cmd/Ctrl+K to clear
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && document.activeElement === inputRef.current) {
        e.preventDefault();
        handleClear();
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleClear]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (showSuggestions && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, showSuggestions]);

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={componentId}
          className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          id={componentId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-2.5 py-1.5 pr-8 text-xs border rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 transition-colors ${
            isInvalid
              ? 'border-accent-red focus:ring-accent-red'
              : 'border-border-light dark:border-border-dark focus:ring-accent-blue'
          }`}
          aria-label={label || 'Date input'}
          aria-describedby={`${componentId}-preview`}
          aria-invalid={isInvalid}
          aria-autocomplete="list"
          aria-controls={`${componentId}-suggestions`}
          aria-expanded={showSuggestions}
          role="combobox"
        />

        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            aria-label="Clear date"
          >
            <X className="w-3.5 h-3.5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        )}
      </div>

      {/* Parsed date preview */}
      {parsedDate && !isInvalid && (
        <div
          id={`${componentId}-preview`}
          className="mt-1 text-[10px] text-accent-green dark:text-accent-green"
        >
          → {formatDateForDisplay(parsedDate)}
        </div>
      )}

      {/* Error message */}
      {isInvalid && inputValue && (
        <div
          id={`${componentId}-preview`}
          className="mt-1 text-[10px] text-accent-red dark:text-accent-red"
        >
          Could not parse date
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && !disabled && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id={`${componentId}-suggestions`}
          role="listbox"
          aria-label="Date suggestions"
          className="absolute z-50 w-full mt-1 bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => {
            const isHighlighted = index === highlightedIndex;
            const display = formatSuggestionDisplay(suggestion);

            return (
              <button
                key={`${suggestion.label}-${index}`}
                type="button"
                data-index={index}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  isHighlighted
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                }`}
              >
                {display}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
