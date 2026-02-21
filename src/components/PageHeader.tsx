import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getPageMetadata } from '../config/pageMetadata';
import { ProjectContextDropdown } from './ProjectContextDropdown';
import { Breadcrumbs } from './Breadcrumbs';
import { NavigationButtons } from './NavigationButtons';

/**
 * PageHeader Component
 *
 * Consistent page header with:
 * - Title and optional subtitle (left) - auto-detected from route or explicit props
 * - Optional action buttons (left, below title)
 * - Date & Time display (right) - full format with seconds, AM/PM, timezone
 *
 * Usage Modes:
 * 1. Auto-detect: <PageHeader /> - automatically uses title/subtitle from pageMetadata registry
 * 2. Explicit: <PageHeader title="Custom" subtitle="Description" /> - overrides auto-detect
 *
 * Responsive: Full format on desktop, compact on mobile.
 * Used across all pages for consistent layout.
 */

interface PageHeaderProps {
  title?: string; // Optional - auto-detected from route if not provided
  subtitle?: string; // Optional - auto-detected from route if not provided
  children?: React.ReactNode; // Action buttons or other content
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title: titleProp, subtitle: subtitleProp, children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-detect title/subtitle from route if not provided via props
  const pageMetadata = getPageMetadata(location.pathname);
  const title = titleProp ?? pageMetadata?.title ?? 'NeumanOS';
  const subtitle = subtitleProp ?? pageMetadata?.subtitle;
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second (for seconds display)
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get timezone abbreviation
  const timezone = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
    .formatToParts(currentTime)
    .find((part) => part.type === 'timeZoneName')?.value || '';

  // Format time with seconds, AM/PM
  const formatFullTime = () => {
    if (timeFormat === '24h') {
      return currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Format compact time (no seconds, for mobile)
  const formatCompactTime = () => {
    if (timeFormat === '24h') {
      return currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format full date with year (desktop)
  const fullDateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Format compact date (mobile)
  const compactDateString = currentTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Animation variants for title transitions
  const titleVariants = {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12 },
  };

  const subtitleVariants = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  };

  return (
    <div className="flex items-start justify-between gap-4 mb-4 sm:mb-8">
      {/* Left: Navigation, Breadcrumbs, Title, Subtitle, Actions */}
      <div className="flex-1 min-w-0">
        {/* Navigation bar: back/forward + breadcrumbs */}
        <div className="flex items-center gap-2 mb-1">
          <NavigationButtons />
          <Breadcrumbs />
        </div>
        <AnimatePresence mode="wait">
          <motion.h1
            key={`title-${location.pathname}`}
            variants={titleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-xl sm:text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-1"
          >
            {title}
          </motion.h1>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {subtitle && (
            <motion.p
              key={`subtitle-${location.pathname}`}
              variants={subtitleVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut', delay: 0.05 }}
              className="text-sm sm:text-base text-text-light-secondary dark:text-text-dark-secondary mb-2 sm:mb-3"
            >
              {subtitle}
            </motion.p>
          )}
        </AnimatePresence>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>

      {/* Right: Project Filter + Date & Time - Responsive */}
      <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
        {/* Global Project Context Filter */}
        {/* Desktop: Full dropdown */}
        <div className="hidden lg:block relative z-50">
          <ProjectContextDropdown />
        </div>
        {/* Mobile/Tablet: Compact dropdown */}
        <div className="lg:hidden relative z-50">
          <ProjectContextDropdown className="max-w-[120px]" />
        </div>

        {/* Date & Time - Click date to go to Today page */}
        <div className="text-right">
          {/* Desktop: Full format */}
          <div className="hidden md:block">
            <div className="text-2xl lg:text-3xl font-bold text-text-light-primary dark:text-text-dark-primary tabular-nums">
              {formatFullTime()} <span className="text-lg lg:text-xl font-medium text-text-light-secondary dark:text-text-dark-secondary">{timezone}</span>
            </div>
            <button
              onClick={() => navigate('/today')}
              className="text-sm lg:text-base text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary transition-colors cursor-pointer"
              title="Go to Today"
            >
              {fullDateString}
            </button>
          </div>
          {/* Mobile: Compact format */}
          <div className="md:hidden">
            <div className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary tabular-nums">
              {formatCompactTime()}
            </div>
            <button
              onClick={() => navigate('/today')}
              className="text-xs text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary transition-colors cursor-pointer"
              title="Go to Today"
            >
              {compactDateString}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
