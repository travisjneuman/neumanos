/**
 * LinkedEventsPanel Component
 *
 * Displays calendar events linked to the current note.
 * Shows event title, date, time, and color. Click navigates to the calendar date.
 * Part of Wave 5D: Calendar-Notes bidirectional linking.
 */

import { useMemo, useState } from 'react';
import { Calendar, ChevronRight, ChevronDown, X, Clock } from 'lucide-react';
import { useNotesStore } from '../../stores/useNotesStore';
import { useCalendarStore } from '../../stores/useCalendarStore';
import type { CalendarEvent } from '../../types';

interface LinkedEventsPanelProps {
  noteId: string;
}

interface ResolvedEvent {
  event: CalendarEvent;
  dateKey: string;
}

export function LinkedEventsPanel({ noteId }: LinkedEventsPanelProps) {
  const note = useNotesStore((state) => state.notes[noteId]);
  const { events, setCurrentDate, setViewMode } = useCalendarStore();
  const { unlinkEventFromNote } = useNotesStore();
  const { unlinkNoteFromEvent } = useCalendarStore();
  const [isExpanded, setIsExpanded] = useState(true);

  // Resolve event IDs to actual events with their date keys
  const resolvedEvents = useMemo((): ResolvedEvent[] => {
    if (!note?.linkedEventIds?.length) return [];

    const result: ResolvedEvent[] = [];
    const linkedIds = new Set(note.linkedEventIds);

    for (const [dateKey, dayEvents] of Object.entries(events)) {
      for (const event of dayEvents) {
        if (linkedIds.has(event.id)) {
          result.push({ event, dateKey });
          linkedIds.delete(event.id);
        }
        if (linkedIds.size === 0) break;
      }
      if (linkedIds.size === 0) break;
    }

    // Sort by date
    result.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return result;
  }, [note?.linkedEventIds, events]);

  if (!note?.linkedEventIds?.length) return null;
  if (resolvedEvents.length === 0) return null;

  const handleNavigateToEvent = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    setCurrentDate(new Date(year, month - 1, day));
    setViewMode('daily');
  };

  const handleUnlink = (eventId: string) => {
    unlinkEventFromNote(noteId, eventId);
    unlinkNoteFromEvent(eventId, noteId);
  };

  const formatDate = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="border-t border-border-light dark:border-border-dark">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        <Calendar className="w-3.5 h-3.5 text-accent-primary" />
        <span>Linked Events ({resolvedEvents.length})</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 space-y-1">
          {resolvedEvents.map(({ event, dateKey }) => (
            <div
              key={event.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            >
              <button
                onClick={() => handleNavigateToEvent(dateKey)}
                className="flex-1 min-w-0 text-left flex items-start gap-2"
              >
                <div
                  className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                  style={{
                    backgroundColor: event.colorCategory
                      ? undefined
                      : '#3b82f6',
                  }}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                    {event.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
                    <span>{formatDate(dateKey)}</span>
                    {event.startTime && (
                      <>
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {event.startTime}
                          {event.endTime ? ` - ${event.endTime}` : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleUnlink(event.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-status-error text-text-light-secondary dark:text-text-dark-secondary transition-all"
                aria-label={`Unlink ${event.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
