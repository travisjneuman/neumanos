/**
 * Status Field Editor Component
 *
 * Dropdown for selecting a status with colored visual indicators.
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { StatusOption } from '../../types/customFields';

interface StatusFieldEditorProps {
  value: string;
  statusOptions: StatusOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function StatusFieldEditor({
  value,
  statusOptions,
  onChange,
  placeholder = 'Select status...',
  className = '',
}: StatusFieldEditorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = statusOptions.find((opt) => opt.label === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleSelect = (option: StatusOption) => {
    onChange(option.label);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Status Button */}
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
      >
        {selectedOption ? (
          <StatusBadge option={selectedOption} />
        ) : (
          <span className="text-text-light-secondary dark:text-text-dark-secondary">
            {placeholder}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          <ul className="py-1">
            {statusOptions.map((option) => (
              <li key={option.label}>
                <button
                  onClick={() => handleSelect(option)}
                  className="w-full px-3 py-2 text-left hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark flex items-center"
                  role="option"
                  aria-selected={value === option.label}
                >
                  <StatusBadge option={option} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Status Badge Component
 * Displays a colored status pill
 */
function StatusBadge({ option }: { option: StatusOption }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-${option.color}/10 dark:bg-${option.color}/20 text-${option.color} dark:text-${option.color}-hover`}
    >
      <span className={`w-2 h-2 rounded-full bg-${option.color} dark:bg-${option.color}-hover mr-1.5`}></span>
      {option.label}
    </span>
  );
}

/**
 * Default status options for new status fields
 */
export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { label: 'Not Started', color: 'accent-gray' },
  { label: 'In Progress', color: 'accent-blue' },
  { label: 'Done', color: 'accent-green' },
  { label: 'Blocked', color: 'accent-red' },
];

/**
 * Available status colors (semantic tokens)
 */
export const AVAILABLE_STATUS_COLORS = [
  { value: 'accent-blue', label: 'Blue' },
  { value: 'accent-green', label: 'Green' },
  { value: 'accent-yellow', label: 'Yellow' },
  { value: 'accent-red', label: 'Red' },
  { value: 'accent-purple', label: 'Purple' },
  { value: 'accent-primary', label: 'Cyan' },
  { value: 'accent-primary', label: 'Magenta' },
  { value: 'accent-gray', label: 'Gray' },
];
