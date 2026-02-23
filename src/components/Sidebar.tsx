import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebarStore } from '../stores/useSidebarStore';
import { useSidebarNavStore } from '../stores/useSidebarNavStore';
import { useNavExpansionStore } from '../stores/useNavExpansionStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Lazy load sidebar panels to reduce initial bundle
const PageSettingsPanel = lazy(() => import('./PageSettingsPanel').then(m => ({ default: m.PageSettingsPanel })));
const TimeTrackingPanel = lazy(() => import('./TimeTrackingPanel').then(m => ({ default: m.TimeTrackingPanel })));

/**
 * FOUNDATIONAL: NavItem interface with expandable support
 * Any nav item can have sub-pages by adding `children`.
 */
interface NavItem {
  icon: string;
  label: string;
  path: string;
  shortcut?: string;
  hasSettings?: boolean; // Whether this page has custom settings
  children?: NavItem[]; // Sub-pages (expandable)
  defaultExpanded?: boolean; // Initial expansion state
}

// Fixed navigation items (always at top, not draggable)
const fixedNavigation: NavItem[] = [
  {
    icon: '🏠',
    label: 'Dashboard',
    path: '/',
    shortcut: 'D',
    hasSettings: true,
    defaultExpanded: true,
    children: [
      { icon: '📆', label: 'Today', path: '/today' },
      { icon: '🔗', label: 'Link Library', path: '/links' },
      { icon: '📊', label: 'Activity', path: '/activity' },
    ],
  },
];

// Draggable navigation items (user can reorganize)
// Structure per Option A from sidebar-navigation-review.md:
// - Parent becomes Tab 1, children become subsequent tabs left-to-right
// - Schedule: Calendar (parent), Timer, Pomodoro (simplified from 10 tabs)
// - Notes: Notes (parent), Daily Notes, Graph (Diagrams/Forms moved to Create)
// - Tasks: Tasks (parent), Timeline, Habits (moved here from standalone)
// - Create: All (parent), Documents, Spreadsheets, Presentations, Diagrams, Forms
const draggableNavigation: NavItem[] = [
  {
    icon: '📅',
    label: 'Schedule',
    path: '/schedule',
    shortcut: 'S',
    hasSettings: false,
    defaultExpanded: false,
    children: [
      { icon: '⏱️', label: 'Timer', path: '/schedule?tab=timer' },
      { icon: '🍅', label: 'Pomodoro', path: '/schedule?tab=pomodoro' },
      { icon: '⚡', label: 'Energy', path: '/energy' },
      { icon: '📋', label: 'Availability', path: '/availability' },
    ],
  },
  {
    icon: '📝',
    label: 'Notes',
    path: '/notes',
    shortcut: 'N',
    hasSettings: false,
    defaultExpanded: false,
    children: [
      { icon: '📅', label: 'Daily Notes', path: '/notes?tab=daily' },
      { icon: '🕸️', label: 'Graph', path: '/notes?tab=graph' },
    ],
  },
  {
    icon: '✓',
    label: 'Tasks',
    path: '/tasks',
    shortcut: 'T',
    hasSettings: false,
    defaultExpanded: false,
    children: [
      { icon: '📊', label: 'Timeline', path: '/tasks?tab=timeline' },
      { icon: '🎯', label: 'Habits', path: '/tasks?tab=habits' },
      { icon: '📈', label: 'PM Dashboard', path: '/pm' },
      { icon: '📂', label: 'Portfolio', path: '/portfolio' },
    ],
  },
  {
    icon: '✨',
    label: 'Create',
    path: '/create',
    shortcut: 'C',
    hasSettings: false,
    defaultExpanded: false,
    children: [
      { icon: '📝', label: 'Documents', path: '/create?tab=documents' },
      { icon: '📊', label: 'Spreadsheets', path: '/create?tab=spreadsheets' },
      { icon: '📽️', label: 'Presentations', path: '/create?tab=presentations' },
      { icon: '🔷', label: 'Diagrams', path: '/create?tab=diagrams' },
      { icon: '📋', label: 'Forms', path: '/create?tab=forms' },
    ],
  },
];

// Sortable Navigation Item Component
interface SortableNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  onPageSettings: (e: React.MouseEvent, path: string) => void;
  isDisablingClicks: boolean;
}

const SortableNavItem: React.FC<SortableNavItemProps> = ({ item, isCollapsed, isActive, onPageSettings, isDisablingClicks }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.path });

  const location = useLocation();
  const { isExpanded, toggleExpanded } = useNavExpansionStore();
  const hasChildren = item.children && item.children.length > 0;
  const expanded = isExpanded(item.path);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if any child is active
  const isChildActive = (navItem: NavItem) => {
    if (!navItem.children) return false;
    return navItem.children.some((child) => {
      // Handle paths with query params
      if (child.path.includes('?')) {
        const [pathname, query] = child.path.split('?');
        if (location.pathname !== pathname) return false;
        const params = new URLSearchParams(query);
        const currentParams = new URLSearchParams(location.search);
        for (const [key, value] of params.entries()) {
          if (currentParams.get(key) !== value) return false;
        }
        return true;
      }
      return location.pathname === child.path;
    });
  };

  const childActive = isChildActive(item);

  return (
    <li ref={setNodeRef} style={{...style, pointerEvents: isDisablingClicks ? 'none' : 'auto'}} {...attributes}>
      <Link
        to={item.path}
        onClick={(e) => {
          if (isDisablingClicks) {
            e.preventDefault();
            return false;
          }
        }}
        className={`
          flex items-center gap-3 px-3 h-11 rounded-button
          transition-all duration-standard ease-smooth
          relative group
          ${
            isActive || childActive
              ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
          }
        `}
        title={isCollapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Active indicator (left accent) */}
        {isActive && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent-blue rounded-r" />
        )}

        {/* Icon - Fixed 20px size - DRAG HANDLE */}
        <span
          {...listeners}
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-lg cursor-grab active:cursor-grabbing"
          role="button"
          aria-label={`Drag ${item.label} to reorder`}
          tabIndex={0}
        >
          {item.icon}
        </span>

        {/* Label (hidden when collapsed) */}
        {!isCollapsed && (
          <>
            <span className="flex-1 text-base leading-5 font-medium truncate">
              {item.label}
            </span>

            {/* Page Settings Icon (shown on hover) */}
            {item.hasSettings && (
              <button
                onClick={(e) => onPageSettings(e, item.path)}
                className="
                  opacity-0 group-hover:opacity-100
                  w-5 h-5 flex items-center justify-center flex-shrink-0
                  text-text-light-secondary dark:text-text-dark-secondary
                  hover:text-text-light-primary dark:hover:text-text-dark-primary
                  transition-opacity duration-200
                "
                title="Page Settings"
                aria-label={`${item.label} page settings`}
              >
                <span className="text-sm">⚙</span>
              </button>
            )}

            {/* Expand/Collapse Chevron (for items with children) */}
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpanded(item.path);
                }}
                className="
                  w-5 h-5 flex items-center justify-center flex-shrink-0
                  text-text-light-secondary dark:text-text-dark-secondary
                  hover:text-text-light-primary dark:hover:text-text-dark-primary
                  transition-transform duration-200
                "
                title={expanded ? 'Collapse' : 'Expand'}
              >
                <span
                  className={`text-xs transition-transform duration-200 ${
                    expanded ? 'rotate-90' : ''
                  }`}
                >
                  ▶
                </span>
              </button>
            )}
          </>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="
            absolute left-full ml-2 px-2 py-1
            bg-surface-light-elevated dark:bg-surface-dark-elevated
            text-text-light-primary dark:text-text-dark-primary text-xs rounded
            opacity-0 group-hover:opacity-100
            pointer-events-none transition-opacity duration-200
            whitespace-nowrap z-50
          ">
            {item.label}
          </div>
        )}
      </Link>

      {/* Children (Sub-pages) - only show when expanded and not collapsed */}
      {hasChildren && expanded && !isCollapsed && (
        <ul className="ml-6 mt-1 space-y-1">
          {item.children!.map((child) => (
            <li key={child.path}>
              <Link
                to={child.path}
                className={`
                  flex items-center gap-3 px-3 h-9 rounded-button
                  transition-all duration-standard ease-smooth
                  relative group
                  ${
                    location.pathname === child.path
                      ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
                      : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                  }
                `}
                aria-current={location.pathname === child.path ? 'page' : undefined}
              >
                {/* Active indicator (left accent) */}
                {location.pathname === child.path && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-accent-blue rounded-r" />
                )}

                {/* Icon */}
                <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-sm" aria-hidden="true">
                  {child.icon}
                </span>

                {/* Label */}
                <span className="flex-1 text-sm leading-5 font-medium truncate">
                  {child.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleCollapse, isMobileMenuOpen, setMobileMenuOpen } = useSidebarStore();
  const { mode, toggleTheme } = useThemeStore();
  const logoSrc = mode === 'dark' ? '/images/logos/logo_white.png' : '/images/logos/logo_black.png';
  const navOrder = useSidebarNavStore((state) => state.navOrder);
  const setNavOrder = useSidebarNavStore((state) => state.setNavOrder);
  const { isExpanded, toggleExpanded } = useNavExpansionStore();
  const location = useLocation();
  const [pageSettingsOpen, setPageSettingsOpen] = useState<string | null>(null);
  const [isDisablingClicks, setIsDisablingClicks] = useState(false);
  const disableTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const dailyNotesEnabled = useSettingsStore((state) => state.dailyNotes.enabled);

  // Check if a nav path is active (handles both pathname and query params)
  const isActive = (path: string) => {
    // Handle paths with query params (e.g., /schedule?tab=calendar)
    if (path.includes('?')) {
      const [pathname, query] = path.split('?');
      if (location.pathname !== pathname) return false;
      const params = new URLSearchParams(query);
      const currentParams = new URLSearchParams(location.search);
      // Check if all specified params match
      for (const [key, value] of params.entries()) {
        if (currentParams.get(key) !== value) return false;
      }
      return true;
    }
    // Simple pathname match
    return location.pathname === path;
  };

  // Check if any child of a parent is active (for highlighting parent when child is active)
  const isChildActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => isActive(child.path));
  };

  // Configure drag sensors with keyboard support for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort draggable navigation items by saved order
  const sortedDraggableNavigation = [...draggableNavigation].sort((a, b) => {
    const aIndex = navOrder.indexOf(a.path);
    const bIndex = navOrder.indexOf(b.path);
    // If path not found in order, put it at the end
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  const handleDragStart = () => {
    // Clear any existing timeout to prevent race conditions
    if (disableTimeoutRef.current) {
      clearTimeout(disableTimeoutRef.current);
    }

    setIsDisablingClicks(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = navOrder.indexOf(active.id as string);
      const newIndex = navOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(navOrder, oldIndex, newIndex);
        setNavOrder(newOrder);
      }
    }

    // Re-enable clicks after a delay to prevent accidental navigation
    // Store timeout ID in ref so it survives re-renders
    disableTimeoutRef.current = setTimeout(() => {
      setIsDisablingClicks(false);
      disableTimeoutRef.current = null;
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (disableTimeoutRef.current) {
        clearTimeout(disableTimeoutRef.current);
      }
    };
  }, []);

  const handlePageSettings = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPageSettingsOpen(path);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  // Handler for Ctrl+D keyboard shortcut (Daily Notes)
  const handleTodayClick = () => {
    navigate('/notes?daily=true');
  };

  // Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  // Keyboard shortcut: Cmd/Ctrl + D to open today's daily note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && dailyNotesEnabled) {
        e.preventDefault();
        handleTodayClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dailyNotesEnabled, handleTodayClick]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Main navigation sidebar"
        className={`
          fixed left-0 top-0 h-screen
          bg-surface-light-elevated dark:bg-surface-dark
          border-r border-border-light dark:border-border-dark
          transition-all duration-200 ease-in-out
          flex flex-col
          z-40
          ${isCollapsed ? 'w-[60px]' : 'w-[210px]'}

          ${/* Mobile: slide in/out as drawer */ ''}
          md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
      {/* Logo Section */}
      <div className="p-4 border-b border-border-light dark:border-border-dark">
        <Link to="/" className="flex flex-col items-center overflow-hidden">
          {!isCollapsed ? (
            <>
              <img
                src={logoSrc}
                alt="NeumanOS"
                className="w-full h-auto object-contain"
              />
              <p className="text-[10px] tracking-[0.3em] uppercase text-text-light-secondary dark:text-text-dark-secondary text-center w-full mt-1">
                Management Platform
              </p>
            </>
          ) : (
            <img
              src={logoSrc}
              alt="NeumanOS"
              className="w-11 h-11 object-contain"
            />
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <ul className="space-y-1 px-2">
          {/* Fixed Navigation Items (Dashboard - not draggable, supports children) */}
          {fixedNavigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const expanded = isExpanded(item.path);
            const parentActive = isActive(item.path);
            const childActive = isChildActive(item);

            return (
              <li key={item.path}>
                {/* Parent Item */}
                <div className="flex items-center">
                  <Link
                    to={item.path}
                    className={`
                      flex-1 flex items-center gap-3 px-3 h-11 rounded-button
                      transition-all duration-standard ease-smooth
                      relative group
                      ${
                        parentActive || childActive
                          ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
                          : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={parentActive ? 'page' : undefined}
                  >
                    {/* Active indicator (left accent) */}
                    {parentActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent-blue rounded-r" />
                    )}

                    {/* Icon - Fixed 20px size */}
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-lg">
                      {item.icon}
                    </span>

                    {/* Label (hidden when collapsed) */}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-base leading-5 font-medium truncate">
                          {item.label}
                        </span>

                        {/* Page Settings Icon (shown on hover) */}
                        {item.hasSettings && (
                          <button
                            onClick={(e) => handlePageSettings(e, item.path)}
                            className="
                              opacity-0 group-hover:opacity-100
                              w-5 h-5 flex items-center justify-center flex-shrink-0
                              text-text-light-secondary dark:text-text-dark-secondary
                              hover:text-text-light-primary dark:hover:text-text-dark-primary
                              transition-opacity duration-200
                            "
                            title="Page Settings"
                          >
                            <span className="text-sm">⚙</span>
                          </button>
                        )}

                        {/* Expand/Collapse Chevron (for items with children) */}
                        {hasChildren && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleExpanded(item.path);
                            }}
                            className="
                              w-5 h-5 flex items-center justify-center flex-shrink-0
                              text-text-light-secondary dark:text-text-dark-secondary
                              hover:text-text-light-primary dark:hover:text-text-dark-primary
                              transition-transform duration-200
                            "
                            title={expanded ? 'Collapse' : 'Expand'}
                            aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            aria-expanded={expanded}
                          >
                            <span
                              className={`text-xs transition-transform duration-200 ${
                                expanded ? 'rotate-90' : ''
                              }`}
                            >
                              ▶
                            </span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="
                        absolute left-full ml-2 px-2 py-1
                        bg-surface-light-elevated dark:bg-surface-dark-elevated
                        text-text-light-primary dark:text-text-dark-primary text-xs rounded
                        opacity-0 group-hover:opacity-100
                        pointer-events-none transition-opacity duration-200
                        whitespace-nowrap z-50
                      ">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </div>

                {/* Children (Sub-pages) - only show when expanded and not collapsed */}
                {hasChildren && expanded && !isCollapsed && (
                  <ul className="ml-6 mt-1 space-y-1">
                    {item.children!.map((child) => (
                      <li key={child.path}>
                        <Link
                          to={child.path}
                          className={`
                            flex items-center gap-3 px-3 h-9 rounded-button
                            transition-all duration-standard ease-smooth
                            relative group
                            ${
                              isActive(child.path)
                                ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
                                : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                            }
                          `}
                          aria-current={isActive(child.path) ? 'page' : undefined}
                        >
                          {/* Active indicator (left accent) */}
                          {isActive(child.path) && (
                            <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-accent-blue rounded-r" />
                          )}

                          {/* Icon */}
                          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-sm" aria-hidden="true">
                            {child.icon}
                          </span>

                          {/* Label */}
                          <span className="flex-1 text-sm leading-5 font-medium truncate">
                            {child.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}

          {/* Draggable Navigation Items (Notes, Planning, Tasks) */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={navOrder} strategy={verticalListSortingStrategy}>
              {sortedDraggableNavigation.map((item) => (
                <SortableNavItem
                  key={item.path}
                  item={item}
                  isCollapsed={isCollapsed}
                  isActive={isActive(item.path)}
                  onPageSettings={handlePageSettings}
                  isDisablingClicks={isDisablingClicks}
                />
              ))}
            </SortableContext>
          </DndContext>
        </ul>
      </nav>

      {/* Time Tracking Panel - only visible when expanded */}
      {!isCollapsed && (
        <Suspense fallback={<div className="h-[120px] animate-pulse bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg m-2" />}>
          <TimeTrackingPanel />
        </Suspense>
      )}

      {/* Bottom Section */}
      <div className="border-t border-border-light dark:border-border-dark p-2 space-y-1">
        {/* Settings (Fixed) */}
        <Link
          to="/settings"
          className={`
            w-full flex items-center gap-3 px-3 h-11 rounded-button
            ${isActive('/settings')
              ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            }
            transition-all duration-standard ease-smooth
            group relative
          `}
          title={isCollapsed ? 'Settings' : undefined}
          aria-current={isActive('/settings') ? 'page' : undefined}
        >
          {/* Active indicator (left accent) */}
          {isActive('/settings') && (
            <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent-blue rounded-r" />
          )}

          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-lg">⚙️</span>
          {!isCollapsed && (
            <span className="flex-1 text-base leading-5 font-medium text-left truncate">
              Settings
            </span>
          )}
          {isCollapsed && (
            <div className="
              absolute left-full ml-2 px-2 py-1
              bg-surface-dark text-text-dark-primary text-xs rounded
              opacity-0 group-hover:opacity-100
              pointer-events-none transition-opacity duration-200
              whitespace-nowrap z-50
            ">
              Settings
            </div>
          )}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center gap-3 px-3 h-11 rounded-button
            text-text-light-secondary dark:text-text-dark-secondary
            hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
            transition-all duration-standard ease-smooth
            group relative
          `}
          title={isCollapsed ? (mode === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-lg" aria-hidden="true">
            {mode === 'dark' ? '☀️' : '🌙'}
          </span>
          {!isCollapsed && (
            <span className="flex-1 text-base leading-5 font-medium text-left">
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
          {isCollapsed && (
            <div className="
              absolute left-full ml-2 px-2 py-1
              bg-surface-dark text-text-dark-primary text-xs rounded
              opacity-0 group-hover:opacity-100
              pointer-events-none transition-opacity duration-200
              whitespace-nowrap z-50
            ">
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className={`
            w-full flex items-center gap-3 px-3 h-11 rounded-button
            text-text-light-secondary dark:text-text-dark-secondary
            hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
            transition-all duration-standard ease-smooth
            group relative
          `}
          title={isCollapsed ? 'Expand Sidebar' : undefined}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-lg" aria-hidden="true">
            {isCollapsed ? '▶' : '◀'}
          </span>
          {!isCollapsed && (
            <span className="flex-1 text-base leading-5 font-medium text-left">
              Collapse
            </span>
          )}
          {isCollapsed && (
            <div className="
              absolute left-full ml-2 px-2 py-1
              bg-surface-dark text-text-dark-primary text-xs rounded
              opacity-0 group-hover:opacity-100
              pointer-events-none transition-opacity duration-200
              whitespace-nowrap z-50
            ">
              Expand Sidebar
            </div>
          )}
        </button>
      </div>
    </aside>

    {/* Page Settings Panel (lazy loaded) */}
    <Suspense fallback={null}>
      {pageSettingsOpen && (
        <PageSettingsPanel
          isOpen={true}
          onClose={() => setPageSettingsOpen(null)}
          pagePath={pageSettingsOpen}
        />
      )}
    </Suspense>
    </>
  );
};
