/**
 * usePWA Hook
 *
 * Manages PWA lifecycle: install prompts, update detection, and offline status.
 * Works with vite-plugin-pwa's virtual:pwa-register module.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export interface PWAState {
  /** Whether the app can be installed (beforeinstallprompt fired) */
  canInstall: boolean;
  /** Whether the app is already installed */
  isInstalled: boolean;
  /** Whether a new version is available */
  needsUpdate: boolean;
  /** Whether the browser is offline */
  isOffline: boolean;
  /** Whether the service worker is ready */
  isReady: boolean;
}

export interface PWAActions {
  /** Trigger the install prompt */
  install: () => Promise<boolean>;
  /** Apply the pending update (reloads the page) */
  applyUpdate: () => void;
  /** Dismiss the install prompt */
  dismissInstall: () => void;
  /** Dismiss the update notification */
  dismissUpdate: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Store install prompt event globally so it persists across re-renders
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function usePWA(): PWAState & PWAActions {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  // Track whether there's actually a waiting service worker
  const [hasWaitingWorker, setHasWaitingWorker] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Register service worker with vite-plugin-pwa
  const {
    needRefresh: [needsUpdate, setNeedsUpdate],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (import.meta.env.DEV) console.log('[PWA] Service worker registered:', registration);
      registrationRef.current = registration || null;
      // Check if there's actually a waiting worker
      if (registration?.waiting) {
        if (import.meta.env.DEV) console.log('[PWA] Waiting service worker found');
        setHasWaitingWorker(true);
      } else {
        if (import.meta.env.DEV) console.log('[PWA] No waiting service worker');
        setHasWaitingWorker(false);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error);
    },
    onOfflineReady() {
      if (import.meta.env.DEV) console.log('[PWA] App ready to work offline');
    },
    onNeedRefresh() {
      if (import.meta.env.DEV) console.log('[PWA] New content available signal received');
      // Verify there's actually a waiting worker before showing the prompt
      // vite-plugin-pwa can fire this even when there's no waiting worker
      const reg = registrationRef.current;
      if (reg?.waiting) {
        if (import.meta.env.DEV) console.log('[PWA] Confirmed: waiting worker exists, showing update prompt');
        setHasWaitingWorker(true);
      } else {
        if (import.meta.env.DEV) console.log('[PWA] False positive: no waiting worker, ignoring update signal');
        setHasWaitingWorker(false);
        // Dismiss the false positive
        setNeedsUpdate(false);
      }
    },
  });

  // Check if app is installed (display-mode: standalone)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    setIsInstalled(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      if (import.meta.env.DEV) console.log('[PWA] Install prompt captured');
    };

    const handleAppInstalled = () => {
      deferredInstallPrompt = null;
      setCanInstall(false);
      setIsInstalled(true);
      if (import.meta.env.DEV) console.log('[PWA] App was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install action
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredInstallPrompt) {
      if (import.meta.env.DEV) console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      await deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;

      if (outcome === 'accepted') {
        if (import.meta.env.DEV) console.log('[PWA] User accepted install prompt');
        deferredInstallPrompt = null;
        setCanInstall(false);
        return true;
      } else {
        if (import.meta.env.DEV) console.log('[PWA] User dismissed install prompt');
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }, []);

  // Apply update action
  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    // Verify there's actually a waiting worker before attempting update
    if (!reg?.waiting) {
      if (import.meta.env.DEV) console.log('[PWA] No waiting worker to activate, dismissing notification');
      setNeedsUpdate(false);
      setHasWaitingWorker(false);
      return;
    }
    if (import.meta.env.DEV) console.log('[PWA] Activating waiting service worker');
    updateServiceWorker(true);
  }, [updateServiceWorker, setNeedsUpdate]);

  // Dismiss actions
  const dismissInstall = useCallback(() => {
    setInstallDismissed(true);
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateDismissed(true);
    setNeedsUpdate(false);
  }, [setNeedsUpdate]);

  return {
    canInstall: canInstall && !installDismissed && !isInstalled,
    isInstalled,
    // Only show update prompt if there's actually a waiting worker
    needsUpdate: needsUpdate && hasWaitingWorker && !updateDismissed,
    isOffline,
    isReady: offlineReady,
    install,
    applyUpdate,
    dismissInstall,
    dismissUpdate,
  };
}

export default usePWA;
