/**
 * Toast Store
 *
 * Global toast notification system for user feedback
 * - Success, error, info, warning notifications
 * - Auto-dismiss with configurable duration
 * - Stack multiple toasts
 * - Accessible (aria-live regions)
 *
 * NOTE: This complements useUndoStore - use that for undo actions
 * Use this for general notifications without undo capability
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../services/logger';

const log = logger.module('ToastStore');

/**
 * Toast types for styling and icons
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string; // Optional longer description
  duration: number; // Auto-dismiss duration in ms
  createdAt: number;
}

/**
 * Toast Store State
 */
interface ToastStore {
  // State
  toasts: Toast[];

  // Actions
  addToast: (
    type: ToastType,
    message: string,
    options?: { description?: string; duration?: number }
  ) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;

  // Convenience methods
  success: (message: string, description?: string) => string;
  error: (message: string, description?: string) => string;
  warning: (message: string, description?: string) => string;
  info: (message: string, description?: string) => string;
}

/**
 * Default durations by toast type (ms)
 */
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  warning: 6000,
  error: 8000, // Errors stay longer
};

/**
 * Maximum number of toasts to show at once
 */
const MAX_TOASTS = 5;

/**
 * Create the Toast store
 * NOTE: This store is NOT persisted - toasts are temporary
 */
export const useToastStore = create<ToastStore>((set, get) => ({
  // Initial state
  toasts: [],

  /**
   * Add a new toast notification
   * Returns the toast ID
   */
  addToast: (type, message, options = {}) => {
    const id = uuidv4();
    const duration = options.duration ?? DEFAULT_DURATIONS[type];

    const toast: Toast = {
      id,
      type,
      message,
      description: options.description,
      duration,
      createdAt: Date.now(),
    };

    set((state) => {
      // Keep only the most recent MAX_TOASTS
      const existingToasts = state.toasts.slice(-(MAX_TOASTS - 1));
      return {
        toasts: [...existingToasts, toast],
      };
    });

    // Auto-dismiss after duration
    setTimeout(() => {
      get().dismissToast(id);
    }, duration);

    log.debug('Toast added', { id, type, message });
    return id;
  },

  /**
   * Dismiss a specific toast
   */
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
    log.debug('Toast dismissed', { id });
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    set({ toasts: [] });
    log.debug('All toasts dismissed');
  },

  // Convenience methods
  success: (message, description) => get().addToast('success', message, { description }),
  error: (message, description) => get().addToast('error', message, { description }),
  warning: (message, description) => get().addToast('warning', message, { description }),
  info: (message, description) => get().addToast('info', message, { description }),
}));

/**
 * Selector hooks for optimized re-renders
 */
export const useToasts = () => useToastStore((state) => state.toasts);
export const useHasToasts = () => useToastStore((state) => state.toasts.length > 0);

/**
 * Standalone toast function for use outside React components
 * Useful in services, stores, and async operations
 */
export const toast = {
  success: (message: string, description?: string) =>
    useToastStore.getState().success(message, description),
  error: (message: string, description?: string) =>
    useToastStore.getState().error(message, description),
  warning: (message: string, description?: string) =>
    useToastStore.getState().warning(message, description),
  info: (message: string, description?: string) =>
    useToastStore.getState().info(message, description),
  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
  dismissAll: () => useToastStore.getState().dismissAll(),
};
