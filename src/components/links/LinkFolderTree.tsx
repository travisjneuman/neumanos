/**
 * LinkFolderTree Component
 *
 * Recursive folder tree for the Link Library sidebar.
 * Based on notes/FolderTreeNode.tsx pattern.
 *
 * Features:
 * - Recursive rendering for nested folders
 * - Expand/collapse with chevron icons
 * - Link count display
 * - Hover actions (rename, delete, new subfolder)
 * - Active state highlighting with left accent bar
 * - Drag-and-drop reordering with @dnd-kit
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  FolderPlus,
  Edit2,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { LinkFolderTreeNode } from '../../stores/useLinkFoldersStore';

// Animation variants for folder children
const getChildrenVariants = (reduceMotion: boolean) => ({
  hidden: {
    opacity: reduceMotion ? 1 : 0,
    height: 0,
    transition: { duration: reduceMotion ? 0 : 0.15, ease: 'easeInOut' as const },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: { duration: reduceMotion ? 0 : 0.15, ease: 'easeInOut' as const },
  },
});

// ============================================================================
// Context Menu Component
// ============================================================================

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onNewSubfolder?: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const FolderContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onNewSubfolder,
  onRename,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedY = Math.min(y, window.innerHeight - 150);
  const adjustedX = Math.min(x, window.innerWidth - 160);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg py-1 min-w-[140px]"
      style={{ top: adjustedY, left: adjustedX }}
    >
      {onNewSubfolder && (
        <button
          onClick={() => {
            onNewSubfolder();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          New Subfolder
        </button>
      )}
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
      >
        <Edit2 className="w-4 h-4" />
        Rename
      </button>
      <div className="border-t border-border-light dark:border-border-dark my-1" />
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-accent-red hover:bg-accent-red/10 dark:hover:bg-accent-red/20 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
};

// ============================================================================
// Props Interfaces
// ============================================================================

export interface LinkFolderTreeProps {
  folders: LinkFolderTreeNode[];
  activeFolderId: string | null;
  expandedFolderIds: Set<string>;
  onSelect: (id: string | null) => void;
  onToggleExpanded: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onRename: (id: string, name: string) => void;
  onCreateSubfolder?: (parentId: string | null) => void;
  onReorderFolders?: (parentId: string | null, orderedIds: string[]) => void;
}

interface LinkFolderTreeNodeProps {
  node: LinkFolderTreeNode;
  depth: number;
  activeFolderId: string | null;
  expandedFolderIds: Set<string>;
  onSelect: (id: string | null) => void;
  onToggleExpanded: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onRename: (id: string, name: string) => void;
  onCreateSubfolder?: (parentId: string | null) => void;
  onReorderFolders?: (parentId: string | null, orderedIds: string[]) => void;
  isDisablingClicks?: boolean;
}

// ============================================================================
// Tree Root Component
// ============================================================================

export const LinkFolderTree: React.FC<LinkFolderTreeProps> = ({
  folders,
  activeFolderId,
  expandedFolderIds,
  onSelect,
  onToggleExpanded,
  onDelete,
  onRename,
  onCreateSubfolder,
  onReorderFolders,
}) => {
  // DnD state for click protection (prevents navigation during drag)
  const [isDisablingClicks, setIsDisablingClicks] = useState(false);
  const disableTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // DnD sensors with activation constraint to differentiate from clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (_event: DragStartEvent) => {
    // Disable clicks immediately when drag starts
    if (disableTimeoutRef.current) clearTimeout(disableTimeoutRef.current);
    setIsDisablingClicks(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Keep clicks disabled briefly after drag ends
    disableTimeoutRef.current = setTimeout(() => {
      setIsDisablingClicks(false);
      disableTimeoutRef.current = null;
    }, 150);

    if (over && active.id !== over.id && onReorderFolders) {
      const oldIndex = folders.findIndex((f) => f.id === active.id);
      const newIndex = folders.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(
          folders.map((f) => f.id),
          oldIndex,
          newIndex
        );
        onReorderFolders(null, newOrder); // null = root level
      }
    }
  };

  const folderIds = useMemo(() => folders.map((f) => f.id), [folders]);

  return (
    <div className="space-y-0.5" role="tree" aria-label="Link folders">
      {/* All Links (root) option - has chevron spacer to align with folder rows */}
      <div
        role="treeitem"
        aria-selected={activeFolderId === null}
        className={`group rounded-lg transition-all duration-150 h-9 flex items-center px-2 cursor-pointer ${
          activeFolderId === null
            ? 'bg-transparent border-l-2 border-accent-primary'
            : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated border-l-2 border-transparent'
        }`}
        onClick={() => onSelect(null)}
      >
        {/* Spacer matching chevron width for alignment with folder rows */}
        <span className="w-5 flex-shrink-0" />
        <Folder
          className={`w-4 h-4 mr-2 flex-shrink-0 ${
            activeFolderId === null
              ? 'text-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary'
          }`}
        />
        <span
          className={`flex-1 text-sm font-medium ${
            activeFolderId === null
              ? 'text-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary'
          }`}
        >
          All Links
        </span>
        {onCreateSubfolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubfolder(null);
            }}
            className="ml-auto p-1 opacity-0 group-hover:opacity-100 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-all flex-shrink-0"
            title="New folder"
            aria-label="Create folder at root"
          >
            <FolderPlus className="w-3.5 h-3.5 text-text-light-secondary dark:text-text-dark-secondary" />
          </button>
        )}
      </div>

      {/* Folder tree with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={folderIds} strategy={verticalListSortingStrategy}>
          {folders.map((folder) => (
            <SortableFolderNode
              key={folder.id}
              node={folder}
              depth={0}
              activeFolderId={activeFolderId}
              expandedFolderIds={expandedFolderIds}
              onSelect={onSelect}
              onToggleExpanded={onToggleExpanded}
              onDelete={onDelete}
              onRename={onRename}
              onCreateSubfolder={onCreateSubfolder}
              onReorderFolders={onReorderFolders}
              isDisablingClicks={isDisablingClicks}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

// ============================================================================
// Sortable Folder Node Wrapper
// ============================================================================

const SortableFolderNode: React.FC<LinkFolderTreeNodeProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LinkFolderTreeNodeComponent {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
};

// ============================================================================
// Tree Node Component (Recursive)
// ============================================================================

interface ExtendedNodeProps extends LinkFolderTreeNodeProps {
  dragHandleProps?: Record<string, unknown>;
}

const LinkFolderTreeNodeComponent: React.FC<ExtendedNodeProps> = ({
  node,
  depth,
  activeFolderId,
  expandedFolderIds,
  onSelect,
  onToggleExpanded,
  onDelete,
  onRename,
  onCreateSubfolder,
  onReorderFolders,
  isDisablingClicks,
  dragHandleProps,
}) => {
  const isExpanded = expandedFolderIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isActive = activeFolderId === node.id;

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const prefersReducedMotion = useReducedMotion();
  const childrenVariants = useMemo(
    () => getChildrenVariants(prefersReducedMotion),
    [prefersReducedMotion]
  );

  // Child folder IDs for nested DnD
  const childIds = useMemo(
    () => (node.children || []).map((c) => c.id),
    [node.children]
  );

  // DnD state for nested children
  const [isChildDragging, setIsChildDragging] = useState(false);
  const childDisableTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleChildDragStart = () => {
    if (childDisableTimeoutRef.current) clearTimeout(childDisableTimeoutRef.current);
    setIsChildDragging(true);
  };

  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    childDisableTimeoutRef.current = setTimeout(() => {
      setIsChildDragging(false);
      childDisableTimeoutRef.current = null;
    }, 150);

    if (over && active.id !== over.id && onReorderFolders && node.children) {
      const oldIndex = node.children.findIndex((f) => f.id === active.id);
      const newIndex = node.children.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(childIds, oldIndex, newIndex);
        onReorderFolders(node.id, newOrder);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDisablingClicks || isChildDragging) {
      e.preventDefault();
      return;
    }
    onSelect(node.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.left, y: rect.bottom + 4 });
  };

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isActive}
      style={{ pointerEvents: isDisablingClicks ? 'none' : 'auto' }}
    >
      <div
        className={`group rounded-lg transition-all duration-150 h-9 flex items-center cursor-pointer px-2 ${
          isActive
            ? 'bg-transparent border-l-2 border-accent-primary'
            : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: depth > 0 ? `${depth * 10 + 8}px` : undefined }}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse chevron or spacer - always in normal flow */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(node.id);
            }}
            className="p-0.5 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-colors flex-shrink-0"
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            )}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        {/* Folder icon - also serves as drag handle */}
        <span
          {...dragHandleProps}
          className={`flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing ${
            isActive
              ? 'text-accent-primary'
              : 'text-text-light-secondary dark:text-text-dark-secondary'
          }`}
          title="Drag to reorder"
        >
          {isExpanded && hasChildren ? (
            <FolderOpen className="w-4 h-4" />
          ) : (
            <Folder className="w-4 h-4" />
          )}
        </span>

        {/* Folder name button - takes full remaining width */}
        <button
          onClick={handleClick}
          className={`flex-1 text-left py-1.5 transition-all duration-150 flex items-center gap-2 min-w-0 ml-2 ${
            isActive
              ? 'text-accent-primary font-medium'
              : 'text-text-light-secondary dark:text-text-dark-secondary group-hover:text-text-light-primary dark:group-hover:text-text-dark-primary'
          }`}
        >
          <span className="text-sm font-medium truncate flex-1">{node.name}</span>
          {node.linkCount > 0 && (
            <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-shrink-0 tabular-nums">
              {node.linkCount}
            </span>
          )}
        </button>

        {/* Menu icon - appears on hover at the end */}
        <button
          onClick={handleMenuButtonClick}
          className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-all flex-shrink-0 ml-1"
          title="Folder options"
          aria-label="Open folder menu"
        >
          <MoreVertical className="w-3.5 h-3.5 text-text-light-tertiary dark:text-text-dark-tertiary" />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <FolderContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onNewSubfolder={onCreateSubfolder ? () => onCreateSubfolder(node.id) : undefined}
          onRename={() => onRename(node.id, node.name)}
          onDelete={() => onDelete(node.id, node.name)}
        />
      )}

      {/* Children - animated expand/collapse with nested DnD */}
      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            role="group"
            className="ml-4 overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={childrenVariants}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleChildDragStart}
              onDragEnd={handleChildDragEnd}
            >
              <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                {node.children!.map((child) => (
                  <SortableFolderNode
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    activeFolderId={activeFolderId}
                    expandedFolderIds={expandedFolderIds}
                    onSelect={onSelect}
                    onToggleExpanded={onToggleExpanded}
                    onDelete={onDelete}
                    onRename={onRename}
                    onCreateSubfolder={onCreateSubfolder}
                    onReorderFolders={onReorderFolders}
                    isDisablingClicks={isDisablingClicks || isChildDragging}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LinkFolderTree;
