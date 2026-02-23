import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CalendarState, ViewMode, CalendarEvent, UserCalendar, ICSSubscription } from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';
import { scheduleEventReminders, cancelEventReminders } from '../services/eventReminders';
import { useProjectContextStore, matchesProjectFilter } from './useProjectContextStore';
import { useActivityStore } from './useActivityStore';

const DEFAULT_CALENDARS: UserCalendar[] = [
  { id: 'cal-work', name: 'Work', color: '#2563eb', visible: true },
  { id: 'cal-personal', name: 'Personal', color: '#059669', visible: true },
  { id: 'cal-birthdays', name: 'Birthdays', color: '#d97706', visible: true },
];

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
  // Multi-calendar management
  addCalendar: (name: string, color: string) => void;
  updateCalendar: (id: string, updates: Partial<Pick<UserCalendar, 'name' | 'color' | 'visible'>>) => void;
  deleteCalendar: (id: string) => void;
  toggleCalendarVisibility: (id: string) => void;
  // ICS Subscriptions
  addICSSubscription: (name: string, url: string, color: string, autoSyncMinutes: number) => void;
  updateICSSubscription: (id: string, updates: Partial<Pick<ICSSubscription, 'name' | 'url' | 'color' | 'autoSyncMinutes' | 'enabled'>>) => void;
  removeICSSubscription: (id: string) => void;
  syncICSSubscription: (id: string, parsedEvents: (CalendarEvent & { _importedDate?: string })[]) => number;
  // Calendar-Notes bidirectional linking
  linkNoteToEvent: (eventId: string, noteId: string) => void;
  unlinkNoteFromEvent: (eventId: string, noteId: string) => void;
  getLinkedNotes: (eventId: string) => string[];
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      // Initial state
      events: {},
      viewMode: 'monthly',
      currentDate: new Date(),
      calendars: DEFAULT_CALENDARS,
      icsSubscriptions: [],

      // Actions
      setViewMode: (mode) => set({ viewMode: mode }),

      setCurrentDate: (date) => set({ currentDate: date }),

      addEvent: (dateKey, title, description, timeData) => {
        const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          title,
          description,
          projectIds: [],
          ...timeData,
        };
        set((state) => {
          const existingEvents = state.events[dateKey] || [];

          // Schedule reminders for the new event
          scheduleEventReminders(newEvent, dateKey);

          return {
            events: {
              ...state.events,
              [dateKey]: [...existingEvents, newEvent],
            },
          };
        });
        useActivityStore.getState().logActivity({
          type: 'created',
          module: 'calendar',
          entityId: newEvent.id,
          entityTitle: title,
        });
      },

      updateEvent: (dateKey, eventId, title, description, timeData) => {
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
        });
        useActivityStore.getState().logActivity({
          type: 'updated',
          module: 'calendar',
          entityId: eventId,
          entityTitle: title,
        });
      },

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

      deleteEvent: (dateKey, eventId) => {
        const events = get().events[dateKey] || [];
        const eventToDelete = events.find((e) => e.id === eventId);
        set((state) => {
          const dateEvents = state.events[dateKey] || [];

          // Cancel reminders for the deleted event
          cancelEventReminders(eventId);

          const filteredEvents = dateEvents.filter((event) => event.id !== eventId);

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
        });
        useActivityStore.getState().logActivity({
          type: 'deleted',
          module: 'calendar',
          entityId: eventId,
          entityTitle: eventToDelete?.title || 'Calendar Event',
        });
      },

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
        const { events, calendars } = get();

        // Build set of hidden calendar IDs
        const hiddenCalendarIds = new Set(
          calendars.filter(c => !c.visible).map(c => c.id)
        );

        // "All" mode - no project filter (matchesProjectFilter handles empty activeProjectIds)
        const applyProjectFilter = activeProjectIds.length > 0;

        const filtered: Record<string, CalendarEvent[]> = {};
        Object.entries(events).forEach(([dateKey, dateEvents]) => {
          const matchingEvents = dateEvents.filter((event: CalendarEvent) => {
            // Calendar visibility filter
            if (event.calendarId && hiddenCalendarIds.has(event.calendarId)) {
              return false;
            }
            // Project filter
            if (applyProjectFilter && !matchesProjectFilter(event.projectIds, activeProjectIds)) {
              return false;
            }
            return true;
          });
          if (matchingEvents.length > 0) {
            filtered[dateKey] = matchingEvents;
          }
        });

        return filtered;
      },

      // Multi-calendar management
      addCalendar: (name, color) =>
        set((state) => ({
          calendars: [...state.calendars, {
            id: `cal-${Date.now()}`,
            name,
            color,
            visible: true,
          }],
        })),

      updateCalendar: (id, updates) =>
        set((state) => ({
          calendars: state.calendars.map(cal =>
            cal.id === id ? { ...cal, ...updates } : cal
          ),
        })),

      deleteCalendar: (id) =>
        set((state) => ({
          calendars: state.calendars.filter(cal => cal.id !== id),
        })),

      toggleCalendarVisibility: (id) =>
        set((state) => ({
          calendars: state.calendars.map(cal =>
            cal.id === id ? { ...cal, visible: !cal.visible } : cal
          ),
        })),

      // ICS Subscriptions
      addICSSubscription: (name, url, color, autoSyncMinutes) =>
        set((state) => ({
          icsSubscriptions: [...state.icsSubscriptions, {
            id: `ics-${Date.now()}`,
            name,
            url,
            color,
            autoSyncMinutes,
            enabled: true,
          }],
        })),

      updateICSSubscription: (id, updates) =>
        set((state) => ({
          icsSubscriptions: state.icsSubscriptions.map(sub =>
            sub.id === id ? { ...sub, ...updates } : sub
          ),
        })),

      removeICSSubscription: (id) =>
        set((state) => {
          // Remove all events from this subscription
          const newEvents: Record<string, CalendarEvent[]> = {};
          Object.entries(state.events).forEach(([dateKey, dayEvents]) => {
            const filtered = dayEvents.filter(e => e.externalSource !== id);
            if (filtered.length > 0) {
              newEvents[dateKey] = filtered;
            }
          });
          return {
            icsSubscriptions: state.icsSubscriptions.filter(sub => sub.id !== id),
            events: newEvents,
          };
        }),

      // Calendar-Notes bidirectional linking
      linkNoteToEvent: (eventId, noteId) =>
        set((state) => {
          const newEvents = { ...state.events };
          for (const dateKey of Object.keys(newEvents)) {
            const dayEvents = newEvents[dateKey];
            const idx = dayEvents.findIndex((e) => e.id === eventId);
            if (idx !== -1) {
              const event = dayEvents[idx];
              const existing = event.linkedNoteIds ?? [];
              if (!existing.includes(noteId)) {
                newEvents[dateKey] = dayEvents.map((e, i) =>
                  i === idx ? { ...e, linkedNoteIds: [...existing, noteId] } : e
                );
              }
              break;
            }
          }
          return { events: newEvents };
        }),

      unlinkNoteFromEvent: (eventId, noteId) =>
        set((state) => {
          const newEvents = { ...state.events };
          for (const dateKey of Object.keys(newEvents)) {
            const dayEvents = newEvents[dateKey];
            const idx = dayEvents.findIndex((e) => e.id === eventId);
            if (idx !== -1) {
              const event = dayEvents[idx];
              const filtered = (event.linkedNoteIds ?? []).filter((id) => id !== noteId);
              newEvents[dateKey] = dayEvents.map((e, i) =>
                i === idx ? { ...e, linkedNoteIds: filtered.length > 0 ? filtered : undefined } : e
              );
              break;
            }
          }
          return { events: newEvents };
        }),

      getLinkedNotes: (eventId) => {
        const { events } = get();
        for (const dateKey of Object.keys(events)) {
          const event = events[dateKey].find((e) => e.id === eventId);
          if (event) {
            return event.linkedNoteIds ?? [];
          }
        }
        return [];
      },

      syncICSSubscription: (id, parsedEvents) => {
        let count = 0;
        set((state) => {
          // Remove old events from this subscription
          const newEvents: Record<string, CalendarEvent[]> = {};
          Object.entries(state.events).forEach(([dateKey, dayEvents]) => {
            const filtered = dayEvents.filter(e => e.externalSource !== id);
            if (filtered.length > 0) {
              newEvents[dateKey] = filtered;
            }
          });

          // Add fresh events
          parsedEvents.forEach((event) => {
            const dateKey = (event as CalendarEvent & { _importedDate?: string })._importedDate;
            if (!dateKey) return;

            const cleanEvent: CalendarEvent = {
              id: `${id}-${event.id}`,
              title: event.title,
              description: event.description,
              startTime: event.startTime,
              endTime: event.endTime,
              isAllDay: event.isAllDay,
              location: event.location,
              externalSource: id,
              projectIds: [],
            };

            if (!newEvents[dateKey]) {
              newEvents[dateKey] = [];
            }
            newEvents[dateKey].push(cleanEvent);
            count++;
          });

          // Update last synced timestamp
          const updatedSubs = state.icsSubscriptions.map(sub =>
            sub.id === id ? { ...sub, lastSyncedAt: new Date().toISOString() } : sub
          );

          return { events: newEvents, icsSubscriptions: updatedSubs };
        });
        return count;
      },
    }),
    {
      name: 'calendar-events',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 2, // v2: Add multi-calendar + ICS subscriptions
      // Only persist these fields
      partialize: (state) => ({
        events: state.events,
        viewMode: state.viewMode,
        calendars: state.calendars,
        icsSubscriptions: state.icsSubscriptions,
      }),
      migrate: (persistedState: unknown, version: number) => {
        let state = persistedState as Record<string, unknown>;

        // Version 0 -> 1: Add projectIds field to all events
        if (version < 1 && state.events) {
          console.log('[CalendarStore] Adding projectIds field to all events');
          const updatedEvents: Record<string, CalendarEvent[]> = {};
          const eventEntries = Object.entries(state.events as Record<string, unknown[]>) as [string, Record<string, unknown>[]][];
          eventEntries.forEach(([dateKey, events]) => {
            updatedEvents[dateKey] = events.map((event) => ({
              ...event,
              projectIds: (event as Record<string, unknown>).projectIds ?? [],
            })) as CalendarEvent[];
          });
          state = {
            ...state,
            events: updatedEvents,
          };
        }

        // Version 1 -> 2: Add calendars and icsSubscriptions
        if (version < 2) {
          console.log('[CalendarStore] Adding calendars and ICS subscriptions');
          state = {
            ...state,
            calendars: (state as Record<string, unknown>).calendars ?? DEFAULT_CALENDARS,
            icsSubscriptions: (state as Record<string, unknown>).icsSubscriptions ?? [],
          };
        }

        return state;
      },
    }
  )
);
