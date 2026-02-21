/**
 * Breadcrumb Navigation Component
 *
 * Shows the current location path with clickable segments.
 * Automatically detects the current route and builds breadcrumbs
 * from page metadata and contextual data (e.g., active note title).
 */

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getPageTitle } from '../config/pageMetadata';
import { useNotesStore } from '../stores/useNotesStore';
import { useFoldersStore } from '../stores/useFoldersStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useDiagramsStore } from '../stores/useDiagramsStore';
import { useDocsStore } from '../stores/useDocsStore';

interface BreadcrumbSegment {
  label: string;
  path: string | null; // null means non-navigable (current page)
  icon?: React.ReactNode;
}

/**
 * Build breadcrumb segments from the current location
 */
function useBreadcrumbs(): BreadcrumbSegment[] {
  const location = useLocation();
  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search);

  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const notes = useNotesStore((s) => s.notes);
  const folders = useFoldersStore((s) => s.folders);
  const tasks = useKanbanStore((s) => s.tasks);
  const diagrams = useDiagramsStore((s) => s.diagrams);
  const docs = useDocsStore((s) => s.docs);

  return useMemo(() => {
    const segments: BreadcrumbSegment[] = [];

    // Always start with Home
    segments.push({
      label: 'Home',
      path: '/',
      icon: <Home className="w-3.5 h-3.5" />,
    });

    // Parse path segments
    const pathParts = pathname.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      // We're on the dashboard
      segments[0].path = null; // Current page, not navigable
      return segments;
    }

    // Build path segments
    const basePath = `/${pathParts[0]}`;
    const baseTitle = getPageTitle(basePath);

    // Handle tab-based routes
    const tab = searchParams.get('tab');

    if (basePath === '/notes') {
      segments.push({ label: baseTitle, path: tab || activeNoteId ? '/notes' : null });

      if (tab === 'graph') {
        segments.push({ label: 'Graph View', path: null });
      } else if (activeNoteId) {
        // Find the active note
        const activeNote = notes[activeNoteId];
        if (activeNote) {
          // Add folder breadcrumbs if note is in a folder
          if (activeNote.folderId) {
            const folderPath = getFolderPath(activeNote.folderId, folders);
            folderPath.forEach((folder) => {
              segments.push({
                label: folder.name,
                path: '/notes', // Navigate to notes with folder selected
              });
            });
          }
          segments.push({
            label: activeNote.title || 'Untitled Note',
            path: null,
          });
        }
      }
    } else if (basePath === '/tasks') {
      segments.push({ label: baseTitle, path: tab ? '/tasks' : null });

      if (tab === 'habits') {
        segments.push({ label: 'Habits', path: null });
      } else if (tab === 'gantt') {
        segments.push({ label: 'Gantt Chart', path: null });
      } else if (tab === 'archive') {
        segments.push({ label: 'Archive', path: null });
      }
    } else if (basePath === '/create') {
      segments.push({ label: 'Create', path: pathParts.length > 1 ? '/create' : null });

      if (tab === 'diagrams') {
        segments.push({ label: 'Diagrams', path: null });
      } else if (tab === 'forms') {
        segments.push({ label: 'Forms', path: null });
      } else if (pathParts.length > 1) {
        // Editing a specific document
        const docId = pathParts[pathParts.length === 3 ? 2 : 1];
        const doc = docs.find((d) => d.id === docId);
        if (doc) {
          segments.push({ label: doc.title || 'Untitled', path: null });
        }
      }
    } else if (basePath === '/diagrams' && pathParts.length > 1) {
      segments.push({ label: 'Diagrams', path: '/create?tab=diagrams' });
      const diagram = diagrams.find((d) => d.id === pathParts[1]);
      if (diagram) {
        segments.push({ label: diagram.title || 'Untitled Diagram', path: null });
      }
    } else if (basePath === '/forms' && pathParts.length > 1) {
      segments.push({ label: 'Forms', path: '/create?tab=forms' });
      // Form editing/filling/responses
      const suffix = pathParts[pathParts.length - 1];
      if (suffix === 'edit') {
        segments.push({ label: 'Edit Form', path: null });
      } else if (suffix === 'fill') {
        segments.push({ label: 'Fill Form', path: null });
      } else if (suffix === 'responses') {
        segments.push({ label: 'Responses', path: null });
      }
    } else if (basePath === '/schedule') {
      segments.push({ label: baseTitle, path: null });
    } else {
      // Generic page
      segments.push({ label: baseTitle, path: null });
    }

    return segments;
  }, [pathname, location.search, activeNoteId, notes, folders, tasks, diagrams, docs]);
}

/**
 * Get the folder path (ancestors) for a given folder ID
 */
function getFolderPath(
  folderId: string,
  folders: Record<string, { id: string; name: string; parentId: string | null }>
): Array<{ name: string; id: string }> {
  const path: Array<{ name: string; id: string }> = [];
  let currentId: string | null = folderId;

  while (currentId && folders[currentId]) {
    const folder = folders[currentId];
    path.unshift({ name: folder.name, id: folder.id });
    currentId = folder.parentId;
  }

  return path;
}

export const Breadcrumbs: React.FC = () => {
  const navigate = useNavigate();
  const segments = useBreadcrumbs();

  // Don't render breadcrumbs if we're on the root with no sub-segments
  if (segments.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1 overflow-x-auto"
    >
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const isClickable = segment.path !== null;

        return (
          <React.Fragment key={`${segment.label}-${index}`}>
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            )}
            {isClickable ? (
              <button
                onClick={() => navigate(segment.path!)}
                className="flex items-center gap-1 hover:text-accent-blue transition-colors whitespace-nowrap px-1 py-0.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated"
              >
                {segment.icon}
                <span>{segment.label}</span>
              </button>
            ) : (
              <span
                className={`flex items-center gap-1 whitespace-nowrap px-1 py-0.5 ${
                  isLast
                    ? 'text-text-light-primary dark:text-text-dark-primary font-medium'
                    : ''
                }`}
              >
                {segment.icon}
                <span className="truncate max-w-[200px]">{segment.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
