import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GanttView } from '../components/GanttView';
import { ExportTasksModal } from '../components/ExportTasksModal';
import { LayoutGrid, ChartGantt, FileDown, Target, Users } from 'lucide-react';
import { PageContent } from '../components/PageContent';
import { TabNavigation, type Tab } from '../components/TabNavigation';
import { HabitsContent } from './Habits';
import { ResourceUtilizationChart } from '../components/charts/ResourceUtilizationChart';

// Lazy load Kanban widget
const Kanban = lazy(() =>
  import('../widgets/Kanban').then((module) => ({ default: module.Kanban }))
);

// Loading fallback
const WidgetLoader = () => (
  <div className="bento-card p-6 h-[600px] animate-pulse">
    <div className="h-full bg-surface-light-elevated dark:bg-surface-dark-elevated rounded"></div>
  </div>
);

// Phase 5: Updated to use tabs (tasks, timeline, habits, resources) instead of views
type TabType = 'tasks' | 'timeline' | 'habits' | 'resources';

const VALID_TABS: TabType[] = ['tasks', 'timeline', 'habits', 'resources'];

// Tab configuration for TabNavigation component
const TASKS_TABS: Tab[] = [
  { id: 'tasks', label: 'Tasks', icon: LayoutGrid },
  { id: 'timeline', label: 'Timeline', icon: ChartGantt },
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'resources', label: 'Resources', icon: Users },
];

/**
 * Tasks Page - Kanban board, Gantt timeline, Habits tracking, and Resources
 * Full-featured task management with drag-and-drop, timeline views, habit tracking, and resource allocation
 *
 * Phase 5: Updated to use TabNavigation with 4 tabs (Tasks, Timeline, Habits, Resources)
 */
export const Tasks: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Read initial tab from URL query params
  // Supports both ?tab= (new) and ?view= (legacy) for backwards compatibility
  const getTabFromUrl = (): TabType => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && VALID_TABS.includes(tab as TabType)) {
      return tab as TabType;
    }
    // Legacy support: map ?view=kanban to tasks, ?view=gantt to timeline
    const view = params.get('view');
    if (view === 'kanban') return 'tasks';
    if (view === 'gantt') return 'timeline';
    return 'tasks'; // Default tab
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl);
  const [showExportModal, setShowExportModal] = useState(false);

  // Update tab when URL changes (e.g., from sidebar navigation)
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.search]);

  useEffect(() => {
    document.title = 'NeumanOS';
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/tasks?tab=${tab}`, { replace: true });
  };

  return (
    <PageContent page="tasks">
      {/* Tab Navigation with Export Button */}
      <div className="flex justify-between items-start mb-4">
        <TabNavigation
          tabs={TASKS_TABS}
          activeTab={activeTab}
          onTabChange={(tabId) => handleTabChange(tabId as TabType)}
          ariaLabel="Tasks navigation"
        />

        {/* Export Button - only show for tasks/timeline tabs */}
        {activeTab !== 'habits' && (
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-button border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            title="Export tasks to markdown"
          >
            <FileDown className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="min-h-[600px]"
      >
        {activeTab === 'tasks' && (
          <Suspense fallback={<WidgetLoader />}>
            <Kanban />
          </Suspense>
        )}
        {activeTab === 'timeline' && (
          <div className="h-full bento-card">
            <GanttView />
          </div>
        )}
        {activeTab === 'habits' && <HabitsContent />}
        {activeTab === 'resources' && (
          <div className="bento-card p-6">
            <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
              Resource Utilization
            </h2>
            <ResourceUtilizationChart height={400} />
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-4">
              Manage resources in Settings. Assign resources to tasks in the task detail panel.
            </p>
          </div>
        )}
      </div>

      {/* Export Tasks Modal */}
      <ExportTasksModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </PageContent>
  );
};
