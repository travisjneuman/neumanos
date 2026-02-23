/**
 * OfflineIndicator Component
 *
 * Shows a subtle indicator when the app is offline, and a brief
 * "Back online" toast when connectivity is restored.
 */

import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  /** Position variant */
  variant?: 'badge' | 'inline';
  /** Additional CSS classes */
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  variant = 'badge',
  className = '',
}) => {
  const { isOffline } = usePWA();
  const { showReconnected } = useOfflineStatus();

  // "Back online" reconnection toast
  if (showReconnected && !isOffline) {
    return (
      <div
        className={`
          fixed bottom-4 left-4 z-50
          flex items-center gap-2 px-3 py-2
          bg-status-success/90
          text-white rounded-lg shadow-lg
          backdrop-blur-sm
          animate-in fade-in slide-in-from-bottom-2
          ${className}
        `}
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">Back online</span>
      </div>
    );
  }

  if (!isOffline) return null;

  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-1.5 text-accent-yellow ${className}`}
        role="status"
        aria-live="polite"
      >
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline</span>
      </div>
    );
  }

  // Badge variant - floating indicator
  return (
    <div
      className={`
        fixed bottom-4 left-4 z-50
        flex items-center gap-2 px-3 py-2
        bg-accent-yellow/90
        text-white rounded-lg shadow-lg
        backdrop-blur-sm
        animate-in fade-in slide-in-from-bottom-2
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You're offline</span>
    </div>
  );
};

export default OfflineIndicator;
