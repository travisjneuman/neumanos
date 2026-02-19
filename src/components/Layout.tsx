import React, { Suspense, lazy, useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { PageHeader } from './PageHeader';
import { Footer as SaveStatusFooter } from './Footer';
import { ErrorToastContainer } from './ErrorToast';
import { PWAPrompts } from './PWAPrompts';
import { OfflineIndicator } from './OfflineIndicator';
import { useSidebarStore } from '../stores/useSidebarStore';
import { useTerminalStore } from '../stores/useTerminalStore';
import { useProjectContextStore } from '../stores/useProjectContextStore';
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';
import { useShortcut } from '../hooks/useShortcut';

// Lazy load heavy components to reduce initial bundle size
// AITerminal: 900KB+ of AI provider SDKs
const AITerminal = lazy(() => import('./AITerminal').then(m => ({ default: m.AITerminal })));
// CommandPalette: imports all stores for global search
const CommandPalette = lazy(() => import('./CommandPalette').then(m => ({ default: m.CommandPalette })));
// Modals: only needed when opened
const SupportModal = lazy(() => import('./SupportModal').then(m => ({ default: m.SupportModal })));
const AboutModal = lazy(() => import('./AboutModal').then(m => ({ default: m.AboutModal })));
const PrivacyModal = lazy(() => import('./PrivacyModal').then(m => ({ default: m.PrivacyModal })));
const OnboardingModal = lazy(() => import('./OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const QuickAddModal = lazy(() => import('../widgets/Kanban/QuickAddModal').then(m => ({ default: m.QuickAddModal })));

/**
 * Layout Component with Sidebar Navigation
 */
interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCollapsed, toggleMobileMenu } = useSidebarStore();
  const { isOpen: isTerminalOpen, toggleTerminal, hasOpenedTerminal } = useTerminalStore();
  const toggleProjectDropdown = useProjectContextStore((s) => s.toggleDropdown);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportModalTab, setSupportModalTab] = useState<'report' | 'help' | 'docs'>('report');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showQuickAddTask, setShowQuickAddTask] = useState(false);

  // Handler for opening support modal from command palette
  const handleOpenSupportModal = (tab: 'report' | 'help' | 'docs') => {
    setSupportModalTab(tab);
    setShowSupportModal(true);
    setShowCommandPalette(false);
  };

  // Handler for opening various modals from command palette
  const handleOpenModal = useCallback((modalId: string) => {
    setShowCommandPalette(false);
    switch (modalId) {
      case 'about':
        setShowAboutModal(true);
        break;
      case 'privacy':
        setShowPrivacyModal(true);
        break;
      case 'onboarding':
        setShowOnboardingModal(true);
        break;
      case 'support':
        setShowSupportModal(true);
        break;
      case 'quick-add':
        setShowQuickAddTask(true);
        break;
      default:
        break;
    }
  }, []);

  // Initialize global keyboard shortcut listener
  // This single listener dispatches to all registered shortcuts
  useGlobalShortcuts();

  // Register global shortcuts using the new system
  useShortcut({
    id: 'open-command-palette',
    keys: ['mod', 'k'],
    label: 'Open command palette',
    description: 'Search notes, tasks, and run actions',
    handler: useCallback(() => setShowCommandPalette(true), []),
    priority: 100,
  });

  useShortcut({
    id: 'open-help-f1',
    keys: ['f1'],
    label: 'Open help',
    description: 'Show keyboard shortcuts and documentation',
    handler: useCallback(() => setShowSupportModal(true), []),
    priority: 50,
  });

  useShortcut({
    id: 'open-help-slash',
    keys: ['mod', '/'],
    label: 'Open help',
    description: 'Show keyboard shortcuts and documentation',
    handler: useCallback(() => setShowSupportModal(true), []),
    priority: 50,
  });

  useShortcut({
    id: 'toggle-project-context',
    keys: ['mod', 'shift', 'p'],
    label: 'Toggle project context',
    description: 'Open project context dropdown',
    handler: toggleProjectDropdown,
    priority: 50,
  });

  useShortcut({
    id: 'quick-add-task',
    keys: ['c'],
    label: 'Quick add task',
    description: 'Create a new task from anywhere',
    handler: useCallback(() => setShowQuickAddTask(true), []),
    priority: 40,
  });

  return (
    <div className="app h-screen bg-surface-light dark:bg-surface-dark flex overflow-hidden">
      {/* Skip to main content link - visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent-blue focus:text-white focus:rounded-button focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Mobile hamburger button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-button bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark shadow-lg transition-all duration-standard ease-smooth"
        aria-label="Toggle navigation menu"
      >
        <span className="text-xl" aria-hidden="true">☰</span>
      </button>

      <Sidebar />

      {/* Main content area with margin for sidebar */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-200 overflow-x-hidden overflow-y-hidden
          ${/* Mobile: no margin (sidebars are overlays) */ ''}
          ml-0 mr-0
          ${/* Desktop: left margin for navigation sidebar */ ''}
          ${isCollapsed ? 'lg:ml-[60px]' : 'lg:ml-[210px]'}
          ${/* Desktop: right margin for AI terminal */ ''}
          ${isTerminalOpen ? 'lg:mr-[375px]' : 'lg:mr-0'}
        `}
      >
        {/* Sticky PageHeader - persists across page navigation */}
        <header className="sticky top-0 z-30 bg-surface-light dark:bg-surface-dark px-6 pt-6 pb-2">
          <PageHeader />
        </header>

        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className="flex-1 flex flex-col min-h-0 overflow-hidden focus:outline-none"
        >
          <div className="w-full h-full flex-1 flex flex-col min-h-0 px-6 pb-4">
            {children}
          </div>
        </main>
      </div>

      {/* Save Status Footer (floating pill at bottom-center) */}
      <SaveStatusFooter />

      {/* AI Terminal Toggle Button (floating action button - right edge, below header) */}
      {!isTerminalOpen && (
        <button
          onClick={toggleTerminal}
          className="fixed top-24 right-4 w-10 h-10 rounded-full bg-gradient-to-r from-accent-blue to-accent-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all z-40 flex items-center justify-center"
          title="AI Terminal (Ctrl+Shift+A)"
          aria-label="Toggle AI Terminal"
        >
          🤖
        </button>
      )}

      {/* AI Terminal Component (lazy loaded, deferred until first open) */}
      {/* hasOpenedTerminal tracks if terminal was ever opened - prevents ~100KB+ load until needed */}
      {(isTerminalOpen || hasOpenedTerminal) && (
        <Suspense fallback={null}>
          <AITerminal />
        </Suspense>
      )}

      {/* Error Toast Notifications */}
      <ErrorToastContainer />

      {/* Lazy-loaded modals - wrapped in Suspense for code splitting */}
      <Suspense fallback={null}>
        {/* Global Support Modal (F1 or Cmd+Ctrl+/) */}
        {showSupportModal && (
          <SupportModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
            initialTab={supportModalTab}
          />
        )}

        {/* About Modal */}
        {showAboutModal && (
          <AboutModal onClose={() => setShowAboutModal(false)} />
        )}

        {/* Privacy Modal */}
        {showPrivacyModal && (
          <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
        )}

        {/* Onboarding Modal */}
        {showOnboardingModal && (
          <OnboardingModal
            isOpen={showOnboardingModal}
            onClose={() => setShowOnboardingModal(false)}
          />
        )}

        {/* Synapse - Neural Search (Cmd+K / Ctrl+K) */}
        {showCommandPalette && (
          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            onOpenSupportModal={handleOpenSupportModal}
            onOpenModal={handleOpenModal}
          />
        )}

        {/* Quick Add Task Modal (C key shortcut) */}
        {showQuickAddTask && (
          <QuickAddModal
            isOpen={showQuickAddTask}
            onClose={() => setShowQuickAddTask(false)}
          />
        )}
      </Suspense>

      {/* PWA Install and Update Prompts */}
      <PWAPrompts />

      {/* Offline Indicator (shows when network is unavailable) */}
      <OfflineIndicator />
    </div>
  );
};
