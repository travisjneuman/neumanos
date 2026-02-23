import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Clock, Eye, EyeOff, Search } from 'lucide-react';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { formatDuration } from '../utils/timeFormatters';
import { getStandardDateKey } from '../utils/dateUtils';
import { generateRecurringInstances, expandMultiDayEvent } from '../utils/recurrence';
import { exportToICS, importFromICS, downloadICS, readICSFile } from '../services/icsImportExport';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AgendaView } from './AgendaView';
import { DayDetailModal } from './DayDetailModal';
import { MiniCalendar } from './MiniCalendar';
import { MonthlyCalendarGrid } from './shared/MonthlyCalendarGrid';
import { CalendarHeader } from './shared/CalendarHeader';
import { CalendarLayersSidebar } from './calendar/CalendarLayersSidebar';
import { EVENT_COLOR_CATEGORIES } from '../utils/eventColors';
import type { TimeEntry, CalendarEvent, ViewMode, Task, EventColorCategory } from '../types';

interface TimeEntryCalendarProps {
  onEditEntry?: (entry: TimeEntry) => void;
  onCreateEvent?: (dateKey: string) => void;
  onEditEvent?: (event: CalendarEvent, dateKey: string) => void;
}

/**
 * TimeEntryCalendar Component (UNIFIED)
 * Full calendar view showing time entries AND calendar events
 * Supports 4 view modes: Monthly, Weekly, Daily, Agenda/List
 * Migrated all functionality from Planning Calendar Widget
 */
export function TimeEntryCalendar({ onEditEntry, onCreateEvent, onEditEvent }: TimeEntryCalendarProps) {
  const { entries, projects, loadEntries, loadProjects } = useTimeTrackingStore();
  const { events, importEvents, calendars, toggleCalendarVisibility, updateEventTime } = useCalendarStore();
  const { tasks } = useKanbanStore();

  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dayDetailModal, setDayDetailModal] = useState<{ dateKey: string; events: CalendarEvent[]; tasks: Task[]; timeEntries: TimeEntry[]; totalDuration: number } | null>(null);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const miniCalendarRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [activeCategories, setActiveCategories] = useState<Set<EventColorCategory>>(new Set());

  // Group tasks by their due date (convert ISO date to standard date key)
  const tasksByDate = useMemo(() => {
    const result: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.dueDate && task.status !== 'done') {
        // Convert YYYY-MM-DD to YYYY-M-D standard format
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const dateKey = `${year}-${month}-${day}`;
        if (!result[dateKey]) result[dateKey] = [];
        result[dateKey].push(task);
      }
    });
    return result;
  }, [tasks]);

  // Handle ICS export
  const handleExport = () => {
    const result = exportToICS(events);
    if (result.success && result.data) {
      const filename = `calendar-${new Date().toISOString().split('T')[0]}.ics`;
      downloadICS(result.data, filename);
    } else {
      setImportStatus({ message: result.error || 'Export failed', type: 'error' });
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  // Handle ICS import
  const handleImport = async (file: File) => {
    try {
      const icsContent = await readICSFile(file);
      const result = importFromICS(icsContent);

      if (result.success && result.events) {
        const count = importEvents(result.events);
        setImportStatus({ message: `Imported ${count} calendar ${count === 1 ? 'event' : 'events'}`, type: 'success' });
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus({ message: result.error || 'Import failed', type: 'error' });
        setTimeout(() => setImportStatus(null), 5000);
      }
    } catch (error) {
      setImportStatus({ message: String(error), type: 'error' });
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load entries for the entire month (or more for weekly/agenda views)
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        await Promise.all([
          loadEntries({
            dateRange: 'custom',
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString(),
            projectIds: [],
            tags: [],
            searchQuery: ''
          }),
          loadProjects()
        ]);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadEntries, loadProjects, year, month]);

  const handlePrevious = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'weekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (viewMode === 'daily') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
    // Agenda view doesn't have prev/next (it's always forward-looking)
  };

  const handleNext = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'weekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (viewMode === 'daily') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrint = () => {
    window.print();
  };

  // Expand recurring and multi-day events for current month
  // NOTE: Must be called before early return to maintain consistent hook order
  const expandedEvents = useMemo(() => {
    const result: Record<string, CalendarEvent[]> = {};

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // Debug: Count events with recurrence
    let recurringEventCount = 0;
    Object.entries(events).forEach(([_, dayEvents]) => {
      dayEvents.forEach((event) => {
        if (event.recurrence) recurringEventCount++;
      });
    });

    if (import.meta.env.DEV) {
      console.log('[ExpandedEvents Debug]', {
        month: `${year}-${month + 1}`,
        totalEventsInStore: Object.keys(events).length,
        totalRecurringEvents: recurringEventCount,
        viewRange: `${monthStart.toISOString().split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}`
      });
    }

    Object.entries(events).forEach(([dateKey, dayEvents]) => {
      dayEvents.forEach((event) => {
        if (event.recurrence) {
          // Generate recurring instances for this month
          const instances = generateRecurringInstances(event, dateKey, monthStart, monthEnd);
          if (import.meta.env.DEV && instances.length > 0) {
            console.log('[ExpandedEvents Debug] Generated instances for', event.title, ':', instances.length);
          }
          instances.forEach(({ date, event: instanceEvent }) => {
            // Also expand multi-day for each recurring instance
            const multiDayInstances = expandMultiDayEvent(instanceEvent, date);
            // Map.forEach signature: (value, key, map) - note VALUE comes first!
            multiDayInstances.forEach((multiDayEvent, multiDayDate) => {
              if (!result[multiDayDate]) result[multiDayDate] = [];
              result[multiDayDate].push(multiDayEvent);
              if (import.meta.env.DEV) {
                console.log('[ExpandedEvents Debug] Added instance to', multiDayDate, ':', multiDayEvent.title);
              }
            });
          });
        } else {
          // Non-recurring event - check if multi-day
          const multiDayInstances = expandMultiDayEvent(event, dateKey);
          multiDayInstances.forEach((multiDayEvent, multiDayDate) => {
            if (!result[multiDayDate]) result[multiDayDate] = [];
            result[multiDayDate].push(multiDayEvent);
          });
        }
      });
    });

    const totalExpandedEvents = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    if (import.meta.env.DEV) {
      console.log('[ExpandedEvents Debug] Result:', {
        datesWithEvents: Object.keys(result).length,
        totalExpandedEvents
      });
    }

    return result;
  }, [events, year, month]);

  // Build set of hidden calendar IDs for filtering
  const hiddenCalendarIds = useMemo(() => {
    return new Set(calendars.filter(c => !c.visible).map(c => c.id));
  }, [calendars]);

  // Apply search, category, and calendar filters to expanded events
  const filteredEvents = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;
    const hasCategories = activeCategories.size > 0;
    const hasHiddenCalendars = hiddenCalendarIds.size > 0;

    if (!hasSearch && !hasCategories && !hasHiddenCalendars) return expandedEvents;

    const lowerSearch = searchQuery.trim().toLowerCase();
    const result: Record<string, CalendarEvent[]> = {};

    Object.entries(expandedEvents).forEach(([dateKey, dayEvents]) => {
      const filtered = dayEvents.filter((event) => {
        // Calendar visibility filter
        if (hasHiddenCalendars && event.calendarId && hiddenCalendarIds.has(event.calendarId)) {
          return false;
        }
        // Search filter
        if (hasSearch && !event.title.toLowerCase().includes(lowerSearch)) {
          return false;
        }
        // Category filter
        if (hasCategories) {
          const eventCat = event.colorCategory || 'default';
          if (!activeCategories.has(eventCat)) return false;
        }
        return true;
      });
      if (filtered.length > 0) {
        result[dateKey] = filtered;
      }
    });

    return result;
  }, [expandedEvents, searchQuery, activeCategories, hiddenCalendarIds]);

  // Search results for dropdown (max 10 results across all dates)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerSearch = searchQuery.trim().toLowerCase();
    const results: { event: CalendarEvent; dateKey: string }[] = [];

    Object.entries(expandedEvents).forEach(([dateKey, dayEvents]) => {
      dayEvents.forEach((event) => {
        if (
          event.title.toLowerCase().includes(lowerSearch) ||
          event.description?.toLowerCase().includes(lowerSearch) ||
          event.location?.toLowerCase().includes(lowerSearch)
        ) {
          results.push({ event, dateKey });
        }
      });
    });

    // Sort by date key
    results.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    return results.slice(0, 10);
  }, [expandedEvents, searchQuery]);

  // Close search results dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle event time change from resize handles
  const handleEventTimeChange = useCallback((dateKey: string, eventId: string, newStartTime: string, newEndTime: string) => {
    updateEventTime(dateKey, eventId, newStartTime, newEndTime);
  }, [updateEventTime]);

  // Navigate to a search result date
  const navigateToSearchResult = useCallback((dateKey: string) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    setCurrentDate(new Date(y, m - 1, d));
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  // Group entries by date (ISO format for time entry lookups)
  // NOTE: Must be called before early return to maintain consistent hook order
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    entries.forEach(entry => {
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      if (!map.has(date)) {
        map.set(date, []);
      }
      map.get(date)!.push(entry);
    });
    return map;
  }, [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-text-light-secondary dark:text-text-dark-secondary">
          Loading calendar...
        </div>
      </div>
    );
  }

  // Get display text for current period
  const getDisplayText = () => {
    if (viewMode === 'monthly') {
      return new Date(year, month, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } else if (viewMode === 'weekly') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else if (viewMode === 'daily') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } else {
      // Agenda
      return 'Upcoming Events';
    }
  };

  const handleDayClick = (dateKey: string) => {
    // Click on a day opens the DayDetailModal
    const dayEvents = filteredEvents[dateKey] || [];
    const dayTasks = tasksByDate[dateKey] || [];

    // Get time entries for this day (need to convert dateKey to ISO format)
    const [year, month, day] = dateKey.split('-').map(Number);
    const isoDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const dayEntries = entriesByDate.get(isoDateStr) || [];
    const totalDuration = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);

    // If no content, go straight to create event modal
    if (dayEvents.length === 0 && dayTasks.length === 0 && dayEntries.length === 0) {
      if (onCreateEvent) {
        onCreateEvent(dateKey);
      }
    } else {
      // Show modal with all events, tasks, and time entries for this day
      setDayDetailModal({ dateKey, events: dayEvents, tasks: dayTasks, timeEntries: dayEntries, totalDuration });
    }
  };

  const handleEventClick = (event: CalendarEvent, dateKey: string) => {
    if (onEditEvent) {
      onEditEvent(event, dateKey);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header - Using shared CalendarHeader component */}
      <CalendarHeader
        displayText={getDisplayText()}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        showNavigation={viewMode !== 'agenda'}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreate={onCreateEvent ? () => onCreateEvent(getStandardDateKey(new Date())) : undefined}
        createButtonText="New Event"
        onPrint={handlePrint}
        onExport={handleExport}
        onImport={handleImport}
        statusMessage={importStatus && (
          <span className={`text-xs px-2 py-1 rounded ${
            importStatus.type === 'success'
              ? 'bg-status-success/20 text-status-success'
              : 'bg-status-error/20 text-status-error'
          }`}>
            {importStatus.message}
          </span>
        )}
      />

      {/* Search, Filter & Mini Calendar Row */}
      <div className="flex items-center gap-3 flex-wrap bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark px-4 py-3">
        {/* Mini Calendar Toggle */}
        <div className="relative" ref={miniCalendarRef}>
          <button
            onClick={() => setShowMiniCalendar(!showMiniCalendar)}
            className={`px-3 py-1.5 text-xs font-medium rounded-button border transition-all duration-standard ease-smooth ${
              showMiniCalendar
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'bg-surface-light-elevated dark:bg-surface-dark-elevated border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            Mini Cal
          </button>
          {showMiniCalendar && (
            <div className="absolute top-full left-0 mt-1 z-40">
              <MiniCalendar
                currentDate={currentDate}
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  setShowMiniCalendar(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Search Bar with Results Dropdown */}
        <div className="flex-1 min-w-[160px] max-w-xs relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-light-tertiary dark:text-text-dark-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchResults(true);
              }}
              placeholder="Search events..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-tertiary dark:placeholder-text-dark-tertiary"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button shadow-lg z-50 max-h-64 overflow-y-auto">
              {searchResults.map(({ event, dateKey }) => {
                const [y, m, d] = dateKey.split('-').map(Number);
                const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                return (
                  <button
                    key={`${event.id}-${dateKey}`}
                    onClick={() => navigateToSearchResult(dateKey)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors border-b border-border-light/50 dark:border-border-dark/50 last:border-b-0"
                  >
                    <div className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {event.title}
                    </div>
                    <div className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary flex items-center gap-2">
                      <span>{dateStr}</span>
                      {event.startTime && <span>{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</span>}
                      {event.location && <span className="truncate">@ {event.location}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button shadow-lg z-50 p-3">
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary text-center">
                No events found
              </p>
            </div>
          )}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {EVENT_COLOR_CATEGORIES.map((cat) => {
            const isActive = activeCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategories((prev) => {
                    const next = new Set(prev);
                    if (next.has(cat.id)) {
                      next.delete(cat.id);
                    } else {
                      next.add(cat.id);
                    }
                    return next;
                  });
                }}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all duration-standard ease-smooth ${
                  isActive
                    ? 'text-white ring-1 ring-offset-1 ring-white/50'
                    : 'opacity-40 hover:opacity-70'
                }`}
                style={{ backgroundColor: cat.hex, color: '#fff' }}
                title={`${isActive ? 'Hide' : 'Show'} ${cat.label} events`}
              >
                {cat.label}
              </button>
            );
          })}
          {activeCategories.size > 0 && (
            <button
              onClick={() => setActiveCategories(new Set())}
              className="px-2 py-0.5 text-[10px] font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Calendar Visibility Toggles */}
        {calendars.length > 0 && (
          <div className="flex items-center gap-1.5 border-l border-border-light dark:border-border-dark pl-3 ml-1">
            {calendars.map((cal) => (
              <button
                key={cal.id}
                onClick={() => toggleCalendarVisibility(cal.id)}
                className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full transition-all duration-standard ease-smooth ${
                  cal.visible ? 'text-white' : 'opacity-30'
                }`}
                style={{ backgroundColor: cal.color }}
                title={`${cal.visible ? 'Hide' : 'Show'} ${cal.name}`}
              >
                {cal.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                {cal.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Content with Calendar Layers Sidebar */}
      <div className="flex">
        <CalendarLayersSidebar />
        <div className="flex-1 min-w-0">
      {viewMode === 'monthly' ? (
        /* Monthly View - Using shared MonthlyCalendarGrid component */
        <MonthlyCalendarGrid
          year={year}
          month={month}
          onDayClick={handleDayClick}
          renderDayContent={({ dateKey, isoDateKey }) => {
            const dayEntries = entriesByDate.get(isoDateKey) || [];
            const dayEvents = filteredEvents[dateKey] || [];
            const dayTasks = tasksByDate[dateKey] || [];
            const totalDuration = dayEntries.reduce((sum, entry) => sum + entry.duration, 0);
            const hasContent = dayEntries.length > 0 || dayEvents.length > 0 || dayTasks.length > 0;

            if (!hasContent) {
              return (
                <div className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary opacity-0 group-hover:opacity-100">
                  Click to add
                </div>
              );
            }

            return (
              <div className="space-y-1">
                {/* Time Tracked */}
                {totalDuration > 0 && (
                  <div className="flex items-center gap-1 text-xs text-accent-primary font-medium">
                    <Clock className="w-3 h-3" />
                    {formatDuration(totalDuration, { showSeconds: false })}
                  </div>
                )}

                {/* Entry Count */}
                {dayEntries.length > 0 && (
                  <div className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                    {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                  </div>
                )}

                {/* Event Count */}
                {dayEvents.length > 0 && (
                  <div className="text-[10px] text-accent-purple">
                    {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                  </div>
                )}

                {/* Task Count */}
                {dayTasks.length > 0 && (
                  <div className="text-[10px] text-accent-blue">
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </div>
                )}
              </div>
            );
          }}
        />
      ) : viewMode === 'weekly' ? (
        /* Weekly View */
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          tasks={[]} // No tasks in time tracking context
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          showTimeSlots={true}
          onEventTimeChange={handleEventTimeChange}
        />
      ) : viewMode === 'daily' ? (
        /* Daily View */
        <DayView
          date={currentDate}
          events={filteredEvents[getStandardDateKey(currentDate)] || []}
          onEventClick={handleEventClick}
          onTimeSlotClick={() => {
            const dateKey = getStandardDateKey(currentDate);
            handleDayClick(dateKey);
          }}
          onEventTimeChange={(eventId, newStart, newEnd) => {
            const dateKey = getStandardDateKey(currentDate);
            handleEventTimeChange(dateKey, eventId, newStart, newEnd);
          }}
          enableTimeBlocking
        />
      ) : (
        /* Agenda/List View */
        <AgendaView
          events={filteredEvents}
          currentDate={currentDate}
          daysToShow={14}
          onEventClick={handleEventClick}
        />
      )}
        </div>
      </div>

      {/* Legend */}
      {projects.filter(p => p.active && !p.archived).length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark p-4">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
            Project Legend
          </h3>
          <div className="flex flex-wrap gap-3">
            {projects.filter(p => p.active && !p.archived).map(project => (
              <div key={project.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {project.name}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-button bg-text-light-tertiary dark:bg-text-dark-tertiary" />
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                No Project
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {dayDetailModal && (
        <DayDetailModal
          dateKey={dayDetailModal.dateKey}
          events={dayDetailModal.events}
          tasks={dayDetailModal.tasks}
          timeEntries={dayDetailModal.timeEntries}
          totalDuration={dayDetailModal.totalDuration}
          onClose={() => setDayDetailModal(null)}
          onCreateEvent={() => {
            if (onCreateEvent) {
              onCreateEvent(dayDetailModal.dateKey);
            }
          }}
          onEditEvent={onEditEvent}
          onEditEntry={onEditEntry}
        />
      )}
    </div>
  );
}
