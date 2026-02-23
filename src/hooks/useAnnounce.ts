/**
 * useAnnounce Hook
 *
 * Provides programmatic screen reader announcements via an aria-live region.
 * Creates a visually hidden div with aria-live="polite" appended to document.body.
 * Returns an announce(message) function that injects text for screen readers.
 *
 * Usage:
 * const announce = useAnnounce();
 * announce('File saved successfully');
 */

import { useCallback, useEffect, useRef } from 'react';

const ANNOUNCER_ID = 'neumanos-sr-announcer';

/**
 * Get or create the shared announcer element on document.body
 */
function getOrCreateAnnouncer(): HTMLDivElement {
  let el = document.getElementById(ANNOUNCER_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = ANNOUNCER_ID;
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('role', 'status');
    // Visually hidden but accessible to screen readers
    Object.assign(el.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: '0',
    });
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Hook that returns an announce function for screen reader announcements
 */
export function useAnnounce(): (message: string) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string) => {
    const announcer = getOrCreateAnnouncer();

    // Clear previous content first so repeated identical messages still trigger
    announcer.textContent = '';

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new message after a microtask to ensure the clear is processed
    timeoutRef.current = setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }, []);

  return announce;
}
