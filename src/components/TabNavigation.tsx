/**
 * TabNavigation Component
 *
 * Reusable tab navigation component for page-level navigation.
 * Provides consistent styling and behavior across all tabbed pages.
 *
 * Features:
 * - Consistent styling with semantic tokens
 * - Keyboard navigation (Arrow keys, Home, End)
 * - ARIA roles for accessibility
 * - Icon + label support
 * - Responsive wrapping
 */

import { useCallback, useRef, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface Tab {
  /** Unique identifier for the tab (used in URL query params) */
  id: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
}

interface TabNavigationProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for the tablist */
  ariaLabel?: string;
}

/**
 * TabNavigation provides consistent tab navigation across pages.
 *
 * @example
 * const tabs: Tab[] = [
 *   { id: 'calendar', label: 'Calendar', icon: Calendar },
 *   { id: 'timer', label: 'Timer', icon: Timer },
 * ];
 *
 * <TabNavigation
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={handleTabChange}
 *   ariaLabel="Schedule navigation"
 * />
 */
export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  ariaLabel = 'Page navigation',
}: TabNavigationProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let newIndex = index;

      switch (event.key) {
        case 'ArrowLeft':
          newIndex = index > 0 ? index - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          newIndex = index < tabs.length - 1 ? index + 1 : 0;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      tabRefs.current[newIndex]?.focus();
      onTabChange(tabs[newIndex].id);
    },
    [tabs, onTabChange]
  );

  return (
    <div
      className={`mb-6 border-b border-border-light dark:border-border-dark ${className}`}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1 flex-wrap"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TabNavigation;
