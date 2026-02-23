import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { StoreErrorBoundary } from './components/StoreErrorBoundary';
import { UndoToastContainer } from './components/UndoToast';
import { ToastContainer } from './components/ToastContainer';
import { useUndoStore } from './stores/useUndoStore';
import { useSettingsStore } from './stores/useSettingsStore';

// Lazy load OnboardingModal (only shown to first-time users)
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

// Lazy load all pages for code splitting (including Dashboard)
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Tasks = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.Tasks })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Notes = lazy(() => import('./pages/Notes').then((m) => ({ default: m.Notes })));
// GraphView is now rendered as a tab within Notes page, redirect handles /graph route
// Diagrams and Forms are now rendered as tabs within Create page, redirects handle legacy routes
const DiagramEditor = lazy(() => import('./pages/DiagramEditor'));
const FormBuilder = lazy(() => import('./pages/FormBuilder'));
const FormFiller = lazy(() => import('./pages/FormFiller'));
const FormResponses = lazy(() => import('./pages/FormResponses'));
const TimeTracking = lazy(() => import('./pages/TimeTracking').then((m) => ({ default: m.TimeTracking })));
const LinkLibrary = lazy(() => import('./pages/LinkLibrary'));
const Automations = lazy(() => import('./pages/Automations').then((m) => ({ default: m.Automations })));
const Today = lazy(() => import('./pages/Today').then((m) => ({ default: m.Today })));
const Focus = lazy(() => import('./pages/Focus').then((m) => ({ default: m.Focus })));
// Habits is now rendered as a tab within Tasks page, redirect handles /habits route
// Create page (formerly Docs) - contains docs, diagrams, and forms as tabs
const Create = lazy(() => import('./pages/Docs').then((m) => ({ default: m.Docs })));
// PM Dashboard - Project management overview
const PMDashboard = lazy(() => import('./pages/PMDashboard').then((m) => ({ default: m.PMDashboard })));
const ActivityFeed = lazy(() => import('./pages/ActivityFeed').then((m) => ({ default: m.ActivityFeed })));
const Energy = lazy(() => import('./pages/Energy').then((m) => ({ default: m.Energy })));
const Portfolio = lazy(() => import('./pages/Portfolio').then((m) => ({ default: m.Portfolio })));
const WeeklyRetrospective = lazy(() => import('./pages/WeeklyRetrospective').then((m) => ({ default: m.WeeklyRetrospective })));
const Availability = lazy(() => import('./pages/Availability'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-cyan border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">Loading...</p>
    </div>
  </div>
);

/**
 * Main App Component with React Router
 * Uses Layout component to provide consistent header/footer
 */
function App() {
  // Get undo toasts from store
  const toasts = useUndoStore((state) => state.toasts);
  const dismissToast = useUndoStore((state) => state.dismissToast);

  // First-time onboarding
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);
  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);

  // Run migration and initialize auto-save on app startup
  useEffect(() => {
    const initialize = async () => {
      // Dynamic import migration service (only needed once for legacy users)
      const { isMigrationNeeded, migrateToIndexedDB } = await import('./services/migration');

      // Run migration if needed
      if (isMigrationNeeded()) {
        console.log('🚀 Migration needed, starting...');
        const result = await migrateToIndexedDB();
        if (result.success) {
          console.log('✅ Migration complete');
        } else {
          console.error('❌ Migration failed:', result.errors);
        }
      }

      // Initialize auto-save (dynamic import to reduce main bundle)
      const { autoSaveManager } = await import('./services/autoSave');
      await autoSaveManager.initialize();
    };

    initialize();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/today"
              element={
                <StoreErrorBoundary storeName="calendar">
                  <Today />
                </StoreErrorBoundary>
              }
            />
            <Route
              path="/notes"
              element={
                <StoreErrorBoundary storeName="notes">
                  <Notes />
                </StoreErrorBoundary>
              }
            />
            {/* Phase 5: Redirect /graph to /notes?tab=graph */}
            <Route
              path="/graph"
              element={<Navigate to="/notes?tab=graph" replace />}
            />
            {/* Phase 5: Redirect /diagrams to /create?tab=diagrams */}
            <Route
              path="/diagrams"
              element={<Navigate to="/create?tab=diagrams" replace />}
            />
            <Route
              path="/diagrams/:id"
              element={
                <StoreErrorBoundary storeName="diagrams">
                  <DiagramEditor />
                </StoreErrorBoundary>
              }
            />
            {/* Phase 5: Redirect /forms to /create?tab=forms */}
            <Route
              path="/forms"
              element={<Navigate to="/create?tab=forms" replace />}
            />
            <Route
              path="/forms/:id/edit"
              element={
                <StoreErrorBoundary storeName="forms">
                  <FormBuilder />
                </StoreErrorBoundary>
              }
            />
            <Route
              path="/forms/:id/fill"
              element={
                <StoreErrorBoundary storeName="forms">
                  <FormFiller />
                </StoreErrorBoundary>
              }
            />
            <Route
              path="/forms/:id/responses"
              element={
                <StoreErrorBoundary storeName="forms">
                  <FormResponses />
                </StoreErrorBoundary>
              }
            />
            <Route
              path="/tasks"
              element={
                <StoreErrorBoundary storeName="kanban">
                  <Tasks />
                </StoreErrorBoundary>
              }
            />
            {/* PM Dashboard - Project management overview */}
            <Route
              path="/pm"
              element={
                <StoreErrorBoundary storeName="kanban">
                  <PMDashboard />
                </StoreErrorBoundary>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/schedule"
              element={
                <StoreErrorBoundary storeName="calendar">
                  <TimeTracking />
                </StoreErrorBoundary>
              }
            />
            <Route path="/links" element={<LinkLibrary />} />
            <Route
              path="/automations"
              element={
                <StoreErrorBoundary storeName="automation">
                  <Automations />
                </StoreErrorBoundary>
              }
            />
            {/* Activity Feed */}
            <Route path="/activity" element={<ActivityFeed />} />
            {/* Portfolio */}
            <Route path="/portfolio" element={<Portfolio />} />
            {/* Energy Tracking */}
            <Route path="/energy" element={<Energy />} />
            {/* Weekly Retrospective */}
            <Route path="/retrospective" element={<WeeklyRetrospective />} />
            {/* Availability sharing */}
            <Route path="/availability" element={<Availability />} />
            {/* Focus mode - full-screen, no layout wrapper */}
            <Route path="/focus" element={<Focus />} />
            {/* Phase 5: Redirect /habits to /tasks?tab=habits */}
            <Route
              path="/habits"
              element={<Navigate to="/tasks?tab=habits" replace />}
            />
            {/* Phase 5: Redirect /docs to /create */}
            <Route
              path="/docs"
              element={<Navigate to="/create" replace />}
            />
            {/* Create page (formerly Docs) */}
            <Route
              path="/create"
              element={
                <StoreErrorBoundary storeName="docs">
                  <Create />
                </StoreErrorBoundary>
              }
            />
            <Route
              path="/create/:id"
              element={
                <StoreErrorBoundary storeName="docs">
                  <Create />
                </StoreErrorBoundary>
              }
            />
            <Route
              path="/create/platform/:id"
              element={
                <StoreErrorBoundary storeName="docs">
                  <Create />
                </StoreErrorBoundary>
              }
            />
          </Routes>
        </Suspense>
      </Layout>

      {/* Undo Toast Container - Global across all pages (bottom-right) */}
      <UndoToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* General Toast Container - Global notifications (bottom-left) */}
      <ToastContainer />

      {/* First-Time Onboarding Modal - includes backup setup for compatible browsers */}
      {/* Only render when needed (lazy loads only for new users) */}
      {!onboardingComplete && (
        <Suspense fallback={null}>
          <OnboardingModal
            isOpen={true}
            onClose={() => setOnboardingComplete(true)}
          />
        </Suspense>
      )}
    </BrowserRouter>
  );
}

export default App;
