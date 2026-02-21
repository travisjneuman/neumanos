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

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { DayView } from '../components/DayView';
import { TodayFocus } from '../components/today/TodayFocus';
import { TimeboxSelector } from '../components/today/TimeboxSelector';
import { TimeboxSummary } from '../components/today/TimeboxSummary';
import { DailyReview } from '../components/today/DailyReview';
import { TomorrowPlanning } from '../components/today/TomorrowPlanning';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useWeatherStore } from '../stores/useWeatherStore';
import { useSettingsStore, formatTemperature } from '../stores/useSettingsStore';
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
 * TodayTasks - Quick list of today's tasks with timeboxing
 */
const TodayTasks: React.FC<{
  tasks: Array<{ id: string; title: string; status: string; priority: 'low' | 'medium' | 'high' }>;
  onTaskClick: (taskId: string) => void;
  dateKey: string;
}> = ({ tasks, onTaskClick, dateKey }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-text-light-secondary dark:text-text-dark-secondary">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No tasks due today</p>
        <p className="text-xs opacity-70">Enjoy your free day!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
            transition-colors group
            ${task.status === 'done' ? 'opacity-60' : ''}
          `}
        >
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
                flex-1 text-sm text-text-light-primary dark:text-text-dark-primary truncate
                ${task.status === 'done' ? 'line-through' : ''}
              `}
            >
              {task.title}
            </span>
          </button>

          {/* Timebox selector */}
          <TimeboxSelector dateKey={dateKey} taskId={task.id} />

          <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * Today Page Component
 */
export const Today: React.FC = () => {
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement>(null);

  // Get today's date
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayKey = format(today, 'yyyy-M-d'); // Non-padded for store compatibility

  // Get data from stores
  const eventsMap = useCalendarStore((state) => state.events);
  const updateEventTime = useCalendarStore((state) => state.updateEventTime);
  const tasks = useKanbanStore((state) => state.tasks);
  const timeEntries = useTimeTrackingStore((state) => state.entries);

  // Weather data
  const weatherData = useWeatherStore((state) => state.weatherData);
  const city = useWeatherStore((state) => state.city);
  const weatherLoading = useWeatherStore((state) => state.loading);
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);

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
        <button
          onClick={() => navigate('/schedule')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-surface-light dark:hover:bg-surface-dark border border-border-light dark:border-border-dark transition-colors text-sm"
        >
          <Calendar className="w-4 h-4" />
          Full Schedule
        </button>
      </div>

      {/* Daily Focus / Goals */}
      <TodayFocus dateKey={todayKey} />

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
                dateKey={todayKey}
              />
            </div>
          </div>

          {/* Tomorrow Planning */}
          <TomorrowPlanning today={today} />

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
    </PageContent>
  );
};

export default Today;
