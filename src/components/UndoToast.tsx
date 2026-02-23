import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number; // Auto-dismiss duration in ms (default: 10000)
}

/**
 * UndoToast Component
 * Shows a temporary notification with an undo action
 * Auto-dismisses after specified duration
 */
export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  onDismiss,
  duration = 10000,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const prefersReducedMotion = useReducedMotion();

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  // Dismiss when time expires (separate effect to avoid setState during render)
  useEffect(() => {
    if (timeRemaining === 0) {
      onDismiss();
    }
  }, [timeRemaining, onDismiss]);

  const handleUndo = () => {
    onUndo();
    onDismiss();
  };

  const progressPercent = (timeRemaining / duration) * 100;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="fixed bottom-6 right-6 z-50 min-w-[200px] max-w-sm"
      role="status"
      aria-live="polite"
    >
      {/* Toast Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button shadow-lg overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent-yellow to-accent-orange flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-light-primary dark:text-text-dark-primary font-medium truncate">
              {message}
            </p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
              {Math.ceil(timeRemaining / 1000)}s remaining
            </p>
          </div>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            className="flex-shrink-0 px-4 py-2 rounded-button bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium transition-all duration-200"
          >
            Undo
          </button>

          {/* Close Button */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-all duration-standard ease-smooth"
            aria-label="Dismiss"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-surface-light-elevated dark:bg-surface-dark-elevated">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

/**
 * UndoToastContainer Component
 * Manages multiple toast notifications
 */
interface ToastData {
  id: string;
  message: string;
  onUndo: () => void;
}

interface UndoToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const UndoToastContainer: React.FC<UndoToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-0 right-0 p-6 z-50 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, _index) => (
            <UndoToast
              key={toast.id}
              message={toast.message}
              onUndo={toast.onUndo}
              onDismiss={() => onDismiss(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
