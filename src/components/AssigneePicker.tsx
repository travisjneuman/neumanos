import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

interface AssigneePickerProps {
  selectedIds: string[]; // Currently selected member IDs
  onChange: (selectedIds: string[]) => void; // Callback when selection changes
}

/**
 * AssigneePicker Component
 *
 * Multi-select dropdown for assigning team members to tasks.
 *
 * Features:
 * - Multi-select with avatar chips
 * - Search/filter members by name
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Remove assignee with × button
 */
export default function AssigneePicker({ selectedIds, onChange }: AssigneePickerProps) {
  const members = useSettingsStore((state) => state.members);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter members based on search query
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected members
  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));

  // Handle member selection toggle
  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onChange(selectedIds.filter((id) => id !== memberId));
    } else {
      onChange([...selectedIds, memberId]);
    }
  };

  // Handle remove assignee
  const removeMember = (memberId: string) => {
    onChange(selectedIds.filter((id) => id !== memberId));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Assignees Display */}
      <div className="space-y-2">
        {/* Avatar Chips */}
        {selectedMembers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg"
              >
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                  title={member.name}
                >
                  {member.initials}
                </div>
                {/* Name */}
                <span className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  {member.name}
                </span>
                {/* Remove Button */}
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
                  aria-label={`Remove ${member.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Assignee Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-left text-sm text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-blue transition-colors"
        >
          {selectedMembers.length === 0 ? '+ Add Assignee' : '+ Add Another Assignee'}
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-border-light dark:border-border-dark">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search members..."
              className="w-full px-3 py-1.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          {/* Member List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {searchQuery ? 'No members found' : 'No team members yet. Add members in Settings.'}
              </div>
            ) : (
              <div className="py-1">
                {filteredMembers.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-accent-blue border-accent-blue'
                            : 'border-border-light dark:border-border-dark'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.initials}
                      </div>

                      {/* Name & Email */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                          {member.name}
                        </div>
                        {member.email && (
                          <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary truncate">
                            {member.email}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
