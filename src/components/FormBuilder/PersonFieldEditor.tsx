/**
 * Person Field Editor Component
 *
 * Autocomplete dropdown for selecting people from the people list.
 * Supports single or multiple person selection.
 */

import { useState, useRef, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface PersonFieldEditorProps {
  value: string | string[];
  allowMultiple: boolean;
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  className?: string;
}

export function PersonFieldEditor({
  value,
  allowMultiple,
  onChange,
  placeholder = 'Select person...',
  className = '',
}: PersonFieldEditorProps) {
  const { peopleList, addPerson } = useSettingsStore();
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize value to array for easier handling
  const selectedPeople = Array.isArray(value) ? value : value ? [value] : [];

  // Filter people based on input and already selected
  const filteredPeople = peopleList.filter((person) => {
    const matchesInput = person.toLowerCase().includes(inputValue.toLowerCase());
    const notSelected = !selectedPeople.includes(person);
    return matchesInput && notSelected;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleSelectPerson = (person: string) => {
    if (allowMultiple) {
      onChange([...selectedPeople, person]);
    } else {
      onChange(person);
      setShowDropdown(false);
    }
    setInputValue('');
  };

  const handleRemovePerson = (person: string) => {
    if (allowMultiple) {
      onChange(selectedPeople.filter((p) => p !== person));
    } else {
      onChange('');
    }
  };

  const handleAddNewPerson = () => {
    const trimmedName = newPersonName.trim();
    if (trimmedName && !peopleList.includes(trimmedName)) {
      addPerson(trimmedName);
      handleSelectPerson(trimmedName);
      setNewPersonName('');
      setShowAddDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredPeople.length > 0) {
      e.preventDefault();
      handleSelectPerson(filteredPeople[0]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Backspace' && inputValue === '' && selectedPeople.length > 0) {
      // Remove last person on backspace when input is empty
      handleRemovePerson(selectedPeople[selectedPeople.length - 1]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected People Pills */}
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedPeople.map((person) => (
            <div
              key={person}
              className="inline-flex items-center gap-1 px-2 py-1 bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue dark:text-accent-blue-hover rounded text-sm"
            >
              <span className="font-medium">{getInitials(person)}</span>
              <span>{person}</span>
              <button
                onClick={() => handleRemovePerson(person)}
                className="hover:bg-accent-blue/20 dark:hover:bg-accent-blue/30 rounded p-0.5"
                aria-label={`Remove ${person}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field */}
      {(allowMultiple || selectedPeople.length === 0) && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            aria-label="Person selector"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />

          {/* Dropdown */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredPeople.length > 0 ? (
                <ul className="py-1">
                  {filteredPeople.map((person) => (
                    <li key={person}>
                      <button
                        onClick={() => handleSelectPerson(person)}
                        className="w-full px-3 py-2 text-left hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-text-light-primary dark:text-text-dark-primary flex items-center gap-2"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-blue/20 text-accent-blue text-xs font-medium">
                          {getInitials(person)}
                        </span>
                        <span>{person}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-4 text-center text-text-light-secondary dark:text-text-dark-secondary text-sm">
                  {peopleList.length === 0 ? (
                    <>No people added yet</>
                  ) : (
                    <>No matching people found</>
                  )}
                </div>
              )}

              {/* Add New Person Button */}
              <div className="border-t border-border-light dark:border-border-dark">
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="w-full px-3 py-2 text-left hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-accent-blue dark:text-accent-blue-hover flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add new person</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add New Person Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
              Add New Person
            </h3>

            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewPerson();
                } else if (e.key === 'Escape') {
                  setShowAddDialog(false);
                  setNewPersonName('');
                }
              }}
              placeholder="Enter person's name"
              className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue mb-4"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewPersonName('');
                }}
                className="px-4 py-2 bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewPerson}
                disabled={!newPersonName.trim()}
                className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get initials from person name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
