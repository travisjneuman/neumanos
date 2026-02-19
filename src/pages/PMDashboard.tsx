/**
 * PM Dashboard Page
 *
 * Comprehensive project management dashboard with:
 * - Project selector dropdown
 * - ProjectHealthCard with key metrics
 * - BurndownChart for sprint progress
 * - ResourceUtilizationChart
 * - Upcoming deadlines list
 * - Recent activity feed
 * - Blocked tasks list
 *
 * Route: /pm
 */

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  AlertTriangle,
  Activity,
  Clock,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useProjectContextStore } from '../stores/useProjectContextStore';
import { ProjectHealthCard } from '../components/pm/ProjectHealthCard';
import { BurndownChart } from '../components/charts/BurndownChart';
import { ResourceUtilizationChart } from '../components/charts/ResourceUtilizationChart';
import { PageContent } from '../components/PageContent';

// Sprint date range (default to current month)
function getDefaultSprintDates(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

export function PMDashboard() {
  const tasks = useKanbanStore((s) => s.tasks);
  const projects = useProjectContextStore((s) => s.projects);

  // Project filter state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Sprint date range
  const [sprintDates] = useState(getDefaultSprintDates);

  // Filter tasks by selected project
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectIds?.includes(selectedProjectId));
  }, [tasks, selectedProjectId]);

  // Get upcoming deadlines (tasks with due dates in next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return filteredTasks
      .filter((task) => {
        if (task.status === 'done') return false;
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= weekFromNow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!);
        const dateB = new Date(b.dueDate!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  }, [filteredTasks]);

  // Get blocked tasks (customStatus === 'blocked' or has incomplete dependencies)
  const blockedTasks = useMemo(() => {
    return filteredTasks
      .filter((task) => {
        if (task.status === 'done') return false;
        // Check if blocked status
        if (task.customStatus === 'blocked') return true;
        // Check if has blocking dependencies
        if (task.dependencies && task.dependencies.length > 0) {
          return task.dependencies.some((dep) => {
            const blockingTask = tasks.find((t) => t.id === dep.taskId);
            return blockingTask && blockingTask.status !== 'done';
          });
        }
        return false;
      })
      .slice(0, 5);
  }, [filteredTasks, tasks]);

  // Get recent activity (tasks with recent changes)
  const recentActivity = useMemo(() => {
    return filteredTasks
      .filter((task) => task.activityLog && task.activityLog.length > 0)
      .flatMap((task) =>
        (task.activityLog || []).map((log) => ({
          ...log,
          taskTitle: task.title,
          taskId: task.id,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 8);
  }, [filteredTasks]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === 'done').length;
    const inProgress = filteredTasks.filter(
      (t) => t.status === 'inprogress'
    ).length;
    const overdue = filteredTasks.filter((t) => {
      if (t.status === 'done' || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    return { total, completed, inProgress, overdue };
  }, [filteredTasks]);

  // Get selected project name
  const selectedProjectName =
    selectedProjectId === 'all'
      ? 'All Projects'
      : projects.find((p) => p.id === selectedProjectId)?.name || 'All Projects';

  return (
    <PageContent page="pm-dashboard">
      {/* Header with Project Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-accent-primary" />
          <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            PM Dashboard
          </h1>
        </div>

        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary transition-colors"
          >
            <Filter className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {selectedProjectName}
            </span>
            <ChevronDown className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          </button>

          {showProjectDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProjectDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedProjectId('all');
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary transition-colors ${
                    selectedProjectId === 'all'
                      ? 'text-accent-primary font-medium'
                      : 'text-text-light-primary dark:text-text-dark-primary'
                  }`}
                >
                  All Projects
                </button>
                {projects
                  .filter((p) => !p.archivedAt)
                  .map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary transition-colors flex items-center gap-2 ${
                        selectedProjectId === project.id
                          ? 'text-accent-primary font-medium'
                          : 'text-text-light-primary dark:text-text-dark-primary'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl border border-border-light dark:border-border-dark">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Total Tasks
          </p>
          <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            {stats.total}
          </p>
        </div>
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl border border-border-light dark:border-border-dark">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Completed
          </p>
          <p className="text-2xl font-bold text-status-success">
            {stats.completed}
          </p>
        </div>
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl border border-border-light dark:border-border-dark">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
            In Progress
          </p>
          <p className="text-2xl font-bold text-accent-primary">
            {stats.inProgress}
          </p>
        </div>
        <div className="p-4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl border border-border-light dark:border-border-dark">
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Overdue
          </p>
          <p className="text-2xl font-bold text-status-error">
            {stats.overdue}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1: Health Card + Burndown */}
        <div className="bento-card p-4">
          <ProjectHealthCard
            tasks={filteredTasks}
            projectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
          />
        </div>

        <div className="bento-card p-4">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Sprint Burndown
          </h3>
          <BurndownChart
            tasks={filteredTasks}
            sprintStart={sprintDates.start}
            sprintEnd={sprintDates.end}
            height={200}
          />
        </div>

        {/* Row 2: Resource Utilization + Upcoming Deadlines */}
        <div className="bento-card p-4">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Resource Utilization
          </h3>
          <ResourceUtilizationChart height={200} />
        </div>

        <div className="bento-card p-4">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming Deadlines
          </h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary py-8 text-center">
              No upcoming deadlines
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-light dark:bg-surface-dark"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      {new Date(task.dueDate!).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-status-error/10 text-status-error'
                        : task.priority === 'medium'
                          ? 'bg-status-warning/10 text-status-warning'
                          : 'bg-status-info/10 text-status-info'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Recent Activity + Blocked Tasks */}
        <div className="bento-card p-4">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary py-8 text-center">
              No recent activity
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.map((activity, idx) => (
                <div
                  key={`${activity.id}-${idx}`}
                  className="flex items-start gap-2 p-2 rounded-lg bg-surface-light dark:bg-surface-dark"
                >
                  <div className="w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="w-3 h-3 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-light-primary dark:text-text-dark-primary">
                      <span className="font-medium">{activity.taskTitle}</span>
                      <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                        {' '}
                        – {activity.action}
                        {activity.field && ` (${activity.field})`}
                      </span>
                    </p>
                    <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bento-card p-4">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            Blocked Tasks
          </h3>
          {blockedTasks.length === 0 ? (
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary py-8 text-center">
              No blocked tasks
            </p>
          ) : (
            <div className="space-y-2">
              {blockedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-status-warning/5 border border-status-warning/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                      {task.title}
                    </p>
                    {task.dependencies && task.dependencies.length > 0 && (
                      <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                        Blocked by {task.dependencies.length} task
                        {task.dependencies.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContent>
  );
}

export default PMDashboard;
