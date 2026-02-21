/**
 * Navigation Buttons Component
 *
 * Browser-like back/forward navigation buttons that track page history.
 * Supports Alt+Left/Right keyboard shortcuts.
 */

import React, { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigationHistoryStore } from '../stores/useNavigationHistoryStore';
import { useShortcut } from '../hooks/useShortcut';

export const NavigationButtons: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const push = useNavigationHistoryStore((s) => s.push);
  const goBack = useNavigationHistoryStore((s) => s.goBack);
  const goForward = useNavigationHistoryStore((s) => s.goForward);
  const canGoBack = useNavigationHistoryStore((s) => s.canGoBack);
  const canGoForward = useNavigationHistoryStore((s) => s.canGoForward);
  const completeNavigation = useNavigationHistoryStore((s) => s.completeNavigation);

  // Track route changes
  useEffect(() => {
    const fullPath = location.pathname + location.search;
    push(fullPath);
    completeNavigation();
  }, [location.pathname, location.search, push, completeNavigation]);

  const handleGoBack = useCallback(() => {
    const path = goBack();
    if (path) {
      navigate(path);
    }
  }, [goBack, navigate]);

  const handleGoForward = useCallback(() => {
    const path = goForward();
    if (path) {
      navigate(path);
    }
  }, [goForward, navigate]);

  // Register Alt+Left and Alt+Right shortcuts
  useShortcut({
    id: 'nav-go-back',
    keys: ['alt', 'ArrowLeft'],
    label: 'Go back',
    description: 'Navigate to previous page',
    handler: handleGoBack,
    priority: 30,
    allowInInput: true,
  });

  useShortcut({
    id: 'nav-go-forward',
    keys: ['alt', 'ArrowRight'],
    label: 'Go forward',
    description: 'Navigate to next page',
    handler: handleGoForward,
    priority: 30,
    allowInInput: true,
  });

  const backEnabled = canGoBack();
  const forwardEnabled = canGoForward();

  // Don't render if there's no history at all
  if (!backEnabled && !forwardEnabled) return null;

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleGoBack}
        disabled={!backEnabled}
        className={`
          p-1.5 rounded-md transition-colors
          ${backEnabled
            ? 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            : 'text-text-light-secondary/30 dark:text-text-dark-secondary/30 cursor-not-allowed'
          }
        `}
        title="Go back (Alt+Left)"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <button
        onClick={handleGoForward}
        disabled={!forwardEnabled}
        className={`
          p-1.5 rounded-md transition-colors
          ${forwardEnabled
            ? 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
            : 'text-text-light-secondary/30 dark:text-text-dark-secondary/30 cursor-not-allowed'
          }
        `}
        title="Go forward (Alt+Right)"
        aria-label="Go forward"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
