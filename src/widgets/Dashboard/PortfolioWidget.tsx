/**
 * Portfolio Dashboard Widget
 *
 * Compact view of project health and task counts for the dashboard.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useProjectContextStore } from '../../stores/useProjectContextStore';

function getHealthDot(completionPercent: number, overdueCount: number): string {
  if (overdueCount > 3) return 'bg-accent-red';
  if (overdueCount > 0) return 'bg-accent-yellow';
  if (completionPercent >= 75) return 'bg-accent-green';
  if (completionPercent >= 40) return 'bg-accent-yellow';
  return 'bg-accent-red';
}

export function PortfolioWidget() {
  const navigate = useNavigate();
  const tasks = useKanbanStore((s) => s.tasks);
  const allProjects = useProjectContextStore((s) => s.getAllActiveProjects());

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const projectStats = useMemo(() => {
    return allProjects.slice(0, 6).map((project) => {
      const projectTasks = tasks.filter((t) => t.projectIds?.includes(project.id));
      const totalCount = projectTasks.length;
      const doneCount = projectTasks.filter((t) => t.status === 'done').length;
      const overdueCount = projectTasks.filter(
        (t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr
      ).length;
      const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
      const openCount = totalCount - doneCount;

      return {
        id: project.id,
        name: project.name,
        color: project.color,
        icon: project.icon,
        totalCount,
        openCount,
        doneCount,
        overdueCount,
        completionPercent,
        healthClass: getHealthDot(completionPercent, overdueCount),
      };
    });
  }, [allProjects, tasks, todayStr]);

  if (allProjects.length === 0) {
    return (
      <div className="text-center py-4 text-text-light-secondary dark:text-text-dark-secondary text-sm">
        No projects yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projectStats.map((p) => (
        <button
          key={p.id}
          onClick={() => navigate('/portfolio')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-left"
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.healthClass}`} />
          {p.icon && <span className="text-sm flex-shrink-0">{p.icon}</span>}
          <span className="flex-1 text-sm truncate text-text-light-primary dark:text-text-dark-primary">
            {p.name}
          </span>
          <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex-shrink-0">
            {p.openCount} open
          </span>
          {p.overdueCount > 0 && (
            <span className="text-xs text-accent-red font-medium flex-shrink-0">
              {p.overdueCount} late
            </span>
          )}
        </button>
      ))}

      {allProjects.length > 6 && (
        <button
          onClick={() => navigate('/portfolio')}
          className="w-full text-xs text-accent-blue hover:underline text-center pt-1"
        >
          View all {allProjects.length} projects
        </button>
      )}
    </div>
  );
}
