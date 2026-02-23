import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Sparkles, Copy } from 'lucide-react';
import { en as chrono } from 'chrono-node';
import { format } from 'date-fns';
import { useCalendarStore } from '../stores/useCalendarStore';
import { REMINDER_OPTIONS } from '../services/eventReminders';
import { detectConflicts, formatConflictMessage, getConflictDetails } from '../utils/conflictDetection';
import { EVENT_COLOR_CATEGORIES } from '../utils/eventColors';
import type { CalendarEvent, EventColorCategory } from '../types';
import { MeetingNotesButton } from './calendar/MeetingNotesButton';

interface EventCreateModalProps {
  dateKey: string;
  event?: CalendarEvent | null;
  onClose: () => void;
  /** When true, opens as a duplicate of the event (new event with same details) */
  isDuplicate?: boolean;
}

/**
 * EventCreateModal Component
 * Create or edit calendar events
 * Simplified version matching TimeEntryCalendar aesthetic
 */
export function EventCreateModal({ dateKey, event, onClose, isDuplicate = false }: EventCreateModalProps) {
  const { addEvent, updateEvent, events, calendars } = useCalendarStore();

  // Natural language input state
  const [nlInput, setNlInput] = useState('');
  const [nlPreview, setNlPreview] = useState<string | null>(null);

  // Convert standard date key (YYYY-M-D) to ISO format for date input (YYYY-MM-DD)
  const toISODate = (standardKey: string): string => {
    const [year, month, day] = standardKey.split('-').map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Convert ISO date (YYYY-MM-DD) to standard date key (YYYY-M-D)
  const toStandardKey = (isoDate: string): string => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(toISODate(dateKey));
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [reminders, setReminders] = useState<number[]>([]);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'after' | 'until'>('never');
  const [recurrenceEndCount, setRecurrenceEndCount] = useState(10);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [colorCategory, setColorCategory] = useState<EventColorCategory>('default');
  const [calendarId, setCalendarId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);

  // Natural language event parsing
  const handleNLInput = useCallback((text: string) => {
    setNlInput(text);
    if (!text.trim()) {
      setNlPreview(null);
      return;
    }

    try {
      const results = chrono.parse(text);
      if (results.length > 0) {
        const parsed = results[0];
        const parsedDate = parsed.start.date();

        // Extract title: text before the date/time phrase
        const titlePart = text.slice(0, parsed.index).trim()
          || text.replace(parsed.text, '').trim()
          || text.trim();

        // Set title if we got something meaningful
        if (titlePart) {
          setTitle(titlePart);
        }

        // Set date
        setStartDate(format(parsedDate, 'yyyy-MM-dd'));

        // Set time if available
        if (parsed.start.isCertain('hour')) {
          const startStr = format(parsedDate, 'HH:mm');
          setStartTime(startStr);
          setIsAllDay(false);

          // Calculate end time from duration or default to 1 hour
          if (parsed.end) {
            const endDate = parsed.end.date();
            setEndTime(format(endDate, 'HH:mm'));
          } else {
            const endDate = new Date(parsedDate.getTime() + 60 * 60 * 1000);
            setEndTime(format(endDate, 'HH:mm'));
          }
        }

        setNlPreview(`"${titlePart}" on ${format(parsedDate, 'MMM d')}${parsed.start.isCertain('hour') ? ` at ${format(parsedDate, 'h:mm a')}` : ''}`);
      } else {
        setNlPreview(null);
      }
    } catch {
      setNlPreview(null);
    }
  }, []);

  // Initialize form when editing existing event or duplicating
  useEffect(() => {
    if (event) {
      setTitle(isDuplicate ? `${event.title} (copy)` : event.title);
      setDescription(event.description || '');
      setStartDate(toISODate(dateKey));
      setIsAllDay(event.isAllDay !== false);
      setStartTime(event.startTime || '09:00');
      setEndTime(event.endTime || '10:00');
      setEndDate(event.endDate || '');
      setLocation(event.location || '');
      setReminders(event.reminders || []);
      setColorCategory(event.colorCategory || 'default');
      setCalendarId(event.calendarId || '');

      if (event.recurrence) {
        setRecurrenceType(event.recurrence.frequency);
        setRecurrenceInterval(event.recurrence.interval || 1);
        setWeeklyDays(event.recurrence.daysOfWeek || []);
        setMonthlyDay(event.recurrence.dayOfMonth || 1);
        setRecurrenceEndType(event.recurrence.endType);
        setRecurrenceEndCount(event.recurrence.endCount || 10);
        setRecurrenceEndDate(event.recurrence.endDate || '');
      }
    }
  }, [event, dateKey, isDuplicate]);

  // Check for conflicts when time changes
  useEffect(() => {
    // Skip conflict detection for all-day events
    if (isAllDay) {
      setConflicts([]);
      return;
    }

    // Get the standard date key from the ISO start date
    const effectiveDateKey = toStandardKey(startDate);

    // Get existing events for this date
    const existingEvents = events[effectiveDateKey] || [];

    // Detect conflicts
    const foundConflicts = detectConflicts(
      effectiveDateKey,
      startTime,
      endTime,
      existingEvents,
      event?.id // Exclude current event when editing
    );

    setConflicts(foundConflicts);
  }, [startDate, startTime, endTime, isAllDay, events, event]);

  const handleSave = async () => {
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Event title is required');
      return;
    }

    if (!isAllDay && startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    setSaving(true);
    try {
      const eventData: Partial<CalendarEvent> = {
        title: title.trim(),
        description: description.trim() || undefined,
        isAllDay,
        startTime: !isAllDay ? startTime : undefined,
        endTime: !isAllDay ? endTime : undefined,
        endDate: endDate || undefined,
        location: location.trim() || undefined,
        reminders: reminders.length > 0 ? reminders : undefined,
        colorCategory: colorCategory !== 'default' ? colorCategory : undefined,
        calendarId: calendarId || undefined,
      };

      // Add recurrence if configured (for both new events and edits)
      if (recurrenceType !== 'none') {
        eventData.recurrence = {
          frequency: recurrenceType,
          interval: recurrenceInterval,
          endType: recurrenceEndType,
          endCount: recurrenceEndType === 'after' ? recurrenceEndCount : undefined,
          endDate: recurrenceEndType === 'until' ? recurrenceEndDate : undefined,
        };

        if (recurrenceType === 'weekly' && weeklyDays.length > 0) {
          eventData.recurrence.daysOfWeek = weeklyDays;
        }

        if (recurrenceType === 'monthly') {
          eventData.recurrence.dayOfMonth = monthlyDay;
        }
      } else {
        // Explicitly remove recurrence when set to none
        eventData.recurrence = undefined;
      }

      // Get the standard date key from the ISO start date
      const effectiveDateKey = toStandardKey(startDate);

      if (event && !isDuplicate) {
        // Update existing event
        updateEvent(effectiveDateKey, event.id, eventData.title!, eventData.description, eventData);
      } else {
        // Create new event (or duplicate)
        addEvent(effectiveDateKey, eventData.title!, eventData.description, eventData);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
          <h2 className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
            {isDuplicate ? 'Duplicate Event' : event ? 'Edit Event' : 'Create Event'}
          </h2>
          <div className="flex items-center gap-1">
            {event && !isDuplicate && (
              <button
                onClick={() => {
                  onClose();
                  // Re-open as duplicate by triggering a custom event
                  window.dispatchEvent(new CustomEvent('calendar:duplicate-event', {
                    detail: { event, dateKey },
                  }));
                }}
                className="p-1 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-all duration-standard ease-smooth"
                aria-label="Duplicate event"
                title="Duplicate event"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary transition-all duration-standard ease-smooth"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {error && (
            <div className="px-3 py-2 bg-status-error/10 border border-status-error/20 rounded-button text-status-error text-xs">
              {error}
            </div>
          )}

          {/* Natural Language Input (only for new events) */}
          {!event && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                Quick Create
              </label>
              <input
                type="text"
                value={nlInput}
                onChange={(e) => handleNLInput(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
                placeholder='e.g. "Meeting with John tomorrow at 3pm for 1 hour"'
              />
              {nlPreview && (
                <div className="mt-1 text-[10px] text-accent-green">
                  Parsed: {nlPreview}
                </div>
              )}
            </div>
          )}

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <div className="px-3 py-2 bg-status-warning/10 border border-status-warning/30 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-status-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-status-warning mb-0.5">
                    {formatConflictMessage(conflicts)}
                  </p>
                  {conflicts.length <= 3 && (
                    <ul className="text-xs text-text-light-secondary dark:text-text-dark-secondary space-y-0.5">
                      {getConflictDetails(conflicts).map((detail, index) => (
                        <li key={index}>• {detail}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-1">
                    You can still save this event, but consider adjusting the time to avoid overlaps.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
            />
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="event-title"
              className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5"
            >
              Event Title
            </label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
              placeholder="Meeting with team, Conference, etc."
              autoFocus
            />
          </div>

          {/* Color Category */}
          <div>
            <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
              Color Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_COLOR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setColorCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-button text-xs transition-all duration-standard ease-smooth ${
                    colorCategory === cat.id
                      ? 'ring-2 ring-offset-1 ring-text-light-primary dark:ring-text-dark-primary'
                      : 'hover:opacity-80'
                  }`}
                  style={{ backgroundColor: cat.hex, color: '#fff' }}
                  title={cat.label}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Selector */}
          {calendars.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                Calendar
              </label>
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
              >
                <option value="">No calendar</option>
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label
              htmlFor="event-description"
              className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5"
            >
              Description (Optional)
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary resize-none"
              placeholder="Add details about this event..."
            />
          </div>

          {/* All-Day Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded w-3.5 h-3.5"
              />
              <span className="text-xs text-text-light-primary dark:text-text-dark-primary">All-day event</span>
            </label>
          </div>

          {/* Time Inputs */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                />
              </div>
            </div>
          )}

          {/* End Date (Multi-day events) */}
          <div>
            <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
              End Date (Optional - for multi-day events)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
            />
            {endDate && (
              <p className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                Event spans from {toStandardKey(startDate)} to {endDate}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
              Location (Optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary"
              placeholder="Meeting room, video call link, address..."
            />
          </div>

          {/* Recurrence */}
          <>
            <div>
              <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                Repeat
              </label>
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly')}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Recurrence Interval */}
            {recurrenceType !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                  Every
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                  />
                  <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    {recurrenceType === 'daily' ? (recurrenceInterval === 1 ? 'day' : 'days') :
                     recurrenceType === 'weekly' ? (recurrenceInterval === 1 ? 'week' : 'weeks') :
                     recurrenceType === 'monthly' ? (recurrenceInterval === 1 ? 'month' : 'months') :
                     (recurrenceInterval === 1 ? 'year' : 'years')}
                  </span>
                </div>
              </div>
            )}

              {/* Weekly days selection */}
              {recurrenceType === 'weekly' && (
                <div>
                  <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                    Repeat on
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (weeklyDays.includes(index)) {
                            setWeeklyDays(weeklyDays.filter(d => d !== index));
                          } else {
                            setWeeklyDays([...weeklyDays, index].sort());
                          }
                        }}
                        className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
                          weeklyDays.includes(index)
                            ? 'bg-accent-primary text-white'
                            : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-accent-primary/20'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly day selection */}
              {recurrenceType === 'monthly' && (
                <div>
                  <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                    Day of month
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={monthlyDay}
                    onChange={(e) => setMonthlyDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                  />
                </div>
              )}

              {/* Recurrence end condition */}
              {recurrenceType !== 'none' && (
                <div>
                  <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
                    Ends
                  </label>
                  <select
                    value={recurrenceEndType}
                    onChange={(e) => setRecurrenceEndType(e.target.value as typeof recurrenceEndType)}
                    className="w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                  >
                    <option value="never">Never</option>
                    <option value="after">After</option>
                    <option value="until">On date</option>
                  </select>

                  {recurrenceEndType === 'after' && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={recurrenceEndCount}
                        onChange={(e) => setRecurrenceEndCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                      />
                      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                        occurrences
                      </span>
                    </div>
                  )}

                  {recurrenceEndType === 'until' && (
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="mt-1.5 w-full px-2.5 py-1.5 text-xs bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary"
                    />
                  )}
                </div>
              )}
          </>

          {/* Reminders */}
          <div>
            <label className="block text-xs font-medium text-text-light-primary dark:text-text-dark-primary mb-1.5">
              Reminders (Optional)
            </label>
            <div className="space-y-1">
              {REMINDER_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminders.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setReminders([...reminders, option.value].sort((a, b) => a - b));
                      } else {
                        setReminders(reminders.filter((r) => r !== option.value));
                      }
                    }}
                    className="rounded w-3.5 h-3.5"
                  />
                  <span className="text-text-light-secondary dark:text-text-dark-secondary">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Meeting Notes (only for existing events, not duplicates) */}
          {event && !isDuplicate && (
            <MeetingNotesButton
              eventId={event.id}
              eventTitle={event.title}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-light dark:border-border-dark sticky bottom-0 bg-surface-light dark:bg-surface-dark">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-text-light-primary dark:text-text-dark-primary bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-button hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-white dark:text-dark-background bg-accent-primary rounded-button hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : event ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
