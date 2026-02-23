/**
 * ToastContainer Component
 *
 * Renders global toast notifications from useToastStore
 * Positioned at bottom-left to avoid overlap with UndoToast (bottom-right)
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToasts, useToastStore, type Toast, type ToastType } from '../stores/useToastStore';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAnnounce } from '../hooks/useAnnounce';

/**
 * Icon and color config for each toast type
 */
const TOAST_CONFIG: Record<
  ToastType,
  {
    icon: React.FC<{ className?: string }>;
    bgClass: string;
    iconClass: string;
  }
> = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-gradient-to-br from-status-success/20 to-status-success/10',
    iconClass: 'text-status-success',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-gradient-to-br from-status-error/20 to-status-error/10',
    iconClass: 'text-status-error',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-gradient-to-br from-status-warning/20 to-status-warning/10',
    iconClass: 'text-status-warning',
  },
  info: {
    icon: Info,
    bgClass: 'bg-gradient-to-br from-accent-blue/20 to-accent-blue/10',
    iconClass: 'text-accent-blue',
  },
};

/**
 * Single Toast Item
 */
interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -50, scale: 0.9 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -50, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto"
    >
      <div
        className={`
          flex items-start gap-3 p-3 min-w-[280px] max-w-sm
          bg-surface-light dark:bg-surface-dark
          border border-border-light dark:border-border-dark
          rounded-button shadow-lg
        `}
        role="alert"
        aria-live="polite"
      >
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full
            ${config.bgClass}
            flex items-center justify-center
          `}
        >
          <Icon className={`w-4 h-4 ${config.iconClass}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
            {toast.message}
          </p>
          {toast.description && (
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
              {toast.description}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="
            flex-shrink-0 p-1 rounded
            text-text-light-tertiary dark:text-text-dark-tertiary
            hover:text-text-light-primary dark:hover:text-text-dark-primary
            hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated
            transition-all duration-150
          "
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * ToastContainer Component
 * Renders all active toasts
 */
export const ToastContainer: React.FC = () => {
  const toasts = useToasts();
  const dismissToast = useToastStore((state) => state.dismissToast);
  const announce = useAnnounce();
  const prevToastIdsRef = useRef<Set<string>>(new Set());

  // Announce new toasts to screen readers
  useEffect(() => {
    const currentIds = new Set(toasts.map((t) => t.id));
    for (const toast of toasts) {
      if (!prevToastIdsRef.current.has(toast.id)) {
        announce(toast.message);
      }
    }
    prevToastIdsRef.current = currentIds;
  }, [toasts, announce]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 p-6 z-50 pointer-events-none"
      aria-label="Notifications"
    >
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
