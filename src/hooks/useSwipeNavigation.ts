import { useEffect, useRef } from 'react';
import { useSidebarStore } from '../stores/useSidebarStore';

/**
 * useSwipeNavigation
 *
 * Detects a right-swipe gesture starting from the left edge of the screen
 * (within 20px) and opens the mobile sidebar menu. This provides a native-feeling
 * navigation gesture on touch devices.
 */
export function useSwipeNavigation(): void {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only track touches starting near the left edge (within 20px)
      if (touch.clientX < 20) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Horizontal swipe > 50px and more horizontal than vertical
      if (deltaX > 50 && deltaX > deltaY) {
        useSidebarStore.getState().setMobileMenuOpen(true);
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
}
