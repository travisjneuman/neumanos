import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BottomNavItem {
  icon: string;
  label: string;
  path: string;
}

const mainItems: BottomNavItem[] = [
  { icon: '\u{1F3E0}', label: 'Home', path: '/' },
  { icon: '\u2713', label: 'Tasks', path: '/tasks' },
  { icon: '\u{1F4DD}', label: 'Notes', path: '/notes' },
  { icon: '\u{1F4C5}', label: 'Calendar', path: '/schedule' },
];

const moreItems: BottomNavItem[] = [
  { icon: '\u{1F4CA}', label: 'Activity', path: '/activity' },
  { icon: '\u{1F517}', label: 'Links', path: '/links' },
  { icon: '\u2728', label: 'Create', path: '/create' },
  { icon: '\u{1F3AF}', label: 'Focus', path: '/focus' },
  { icon: '\u2699\uFE0F', label: 'Settings', path: '/settings' },
  { icon: '\u{1F4C6}', label: 'Today', path: '/today' },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isActive = useCallback(
    (path: string) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  // Check if current route is in the "more" section
  const isMoreActive = moreItems.some((item) => isActive(item.path));

  // Close "more" sheet on route change
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  // Close "more" sheet on Escape key
  useEffect(() => {
    if (!showMore) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMore(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMore]);

  return (
    <>
      {/* More sheet backdrop */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[49] backdrop-blur-sm"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {/* More sheet - slides up from bottom */}
      <div
        className={`
          md:hidden fixed bottom-[60px] left-0 right-0 z-50
          bg-surface-light dark:bg-surface-dark
          border-t border-border-light dark:border-border-dark
          rounded-t-2xl shadow-2xl
          transition-transform duration-200 ease-out
          ${showMore ? 'translate-y-0' : 'translate-y-full'}
        `}
        role="dialog"
        aria-label="More navigation options"
        aria-hidden={!showMore}
      >
        <div className="p-4 pb-2">
          {/* Handle indicator */}
          <div className="w-8 h-1 bg-border-light dark:bg-border-dark rounded-full mx-auto mb-4" />

          <div className="grid grid-cols-3 gap-2">
            {moreItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-1.5
                  min-h-[64px] rounded-xl
                  transition-colors duration-150
                  ${
                    isActive(item.path)
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                  }
                `}
                onClick={() => setShowMore(false)}
              >
                <span className="text-xl" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark"
        aria-label="Mobile navigation"
      >
        <div className="flex items-stretch justify-around h-[60px]">
          {mainItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-0.5
                  min-w-[56px] min-h-[44px] flex-1
                  transition-colors duration-150
                  ${
                    active
                      ? 'text-accent-primary'
                      : 'text-text-light-secondary dark:text-text-dark-secondary'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                <span className="text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore((prev) => !prev)}
            className={`
              flex flex-col items-center justify-center gap-0.5
              min-w-[56px] min-h-[44px] flex-1
              transition-colors duration-150
              ${
                showMore || isMoreActive
                  ? 'text-accent-primary'
                  : 'text-text-light-secondary dark:text-text-dark-secondary'
              }
            `}
            aria-expanded={showMore}
            aria-label="More navigation options"
          >
            <span className="text-lg" aria-hidden="true">
              {showMore ? '\u2715' : '\u2022\u2022\u2022'}
            </span>
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom,0px)] bg-surface-light dark:bg-surface-dark" />
      </nav>
    </>
  );
};
