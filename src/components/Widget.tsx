import React, { useState, useCallback } from 'react';
import type { WidgetProps } from '../types';
import { WidgetControls } from './WidgetControls';
import { WidgetSettingsModal } from './WidgetSettingsModal';
import { useDragHandle } from '../hooks/useDragHandle';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './ui';

/**
 * Widget component - consistent wrapper for full-page widgets
 *
 * Features:
 * - Header with title, category, and controls
 * - Optional loading state with spinner
 * - Optional error state with retry button
 * - Settings modal integration
 */
export const Widget: React.FC<WidgetProps> = ({
  id,
  title,
  category,
  className = '',
  children,
  headerAccessory,
  draggable = true,
  loading = false,
  error = null,
  onRefresh,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get drag handle from SortableWidget context (if wrapped)
  const dragHandle = useDragHandle();

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Minimum 500ms for visual feedback
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [onRefresh, isRefreshing]);

  // Render loading state
  const renderLoading = () => (
    <div className="flex-1 flex items-center justify-center">
      <LoadingSpinner size="md" message="Loading..." />
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center max-w-[280px] px-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-sm text-accent-red dark:text-accent-red">
          {error}
        </p>
        {onRefresh && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshing}
            loadingText="Retrying..."
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
    <div
      id={id}
      className={`h-full flex flex-col border border-border-light dark:border-border-dark rounded-button bg-transparent ${className}`}
      data-widget-id={id}
      data-category={category}
    >
      {/* Widget Header - Draggable via cursor (no icon, entire header is drag handle) */}
      <div
        className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between gap-2 sm:gap-4 ${
          dragHandle && draggable ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        {...(dragHandle && draggable ? { ...dragHandle.attributes, ...dragHandle.listeners } : {})}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-md font-semibold text-text-light-primary dark:text-text-dark-primary truncate">
            {title}
          </h2>
          {category && (
            <span className="text-[10px] sm:text-xs text-text-light-secondary dark:text-text-dark-secondary uppercase">
              {category}
            </span>
          )}
        </div>

        {/* Header Accessory */}
        {headerAccessory && (
          <div className="flex-shrink-0">
            {headerAccessory}
          </div>
        )}

        {/* Refresh Button (when onRefresh provided) */}
        {onRefresh && !loading && !error && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-shrink-0 p-1.5 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded transition-all disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh widget"
          >
            <span className={`text-lg ${isRefreshing ? 'animate-spin inline-block' : ''}`}>
              🔄
            </span>
          </button>
        )}

        {/* Widget Controls */}
        {draggable && (
          <div className="flex-shrink-0">
            <WidgetControls
              widgetId={id}
              draggable={true}
              onSettings={handleSettings}
            />
          </div>
        )}
      </div>

      {/* Widget Content - with loading/error state handling */}
      <div className="flex-1 overflow-hidden">
        {loading ? renderLoading() : error ? renderError() : children}
      </div>
    </div>

      {/* Widget Settings Modal */}
      {showSettingsModal && (
        <WidgetSettingsModal
          widgetId={id}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </>
  );
};
