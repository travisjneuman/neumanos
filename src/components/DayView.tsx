/**
 * Day View Component
 *
 * Displays a 24-hour timeline with hourly slots for a single day
 * Features: current time indicator, timed events in slots, quick event creation
 * Time Blocking: Drag-drop support for moving events between time slots
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, Modifier } from '@dnd-kit/core';
import { GripVertical, AlertCircle } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { format } from 'date-fns';
import { getEventDisplayColor } from '../utils/calendarColors';
import { calculateEventLayout } from '../utils/eventLayout';
import { QuickEventCreate } from './QuickEventCreate';

interface ResizeState {
  isResizing: boolean;
  eventId: string;
  edge: 'top' | 'bottom';
  originalStartTime: string;
  originalEndTime: string;
  currentMinute: number;
}

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent, dateKey: string) => void;
  onTimeSlotClick?: (hour: number) => void;
  /** Called when an event is dragged to a new time slot */
  onEventTimeChange?: (eventId: string, newStartTime: string, newEndTime: string) => void;
  /** Enable time blocking (drag-drop) - defaults to false for readonly views */
  enableTimeBlocking?: boolean;
}

// Snap modifier: snaps to 15-minute intervals (15px = 15 minutes at 60px/hour scale)
const MINUTES_PER_SNAP = 15;
const PIXELS_PER_HOUR = 60;
const SNAP_PIXELS = (MINUTES_PER_SNAP / 60) * PIXELS_PER_HOUR;

const snapToGridModifier: Modifier = ({ transform }) => {
  return {
    ...transform,
    y: Math.round(transform.y / SNAP_PIXELS) * SNAP_PIXELS,
  };
};

/**
 * Draggable Event Component
 */
interface DraggableEventProps {
  event: CalendarEvent;
  style: React.CSSProperties;
  dateKey: string;
  onEventClick?: (event: CalendarEvent, dateKey: string) => void;
  isDragging?: boolean;
  enableDrag: boolean;
  hasConflict?: boolean;
}

const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  style,
  dateKey,
  onEventClick,
  isDragging = false,
  enableDrag,
  hasConflict = false,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event, dateKey },
    disabled: !enableDrag,
  });

  const dragStyle = transform
    ? {
        ...style,
        transform: `translate3d(0, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : style;

  const eventColor = getEventDisplayColor(event);

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-0 right-1 px-2 py-1 rounded text-left overflow-hidden text-white text-sm shadow-sm transition-all duration-standard ease-smooth group
        ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-accent-primary' : 'hover:opacity-90'}
        ${enableDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
      `}
      style={{ ...dragStyle, backgroundColor: eventColor }}
      onClick={(e) => {
        if (!transform) {
          e.stopPropagation();
          onEventClick?.(event, dateKey);
        }
      }}
      title={`${event.startTime} - ${event.endTime || ''}: ${event.title}`}
    >
      <div className="flex items-center gap-1">
        {enableDrag && (
          <div
            {...listeners}
            {...attributes}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate flex items-center gap-1">
            {event.title}
            {hasConflict && (
              <span className="flex-shrink-0" aria-label="Overlapping event">
                <AlertCircle className="w-3 h-3 text-amber-300" />
              </span>
            )}
          </div>
          {event.startTime && (
            <div className="text-xs opacity-90">
              {event.startTime} {event.endTime && `- ${event.endTime}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Droppable Time Slot Component
 */
interface DroppableTimeSlotProps {
  hour: number;
  quarter: number;
  isOver: boolean;
  children?: React.ReactNode;
}

const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  hour,
  quarter,
  isOver,
  children,
}) => {
  const slotId = `slot-${hour}-${quarter}`;
  const { setNodeRef, isOver: localIsOver } = useDroppable({
    id: slotId,
    data: { hour, quarter },
  });

  const isActive = isOver || localIsOver;

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-14 right-0 transition-colors duration-150
        ${isActive ? 'bg-accent-primary/20 border-l-2 border-accent-primary' : ''}
      `}
      style={{
        top: `${(hour * 60 + quarter * 15) / (24 * 60) * 100}%`,
        height: `${15 / (24 * 60) * 100}%`,
      }}
    >
      {children}
    </div>
  );
};

export const DayView: React.FC<DayViewProps> = ({
  date,
  events,
  onEventClick,
  onTimeSlotClick: _onTimeSlotClick,
  onEventTimeChange,
  enableTimeBlocking = false,
}) => {
  const dateKey = format(date, 'yyyy-MM-dd');
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const quarters = [0, 1, 2, 3]; // 0, 15, 30, 45 minutes

  // Track dragging state for overlay
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [quickCreate, setQuickCreate] = useState<{ hour: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  // Configure pointer sensor with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start drag
      },
    })
  );

  // Get current hour for time indicator
  const now = new Date();
  const isToday = format(now, 'yyyy-MM-dd') === dateKey;
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentPosition = isToday ? ((currentHour * 60 + currentMinutes) / (24 * 60)) * 100 : null;

  // Group events by time
  const timedEvents = useMemo(() => {
    return events.filter(e => !e.isAllDay && e.startTime);
  }, [events]);

  const allDayEvents = useMemo(() => {
    return events.filter(e => e.isAllDay || !e.startTime);
  }, [events]);

  // Parse time string "HH:MM" to decimal hours
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent): React.CSSProperties | null => {
    if (!event.startTime) return null;

    const startHour = parseTime(event.startTime);
    const endHour = event.endTime ? parseTime(event.endTime) : startHour + 1;
    const duration = endHour - startHour;

    return {
      top: `${(startHour / 24) * 100}%`,
      height: `${(duration / 24) * 100}%`,
    };
  };

  // Convert decimal hours to "HH:MM" format
  const formatTimeString = (decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const draggedEvent = timedEvents.find((e) => e.id === event.active.id);
    if (draggedEvent) {
      setActiveEvent(draggedEvent);
    }
  }, [timedEvents]);

  // Handle drag end - calculate new time and call callback
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveEvent(null);

    const { active, over, delta } = event;
    if (!over || !onEventTimeChange) return;

    const draggedEvent = timedEvents.find((e) => e.id === active.id);
    if (!draggedEvent || !draggedEvent.startTime) return;

    // Calculate new time based on Y delta
    // 60px = 1 hour, so delta.y / 60 = hours moved
    const hoursDelta = delta.y / PIXELS_PER_HOUR;

    // Snap to 15-minute intervals
    const snappedHoursDelta = Math.round(hoursDelta * 4) / 4; // 4 = 60/15

    if (snappedHoursDelta === 0) return; // No meaningful move

    // Calculate new start/end times
    const currentStart = parseTime(draggedEvent.startTime);
    const currentEnd = draggedEvent.endTime ? parseTime(draggedEvent.endTime) : currentStart + 1;
    const duration = currentEnd - currentStart;

    let newStart = currentStart + snappedHoursDelta;
    // Clamp to valid range (0-24)
    newStart = Math.max(0, Math.min(24 - duration, newStart));
    const newEnd = newStart + duration;

    const newStartTime = formatTimeString(newStart);
    const newEndTime = formatTimeString(newEnd);

    // Only update if time actually changed
    if (newStartTime !== draggedEvent.startTime) {
      onEventTimeChange(draggedEvent.id, newStartTime, newEndTime);
    }
  }, [timedEvents, onEventTimeChange, parseTime]);

  // --- Resize handlers ---
  const snapTo15 = (minute: number): number => Math.round(minute / 15) * 15;

  const handleResizeStart = useCallback((e: React.MouseEvent, eventId: string, edge: 'top' | 'bottom', startTime: string, endTime: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + (containerRef.current.parentElement?.scrollTop ?? 0);
    const rawMinute = Math.max(0, Math.min(y, 1439));
    setResizeState({
      isResizing: true,
      eventId,
      edge,
      originalStartTime: startTime,
      originalEndTime: endTime,
      currentMinute: snapTo15(rawMinute),
    });
  }, []);

  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!resizeState?.isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + (containerRef.current.parentElement?.scrollTop ?? 0);
    const rawMinute = snapTo15(Math.max(0, Math.min(y, 1439)));
    setResizeState(prev => prev ? { ...prev, currentMinute: rawMinute } : null);
  }, [resizeState]);

  const handleResizeEnd = useCallback(() => {
    if (!resizeState?.isResizing || !onEventTimeChange) {
      setResizeState(null);
      return;
    }

    const [origSH, origSM] = resizeState.originalStartTime.split(':').map(Number);
    const [origEH, origEM] = resizeState.originalEndTime.split(':').map(Number);
    let startMin = origSH * 60 + origSM;
    let endMin = origEH * 60 + origEM;

    if (resizeState.edge === 'top') {
      startMin = Math.min(resizeState.currentMinute, endMin - 15);
      startMin = Math.max(0, startMin);
    } else {
      endMin = Math.max(resizeState.currentMinute, startMin + 15);
      endMin = Math.min(24 * 60 - 1, endMin);
    }

    const fmtTime = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
    const newStartTime = fmtTime(startMin);
    const newEndTime = fmtTime(endMin);

    if (newStartTime !== resizeState.originalStartTime || newEndTime !== resizeState.originalEndTime) {
      onEventTimeChange(resizeState.eventId, newStartTime, newEndTime);
    }

    setResizeState(null);
  }, [resizeState, onEventTimeChange]);

  // Cleanup resize on global mouseup
  useEffect(() => {
    const handleGlobalUp = () => {
      if (resizeState?.isResizing) {
        handleResizeEnd();
      }
    };
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, [resizeState, handleResizeEnd]);

  // Render timeline content (shared between DndContext and non-DnD modes)
  const renderTimelineContent = () => (
    <>
      {/* Current time indicator */}
      {currentPosition !== null && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: `${currentPosition}%` }}
        >
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-accent-red" />
            <div className="flex-1 h-0.5 bg-accent-red" />
          </div>
        </div>
      )}

      {/* Hour slots */}
      <div
        ref={containerRef}
        className="relative h-full"
        style={{ minHeight: '1440px' /* 24 hours * 60px */ }}
      >
        {hours.map((hour) => (
          <div
            key={hour}
            className="relative border-b border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth cursor-pointer"
            style={{ height: '60px' }}
            onClick={() => {
              setQuickCreate({ hour });
            }}
          >
            {/* Hour label */}
            <div className="absolute -top-3 left-0 text-xs text-text-light-secondary dark:text-text-dark-secondary w-12 text-right pr-2">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>

            {/* 30-minute half line */}
            <div className="absolute top-1/2 left-14 right-0 h-px bg-border-light dark:border-border-dark opacity-30" />
          </div>
        ))}

        {/* Droppable quarter-hour zones (only when time blocking enabled) */}
        {enableTimeBlocking && hours.map((hour) =>
          quarters.map((quarter) => (
            <DroppableTimeSlot
              key={`${hour}-${quarter}`}
              hour={hour}
              quarter={quarter}
              isOver={false}
            />
          ))
        )}

        {/* Timed events (with overlap stacking + resize handles) */}
        <div
          className="absolute top-0 left-14 right-0 bottom-0"
          onMouseMove={handleResizeMove}
          onMouseUp={handleResizeEnd}
          style={{ userSelect: resizeState?.isResizing ? 'none' : undefined }}
        >
          {(() => {
            const layout = calculateEventLayout(timedEvents);
            return timedEvents.map((event) => {
              let style = getEventStyle(event);
              if (!style) return null;

              // Adjust style if this event is being resized
              const isBeingResized = resizeState?.isResizing && resizeState.eventId === event.id;
              if (isBeingResized && event.startTime && event.endTime) {
                const [origSH, origSM] = event.startTime.split(':').map(Number);
                const [origEH, origEM] = event.endTime.split(':').map(Number);
                let startMin = origSH * 60 + origSM;
                let endMin = origEH * 60 + origEM;
                if (resizeState.edge === 'top') {
                  startMin = Math.min(resizeState.currentMinute, endMin - 15);
                  startMin = Math.max(0, startMin);
                } else {
                  endMin = Math.max(resizeState.currentMinute, startMin + 15);
                  endMin = Math.min(24 * 60 - 1, endMin);
                }
                const startHour = startMin / 60;
                const duration = (endMin - startMin) / 60;
                style = {
                  top: `${(startHour / 24) * 100}%`,
                  height: `${(duration / 24) * 100}%`,
                };
              }

              const layoutInfo = layout.get(event.id);
              const col = layoutInfo?.column ?? 0;
              const totalCols = layoutInfo?.totalColumns ?? 1;
              const widthPercent = 100 / totalCols;
              const leftPercent = col * widthPercent;

              const positionedStyle: React.CSSProperties = {
                ...style,
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              };

              return (
                <div key={event.id} className={`absolute group/resize ${isBeingResized ? 'ring-2 ring-white/50 z-50' : ''}`} style={positionedStyle}>
                  {/* Top resize handle */}
                  {onEventTimeChange && event.startTime && event.endTime && (
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize opacity-0 group-hover/resize:opacity-100 bg-white/30 rounded-t z-30"
                      onMouseDown={(e) => handleResizeStart(e, event.id, 'top', event.startTime!, event.endTime!)}
                    />
                  )}

                  <DraggableEvent
                    event={event}
                    style={{ top: 0, left: 0, width: '100%', height: '100%', position: 'absolute' }}
                    dateKey={dateKey}
                    onEventClick={onEventClick}
                    isDragging={activeEvent?.id === event.id}
                    enableDrag={enableTimeBlocking}
                    hasConflict={totalCols > 1}
                  />

                  {/* Bottom resize handle */}
                  {onEventTimeChange && event.startTime && event.endTime && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize opacity-0 group-hover/resize:opacity-100 bg-white/30 rounded-b z-30"
                      onMouseDown={(e) => handleResizeStart(e, event.id, 'bottom', event.startTime!, event.endTime!)}
                    />
                  )}
                </div>
              );
            });
          })()}

          {/* Quick event creation */}
          {quickCreate !== null && (
            <QuickEventCreate
              dateKey={dateKey}
              startTime={`${quickCreate.hour.toString().padStart(2, '0')}:00`}
              onClose={() => setQuickCreate(null)}
              style={{
                top: `${(quickCreate.hour / 24) * 100}%`,
                height: `${(1 / 24) * 100}%`,
              }}
            />
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Day header */}
      <div className="flex-shrink-0 border-b border-border-light dark:border-border-dark p-4 bg-surface-light dark:bg-surface-dark">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {format(date, 'EEEE')}
            </h2>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {format(date, 'MMMM d, yyyy')}
            </p>
          </div>
          {isToday && (
            <span className="px-3 py-1 bg-accent-blue text-white text-sm font-medium rounded-full">
              Today
            </span>
          )}
        </div>
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="flex-shrink-0 border-b border-border-light dark:border-border-dark p-2 bg-surface-light-elevated dark:bg-surface-dark-elevated">
          <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            All Day
          </div>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event, dateKey)}
                className="w-full text-left px-2 py-1 rounded text-white text-sm hover:opacity-90 transition-all duration-standard ease-smooth"
                style={{ backgroundColor: getEventDisplayColor(event) }}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline with optional drag-drop */}
      <div className="flex-1 overflow-y-auto relative">
        {enableTimeBlocking ? (
          <DndContext
            sensors={sensors}
            modifiers={[snapToGridModifier]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {renderTimelineContent()}

            {/* Drag overlay for smooth dragging */}
            <DragOverlay>
              {activeEvent && (
                <div className="bg-accent-primary text-white text-sm px-2 py-1 rounded shadow-lg opacity-90 pointer-events-none">
                  <div className="font-medium">{activeEvent.title}</div>
                  {activeEvent.startTime && (
                    <div className="text-xs opacity-90">
                      {activeEvent.startTime} {activeEvent.endTime && `- ${activeEvent.endTime}`}
                    </div>
                  )}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          renderTimelineContent()
        )}
      </div>
    </div>
  );
};
