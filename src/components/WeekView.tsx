/**
 * Week View Component
 *
 * Displays a 7-day week with time slots for each day
 * Features: time slots (hourly), timed events, all-day events, task bars
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import type { CalendarEvent, Task } from '../types';
import { getLegacyDateKey, isToday, isDateBetween } from '../utils/dateUtils';
import { getEventDisplayColor } from '../utils/calendarColors';
import { calculateEventLayout } from '../utils/eventLayout';
import { QuickEventCreate } from './QuickEventCreate';

interface DragState {
  isDragging: boolean;
  startDayIndex: number;
  startHour: number;
  startMinute: number;
  currentDayIndex: number;
  currentHour: number;
  currentMinute: number;
  startY: number; // initial mouseY for threshold detection
}

interface ResizeState {
  isResizing: boolean;
  eventId: string;
  dateKey: string;
  edge: 'top' | 'bottom';
  originalStartTime: string;
  originalEndTime: string;
  currentMinute: number;
}

interface WeekViewProps {
  currentDate: Date;
  events: Record<string, CalendarEvent[]>;
  tasks: Task[];
  onDayClick: (dateKey: string) => void;
  onEventClick?: (event: CalendarEvent, dateKey: string) => void;
  showTimeSlots?: boolean;
  /** Called when an event is resized via drag handles */
  onEventTimeChange?: (dateKey: string, eventId: string, newStartTime: string, newEndTime: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  tasks,
  onDayClick,
  onEventClick,
  showTimeSlots = true,
  onEventTimeChange,
}) => {
  const [quickCreate, setQuickCreate] = useState<{
    dateKey: string;
    hour: number;
    startTime?: string;
    endTime?: string;
  } | null>(null);
  const [currentMinute, setCurrentMinute] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDraggingVisual, setIsDraggingVisual] = useState(false);
  const dragThresholdMet = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = showTimeSlots ? Array.from({ length: 24 }, (_, i) => i) : [];

  // Get start of week (Sunday) — must be before callbacks that reference weekDays
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [startOfWeek]);

  /** Snap a minute value to the nearest 15-minute interval */
  const snapTo15 = (minute: number): number => Math.round(minute / 15) * 15;

  /** Format hour + minute to "HH:MM" */
  const formatTime = (hour: number, minute: number): string => {
    const clampedMinute = Math.min(minute, 59);
    return `${hour.toString().padStart(2, '0')}:${clampedMinute.toString().padStart(2, '0')}`;
  };

  /** Format hour + minute for display (12h) */
  const formatTimeDisplay = (hour: number, minute: number): string => {
    const m = Math.min(minute, 59);
    const mStr = m.toString().padStart(2, '0');
    if (hour === 0) return `12:${mStr} AM`;
    if (hour < 12) return `${hour}:${mStr} AM`;
    if (hour === 12) return `12:${mStr} PM`;
    return `${hour - 12}:${mStr} PM`;
  };

  /** Compute hour and snapped minute from a mouse Y relative to the grid */
  const getTimeFromY = useCallback((clientY: number): { hour: number; minute: number } => {
    if (!gridRef.current) return { hour: 0, minute: 0 };
    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top + gridRef.current.parentElement!.scrollTop;
    const rawHour = Math.floor(Math.max(0, Math.min(y, 1439)) / 60);
    const rawMinute = Math.max(0, Math.min(y, 1439)) % 60;
    return { hour: Math.min(rawHour, 23), minute: snapTo15(rawMinute) };
  }, []);

  /** Compute day index from mouse X relative to the grid */
  const getDayFromX = useCallback((clientX: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    // First col is the time label column (1/8 of grid width)
    const colWidth = rect.width / 8;
    const dayIdx = Math.floor((clientX - rect.left - colWidth) / colWidth);
    return Math.max(0, Math.min(dayIdx, 6));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, dayIndex: number, hour: number) => {
    // Only handle left click
    if (e.button !== 0) return;
    e.preventDefault(); // Prevent text selection

    const slotEl = e.currentTarget as HTMLElement;
    const rect = slotEl.getBoundingClientRect();
    const yInSlot = e.clientY - rect.top;
    const minuteInSlot = snapTo15(Math.floor((yInSlot / 60) * 60));

    dragThresholdMet.current = false;
    setIsDraggingVisual(false);
    setDragState({
      isDragging: true,
      startDayIndex: dayIndex,
      startHour: hour,
      startMinute: minuteInSlot,
      currentDayIndex: dayIndex,
      currentHour: hour,
      currentMinute: minuteInSlot,
      startY: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState?.isDragging) return;

    // Check threshold (5px)
    if (!dragThresholdMet.current) {
      if (Math.abs(e.clientY - dragState.startY) < 5) return;
      dragThresholdMet.current = true;
      setIsDraggingVisual(true);
    }

    const { hour, minute } = getTimeFromY(e.clientY);
    const dayIdx = getDayFromX(e.clientX);

    setDragState((prev) =>
      prev ? { ...prev, currentHour: hour, currentMinute: minute, currentDayIndex: dayIdx } : null
    );
  }, [dragState, getTimeFromY, getDayFromX]);

  const handleMouseUp = useCallback(() => {
    if (!dragState?.isDragging) return;

    if (dragThresholdMet.current) {
      // Drag occurred -- open QuickEventCreate with computed times
      // Determine start and end, ensuring start < end
      const startTotal = dragState.startHour * 60 + dragState.startMinute;
      const endTotal = dragState.currentHour * 60 + dragState.currentMinute;
      const minT = Math.min(startTotal, endTotal);
      const maxT = Math.max(startTotal, endTotal);
      // Ensure at least 15 min duration
      const finalEnd = maxT <= minT ? minT + 15 : maxT;

      const startH = Math.floor(minT / 60);
      const startM = minT % 60;
      const endH = Math.min(Math.floor(finalEnd / 60), 23);
      const endM = finalEnd >= 24 * 60 ? 45 : finalEnd % 60;

      const dateKey = getLegacyDateKey(weekDays[dragState.startDayIndex]);
      setQuickCreate({
        dateKey,
        hour: startH,
        startTime: formatTime(startH, startM),
        endTime: formatTime(endH, endM),
      });
    } else {
      // No significant drag -- treat as click
      const dateKey = getLegacyDateKey(weekDays[dragState.startDayIndex]);
      setQuickCreate({ dateKey, hour: dragState.startHour });
    }

    setDragState(null);
    setIsDraggingVisual(false);
    dragThresholdMet.current = false;
  }, [dragState, weekDays]);

  // --- Resize handlers ---
  const handleResizeStart = useCallback((e: React.MouseEvent, eventId: string, dateKey: string, edge: 'top' | 'bottom', startTime: string, endTime: string) => {
    e.preventDefault();
    e.stopPropagation();
    const { hour, minute } = getTimeFromY(e.clientY);
    setResizeState({
      isResizing: true,
      eventId,
      dateKey,
      edge,
      originalStartTime: startTime,
      originalEndTime: endTime,
      currentMinute: hour * 60 + minute,
    });
  }, [getTimeFromY]);

  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!resizeState?.isResizing) return;
    const { hour, minute } = getTimeFromY(e.clientY);
    setResizeState(prev => prev ? { ...prev, currentMinute: hour * 60 + minute } : null);
  }, [resizeState, getTimeFromY]);

  const handleResizeEnd = useCallback(() => {
    if (!resizeState?.isResizing || !onEventTimeChange) {
      setResizeState(null);
      return;
    }

    const [origStartH, origStartM] = resizeState.originalStartTime.split(':').map(Number);
    const [origEndH, origEndM] = resizeState.originalEndTime.split(':').map(Number);
    const origStartTotal = origStartH * 60 + origStartM;
    const origEndTotal = origEndH * 60 + origEndM;

    let newStartTotal = origStartTotal;
    let newEndTotal = origEndTotal;

    if (resizeState.edge === 'top') {
      newStartTotal = Math.min(resizeState.currentMinute, origEndTotal - 15);
      newStartTotal = Math.max(0, newStartTotal);
    } else {
      newEndTotal = Math.max(resizeState.currentMinute, origStartTotal + 15);
      newEndTotal = Math.min(24 * 60 - 1, newEndTotal);
    }

    const newStartH = Math.floor(newStartTotal / 60);
    const newStartM = newStartTotal % 60;
    const newEndH = Math.floor(newEndTotal / 60);
    const newEndM = newEndTotal % 60;

    const newStartTime = `${newStartH.toString().padStart(2, '0')}:${newStartM.toString().padStart(2, '0')}`;
    const newEndTime = `${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`;

    if (newStartTime !== resizeState.originalStartTime || newEndTime !== resizeState.originalEndTime) {
      onEventTimeChange(resizeState.dateKey, resizeState.eventId, newStartTime, newEndTime);
    }

    setResizeState(null);
  }, [resizeState, onEventTimeChange]);

  // Clean up drag on mouse leave / window blur
  useEffect(() => {
    const handleGlobalUp = () => {
      if (dragState?.isDragging) {
        handleMouseUp();
      }
      if (resizeState?.isResizing) {
        handleResizeEnd();
      }
    };
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, [dragState, handleMouseUp, resizeState, handleResizeEnd]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinute(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const tasksWithDates = useMemo(() => {
    return tasks.filter((task) => task.startDate && task.dueDate);
  }, [tasks]);

  // Parse time string "HH:MM" to decimal hours
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    if (!event.startTime) return null;

    const startHour = parseTime(event.startTime);
    const endHour = event.endTime ? parseTime(event.endTime) : startHour + 1;
    const duration = endHour - startHour;

    return {
      top: `${(startHour / 24) * 100}%`,
      height: `${(duration / 24) * 100}%`,
    };
  };

  // Priority colors for task bars
  const priorityColors = {
    low: 'bg-accent-blue dark:bg-accent-blue',
    medium: 'bg-accent-primary',
    high: 'bg-accent-red dark:bg-accent-red',
  };

  if (!showTimeSlots) {
    // Simple week view without time slots (original style)
    return (
      <div className="calendar-week-view flex-1 grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dateKey = getLegacyDateKey(day);
          const dayEvents = events[dateKey] || [];
          const dayIsToday = isToday(day);

          const overlappingTasks = tasksWithDates.filter((task) => {
            const startDate = new Date(task.startDate!);
            const dueDate = new Date(task.dueDate!);
            return isDateBetween(day, startDate, dueDate);
          });

          return (
            <div
              key={index}
              onClick={() => onDayClick(dateKey)}
              className={`
                calendar-week-day flex flex-col border rounded-button p-3 cursor-pointer transition-all hover:shadow-lg
                ${dayIsToday ? 'ring-2 ring-accent-primary bg-accent-primary/10 dark:bg-accent-primary/20' : 'bg-surface-light dark:bg-surface-dark'}
                border-border-light dark:border-border-dark
              `}
            >
              <div className="week-day-header mb-2">
                <div className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  {days[index]}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    dayIsToday
                      ? 'text-accent-primary'
                      : 'text-text-light-primary dark:text-text-dark-primary'
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* Events */}
              <div className="space-y-1 mb-2">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event, dateKey);
                    }}
                    className="w-full text-left text-xs px-2 py-1 rounded-button text-white hover:opacity-90 transition-all duration-standard ease-smooth truncate"
                    style={{ backgroundColor: getEventDisplayColor(event) }}
                  >
                    {event.startTime && `${event.startTime} `}
                    {event.title}
                  </button>
                ))}
              </div>

              {/* Task bars */}
              {overlappingTasks.length > 0 && (
                <div className="mt-1 space-y-1">
                  {overlappingTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs px-1 py-0.5 rounded-button text-white truncate ${
                        priorityColors[task.priority || 'medium']
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {overlappingTasks.length > 2 && (
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      +{overlappingTasks.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Week view with time slots
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with day names and dates */}
      <div className="flex-shrink-0 grid grid-cols-8 border-b border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated sticky top-0 z-10">
        <div className="p-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          {/* Empty cell for time column */}
        </div>
        {weekDays.map((day, index) => {
          const dayIsToday = isToday(day);
          return (
            <div
              key={index}
              className={`p-2 text-center border-l border-border-light dark:border-border-dark ${
                dayIsToday ? 'bg-accent-primary/10 dark:bg-accent-primary/20' : ''
              }`}
            >
              <div className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                {days[index]}
              </div>
              <div
                className={`text-lg font-bold ${
                  dayIsToday
                    ? 'text-accent-primary'
                    : 'text-text-light-primary dark:text-text-dark-primary'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time slots grid */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={gridRef}
          className="grid grid-cols-8 relative"
          style={{ minHeight: '1440px' /* 24 hours * 60px */, userSelect: (isDraggingVisual || resizeState?.isResizing) ? 'none' : undefined }}
          onMouseMove={(e) => {
            handleMouseMove(e);
            handleResizeMove(e);
          }}
          onMouseUp={() => {
            handleMouseUp();
            handleResizeEnd();
          }}
        >
          {/* Time labels column */}
          <div className="border-r border-border-light dark:border-border-dark">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border-light dark:border-border-dark"
                style={{ height: '60px' }}
              >
                <div className="absolute -top-3 left-0 text-xs text-text-light-secondary dark:text-text-dark-secondary w-full text-right pr-2">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dateKey = getLegacyDateKey(day);
            const dayEvents = events[dateKey] || [];
            const timedEvents = dayEvents.filter((e) => !e.isAllDay && e.startTime);
            const allDayEvents = dayEvents.filter((e) => e.isAllDay || !e.startTime);
            const dayIsToday = isToday(day);

            return (
              <div
                key={dayIndex}
                className={`relative border-l border-border-light dark:border-border-dark ${
                  dayIsToday ? 'bg-accent-primary/5 dark:bg-accent-primary/10' : ''
                }`}
              >
                {/* Hour slots */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth cursor-pointer"
                    style={{ height: '60px' }}
                    onMouseDown={(e) => handleMouseDown(e, dayIndex, hour)}
                  >
                    {/* 30-minute half line */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-border-light dark:bg-border-dark opacity-30" />
                  </div>
                ))}

                {/* Drag selection overlay */}
                {dragState?.isDragging && isDraggingVisual && dragState.startDayIndex === dayIndex && (() => {
                  const startTotal = dragState.startHour * 60 + dragState.startMinute;
                  const currentTotal = dragState.currentHour * 60 + dragState.currentMinute;
                  const minT = Math.min(startTotal, currentTotal);
                  const maxT = Math.max(startTotal, currentTotal);
                  const topPx = minT; // 1px per minute since grid is 1440px for 24h
                  const heightPx = Math.max(maxT - minT, 15);
                  const startH = Math.floor(minT / 60);
                  const startM = minT % 60;
                  const endH = Math.floor(maxT / 60);
                  const endM = maxT % 60;
                  return (
                    <div
                      className="absolute left-0 right-0 bg-accent-primary/30 border border-accent-primary/60 rounded z-20 pointer-events-none"
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    >
                      <div className="absolute -top-4 left-1 text-[10px] font-medium text-accent-primary">
                        {formatTimeDisplay(startH, startM)}
                      </div>
                      <div className="absolute -bottom-4 left-1 text-[10px] font-medium text-accent-primary">
                        {formatTimeDisplay(endH, endM)}
                      </div>
                    </div>
                  );
                })()}

                {/* Current time indicator */}
                {dayIsToday && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{ top: `${(currentMinute / (24 * 60)) * 100}%` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-accent-red" />
                      <div className="flex-1 h-0.5 bg-accent-red" />
                    </div>
                  </div>
                )}

                {/* Timed events (with overlap stacking + resize handles) */}
                {(() => {
                  const layout = calculateEventLayout(timedEvents);
                  return timedEvents.map((event) => {
                    // If resizing this event, compute adjusted style
                    let style = getEventStyle(event);
                    if (!style) return null;

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
                    const hasConflict = totalCols > 1;

                    return (
                      <div
                        key={event.id}
                        className={`absolute rounded-button text-left overflow-hidden text-white text-xs shadow-sm z-20 group/event ${isBeingResized ? 'ring-2 ring-white/50' : ''}`}
                        style={{
                          ...style,
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: getEventDisplayColor(event),
                        }}
                        title={`${event.startTime} - ${event.endTime || ''}: ${event.title}`}
                      >
                        {/* Top resize handle */}
                        {onEventTimeChange && event.startTime && event.endTime && (
                          <div
                            className="absolute top-0 left-0 right-0 h-1.5 cursor-n-resize opacity-0 group-hover/event:opacity-100 bg-white/30 rounded-t-button z-30"
                            onMouseDown={(e) => handleResizeStart(e, event.id, dateKey, 'top', event.startTime!, event.endTime!)}
                          />
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event, dateKey);
                          }}
                          className="w-full h-full px-1 py-0.5 text-left hover:opacity-90 transition-all duration-standard ease-smooth"
                        >
                          <div className="font-medium truncate flex items-center gap-0.5">
                            {event.title}
                            {hasConflict && <AlertCircle className="w-2.5 h-2.5 text-amber-300 flex-shrink-0" />}
                          </div>
                          {event.startTime && (
                            <div className="text-xs opacity-90">
                              {event.startTime} {event.endTime && `- ${event.endTime}`}
                            </div>
                          )}
                        </button>

                        {/* Bottom resize handle */}
                        {onEventTimeChange && event.startTime && event.endTime && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize opacity-0 group-hover/event:opacity-100 bg-white/30 rounded-b-button z-30"
                            onMouseDown={(e) => handleResizeStart(e, event.id, dateKey, 'bottom', event.startTime!, event.endTime!)}
                          />
                        )}
                      </div>
                    );
                  });
                })()}

                {/* All-day events (floating at top) */}
                {allDayEvents.length > 0 && (
                  <div className="absolute top-0 left-0 right-0 p-1 space-y-1 bg-surface-light-elevated dark:bg-surface-dark-elevated z-30">
                    {allDayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event, dateKey);
                        }}
                        className="w-full text-left text-xs px-2 py-1 rounded-button text-white hover:opacity-90 transition-all duration-standard ease-smooth truncate"
                        style={{ backgroundColor: getEventDisplayColor(event) }}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick event creation */}
                {quickCreate?.dateKey === dateKey && (() => {
                  const st = quickCreate.startTime ?? `${quickCreate.hour.toString().padStart(2, '0')}:00`;
                  const et = quickCreate.endTime;
                  // Calculate position from startTime
                  const [sH, sM] = st.split(':').map(Number);
                  const startTotal = sH * 60 + sM;
                  let durationMin = 60; // default 1 hour
                  if (et) {
                    const [eH, eM] = et.split(':').map(Number);
                    durationMin = Math.max((eH * 60 + eM) - startTotal, 15);
                  }
                  return (
                    <QuickEventCreate
                      dateKey={dateKey}
                      startTime={st}
                      endTime={et}
                      onClose={() => setQuickCreate(null)}
                      style={{
                        top: `${startTotal}px`,
                        height: `${durationMin}px`,
                      }}
                    />
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
