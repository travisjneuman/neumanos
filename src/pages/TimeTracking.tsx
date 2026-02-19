import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  List,
  BarChart3,
  FolderOpen,
  Calendar,
  Timer,
  FileText,
  TrendingUp,
  Clock,
  Activity,
  Settings as SettingsIcon,
} from 'lucide-react';
import { TimeEntryList } from '../components/TimeEntryList';
import { TimeEntrySummary } from '../components/TimeEntrySummary';
import { EditTimeEntryModal } from '../components/EditTimeEntryModal';
import { EventCreateModal } from '../components/EventCreateModal';
import { ProjectManager } from '../components/ProjectManager';
import { TimeEntryCalendar } from '../components/TimeEntryCalendar';
import { TimeTrackingTimer } from '../components/TimeTrackingTimer';
import { InvoiceBuilder } from '../components/InvoiceBuilder';
import { AdvancedReports } from '../components/AdvancedReports';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { AutoTrackingSettings } from '../components/AutoTrackingSettings';
import { BillableRateSettings } from '../components/BillableRateSettings';
import { ProjectBillingSummary } from '../components/ProjectBillingSummary';
import { ExportTimeEntriesModal } from '../components/ExportTimeEntriesModal';
import { TabNavigation, type Tab } from '../components/TabNavigation';
import type { TimeEntry, CalendarEvent } from '../types';
import { PageContent } from '../components/PageContent';

// Main tabs: Calendar, Timer (with sub-sections), Pomodoro
type MainTabType = 'calendar' | 'timer' | 'pomodoro';

// Timer sub-sections (shown as sidebar when timer tab is active)
type TimerSectionType = 'timer' | 'entries' | 'summary' | 'projects' | 'invoices' | 'reports' | 'timeline' | 'settings';

const VALID_MAIN_TABS: MainTabType[] = ['calendar', 'timer', 'pomodoro'];
const VALID_TIMER_SECTIONS: TimerSectionType[] = ['timer', 'entries', 'summary', 'projects', 'invoices', 'reports', 'timeline', 'settings'];

// Main tab configuration
const SCHEDULE_TABS: Tab[] = [
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'timer', label: 'Time Tracking', icon: Timer },
  { id: 'pomodoro', label: 'Pomodoro', icon: Clock },
];

// Timer section configuration (sidebar items)
const TIMER_SECTIONS = [
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'entries', label: 'Entries', icon: List },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
  { id: 'timeline', label: 'Timeline', icon: Activity },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

/**
 * TimeTracking Page (Schedule)
 *
 * Main tabs:
 * - Calendar: Time entries + events calendar view
 * - Time Tracking: Full time tracking suite with sidebar navigation
 * - Pomodoro: Focus timer with breaks
 *
 * Time Tracking sub-sections:
 * - Timer: Active time tracking
 * - Entries: List view of all time entries
 * - Summary: Time entry analytics and charts
 * - Projects: Project management for time tracking
 * - Invoices: Generate invoices from tracked time
 * - Reports: Advanced reporting and analytics
 * - Timeline: Activity timeline view
 * - Settings: Auto-tracking configuration
 */
export function TimeTracking() {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse URL for main tab and timer section
  const getStateFromUrl = (): { mainTab: MainTabType; timerSection: TimerSectionType } => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const section = params.get('section');

    // Check if it's a valid main tab
    if (tab && VALID_MAIN_TABS.includes(tab as MainTabType)) {
      const mainTab = tab as MainTabType;
      // If timer tab, also check for section
      if (mainTab === 'timer' && section && VALID_TIMER_SECTIONS.includes(section as TimerSectionType)) {
        return { mainTab, timerSection: section as TimerSectionType };
      }
      return { mainTab, timerSection: 'timer' };
    }

    // Legacy support: map old tab names to new structure
    if (tab && VALID_TIMER_SECTIONS.includes(tab as TimerSectionType)) {
      return { mainTab: 'timer', timerSection: tab as TimerSectionType };
    }

    return { mainTab: 'calendar', timerSection: 'timer' };
  };

  const [state, setState] = useState(getStateFromUrl);
  const { mainTab, timerSection } = state;

  // Update state when URL changes
  useEffect(() => {
    const newState = getStateFromUrl();
    if (newState.mainTab !== mainTab || newState.timerSection !== timerSection) {
      setState(newState);
    }
  }, [location.search]);

  // Update URL when main tab changes
  const handleMainTabChange = (tab: MainTabType) => {
    setState({ mainTab: tab, timerSection: 'timer' });
    if (tab === 'timer') {
      navigate(`/schedule?tab=timer&section=timer`, { replace: true });
    } else {
      navigate(`/schedule?tab=${tab}`, { replace: true });
    }
  };

  // Update URL when timer section changes
  const handleTimerSectionChange = (section: TimerSectionType) => {
    setState({ mainTab: 'timer', timerSection: section });
    navigate(`/schedule?tab=timer&section=${section}`, { replace: true });
  };

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [eventModalData, setEventModalData] = useState<{ dateKey: string; event?: CalendarEvent } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <PageContent page="time-tracking">
      {/* Main Tab Navigation */}
      <TabNavigation
        tabs={SCHEDULE_TABS}
        activeTab={mainTab}
        onTabChange={(tabId) => handleMainTabChange(tabId as MainTabType)}
        ariaLabel="Schedule navigation"
      />

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${mainTab}`}
        aria-labelledby={`tab-${mainTab}`}
        className="min-h-[600px]"
      >
        {/* Calendar Tab */}
        {mainTab === 'calendar' && (
          <TimeEntryCalendar
            onEditEntry={(entry) => setEditingEntry(entry)}
            onCreateEvent={(dateKey) => setEventModalData({ dateKey })}
            onEditEvent={(event, dateKey) => setEventModalData({ dateKey, event })}
          />
        )}

        {/* Time Tracking Tab - with sidebar navigation */}
        {mainTab === 'timer' && (
          <div className="flex gap-4 h-[calc(100vh-16rem)]">
            {/* Timer Sections Sidebar */}
            <aside className="w-48 shrink-0 border-r border-border-light dark:border-border-dark pr-4">
              <nav className="space-y-1" aria-label="Time tracking sections">
                {TIMER_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = timerSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleTimerSectionChange(section.id as TimerSectionType)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-primary/10 text-accent-primary'
                          : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated hover:text-text-light-primary dark:hover:text-text-dark-primary'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Timer Section Content */}
            <main className="flex-1 overflow-auto">
              {timerSection === 'timer' && <TimeTrackingTimer />}
              {timerSection === 'entries' && (
                <div className="space-y-4">
                  {/* Export button header */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export CSV
                    </button>
                  </div>
                  <TimeEntryList onEditEntry={(entry) => setEditingEntry(entry)} />
                </div>
              )}
              {timerSection === 'summary' && (
                <div className="space-y-6">
                  <ProjectBillingSummary />
                  <TimeEntrySummary />
                </div>
              )}
              {timerSection === 'projects' && <ProjectManager />}
              {timerSection === 'invoices' && <InvoiceBuilder />}
              {timerSection === 'reports' && <AdvancedReports />}
              {timerSection === 'timeline' && <ActivityTimeline />}
              {timerSection === 'settings' && (
                <div className="space-y-8">
                  <BillableRateSettings />
                  <div className="border-t border-border-light dark:border-border-dark pt-8">
                    <AutoTrackingSettings />
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* Pomodoro Tab */}
        {mainTab === 'pomodoro' && <PomodoroTimer />}
      </div>

      {/* Edit Time Entry Modal */}
      {editingEntry && (
        <EditTimeEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {/* Create/Edit Event Modal */}
      {eventModalData && (
        <EventCreateModal
          dateKey={eventModalData.dateKey}
          event={eventModalData.event}
          onClose={() => setEventModalData(null)}
        />
      )}

      {/* Export Time Entries Modal */}
      {showExportModal && (
        <ExportTimeEntriesModal onClose={() => setShowExportModal(false)} />
      )}
    </PageContent>
  );
}
