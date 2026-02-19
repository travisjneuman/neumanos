import { useEffect, useRef } from 'react';
import type { Layouts, Layout } from 'react-grid-layout';

/**
 * Custom hook to dynamically adjust grid item heights based on content
 * Uses ResizeObserver to measure content and update layouts
 */
export const useDynamicGridHeight = (
  setLayouts: (updater: (layouts: Layouts) => Layouts) => void,
  rowHeight: number,
  enabled: boolean = true
) => {
  const observersRef = useRef<Map<string, ResizeObserver>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const updateItemHeight = (widgetId: string, contentHeight: number) => {
      // Calculate required rows (add 2 for header and padding)
      const headerHeight = 60; // Approximate header height
      const padding = 32; // Approximate padding
      const totalRequiredHeight = contentHeight + headerHeight + padding;
      const requiredRows = Math.ceil(totalRequiredHeight / rowHeight);

      // Update layouts for all breakpoints
      setLayouts((currentLayouts: Layouts) => {
        const newLayouts: Layouts = {};
        let hasChanges = false;

        Object.keys(currentLayouts).forEach((breakpoint) => {
          const breakpointLayout = currentLayouts[breakpoint];
          newLayouts[breakpoint] = breakpointLayout.map((item: Layout) => {
            if (item.i === widgetId) {
              // Only update if height is significantly different (avoid infinite loops)
              if (Math.abs(item.h - requiredRows) > 1) {
                hasChanges = true;
                return {
                  ...item,
                  h: Math.max(requiredRows, item.minH || 4),
                };
              }
            }
            return item;
          });
        });

        return hasChanges ? newLayouts : currentLayouts;
      });
    };

    // Set up observers for each widget
    const setupObservers = () => {
      const widgetIds = ['calendar', 'kanban', 'weather', 'map'];

      widgetIds.forEach((widgetId) => {
        const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (widgetElement) {
          const contentElement = widgetElement.querySelector('.widget-content');
          if (contentElement) {
            // Clean up existing observer
            if (observersRef.current.has(widgetId)) {
              observersRef.current.get(widgetId)?.disconnect();
            }

            // Create new observer
            const observer = new ResizeObserver((entries) => {
              for (const entry of entries) {
                // Use scrollHeight to get the full content height including overflow
                const element = entry.target as HTMLElement;
                const contentHeight = element.scrollHeight;
                updateItemHeight(widgetId, contentHeight);
              }
            });

            observer.observe(contentElement);
            observersRef.current.set(widgetId, observer);
          }
        }
      });
    };

    // Initial setup with delay to ensure DOM is ready
    const timeoutId = setTimeout(setupObservers, 500);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      observersRef.current.forEach((observer) => observer.disconnect());
      observersRef.current.clear();
    };
  }, [enabled, rowHeight, setLayouts]);
};
