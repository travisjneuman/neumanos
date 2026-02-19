/**
 * ProjectPicker Component
 *
 * Reusable project selector for entity creation/edit modals.
 * Allows assigning one or multiple projects to an entity.
 *
 * Used by:
 * - Task modals (TaskModal, QuickAdd)
 * - Note modals (NoteEditor)
 * - Event modals (EventModal)
 * - Link modals (LinkModal)
 * - Time entry modals (TimeEntryModal)
 *
 * Features:
 * - Single or multi-select mode
 * - Inline display with dropdown
 * - Shows selected projects as chips
 * - Defaults to current global context
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X, FolderPlus } from 'lucide-react';
import { useProjectContextStore } from '../stores/useProjectContextStore';
import { ProjectTree } from './ProjectTree';
import type { ProjectContext } from '../types';

interface ProjectPickerProps {
  /** Currently selected project IDs */
  value: string[];
  /** Callback when selection changes */
  onChange: (projectIds: string[]) => void;
  /** Selection mode: single project or multiple */
  mode?: 'single' | 'multi';
  /** Placeholder text when no projects selected */
  placeholder?: string;
  /** Label for the field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether to show the label */
  showLabel?: boolean;
  /** Custom class for the container */
  className?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Whether to auto-select current global context if value is empty */
  autoSelectContext?: boolean;
}

export const ProjectPicker: React.FC<ProjectPickerProps> = ({
  value,
  onChange,
  mode = 'multi',
  placeholder = 'Select project...',
  label = 'Project',
  required = false,
  showLabel = true,
  className = '',
  compact = false,
  autoSelectContext = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Store state
  const projects = useProjectContextStore((s) => s.projects);
  const activeProjectIds = useProjectContextStore((s) => s.activeProjectIds);

  // Auto-select current context on mount if value is empty
  useEffect(() => {
    if (autoSelectContext && value.length === 0 && activeProjectIds.length > 0) {
      // In single mode, only take the first project
      if (mode === 'single') {
        onChange([activeProjectIds[0]]);
      } else {
        onChange(activeProjectIds);
      }
    }
  }, []); // Only on mount

  // Get selected project objects
  const selectedProjects = value
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is ProjectContext => p !== undefined);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, []);

  // Handle selection from tree
  const handleSelectionChange = useCallback(
    (ids: string[]) => {
      onChange(ids);
      if (mode === 'single') {
        setIsOpen(false);
      }
    },
    [onChange, mode]
  );

  // Remove a project from selection
  const handleRemoveProject = useCallback(
    (projectId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((id) => id !== projectId));
    },
    [value, onChange]
  );

  // Clear all selections
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Label */}
      {showLabel && (
        <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
          {label}
          {required && <span className="text-accent-red ml-1">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center gap-2 text-left
          border border-border-light dark:border-border-dark rounded-lg
          bg-surface-light dark:bg-surface-dark
          transition-all duration-standard ease-smooth
          ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}
          ${isOpen
            ? 'ring-2 ring-accent-blue/50 border-accent-blue'
            : 'hover:border-accent-blue/50'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Selected projects display */}
        <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[24px]">
          {selectedProjects.length === 0 ? (
            <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
              {placeholder}
            </span>
          ) : (
            selectedProjects.map((project) => (
              <span
                key={project.id}
                className="
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  bg-surface-light-elevated dark:bg-surface-dark-elevated
                  text-text-light-primary dark:text-text-dark-primary
                  text-xs font-medium
                "
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate max-w-[100px]">{project.name}</span>
                {mode === 'multi' && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveProject(project.id, e)}
                    className="p-0.5 hover:bg-surface-light dark:hover:bg-surface-dark rounded-full transition-colors"
                    aria-label={`Remove ${project.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {/* Clear button */}
        {selectedProjects.length > 0 && mode === 'multi' && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
            aria-label="Clear all"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-standard ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0 mt-1
            max-h-[300px] overflow-hidden
            bg-surface-light dark:bg-surface-dark
            border border-border-light dark:border-border-dark
            rounded-lg shadow-xl
            z-50
            animate-fadeIn
          "
          role="listbox"
          onKeyDown={handleKeyDown}
        >
          {projects.length === 0 ? (
            <div className="p-4 text-center">
              <FolderPlus className="w-8 h-8 mx-auto mb-2 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                No projects yet
              </p>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
                Create projects in Settings → Projects
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <ProjectTree
                selectionMode={mode}
                selectedIds={value}
                onSelectionChange={handleSelectionChange}
                showAllOption={false}
                compact={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
