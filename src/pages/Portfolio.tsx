/**
 * Portfolio Page
 *
 * Cross-project dashboard showing aggregate metrics,
 * health status, and timelines across all projects.
 *
 * Route: /portfolio
 */

import { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  GanttChart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useProjectContextStore } from '../stores/useProjectContextStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { PageContent } from '../components/PageContent';
import { PortfolioTimeline } from '../components/portfolio/PortfolioTimeline';
import { PortfolioMetrics } from '../components/portfolio/PortfolioMetrics';
import type { ProjectContext, Task } from '../types';

type ViewMode = 'cards' | 'list' | 'timeline';

interface ProjectSummary {
  project: ProjectContext;
  openCount: number;
  inProgressCount: number;
  doneCount: number;
  overdueCount: number;
  totalCount: number;
  completionPercent: number;
  health: 'green' | 'yellow' | 'red';
  hoursThisWeek: number;
  nextDeadline: string | null;
}

function getHealth(completionPercent: number, overdueCount: number): 'green' | 'yellow' | 'red' {
  if (overdueCount > 3) return 'red';
  if (overdueCount > 0) return 'yellow';
  if (completionPercent >= 75) return 'green';
  if (completionPercent >= 40) return 'yellow';
  return 'red';
}

function getHealthColor(health: 'green' | 'yellow' | 'red'): string {
  switch (health) {
    case 'green': return 'bg-accent-green';
    case 'yellow': return 'bg-accent-yellow';
    case 'red': return 'bg-accent-red';
  }
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function buildProjectSummaries(
  projects: ProjectContext[],
  tasks: Task[],
  timeEntries: { projectIds: string[]; startTime: string; duration: number }[],
): ProjectSummary[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekStart = getWeekStart();

  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectIds?.includes(project.id));
    const totalCount = projectTasks.length;

    const doneCount = projectTasks.filter((t) => t.status === 'done').length;
    const inProgressCount = projectTasks.filter((t) => t.status === 'inprogress').length;
    const overdueCount = projectTasks.filter(
      (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr
    ).length;
    const openCount = totalCount - doneCount - inProgressCount;

    const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    // Hours this week from time entries
    const hoursThisWeek = timeEntries
      .filter(
        (e) =>
          e.projectIds?.includes(project.id) &&
          new Date(e.startTime) >= weekStart
      )
      .reduce((sum, e) => sum + e.duration, 0) / 3600;

    // Next deadline
    const upcomingDueDates = projectTasks
      .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate >= todayStr)
      .map((t) => t.dueDate!)
      .sort();
    const nextDeadline = upcomingDueDates[0] ?? null;

    return {
      project,
      openCount,
      inProgressCount,
      doneCount,
      overdueCount,
      totalCount,
      completionPercent,
      health: getHealth(completionPercent, overdueCount),
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      nextDeadline,
    };
  });
}

// ============================================================================
// Card View
// ============================================================================

function ProjectCard({ summary }: { summary: ProjectSummary }) {
  const { project, openCount, inProgressCount, doneCount, overdueCount, completionPercent, health, hoursThisWeek, nextDeadline } = summary;

  return (
    <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${getHealthColor(health)}`} title={`Health: ${health}`} />
        {project.icon && <span className="text-lg">{project.icon}</span>}
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary truncate flex-1">
          {project.name}
        </h3>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: project.color + '22', color: project.color }}
        >
          {completionPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-surface-light dark:bg-surface-dark rounded-full mb-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getHealthColor(health)}`}
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* Task summary */}
      <div className="grid grid-cols-4 gap-2 text-xs mb-3">
        <div className="text-center">
          <div className="font-semibold text-text-light-primary dark:text-text-dark-primary">{openCount}</div>
          <div className="text-text-light-secondary dark:text-text-dark-secondary">Open</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-accent-blue">{inProgressCount}</div>
          <div className="text-text-light-secondary dark:text-text-dark-secondary">Active</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-accent-green">{doneCount}</div>
          <div className="text-text-light-secondary dark:text-text-dark-secondary">Done</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${overdueCount > 0 ? 'text-accent-red' : 'text-text-light-secondary dark:text-text-dark-secondary'}`}>
            {overdueCount}
          </div>
          <div className="text-text-light-secondary dark:text-text-dark-secondary">Late</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-light-secondary dark:text-text-dark-secondary border-t border-border-light dark:border-border-dark pt-2">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {hoursThisWeek}h this week
        </span>
        {nextDeadline && (
          <span className="flex items-center gap-1">
            {new Date(nextDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// List View
// ============================================================================

type SortKey = 'name' | 'completion' | 'overdue' | 'health' | 'hours';

function ListView({ summaries }: { summaries: ProjectSummary[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const arr = [...summaries];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.project.name.localeCompare(b.project.name); break;
        case 'completion': cmp = a.completionPercent - b.completionPercent; break;
        case 'overdue': cmp = a.overdueCount - b.overdueCount; break;
        case 'health': {
          const order = { green: 0, yellow: 1, red: 2 };
          cmp = order[a.health] - order[b.health];
          break;
        }
        case 'hours': cmp = a.hoursThisWeek - b.hoursThisWeek; break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [summaries, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const headerClass = 'cursor-pointer hover:text-text-light-primary dark:hover:text-text-dark-primary select-none';
  const indicator = (key: SortKey) => sortKey === key ? (sortAsc ? ' ^' : ' v') : '';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-light-secondary dark:text-text-dark-secondary border-b border-border-light dark:border-border-dark">
            <th className={`pb-2 pr-4 ${headerClass}`} onClick={() => handleSort('name')}>
              Project{indicator('name')}
            </th>
            <th className={`pb-2 pr-4 ${headerClass} text-center`} onClick={() => handleSort('health')}>
              Health{indicator('health')}
            </th>
            <th className={`pb-2 pr-4 ${headerClass} text-right`} onClick={() => handleSort('completion')}>
              Progress{indicator('completion')}
            </th>
            <th className="pb-2 pr-4 text-right">Open</th>
            <th className="pb-2 pr-4 text-right">Active</th>
            <th className="pb-2 pr-4 text-right">Done</th>
            <th className={`pb-2 pr-4 text-right ${headerClass}`} onClick={() => handleSort('overdue')}>
              Overdue{indicator('overdue')}
            </th>
            <th className={`pb-2 pr-4 text-right ${headerClass}`} onClick={() => handleSort('hours')}>
              Hours/wk{indicator('hours')}
            </th>
            <th className="pb-2 text-right">Next Deadline</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr
              key={s.project.id}
              className="border-b border-border-light/50 dark:border-border-dark/50 hover:bg-surface-light-elevated/50 dark:hover:bg-surface-dark-elevated/50"
            >
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.project.color }} />
                  {s.project.icon && <span>{s.project.icon}</span>}
                  <span className="font-medium text-text-light-primary dark:text-text-dark-primary">{s.project.name}</span>
                </div>
              </td>
              <td className="py-2.5 pr-4 text-center">
                <div className={`w-2.5 h-2.5 rounded-full mx-auto ${getHealthColor(s.health)}`} />
              </td>
              <td className="py-2.5 pr-4 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-16 h-1.5 bg-surface-light dark:bg-surface-dark rounded-full">
                    <div
                      className={`h-full rounded-full ${getHealthColor(s.health)}`}
                      style={{ width: `${s.completionPercent}%` }}
                    />
                  </div>
                  <span className="text-text-light-secondary dark:text-text-dark-secondary w-8 text-right">{s.completionPercent}%</span>
                </div>
              </td>
              <td className="py-2.5 pr-4 text-right text-text-light-secondary dark:text-text-dark-secondary">{s.openCount}</td>
              <td className="py-2.5 pr-4 text-right text-accent-blue">{s.inProgressCount}</td>
              <td className="py-2.5 pr-4 text-right text-accent-green">{s.doneCount}</td>
              <td className={`py-2.5 pr-4 text-right ${s.overdueCount > 0 ? 'text-accent-red font-medium' : 'text-text-light-secondary dark:text-text-dark-secondary'}`}>
                {s.overdueCount}
              </td>
              <td className="py-2.5 pr-4 text-right text-text-light-secondary dark:text-text-dark-secondary">{s.hoursThisWeek}h</td>
              <td className="py-2.5 text-right text-text-light-secondary dark:text-text-dark-secondary">
                {s.nextDeadline
                  ? new Date(s.nextDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function Portfolio() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const tasks = useKanbanStore((s) => s.tasks);
  const allProjects = useProjectContextStore((s) => s.getAllActiveProjects());
  const timeEntries = useTimeTrackingStore((s) => s.entries);

  const summaries = useMemo(
    () => buildProjectSummaries(allProjects, tasks, timeEntries),
    [allProjects, tasks, timeEntries]
  );

  // Overall metrics
  const totalTasks = summaries.reduce((sum, s) => sum + s.totalCount, 0);
  const totalHours = summaries.reduce((sum, s) => sum + s.hoursThisWeek, 0);
  const atRiskCount = summaries.filter((s) => s.health === 'red').length;

  const viewButtons: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'cards', icon: LayoutGrid, label: 'Cards' },
    { mode: 'list', icon: List, label: 'List' },
    { mode: 'timeline', icon: GanttChart, label: 'Timeline' },
  ];

  return (
    <PageContent page="portfolio">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Portfolio
            </h1>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Cross-project overview and health tracking
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark rounded-lg p-1">
            {viewButtons.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === mode
                    ? 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-primary dark:text-text-dark-primary shadow-sm'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overall metrics bar */}
        <div className="flex items-center gap-6 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-green" />
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {totalTasks} total tasks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-blue" />
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {Math.round(totalHours * 10) / 10}h this week
            </span>
          </div>
          {atRiskCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent-red" />
              <span className="text-accent-red font-medium">
                {atRiskCount} project{atRiskCount !== 1 ? 's' : ''} at risk
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-purple" />
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {allProjects.length} active project{allProjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Aggregate Metrics */}
        <PortfolioMetrics summaries={summaries} tasks={tasks} />

        {/* Content by view mode */}
        {allProjects.length === 0 ? (
          <div className="text-center py-16 text-text-light-secondary dark:text-text-dark-secondary">
            <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium mb-2">No projects yet</p>
            <p className="text-sm">Create projects in the project context menu to see them here.</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaries.map((s) => (
              <ProjectCard key={s.project.id} summary={s} />
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg p-4">
            <ListView summaries={summaries} />
          </div>
        ) : (
          <PortfolioTimeline summaries={summaries} tasks={tasks} />
        )}
      </div>
    </PageContent>
  );
}

export default Portfolio;
