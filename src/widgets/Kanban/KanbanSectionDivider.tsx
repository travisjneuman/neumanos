import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type { KanbanSection } from '../../types';

interface KanbanSectionDividerProps {
  section: KanbanSection;
  taskCount: number;
  onToggleCollapse: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export const KanbanSectionDivider: React.FC<KanbanSectionDividerProps> = ({
  section,
  taskCount,
  onToggleCollapse,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);

  const handleSubmitRename = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== section.title) {
      onRename(section.id, trimmed);
    } else {
      setEditTitle(section.title);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 my-1 rounded-md bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/50 border border-border-light/50 dark:border-border-dark/50 group">
      <button
        onClick={() => onToggleCollapse(section.id)}
        className="p-0.5 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
        title={section.collapsed ? 'Expand section' : 'Collapse section'}
      >
        {section.collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSubmitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmitRename();
            if (e.key === 'Escape') {
              setEditTitle(section.title);
              setIsEditing(false);
            }
          }}
          className="flex-1 text-xs font-semibold bg-transparent border-none outline-none text-text-light-primary dark:text-text-dark-primary"
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-xs font-semibold text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wider cursor-pointer"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to rename"
        >
          {section.title}
        </span>
      )}

      <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
        {taskCount}
      </span>

      <button
        onClick={() => onDelete(section.id)}
        className="p-0.5 opacity-0 group-hover:opacity-100 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-status-error transition-all"
        title="Delete section"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};
