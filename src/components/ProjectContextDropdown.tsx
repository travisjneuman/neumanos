/**
 * ProjectContextDropdown Component
 *
 * Global project context switcher for the page header.
 * Allows users to filter all content to a specific project or view all.
 *
 * Features:
 * - Dropdown with hierarchical project tree
 * - "All Projects" option at top
 * - Current selection display with project color
 * - Keyboard navigation support
 * - Click outside to close
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { useProjectContextStore } from '../stores/useProjectContextStore';
import { ProjectTree } from './ProjectTree';
import { ProjectSettingsModal } from './ProjectSettingsModal';

interface ProjectContextDropdownProps {
  /** Custom class for the container */
  className?: string;
}

export const ProjectContextDropdown: React.FC<ProjectContextDropdownProps> = ({
  className = '',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Track if we're currently processing an internal click to prevent race conditions
  const isInternalClickRef = useRef(false);

  // Store state - use global isDropdownOpen for keyboard shortcut support
  const isOpen = useProjectContextStore((s) => s.isDropdownOpen);
  const setIsOpen = useProjectContextStore((s) => s.setDropdownOpen);
  const activeProjectIds = useProjectContextStore((s) => s.activeProjectIds);
  const setActiveProjects = useProjectContextStore((s) => s.setActiveProjects);
  const projects = useProjectContextStore((s) => s.projects);
  const getProjectPath = useProjectContextStore((s) => s.getProjectPath);

  // Determine display state
  const isAllSelected = activeProjectIds.length === 0;
  const activeProject = activeProjectIds.length === 1
    ? projects.find((p) => p.id === activeProjectIds[0])
    : null;
  const multipleSelected = activeProjectIds.length > 1;

  // Get display text and color
  const getDisplayInfo = () => {
    if (isAllSelected) {
      return {
        text: 'All Projects',
        color: null,
        icon: null, // Use gradient circle instead
        isAllProjects: true,
      };
    }
    if (activeProject) {
      // Show breadcrumb path if nested
      const path = getProjectPath(activeProject.id);
      const displayText = path.length > 1
        ? path.map((p) => p.name).join(' › ')
        : activeProject.name;
      return {
        text: displayText,
        color: activeProject.color,
        icon: activeProject.icon || null,
        isAllProjects: false,
      };
    }
    if (multipleSelected) {
      return {
        text: `${activeProjectIds.length} Projects`,
        color: null,
        icon: null,
        isAllProjects: false,
      };
    }
    return {
      text: 'All Projects',
      color: null,
      icon: null,
      isAllProjects: true,
    };
  };

  const displayInfo = getDisplayInfo();

  // Handle click outside - use a more robust approach
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Skip if we're processing an internal click
      if (isInternalClickRef.current) {
        return;
      }

      // Check if click is outside using closest() which is more reliable
      const target = event.target as HTMLElement;
      const isInsideDropdown = target.closest('[data-project-dropdown]');

      if (!isInsideDropdown) {
        setIsOpen(false);
      }
    };

    // Use setTimeout to add listener after current event loop
    // This prevents the click that opened the dropdown from immediately closing it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    },
    [setIsOpen]
  );

  // Handle "All Projects" selection
  const handleSelectAll = useCallback(() => {
    setActiveProjects([]);
    setIsOpen(false);
  }, [setActiveProjects, setIsOpen]);

  // Handle project selection
  const handleSelectionChange = useCallback(
    (ids: string[]) => {
      setActiveProjects(ids);
      setIsOpen(false);
    },
    [setActiveProjects, setIsOpen]
  );

  // Open project settings modal
  const handleManageProjects = useCallback(() => {
    // Mark as internal click to prevent click-outside from interfering
    isInternalClickRef.current = true;

    // Close dropdown first, then open modal
    setIsOpen(false);

    // Use setTimeout to ensure state updates complete before opening modal
    setTimeout(() => {
      setShowSettingsModal(true);
      isInternalClickRef.current = false;
    }, 0);
  }, [setIsOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
      data-project-dropdown
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          transition-all duration-standard ease-smooth
          border border-transparent
          ${isOpen
            ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated border-border-light dark:border-border-dark shadow-md'
            : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select project context"
      >
        {/* Color indicator or icon */}
        {displayInfo.isAllProjects ? (
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary flex-shrink-0" />
        ) : displayInfo.color ? (
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: displayInfo.color }}
          />
        ) : displayInfo.icon ? (
          <span className="text-text-light-secondary dark:text-text-dark-secondary">
            {displayInfo.icon}
          </span>
        ) : (
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary flex-shrink-0" />
        )}

        {/* Display text */}
        <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary max-w-[200px] truncate">
          {displayInfo.text}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary transition-transform duration-standard ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="
            absolute top-full mt-1
            w-72 max-h-[400px] overflow-hidden
            bg-surface-light dark:bg-surface-dark
            border border-border-light dark:border-border-dark
            rounded-lg shadow-xl
            z-[100]
            animate-fadeIn
            left-0 sm:left-1/2 sm:-translate-x-1/2
          "
          role="listbox"
          onKeyDown={handleKeyDown}
          data-project-dropdown
        >
          {/* Scrollable project tree */}
          <div className="max-h-[320px] overflow-y-auto">
            <ProjectTree
              selectionMode="single"
              selectedIds={activeProjectIds}
              onSelectionChange={handleSelectionChange}
              showAllOption={true}
              allSelected={isAllSelected}
              onSelectAll={handleSelectAll}
              compact={true}
            />
          </div>

          {/* Footer actions */}
          <div className="border-t border-border-light dark:border-border-dark p-1">
            <button
              type="button"
              onClick={handleManageProjects}
              className="
                w-full flex items-center gap-2 px-3 py-2 text-sm
                text-text-light-secondary dark:text-text-dark-secondary
                hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
                hover:text-text-light-primary dark:hover:text-text-dark-primary
                rounded transition-colors
              "
            >
              <Settings className="w-4 h-4" />
              <span>Manage Projects</span>
            </button>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
