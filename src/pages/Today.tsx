/**
 * Today Page - Daily Planning View
 *
 * A focused view of today's schedule, tasks, and time tracking.
 * Inspired by Sunsama's intentional daily planning approach.
 *
 * Features:
 * - Daily goals/intentions (1-3 per day)
 * - Task timeboxing with duration estimates
 * - Timeline with calendar events inline
 * - Tomorrow planning
 * - End-of-day review
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { format, startOfDay, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
  Target,
  Zap,
  CloudSun,
  Focus,
  Sun,
  Moon,
  FileText,
} from 'lucide-react';
import { DayView } from '../components/DayView';
import { TodayFocus } from '../components/today/TodayFocus';
import { TimeboxSelector } from '../components/today/TimeboxSelector';
import { TimeboxSummary } from '../components/today/TimeboxSummary';
import { DailyReview } from '../components/today/DailyReview';
import { TomorrowPlanning } from '../components/today/TomorrowPlanning';
import { WeeklyPlanning } from '../components/today/WeeklyPlanning';
import { CapacityBar } from '../components/today/CapacityBar';
import { MorningRitual } from '../components/today/MorningRitual';
import { EveningReview as EveningReviewFlow } from '../components/today/EveningReview';
import { RolloverModal } from '../components/today/RolloverModal';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useWeatherStore } from '../stores/useWeatherStore';
import { useSettingsStore, formatTemperature } from '../stores/useSettingsStore';
import { useFocusModeStore } from '../stores/useFocusModeStore';
import { useDailyPlanningStore } from '../stores/useDailyPlanningStore';
import { useNotesStore } from '../stores/useNotesStore';
import { useShortcut } from '../hooks/useShortcut';
import type { CalendarEvent, WeatherData } from '../types';
import { PageContent } from '../components/PageContent';

/**
 * TodayMetrics - Shows today's summary statistics
 */
const TodayMetrics: React.FC<{
  tasksCompleted: number;
  tasksDue: number;
  hoursTracked: number;
  eventsCount: number;
  dateKey: string;
}> = ({ tasksCompleted, tasksDue, hoursTracked, eventsCount, dateKey }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
      <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-3 border border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 text-accent-green mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Completed</span>
        </div>
        <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {tasksCompleted}
          <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary ml-1">
            / {tasksDue} tasks
          </span>
        </div>
      </div>

      <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-3 border border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 text-accent-primary mb-1">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Tracked</span>
        </div>
        <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {hoursTracked.toFixed(1)}
          <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary ml-1">
            hours
          </span>
        </div>
      </div>

      <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-3 border border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 text-accent-secondary mb-1">
          <Calendar className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Events</span>
        </div>
        <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {eventsCount}
          <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary ml-1">
            scheduled
          </span>
        </div>
      </div>

      <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-3 border border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2 text-accent-purple mb-1">
          <Target className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Focus</span>
        </div>
        <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {tasksDue > 0 ? Math.round((tasksCompleted / tasksDue) * 100) : 100}
          <span className="text-sm font-normal text-text-light-secondary dark:text-text-dark-secondary ml-1">
            %
          </span>
        </div>
      </div>

      {/* Timebox summary as 5th metric card */}
      <TimeboxSummary dateKey={dateKey} />
    </div>
  );
};

/**
 * TodayWeather - Compact weather display for the header
 */
const TodayWeather: React.FC<{
  weatherData: WeatherData | null;
  city: string;
  loading: boolean;
  temperatureUnit: 'fahrenheit' | 'celsius';
}> = ({ weatherData, city, loading, temperatureUnit }) => {
  if (loading && !weatherData) {
    return (
      <div className="flex items-center gap-2 text-text-light-secondary dark:text-text-dark-secondary animate-pulse">
        <CloudSun className="w-5 h-5" />
        <span className="text-sm">Loading weather...</span>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="flex items-center gap-2 text-text-light-secondary dark:text-text-dark-secondary">
        <CloudSun className="w-5 h-5" />
        <span className="text-sm">Weather unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-text-light-secondary dark:text-text-dark-secondary">
      <span className="text-2xl">{weatherData.icon}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          {formatTemperature(weatherData.temp, temperatureUnit)}
        </span>
        <span className="text-sm">{weatherData.desc}</span>
        {city && (
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            • {city}
          </span>
        )}
      </div>
      {weatherData.precipProbability > 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-accent-primary/10 text-accent-primary rounded">
          {weatherData.precipProbability}%
        </span>
      )}
    </div>
  );
};

/**
 * TodayTasks - Quick list of today's tasks with timeboxing and focus highlighting
 */
const TodayTasks: React.FC<{
  tasks: Array<{ id: string; title: string; status: string; priority: 'low' | 'medium' | 'high' }>;
  onTaskClick: (taskId: string) => void;
  onFocusTask: (taskId: string) => void;
  focusedTaskId: string | null;
  dateKey: string;
}> = ({ tasks, onTaskClick, onFocusTask, focusedTaskId, dateKey }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No tasks due today</p>
        <p className="text-xs opacity-70">Enjoy your free day!</p>
      </div>
    );
  }

  const isFocused = (id: string) => focusedTaskId === id;

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-colors group
            ${isFocused(task.id)
              ? 'bg-accent-primary/10 border border-accent-primary/30 shadow-sm'
              : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'}
            ${task.status === 'done' ? 'opacity-60' : ''}
          `}
        >
          {/* Focus indicator */}
          {isFocused(task.id) && (
            <div className="w-1 h-6 bg-accent-primary rounded-full flex-shrink-0" />
          )}

          <button
            onClick={() => onTaskClick(task.id)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <div
              className={`
                w-3 h-3 rounded-full flex-shrink-0
                ${task.priority === 'high' ? 'bg-accent-red' :
                  task.priority === 'medium' ? 'bg-accent-yellow' : 'bg-accent-green'}
              `}
            />
            <span
              className={`
                flex-1 text-sm truncate
                ${isFocused(task.id)
                  ? 'font-medium text-accent-primary'
                  : 'text-text-light-primary dark:text-text-dark-primary'}
                ${task.status === 'done' ? 'line-through' : ''}
              `}
            >
              {task.title}
            </span>
          </button>

          {/* Focus button */}
          {task.status !== 'done' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFocusTask(task.id);
              }}
              className={`p-1 rounded transition-colors flex-shrink-0 ${
                isFocused(task.id)
                  ? 'text-accent-primary bg-accent-primary/10'
                  : 'text-text-light-tertiary dark:text-text-dark-tertiary opacity-0 group-hover:opacity-100 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
              }`}
              title={isFocused(task.id) ? 'End focus' : 'Focus on this task'}
              aria-label={isFocused(task.id) ? 'End focus' : 'Focus on this task'}
            >
              <Focus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Timebox selector */}
          <TimeboxSelector dateKey={dateKey} taskId={task.id} />

          <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * DailyNoteWidget - Quick access to today's daily note
 */
const DailyNoteWidget: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const dailyNotesEnabled = useSettingsStore((state) => state.dailyNotes.enabled);
  const getOrCreateDailyNote = useNotesStore((state) => state.getOrCreateDailyNote);
  const getDailyNote = useNotesStore((state) => state.getDailyNote);

  const todayNote = useMemo(() => getDailyNote(new Date()), [getDailyNote]);

  if (!dailyNotesEnabled) return null;

  const handleOpenDailyNote = () => {
    getOrCreateDailyNote(new Date());
    onNavigate();
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent-primary" />
          Daily Note
        </h3>
      </div>
      <div className="p-4">
        {todayNote ? (
          <button
            onClick={handleOpenDailyNote}
            className="w-full text-left group"
          >
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors">
              <span className="text-2xl">{todayNote.icon || '📅'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                  {todayNote.title}
                </p>
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary line-clamp-2 mt-0.5">
                  {todayNote.contentText.slice(0, 120) || 'No content yet'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </button>
        ) : (
          <button
            onClick={handleOpenDailyNote}
            className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:border-accent-primary hover:bg-accent-primary/5 transition-colors group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-accent-primary/10 rounded-lg">
              <Plus className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                Create Today's Note
              </p>
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Start capturing today's thoughts
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Today Page Component
 */
export const Today: React.FC = () => {
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showMorningRitual, setShowMorningRitual] = useState(false);
  const [showEveningReview, setShowEveningReview] = useState(false);
  const [showRollover, setShowRollover] = useState(false);
  const [rolloverDismissed, setRolloverDismissed] = useState(false);

  // Get today's date
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = format(today, 'yyyy-M-d'); // Non-padded for store compatibility

  // Get data from stores
  const eventsMap = useCalendarStore((state) => state.events);
  const updateEventTime = useCalendarStore((state) => state.updateEventTime);
  const tasks = useKanbanStore((state) => state.tasks);
  const timeEntries = useTimeTrackingStore((state) => state.entries);

  // Daily planning store
  const isMorningRitualCompleted = useDailyPlanningStore((s) => s.isMorningRitualCompleted(todayKey));
  const eveningReview = useDailyPlanningStore((s) => s.getEveningReview(todayKey));

  // Weather data
  const weatherData = useWeatherStore((state) => state.weatherData);
  const city = useWeatherStore((state) => state.city);
  const weatherLoading = useWeatherStore((state) => state.loading);
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);

  // Focus mode
  const focusedTaskId = useFocusModeStore((state) => state.linkedTaskId);
  const focusIsActive = useFocusModeStore((state) => state.isActive);
  const startFocus = useFocusModeStore((state) => state.startFocus);
  const endFocus = useFocusModeStore((state) => state.endFocus);

  // Get today's events from the map
  const todayEvents = useMemo(() => {
    return eventsMap[todayKey] || [];
  }, [eventsMap, todayKey]);

  // Filter today's tasks (due today)
  const todayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = format(new Date(task.dueDate), 'yyyy-M-d');
      return dueDate === todayKey;
    });
  }, [tasks, todayKey]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const tasksCompleted = todayTasks.filter((t) => t.status === 'done').length;
    const tasksDue = todayTasks.length;

    // Calculate hours tracked today (entries use startTime ISO timestamp)
    const todayEntries = timeEntries.filter((entry) => {
      if (!entry.startTime) return false;
      const entryDate = format(parseISO(entry.startTime), 'yyyy-M-d');
      return entryDate === todayKey;
    });
    const hoursTracked = todayEntries.reduce((sum, entry) => {
      return sum + (entry.duration || 0) / 3600; // Convert seconds to hours
    }, 0);

    return {
      tasksCompleted,
      tasksDue,
      hoursTracked,
      eventsCount: todayEvents.length,
    };
  }, [todayTasks, todayEvents, timeEntries, todayKey]);

  // Check for incomplete tasks from yesterday on mount
  const hasOverdueTasks = useMemo(() => {
    return tasks.some((task) => {
      if (!task.dueDate || task.status === 'done' || task.archivedAt) return false;
      return new Date(task.dueDate) < today;
    });
  }, [tasks, today]);

  useEffect(() => {
    if (hasOverdueTasks && !rolloverDismissed && !isMorningRitualCompleted) {
      setShowRollover(true);
    }
  }, [hasOverdueTasks, rolloverDismissed, isMorningRitualCompleted]);

  // Is it evening? (after 5pm)
  const isEvening = useMemo(() => new Date().getHours() >= 17, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      // Scroll to current hour, with some padding above
      const scrollPosition = Math.max(0, (currentHour - 2) * 60);
      timelineRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Handle event click - navigate to schedule with the event selected
  const handleEventClick = useCallback((_event: CalendarEvent, _dateKey: string) => {
    navigate(`/schedule?date=${format(today, 'yyyy-MM-dd')}`);
  }, [navigate, today]);

  // Handle time slot click - quick add event
  const handleTimeSlotClick = useCallback((hour: number) => {
    navigate(`/schedule?date=${format(today, 'yyyy-MM-dd')}&hour=${hour}`);
  }, [navigate, today]);

  // Handle task click
  const handleTaskClick = useCallback((taskId: string) => {
    navigate(`/tasks?task=${taskId}`);
  }, [navigate]);

  // Handle focus on task
  const handleFocusTask = useCallback((taskId: string) => {
    if (focusIsActive && focusedTaskId === taskId) {
      endFocus();
    } else {
      startFocus(taskId);
    }
  }, [focusIsActive, focusedTaskId, startFocus, endFocus]);

  // Handle event time change (time blocking drag-drop)
  const handleEventTimeChange = useCallback((eventId: string, newStartTime: string, newEndTime: string) => {
    updateEventTime(todayKey, eventId, newStartTime, newEndTime);
  }, [updateEventTime, todayKey]);

  // Register D keyboard shortcut (already on this page, so just log)
  useShortcut({
    id: 'today-page',
    keys: ['d'],
    label: 'Go to Today',
    description: 'Open daily planning view',
    handler: useCallback(() => {
      // Already on Today page, scroll to current time
      if (timelineRef.current) {
        const now = new Date();
        const currentHour = now.getHours();
        const scrollPosition = Math.max(0, (currentHour - 1) * 60);
        timelineRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }
    }, []),
    priority: 30,
  });

  return (
    <PageContent page="today">
      {/* Header with weather */}
      <div className="flex items-center justify-between mb-4">
        {/* Weather Display */}
        <TodayWeather
          weatherData={weatherData}
          city={city}
          loading={weatherLoading}
          temperatureUnit={temperatureUnit}
        />

        {/* Page-specific toolbar */}
        <div className="flex items-center gap-2">
          {/* Morning Ritual button */}
          {!isMorningRitualCompleted && (
            <button
              onClick={() => setShowMorningRitual(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-yellow/10 text-accent-yellow hover:bg-accent-yellow/20 border border-accent-yellow/20 transition-colors text-sm font-medium"
            >
              <Sun className="w-4 h-4" />
              Start Your Day
            </button>
          )}

          {/* Evening Review button */}
          {(isEvening || isMorningRitualCompleted) && !eveningReview && (
            <button
              onClick={() => setShowEveningReview(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 border border-accent-purple/20 transition-colors text-sm font-medium"
            >
              <Moon className="w-4 h-4" />
              End Your Day
            </button>
          )}

          <button
            onClick={() => navigate('/schedule')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark border border-border-light dark:border-border-dark transition-colors text-sm"
          >
            <Calendar className="w-4 h-4" />
            Full Schedule
          </button>
        </div>
      </div>

      {/* Daily Focus / Goals */}
      <TodayFocus dateKey={todayKey} />

      {/* Capacity Indicator */}
      <CapacityBar dateKey={todayKey} hoursTracked={metrics.hoursTracked} />

      {/* Metrics */}
      <TodayMetrics {...metrics} dateKey={todayKey} />

      {/* Main content: Tasks + Timeline */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Tasks sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-0">
          {/* Tasks list */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
              <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                Today's Tasks
              </h3>
              <button
                onClick={() => navigate('/tasks')}
                className="p-1.5 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
                title="Add task"
                aria-label="Add task"
              >
                <Plus className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <TodayTasks
                tasks={todayTasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  priority: t.priority,
                }))}
                onTaskClick={handleTaskClick}
                onFocusTask={handleFocusTask}
                focusedTaskId={focusIsActive ? focusedTaskId : null}
                dateKey={todayKey}
              />
            </div>
          </div>

          {/* Daily Note Widget */}
          <DailyNoteWidget onNavigate={() => navigate('/notes?daily=true')} />

          {/* Tomorrow Planning */}
          <TomorrowPlanning today={today} />

          {/* Weekly Planning */}
          <WeeklyPlanning today={today} />

          {/* Daily Review */}
          <DailyReview
            dateKey={todayKey}
            tasksCompleted={metrics.tasksCompleted}
            tasksDue={metrics.tasksDue}
            hoursTracked={metrics.hoursTracked}
          />
        </div>

        {/* Timeline */}
        <div
          ref={timelineRef}
          className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden"
        >
          <DayView
            date={today}
            events={todayEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventTimeChange={handleEventTimeChange}
            enableTimeBlocking={true}
          />
        </div>
      </div>

      {/* Morning Ritual Modal */}
      {showMorningRitual && (
        <MorningRitual
          dateKey={todayKey}
          onComplete={() => setShowMorningRitual(false)}
          onDismiss={() => setShowMorningRitual(false)}
        />
      )}

      {/* Evening Review Modal */}
      {showEveningReview && (
        <EveningReviewFlow
          dateKey={todayKey}
          tasksCompleted={metrics.tasksCompleted}
          tasksDue={metrics.tasksDue}
          hoursTracked={metrics.hoursTracked}
          onComplete={() => setShowEveningReview(false)}
          onDismiss={() => setShowEveningReview(false)}
        />
      )}

      {/* Rollover Modal */}
      {showRollover && (
        <RolloverModal
          dateKey={todayKey}
          onComplete={() => {
            setShowRollover(false);
            setRolloverDismissed(true);
          }}
          onDismiss={() => {
            setShowRollover(false);
            setRolloverDismissed(true);
          }}
        />
      )}
    </PageContent>
  );
};

export default Today;
