import React, { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragContext, type DragContextValue } from '../hooks/useDragHandle';
import { useWidgetStore } from '../stores/useWidgetStore';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component to make dashboard widgets sortable via drag-drop
 * Uses @dnd-kit for drag-drop functionality
 *
 * Features:
 * - Entire widget header is draggable (cursor changes to grab hand)
 * - No visible icon - cursor change is the only indicator
 * - Visual feedback during drag (opacity change)
 * - Accessible keyboard support
 *
 * Note: Resize is handled via Widget Manager modal, not hover buttons
 */
/** Size labels for the resize control */
const SIZE_LABELS: Record<number, string> = { 1: '1x', 2: '2x', 3: '3x' };

export const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, className = '' }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const currentSize = useWidgetStore((state) => state.widgetSizes[id] ?? 1);
  const setWidgetSize = useWidgetStore((state) => state.setWidgetSize);

  // WeatherMap is locked to 3x
  const isLocked = id === 'weathermap';

  const cycleSize = useCallback(() => {
    if (isLocked) return;
    const next = currentSize >= 3 ? 1 : (currentSize + 1) as 1 | 2 | 3;
    setWidgetSize(id, next);
  }, [id, currentSize, setWidgetSize, isLocked]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Provide drag context to children (Widget header will consume this)
  const dragContext: DragContextValue = {
    attributes,
    listeners,
    isDragging,
  };

  return (
    <DragContext.Provider value={dragContext}>
      <div
        ref={setNodeRef}
        style={style}
        className={`sortable-widget relative group ${className}`}
      >
        {/* Widget Content - drag is handled by Widget header via context */}
        {children}

        {/* Inline Resize Handle - appears on hover */}
        {!isLocked && !isDragging && (
          <button
            onClick={cycleSize}
            className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-blue hover:border-accent-blue/50 shadow-sm z-10"
            title={`Current: ${SIZE_LABELS[currentSize]} — Click to resize`}
            aria-label={`Resize widget from ${SIZE_LABELS[currentSize]}`}
          >
            {SIZE_LABELS[currentSize]}
          </button>
        )}
      </div>
    </DragContext.Provider>
  );
};
