/**
 * Activity Feed Page
 *
 * Displays a chronological feed of activity events across all modules
 * with filtering, grouping by day, and personal analytics.
 *
 * Uses react-window v2 List for virtualized rendering to handle up to 10,000
 * events without DOM performance degradation.
 */

import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { useActivityStore } from '../stores/useActivityStore';
import type { ModuleType, ActivityFilter, ActivityEvent } from '../stores/useActivityStore';

// Lazy-load analytics components since they pull in Recharts (~200KB)
const ActivityHeatmap = lazy(() => import('../components/Analytics/ActivityHeatmap').then(m => ({ default: m.ActivityHeatmap })));
const ModuleUsageChart = lazy(() => import('../components/Analytics/ModuleUsageChart').then(m => ({ default: m.ModuleUsageChart })));
const ProductivityTrends = lazy(() => import('../components/Analytics/ProductivityTrends').then(m => ({ default: m.ProductivityTrends })));

const MODULE_ICONS: Record<ModuleType, string> = {
  notes: '\u{1F4DD}',
  tasks: '\u2705',
  calendar: '\u{1F4C5}',
  docs: '\u{1F4C4}',
  'time-tracking': '\u23F1\uFE0F',
  habits: '\u{1F3AF}',
  links: '\u{1F517}',
  ai: '\u{1F916}',
  forms: '\u{1F4CB}',
  diagrams: '\u{1F537}',
};

const MODULE_LABELS: Record<ModuleType, string> = {
  notes: 'Notes',
  tasks: 'Tasks',
  calendar: 'Calendar',
  docs: 'Documents',
  'time-tracking': 'Time Tracking',
  habits: 'Habits',
  links: 'Links',
  ai: 'AI',
  forms: 'Forms',
  diagrams: 'Diagrams',
};

const MODULE_COLORS: Record<ModuleType, string> = {
  notes: 'bg-amber-500/20 text-amber-400',
  tasks: 'bg-green-500/20 text-green-400',
  calendar: 'bg-blue-500/20 text-blue-400',
  docs: 'bg-purple-500/20 text-purple-400',
  'time-tracking': 'bg-cyan-500/20 text-cyan-400',
  habits: 'bg-rose-500/20 text-rose-400',
  links: 'bg-indigo-500/20 text-indigo-400',
  ai: 'bg-emerald-500/20 text-emerald-400',
  forms: 'bg-orange-500/20 text-orange-400',
  diagrams: 'bg-teal-500/20 text-teal-400',
};

const MODULE_ROUTES: Record<ModuleType, string> = {
  notes: '/notes',
  tasks: '/tasks',
  calendar: '/schedule',
  docs: '/create',
  'time-tracking': '/schedule',
  habits: '/tasks?tab=habits',
  links: '/links',
  ai: '/',
  forms: '/create?tab=forms',
  diagrams: '/create?tab=diagrams',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  completed: 'Completed',
  viewed: 'Viewed',
};

type DateRange = 'today' | '7d' | '30d' | 'all';

/** Row height in pixels for virtualized list items */
const EVENT_ROW_HEIGHT = 44;
/** Row height for day header separators */
const DAY_HEADER_HEIGHT = 36;

/**
 * Flattened row item: either a day header or an event row.
 * This allows react-window to virtualize a mixed list of headers and events.
 */
type FlatRow =
  | { type: 'day-header'; dayKey: string }
  | { type: 'event'; event: ActivityEvent };

/** Props passed to every row via react-window's rowProps */
interface RowExtraProps {
  flatRows: FlatRow[];
  navigate: (path: string) => void;
}

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getDateRangeFilter(range: DateRange): { startDate?: string } {
  if (range === 'all') return {};
  const now = new Date();
  const start = new Date(now);
  if (range === 'today') start.setHours(0, 0, 0, 0);
  else if (range === '7d') start.setDate(start.getDate() - 7);
  else if (range === '30d') start.setDate(start.getDate() - 30);
  return { startDate: start.toISOString() };
}

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Memoized event row component to prevent unnecessary re-renders
 * in the virtualized list.
 */
const EventRow = React.memo(function EventRow({
  event,
  navigate,
}: {
  event: ActivityEvent;
  navigate: (path: string) => void;
}) {
  return (
    <button
      onClick={() => navigate(MODULE_ROUTES[event.module] || '/')}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all text-left group"
    >
      <span className="text-lg flex-shrink-0">{event.entityIcon || MODULE_ICONS[event.module]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
            {EVENT_TYPE_LABELS[event.type] || event.type} {event.entityTitle}
          </span>
        </div>
      </div>
      <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${MODULE_COLORS[event.module]}`}>
        {MODULE_LABELS[event.module]}
      </span>
      <span className="flex-shrink-0 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
        {getRelativeTime(event.timestamp)}
      </span>
    </button>
  );
});

/**
 * Row component for react-window v2 List.
 * Receives index, style, and rowProps (flatRows + navigate).
 */
function VirtualRow({
  index,
  style,
  flatRows,
  navigate,
}: {
  index: number;
  style: React.CSSProperties;
  flatRows: FlatRow[];
  navigate: (path: string) => void;
}) {
  const row = flatRows[index];
  if (row.type === 'day-header') {
    return (
      <div style={style} className="flex items-end px-3 pb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary">
          {formatDayHeader(row.dayKey)}
        </h3>
      </div>
    );
  }
  return (
    <div style={style}>
      <EventRow event={row.event} navigate={navigate} />
    </div>
  );
}

export const ActivityFeed: React.FC = () => {
  const navigate = useNavigate();
  const getActivities = useActivityStore((s) => s.getActivities);
  const events = useActivityStore((s) => s.events);

  const [moduleFilter, setModuleFilter] = useState<ModuleType | ''>('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [activeTab, setActiveTab] = useState<'feed' | 'analytics'>('feed');

  const filter: ActivityFilter = useMemo(() => {
    const f: ActivityFilter = {};
    if (moduleFilter) f.module = moduleFilter;
    const rangeFilter = getDateRangeFilter(dateRange);
    if (rangeFilter.startDate) f.startDate = rangeFilter.startDate;
    return f;
  }, [moduleFilter, dateRange]);

  const filteredEvents = useMemo(() => getActivities(filter), [events, filter, getActivities]);

  /**
   * Flatten grouped events into a single array of FlatRow items
   * for react-window virtualization. Day headers and events are
   * interleaved so the virtualizer can render them as variable-height rows.
   */
  const flatRows: FlatRow[] = useMemo(() => {
    const rows: FlatRow[] = [];
    let currentDay = '';
    for (const event of filteredEvents) {
      const dayKey = event.timestamp.split('T')[0];
      if (dayKey !== currentDay) {
        currentDay = dayKey;
        rows.push({ type: 'day-header', dayKey });
      }
      rows.push({ type: 'event', event });
    }
    return rows;
  }, [filteredEvents]);

  /** Returns the pixel height of each row based on whether it's a header or event */
  const getItemSize = useCallback(
    (index: number): number => {
      const row = flatRows[index];
      return row.type === 'day-header' ? DAY_HEADER_HEIGHT : EVENT_ROW_HEIGHT;
    },
    [flatRows],
  );

  /** Stable rowProps object for react-window v2 */
  const rowProps: RowExtraProps = useMemo(
    () => ({ flatRows, navigate }),
    [flatRows, navigate],
  );

  const allModules: ModuleType[] = ['notes', 'tasks', 'calendar', 'docs', 'time-tracking', 'habits', 'links', 'ai', 'forms', 'diagrams'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
        <div>
          <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">Activity</h1>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-1">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'feed'
                ? 'bg-accent-primary text-white'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'analytics'
                ? 'bg-accent-primary text-white'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <>
          {/* Filter Bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-border-light dark:border-border-dark">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value as ModuleType | '')}
              className="px-3 py-1.5 text-sm rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary"
            >
              <option value="">All Modules</option>
              {allModules.map((m) => (
                <option key={m} value={m}>
                  {MODULE_ICONS[m]} {MODULE_LABELS[m]}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-0.5 border border-border-light dark:border-border-dark">
              {(['today', '7d', '30d', 'all'] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    dateRange === r
                      ? 'bg-accent-primary text-white'
                      : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                  }`}
                >
                  {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Virtualized Event List */}
          <div className="flex-1 min-h-0 px-6 py-4">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-4xl mb-4">{'\u{1F4CA}'}</span>
                <h3 className="text-lg font-medium text-text-light-primary dark:text-text-dark-primary mb-1">
                  No activity yet
                </h3>
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary max-w-sm">
                  Activity events will appear here as you use NeumanOS. Try creating a note, completing a task, or tracking time.
                </p>
              </div>
            ) : (
              <AutoSizer
                renderProp={({ height, width }) => {
                  if (!height || !width) return null;
                  return (
                    <List<RowExtraProps>
                      style={{ width, height }}
                      rowCount={flatRows.length}
                      rowHeight={getItemSize}
                      overscanCount={15}
                      rowProps={rowProps}
                      rowComponent={VirtualRow}
                    />
                  );
                }}
              />
            )}
          </div>
        </>
      ) : (
        /* Analytics Tab */
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <Suspense fallback={<div className="h-48 rounded-xl border border-border-light dark:border-border-dark animate-pulse bg-surface-light-elevated dark:bg-surface-dark-elevated" />}>
            <ActivityHeatmap />
          </Suspense>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div className="h-48 rounded-xl border border-border-light dark:border-border-dark animate-pulse bg-surface-light-elevated dark:bg-surface-dark-elevated" />}>
              <ModuleUsageChart />
            </Suspense>
            <Suspense fallback={<div className="h-48 rounded-xl border border-border-light dark:border-border-dark animate-pulse bg-surface-light-elevated dark:bg-surface-dark-elevated" />}>
              <ProductivityTrends />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
