import React, { Suspense, useEffect, useState, useMemo, lazy } from 'react';
import { indexedDBService } from '../services/indexedDB';
import { useWidgetStore } from '../stores/useWidgetStore';
import { WidgetManager } from '../components/WidgetManager';
import { PresetManager } from '../components/PresetManager';
import { BackgroundCustomizer, type BackgroundSettings } from '../components/BackgroundCustomizer';
import { SortableWidget } from '../components/SortableWidget';
import { WidgetErrorBoundary } from '../components/WidgetErrorBoundary';
import { DashboardTemplatePicker } from '../components/DashboardTemplatePicker';
// Masonry removed - using CSS Grid for proper column spanning support
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
// Centralized widget registry - single source of truth for all widgets
import { getWidgetComponentMap, registerCustomWidget } from '../widgets/Dashboard/WidgetRegistry';
import { logger } from '../services/logger';
import { getContentContrastClass } from '../utils/colorUtils';
import { PageContent } from '../components/PageContent';

// Lazy-load CustomWidgetBuilder - only needed when user opens the builder modal
const CustomWidgetBuilder = lazy(() => import('../components/CustomWidgetBuilder').then(m => ({ default: m.CustomWidgetBuilder })));

const log = logger.module('Dashboard');

// Loading fallback - improved skeleton with structure
const WidgetLoader = () => (
  <div className="h-64 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button overflow-hidden">
    {/* Header skeleton */}
    <div className="px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 w-24 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded animate-pulse" />
        <div className="h-3 w-16 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded animate-pulse mt-1" />
      </div>
      <div className="flex gap-1">
        <div className="w-6 h-6 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded animate-pulse" />
        <div className="w-6 h-6 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded animate-pulse" />
      </div>
    </div>
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <div className="h-4 w-full bg-surface-light-elevated dark:bg-surface-dark-elevated rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded animate-pulse" />
    </div>
  </div>
);

// Widget components are now loaded from the centralized WidgetRegistry
// See: src/widgets/Dashboard/WidgetRegistry.ts

/**
 * Dashboard Page - Personal overview
 */
export const Dashboard: React.FC = () => {
  const [hasData, setHasData] = useState(true);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showWidgetManager, setShowWidgetManager] = useState(false);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showBackgroundCustomizer, setShowBackgroundCustomizer] = useState(false);
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Background settings (persisted to localStorage)
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(() => {
    const saved = localStorage.getItem('dashboard-background');
    return saved
      ? JSON.parse(saved)
      : { type: 'none', value: '', opacity: 100, blur: 0 };
  });
  const enabledWidgets = useWidgetStore((state) => state.enabledWidgets);
  const widgetSizes = useWidgetStore((state) => state.widgetSizes);
  const reorderWidgets = useWidgetStore((state) => state.reorderWidgets);
  const customWidgets = useWidgetStore((state) => state.customWidgets);

  // Register custom widgets in the registry so they appear in the component map
  // Re-compute when customWidgets changes (add/remove/edit)
  const WIDGET_COMPONENTS = useMemo(() => {
    for (const cw of customWidgets) {
      registerCustomWidget(cw);
    }
    return getWidgetComponentMap();
  }, [customWidgets]);

  // Calculate content contrast class based on background luminance
  // This forces appropriate text colors when background contrasts with current theme
  const contentContrastClass = useMemo(() => {
    if (bgSettings.type === 'none' || !bgSettings.value) {
      return '';
    }
    return getContentContrastClass(bgSettings.value) || '';
  }, [bgSettings.type, bgSettings.value]);

  // Configure drag sensors with keyboard support for accessibility (WCAG 2.1)
  // Memoized to prevent DndContext re-initialization on each render
  const pointerSensorOptions = useMemo(() => ({
    activationConstraint: {
      distance: 5,
    },
  }), []);
  const keyboardSensorOptions = useMemo(() => ({
    coordinateGetter: sortableKeyboardCoordinates,
  }), []);
  const sensors = useSensors(
    useSensor(PointerSensor, pointerSensorOptions),
    useSensor(KeyboardSensor, keyboardSensorOptions)
  );

  // Handle drag start - track active widget for ghost preview
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end - reorder widgets
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = enabledWidgets.indexOf(active.id as string);
      const newIndex = enabledWidgets.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...enabledWidgets];
        const [movedItem] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, movedItem);
        reorderWidgets(newOrder);
      }
    }

    setActiveId(null);
  };

  useEffect(() => {
    document.title = 'NeumanOS';

    // Check for hash navigation (#customize-widgets)
    if (window.location.hash === '#customize-widgets') {
      setShowWidgetManager(true);
      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Check if user has any data
    const checkForData = async () => {
      try {
        const keys = await indexedDBService.getAllKeys();
        const hasAnyData = keys.length > 0;
        setHasData(hasAnyData);

        // Show backup reminder if no data AND not dismissed
        const dismissed = localStorage.getItem('dashboard-backup-reminder-dismissed');
        if (!hasAnyData && !dismissed) {
          setShowBackupReminder(true);
        }
      } catch (error) {
        log.error('Failed to check for data', { error });
      }
    };

    checkForData();
  }, []);

  const handleDismissReminder = () => {
    setShowBackupReminder(false);
    localStorage.setItem('dashboard-backup-reminder-dismissed', 'true');
  };

  const handleBackgroundChange = (newSettings: BackgroundSettings) => {
    setBgSettings(newSettings);
    localStorage.setItem('dashboard-background', JSON.stringify(newSettings));
  };

  return (
    <PageContent page="dashboard" className={`relative isolate ${contentContrastClass}`}>
      {/* Background Layer - z-0 so it appears behind content but visible */}
      {bgSettings.type !== 'none' && (
        <div
          className="dashboard-background fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: bgSettings.value,
            backgroundSize: bgSettings.type === 'image' ? 'cover' : undefined,
            backgroundPosition: bgSettings.type === 'image' ? 'center' : undefined,
            backgroundAttachment: 'fixed',
            opacity: bgSettings.opacity / 100,
            filter: `blur(${bgSettings.blur}px)`,
          }}
        />
      )}

      {/* Dashboard-specific customization toolbar */}
      <div className="relative z-10 flex justify-end gap-2 mb-4">
        <button
          onClick={() => setShowBackgroundCustomizer(true)}
          className="px-3 py-1.5 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors"
          title="Customize background"
        >
          🎨 Background
        </button>
        <button
          onClick={() => setShowWidgetBuilder(true)}
          className="px-3 py-1.5 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors"
          title="Create custom widget"
        >
          + Custom Widget
        </button>
        <button
          onClick={() => setShowPresetManager(true)}
          className="px-3 py-1.5 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark text-text-light-primary dark:text-text-dark-primary rounded-lg font-medium transition-colors"
          title="Manage layout presets"
        >
          📐 Presets
        </button>
      </div>

      {/* First-Time User Backup Reminder */}
      {showBackupReminder && !hasData && (
        <div className="mb-6 p-6 rounded-lg bg-accent-yellow/10 dark:bg-accent-yellow/20 border-2 border-accent-yellow">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-accent-yellow mb-2">
                Welcome to NeumanOS!
              </h3>
              <p className="text-sm text-text-light-primary dark:text-text-dark-primary mb-3">
                <strong>Important:</strong> Your data is stored locally in this browser. To protect your work, remember to create regular backups!
              </p>
              <div className="bg-surface-light dark:bg-surface-dark-elevated p-4 rounded-lg mb-4">
                <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
                  Quick Start:
                </p>
                <ol className="text-sm text-text-light-secondary dark:text-text-dark-secondary space-y-1 list-decimal list-inside ml-2">
                  <li>Start creating tasks, notes, and plans</li>
                  <li>When you have data to protect, go to Settings → Backup</li>
                  <li>Export your first backup (Chrome/Edge: enable Auto-Save!)</li>
                  <li>Store your .brain file somewhere safe (cloud, USB, etc.)</li>
                </ol>
              </div>
              <button
                onClick={handleDismissReminder}
                className="px-4 py-2 bg-accent-yellow hover:bg-accent-yellow-hover text-text-light-primary rounded-lg font-medium"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid Layout - CSS Grid with column spanning + drag-drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={enabledWidgets} strategy={verticalListSortingStrategy}>
          {enabledWidgets.length > 0 ? (
            <div className="dashboard-grid relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 auto-rows-min" style={{ gridAutoFlow: 'dense' }}>
              {enabledWidgets.map((widgetId) => {
                // Custom widgets use their full ID as the key
                const isCustomWidget = widgetId.startsWith('custom-');

                // Handle dynamic widget instances (e.g., github-1, github-2)
                const baseWidgetType = !isCustomWidget && widgetId.includes('-') && widgetId.match(/^([a-z]+)-\d+$/)
                  ? widgetId.split('-')[0]
                  : widgetId;

                const WidgetComponent = WIDGET_COMPONENTS[baseWidgetType];
                if (!WidgetComponent) return null;

                // Pass widgetId prop for dynamic instances and custom widgets
                const isDynamicInstance = isCustomWidget || widgetId !== baseWidgetType;

                // Get widget size (default to 1x)
                // In 2-column grid: 1x = 1 column (50%), 2x = 2 columns (100%), 3x = 2 columns (100%)
                const size = widgetSizes[widgetId] || 1;
                const sizeClass = size >= 2 ? 'md:col-span-2' : '';

                return (
                  <SortableWidget key={widgetId} id={widgetId} className={sizeClass}>
                    <WidgetErrorBoundary widgetId={widgetId}>
                      <Suspense fallback={<WidgetLoader />}>
                        {isDynamicInstance ? (
                          <WidgetComponent widgetId={widgetId} />
                        ) : (
                          <WidgetComponent />
                        )}
                      </Suspense>
                    </WidgetErrorBoundary>
                  </SortableWidget>
                );
              })}
            </div>
          ) : (
            <div className="relative z-10">
              <DashboardTemplatePicker
                onCustomize={() => setShowWidgetManager(true)}
              />
            </div>
          )}
        </SortableContext>

        {/* Ghost Preview during Drag */}
        <DragOverlay>
          {activeId ? (
            <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated border-2 border-accent-primary rounded-lg p-6 shadow-2xl opacity-80">
              <div className="flex items-center gap-2 text-text-light-primary dark:text-text-dark-primary font-medium">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-accent-primary"
                >
                  <circle cx="6" cy="4" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="4" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="8" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="8" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="12" r="1.5" fill="currentColor" />
                </svg>
                <span>Moving widget...</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Widget Manager Modal */}
      <WidgetManager isOpen={showWidgetManager} onClose={() => setShowWidgetManager(false)} />

      {/* Preset Manager Modal */}
      <PresetManager isOpen={showPresetManager} onClose={() => setShowPresetManager(false)} />

      {/* Background Customizer Modal */}
      <BackgroundCustomizer
        isOpen={showBackgroundCustomizer}
        onClose={() => setShowBackgroundCustomizer(false)}
        settings={bgSettings}
        onSettingsChange={handleBackgroundChange}
      />

      {/* Custom Widget Builder Modal (lazy-loaded, only renders when opened) */}
      {showWidgetBuilder && (
        <Suspense fallback={null}>
          <CustomWidgetBuilder
            isOpen={showWidgetBuilder}
            onClose={() => setShowWidgetBuilder(false)}
          />
        </Suspense>
      )}
    </PageContent>
  );
};
