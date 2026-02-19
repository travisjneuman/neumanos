import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Optional message to display below the spinner
   */
  message?: string;

  /**
   * Whether to center the spinner in its container
   * @default false
   */
  center?: boolean;

  /**
   * Whether to show full-screen overlay (useful for page-level loading)
   * @default false
   */
  fullScreen?: boolean;

  /**
   * Custom className for additional styling
   */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

/**
 * LoadingSpinner - Reusable loading indicator with optional message
 *
 * @example
 * // Simple spinner
 * <LoadingSpinner />
 *
 * @example
 * // With message
 * <LoadingSpinner message="Loading your notes..." />
 *
 * @example
 * // Centered
 * <LoadingSpinner center message="Please wait..." />
 *
 * @example
 * // Full-screen loading overlay
 * <LoadingSpinner fullScreen message="Importing calendar..." />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  center = false,
  fullScreen = false,
  className = '',
}) => {
  const spinnerContent = (
    <div className={`flex flex-col items-center gap-3 ${center ? 'justify-center' : ''} ${className}`}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-accent-primary`}
        aria-label="Loading"
      />
      {message && (
        <p className={`${textSizeClasses[size]} text-text-light-secondary dark:text-text-dark-secondary text-center max-w-md`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-sm">
        {spinnerContent}
      </div>
    );
  }

  if (center) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};
