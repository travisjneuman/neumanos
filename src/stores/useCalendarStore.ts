import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CalendarState, ViewMode, CalendarEvent } from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';
import { scheduleEventReminders, cancelEventReminders } from '../services/eventReminders';
import { useProjectContextStore, matchesProjectFilter } from './useProjectContextStore';

interface CalendarStore extends CalendarState {
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  addEvent: (dateKey: string, title: string, description?: string, timeData?: Partial<CalendarEvent>) => void;
  updateEvent: (dateKey: string, eventId: string, title: string, description?: string, timeData?: Partial<CalendarEvent>) => void;
  /** Update only the time of an event (for time blocking drag-drop) */
  updateEventTime: (dateKey: string, eventId: string, startTime: string, endTime: string) => void;
  deleteEvent: (dateKey: string, eventId: string) => void;
  removeAllEvents: (dateKey: string) => void;
  createEventException: (dateKey: string, recurrenceId: string, updates: Partial<CalendarEvent>) => void;
  updateRecurringSeries: (recurrenceId: string, updates: Partial<CalendarEvent>) => void;
  deleteRecurringSeries: (recurrenceId: string) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  // ICS Import/Export
  importEvents: (events: (CalendarEvent & { _importedDate?: string })[]) => number;
  // Project context filtering
  getFilteredEvents: () => Record<string, CalendarEvent[]>;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      // Initial state
      events: {},
      viewMode: 'monthly',
      currentDate: new Date(),

      // Actions
      setViewMode: (mode) => set({ viewMode: mode }),

      setCurrentDate: (date) => set({ currentDate: date }),

      addEvent: (dateKey, title, description, timeData) =>
        set((state) => {
          const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title,
            description,
            projectIds: [],
            ...timeData,
          };
          const existingEvents = state.events[dateKey] || [];

          // Schedule reminders for the new event
          scheduleEventReminders(newEvent, dateKey);

          return {
            events: {
              ...state.events,
              [dateKey]: [...existingEvents, newEvent],
            },
          };
        }),

      updateEvent: (dateKey, eventId, title, description, timeData) =>
        set((state) => {
          const events = state.events[dateKey] || [];

          // Cancel existing reminders for this event
          cancelEventReminders(eventId);

          // Update event and reschedule reminders
          const updatedEvents = events.map((event) => {
            if (event.id === eventId) {
              const updatedEvent = { ...event, title, description, ...timeData };
              // Reschedule reminders with new data
              scheduleEventReminders(updatedEvent, dateKey);
              return updatedEvent;
            }
            return event;
          });

          return {
            events: {
              ...state.events,
              [dateKey]: updatedEvents,
            },
          };
        }),

      // Update only time (optimized for time blocking drag-drop)
      updateEventTime: (dateKey, eventId, startTime, endTime) =>
        set((state) => {
          const events = state.events[dateKey] || [];

          // Cancel existing reminders for this event
          cancelEventReminders(eventId);

          // Update event time and reschedule reminders
          const updatedEvents = events.map((event) => {
            if (event.id === eventId) {
              const updatedEvent = { ...event, startTime, endTime };
              // Reschedule reminders with new time
              scheduleEventReminders(updatedEvent, dateKey);
              return updatedEvent;
            }
            return event;
          });

          return {
            events: {
              ...state.events,
              [dateKey]: updatedEvents,
            },
          };
        }),

      deleteEvent: (dateKey, eventId) =>
        set((state) => {
          const events = state.events[dateKey] || [];

          // Cancel reminders for the deleted event
          cancelEventReminders(eventId);

          const filteredEvents = events.filter((event) => event.id !== eventId);

          if (filteredEvents.length === 0) {
            // Remove the date key if no events left
            const newEvents = { ...state.events };
            delete newEvents[dateKey];
            return { events: newEvents };
          }

          return {
            events: {
              ...state.events,
              [dateKey]: filteredEvents,
            },
          };
        }),

      removeAllEvents: (dateKey) =>
        set((state) => {
          const newEvents = { ...state.events };
          delete newEvents[dateKey];
          return { events: newEvents };
        }),

      // Create exception for single recurring event instance
      createEventException: (dateKey, recurrenceId, updates) =>
        set((state) => {
          const existingEvents = state.events[dateKey] || [];
          const newEvent: CalendarEvent = {
            id: `${recurrenceId}-exception-${Date.now()}`,
            title: updates.title || 'Untitled',
            recurrenceId,
            recurrenceException: true,
            projectIds: [],
            ...updates,
          };

          // Schedule reminders for the exception event
          scheduleEventReminders(newEvent, dateKey);

          return {
            events: {
              ...state.events,
              [dateKey]: [...existingEvents, newEvent],
            },
          };
        }),

      // Update all events in a recurring series
      updateRecurringSeries: (recurrenceId, updates) =>
        set((state) => {
          // Cancel all reminders for this recurring series
          cancelEventReminders(recurrenceId);

          const newEvents = { ...state.events };
          Object.entries(newEvents).forEach(([dateKey, events]) => {
            newEvents[dateKey] = events.map((event) => {
              if (event.id === recurrenceId) {
                const updatedEvent = { ...event, ...updates };
                // Reschedule reminders for each instance
                scheduleEventReminders(updatedEvent, dateKey);
                return updatedEvent;
              }
              return event;
            });
          });
          return { events: newEvents };
        }),

      // Delete all events in a recurring series
      deleteRecurringSeries: (recurrenceId) =>
        set((state) => {
          // Cancel all reminders for this recurring series
          cancelEventReminders(recurrenceId);

          const newEvents = { ...state.events };
          Object.entries(newEvents).forEach(([dateKey, events]) => {
            const filtered = events.filter((event) => event.id !== recurrenceId);
            if (filtered.length === 0) {
              delete newEvents[dateKey];
            } else {
              newEvents[dateKey] = filtered;
            }
          });
          return { events: newEvents };
        }),

      nextPeriod: () =>
        set((state) => {
          const newDate = new Date(state.currentDate);
          if (state.viewMode === 'daily') {
            newDate.setDate(newDate.getDate() + 1);
          } else if (state.viewMode === 'weekly') {
            newDate.setDate(newDate.getDate() + 7);
          } else if (state.viewMode === 'agenda') {
            newDate.setDate(newDate.getDate() + 14);
          } else {
            newDate.setMonth(newDate.getMonth() + 1);
          }
          return { currentDate: newDate };
        }),

      prevPeriod: () =>
        set((state) => {
          const newDate = new Date(state.currentDate);
          if (state.viewMode === 'daily') {
            newDate.setDate(newDate.getDate() - 1);
          } else if (state.viewMode === 'weekly') {
            newDate.setDate(newDate.getDate() - 7);
          } else if (state.viewMode === 'agenda') {
            newDate.setDate(newDate.getDate() - 14);
          } else {
            newDate.setMonth(newDate.getMonth() - 1);
          }
          return { currentDate: newDate };
        }),

      // ICS Import - add imported events to the calendar
      importEvents: (importedEvents) => {
        let count = 0;
        set((state) => {
          const newEvents = { ...state.events };

          importedEvents.forEach((event) => {
            // Get the date key from _importedDate metadata
            const dateKey = (event as any)._importedDate;
            if (!dateKey) return;

            // Create clean event without metadata
            const cleanEvent: CalendarEvent = {
              id: event.id,
              title: event.title,
              description: event.description,
              startTime: event.startTime,
              endTime: event.endTime,
              isAllDay: event.isAllDay,
              recurrence: event.recurrence,
              endDate: event.endDate,
              location: event.location,
              reminders: event.reminders,
              colorCategory: event.colorCategory,
              projectIds: event.projectIds ?? [],
            };

            // Add to events for this date
            if (!newEvents[dateKey]) {
              newEvents[dateKey] = [];
            }
            newEvents[dateKey].push(cleanEvent);
            count++;
          });

          return { events: newEvents };
        });
        return count;
      },

      // Project context filtering
      getFilteredEvents: (): Record<string, CalendarEvent[]> => {
        const { activeProjectIds } = useProjectContextStore.getState();
        const { events } = get();

        // "All" mode - no filter applied (matchesProjectFilter handles empty activeProjectIds)
        if (activeProjectIds.length === 0) return events;

        // Filter events using centralized project filter utility
        const filtered: Record<string, CalendarEvent[]> = {};
        Object.entries(events).forEach(([dateKey, dateEvents]) => {
          const matchingEvents = dateEvents.filter((event: CalendarEvent) =>
            matchesProjectFilter(event.projectIds, activeProjectIds)
          );
          if (matchingEvents.length > 0) {
            filtered[dateKey] = matchingEvents;
          }
        });

        return filtered;
      },
    }),
    {
      name: 'calendar-events',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1, // v1: Add projectIds for global project context filter
      // Only persist these fields
      partialize: (state) => ({
        events: state.events,
        viewMode: state.viewMode,
      }),
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as any;

        // Version 0 -> 1: Add projectIds field to all events
        if (version < 1 && state.events) {
          console.log('[CalendarStore] Adding projectIds field to all events');
          const updatedEvents: Record<string, CalendarEvent[]> = {};
          const eventEntries = Object.entries(state.events) as [string, any[]][];
          eventEntries.forEach(([dateKey, events]) => {
            updatedEvents[dateKey] = events.map((event: any) => ({
              ...event,
              projectIds: event.projectIds ?? [],
            }));
          });
          state = {
            ...state,
            events: updatedEvents,
          };
        }

        return state;
      },
    }
  )
);
