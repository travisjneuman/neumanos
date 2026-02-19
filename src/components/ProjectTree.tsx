/**
 * ProjectTree Component
 *
 * Hierarchical tree view for displaying and selecting projects.
 * Supports expand/collapse, selection (single or multi), and inline actions.
 *
 * Used by:
 * - ProjectContextDropdown (global filter)
 * - ProjectPicker (entity assignment)
 * - Settings > Projects management
 */

import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useProjectContextStore } from '../stores/useProjectContextStore';
import type { ProjectContext } from '../types';

// ============================================================================
// Types
// ============================================================================

interface ProjectTreeProps {
  /** Selection mode: single project, multiple, or none (display only) */
  selectionMode?: 'single' | 'multi' | 'none';
  /** Currently selected project IDs */
  selectedIds?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (ids: string[]) => void;
  /** Callback when project is clicked (for navigation/details) */
  onProjectClick?: (project: ProjectContext) => void;
  /** Show archived projects */
  showArchived?: boolean;
  /** Show "All Projects" option at top */
  showAllOption?: boolean;
  /** Whether "All Projects" is currently selected */
  allSelected?: boolean;
  /** Callback when "All" is selected */
  onSelectAll?: () => void;
  /** Custom class for the container */
  className?: string;
  /** Compact mode for dropdowns */
  compact?: boolean;
}

interface ProjectNodeProps {
  project: ProjectContext;
  level: number;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  selectionMode: 'single' | 'multi' | 'none';
  isSelected: boolean;
  onSelect: (project: ProjectContext) => void;
  onProjectClick?: (project: ProjectContext) => void;
  childProjects: ProjectContext[];
  compact?: boolean;
}

// ============================================================================
// ProjectNode Component (recursive)
// ============================================================================

const ProjectNode: React.FC<ProjectNodeProps> = ({
  project,
  level,
  expanded,
  onToggleExpand,
  selectionMode,
  isSelected,
  onSelect,
  onProjectClick,
  childProjects,
  compact,
}) => {
  const hasChildren = childProjects.length > 0;
  const paddingLeft = level * (compact ? 12 : 16);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode !== 'none') {
      onSelect(project);
    } else if (onProjectClick) {
      onProjectClick(project);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(project.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (selectionMode !== 'none') {
        onSelect(project);
      } else if (onProjectClick) {
        onProjectClick(project);
      }
    }
  };

  return (
    <div>
      {/* Use div with role="button" to avoid button nesting (expand button inside) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center gap-2 text-left transition-colors cursor-pointer
          ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}
          ${isSelected
            ? 'bg-accent-blue/10 text-accent-blue dark:bg-accent-blue/20'
            : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
          }
        `}
        style={{ paddingLeft: `${paddingLeft + (compact ? 8 : 12)}px` }}
      >
        {/* Expand/collapse button or spacer */}
        {hasChildren ? (
          <button
            type="button"
            onClick={handleExpandClick}
            className="p-0.5 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            ) : (
              <ChevronRight className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
            )}
          </button>
        ) : (
          <span className={compact ? 'w-4' : 'w-5'} />
        )}

        {/* Project color indicator */}
        <span
          className={`${compact ? 'w-2 h-2' : 'w-3 h-3'} rounded-full flex-shrink-0`}
          style={{ backgroundColor: project.color }}
        />

        {/* Icon or folder */}
        {project.icon ? (
          <span className={compact ? 'text-sm' : 'text-base'}>{project.icon}</span>
        ) : hasChildren ? (
          expanded ? (
            <FolderOpen className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-text-light-secondary dark:text-text-dark-secondary`} />
          ) : (
            <Folder className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-text-light-secondary dark:text-text-dark-secondary`} />
          )
        ) : null}

        {/* Project name */}
        <span className="flex-1 truncate">{project.name}</span>

        {/* Multi-select checkbox */}
        {selectionMode === 'multi' && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 rounded border-border-light dark:border-border-dark"
          />
        )}
      </div>

      {/* Render children if expanded */}
      {hasChildren && expanded && (
        <div>
          {childProjects.map((child) => (
            <ProjectNodeWrapper
              key={child.id}
              project={child}
              level={level + 1}
              selectionMode={selectionMode}
              isSelected={false}
              onSelect={onSelect}
              onProjectClick={onProjectClick}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Wrapper to connect to store for child fetching
const ProjectNodeWrapper: React.FC<Omit<ProjectNodeProps, 'expanded' | 'onToggleExpand' | 'childProjects'> & {
  expandedIds?: Set<string>;
  setExpandedIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
}> = (props) => {
  const getChildProjects = useProjectContextStore((s) => s.getChildProjects);
  const childProjects = getChildProjects(props.project.id);

  // Use context for expansion state
  const [localExpanded, setLocalExpanded] = useState(false);

  const handleToggle = useCallback((_id: string) => {
    setLocalExpanded((prev) => !prev);
  }, []);

  return (
    <ProjectNode
      {...props}
      expanded={localExpanded}
      onToggleExpand={handleToggle}
      childProjects={childProjects}
    />
  );
};

// ============================================================================
// ProjectTree Component
// ============================================================================

export const ProjectTree: React.FC<ProjectTreeProps> = ({
  selectionMode = 'single',
  selectedIds = [],
  onSelectionChange,
  onProjectClick,
  showArchived = false,
  showAllOption = false,
  allSelected = false,
  onSelectAll,
  className = '',
  compact = false,
}) => {
  const getRootProjects = useProjectContextStore((s) => s.getRootProjects);
  const getChildProjects = useProjectContextStore((s) => s.getChildProjects);
  const getArchivedProjects = useProjectContextStore((s) => s.getArchivedProjects);

  const rootProjects = getRootProjects();
  const archivedProjects = showArchived ? getArchivedProjects() : [];

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (project: ProjectContext) => {
      if (!onSelectionChange) return;

      if (selectionMode === 'single') {
        onSelectionChange([project.id]);
      } else if (selectionMode === 'multi') {
        const isSelected = selectedIds.includes(project.id);
        if (isSelected) {
          onSelectionChange(selectedIds.filter((id) => id !== project.id));
        } else {
          onSelectionChange([...selectedIds, project.id]);
        }
      }
    },
    [selectionMode, selectedIds, onSelectionChange]
  );

  const selectedSet = new Set(selectedIds);

  return (
    <div className={`${className}`}>
      {/* "All Projects" option */}
      {showAllOption && (
        <button
          type="button"
          onClick={onSelectAll}
          className={`
            w-full flex items-center gap-2 text-left transition-colors
            ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}
            ${allSelected
              ? 'bg-accent-blue/10 text-accent-blue dark:bg-accent-blue/20 font-medium'
              : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
            }
          `}
        >
          <span className={`${compact ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary flex-shrink-0`} />
          <span className="flex-1">All Projects</span>
          {selectionMode === 'multi' && (
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => {}}
              className="w-4 h-4 rounded"
            />
          )}
        </button>
      )}

      {/* Separator */}
      {showAllOption && rootProjects.length > 0 && (
        <div className="border-t border-border-light dark:border-border-dark my-1" />
      )}

      {/* Root projects */}
      {rootProjects.length === 0 ? (
        <div className={`${compact ? 'px-2 py-3 text-xs' : 'px-3 py-4 text-sm'} text-center text-text-light-tertiary dark:text-text-dark-tertiary`}>
          No projects yet
        </div>
      ) : (
        rootProjects.map((project) => (
          <ProjectNode
            key={project.id}
            project={project}
            level={0}
            expanded={expandedIds.has(project.id)}
            onToggleExpand={handleToggleExpand}
            selectionMode={selectionMode}
            isSelected={selectedSet.has(project.id)}
            onSelect={handleSelect}
            onProjectClick={onProjectClick}
            childProjects={getChildProjects(project.id)}
            compact={compact}
          />
        ))
      )}

      {/* Archived section */}
      {showArchived && archivedProjects.length > 0 && (
        <>
          <div className="border-t border-border-light dark:border-border-dark my-2" />
          <div className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'} text-text-light-tertiary dark:text-text-dark-tertiary font-medium uppercase tracking-wide`}>
            Archived
          </div>
          {archivedProjects.map((project) => (
            <ProjectNode
              key={project.id}
              project={project}
              level={0}
              expanded={false}
              onToggleExpand={() => {}}
              selectionMode={selectionMode}
              isSelected={selectedSet.has(project.id)}
              onSelect={handleSelect}
              onProjectClick={onProjectClick}
              childProjects={[]}
              compact={compact}
            />
          ))}
        </>
      )}
    </div>
  );
};
