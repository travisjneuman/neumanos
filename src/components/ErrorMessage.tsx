import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export interface ErrorMessageProps {
  /**
   * Error title/heading
   */
  title: string;

  /**
   * Error description/message
   */
  message: string;

  /**
   * Optional technical error details (collapsible)
   */
  details?: string;

  /**
   * Optional retry handler
   */
  onRetry?: () => void;

  /**
   * Optional dismiss handler
   */
  onDismiss?: () => void;

  /**
   * Error severity level
   * @default 'error'
   */
  variant?: 'error' | 'warning' | 'info';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Custom className
   */
  className?: string;
}

const variantConfig = {
  error: {
    background: 'bg-accent-red/10 dark:bg-accent-red/20',
    border: 'border-accent-red/50 dark:border-accent-red/60',
    icon: 'text-accent-red',
    title: 'text-accent-red dark:text-accent-red',
    message: 'text-accent-red/80 dark:text-accent-red/90',
  },
  warning: {
    background: 'bg-accent-yellow/10 dark:bg-accent-yellow/20',
    border: 'border-accent-yellow/50 dark:border-accent-yellow/60',
    icon: 'text-accent-yellow',
    title: 'text-accent-yellow dark:text-accent-yellow',
    message: 'text-accent-yellow/80 dark:text-accent-yellow/90',
  },
  info: {
    background: 'bg-accent-blue/10 dark:bg-accent-blue/20',
    border: 'border-accent-blue/50 dark:border-accent-blue/60',
    icon: 'text-accent-blue',
    title: 'text-accent-blue dark:text-accent-blue',
    message: 'text-accent-blue/80 dark:text-accent-blue/90',
  },
};

const sizeConfig = {
  sm: {
    padding: 'p-3',
    icon: 'w-5 h-5',
    title: 'text-sm',
    message: 'text-xs',
    button: 'text-xs px-2 py-1',
  },
  md: {
    padding: 'p-4',
    icon: 'w-6 h-6',
    title: 'text-base',
    message: 'text-sm',
    button: 'text-sm px-3 py-1.5',
  },
  lg: {
    padding: 'p-6',
    icon: 'w-8 h-8',
    title: 'text-xl',
    message: 'text-base',
    button: 'text-base px-4 py-2',
  },
};

/**
 * ErrorMessage - Comprehensive error display component with retry and details
 *
 * @example
 * // Simple error
 * <ErrorMessage
 *   title="Import Failed"
 *   message="The ICS file could not be imported. Please check the file format and try again."
 *   onRetry={() => retryImport()}
 * />
 *
 * @example
 * // With technical details
 * <ErrorMessage
 *   title="Connection Error"
 *   message="Failed to connect to the server"
 *   details={error.stack}
 *   onRetry={() => reconnect()}
 * />
 *
 * @example
 * // Warning variant
 * <ErrorMessage
 *   variant="warning"
 *   title="Storage Almost Full"
 *   message="You've used 90% of your browser storage. Consider exporting and deleting old data."
 * />
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  details,
  onRetry,
  onDismiss,
  variant = 'error',
  size = 'md',
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const variantStyles = variantConfig[variant];
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={`${sizeStyles.padding} ${variantStyles.background} ${variantStyles.border} border-2 rounded-lg ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <AlertCircle className={`${sizeStyles.icon} ${variantStyles.icon} flex-shrink-0 mt-0.5`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`${sizeStyles.title} font-bold ${variantStyles.title} mb-1`}>
            {title}
          </h3>

          {/* Message */}
          <p className={`${sizeStyles.message} ${variantStyles.message}`}>
            {message}
          </p>

          {/* Technical Details (Collapsible) */}
          {details && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`${sizeStyles.button} flex items-center gap-1 ${variantStyles.message} hover:opacity-75 transition-opacity font-medium`}
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show details
                  </>
                )}
              </button>

              {showDetails && (
                <div className="mt-2 p-3 bg-surface-light dark:bg-surface-dark-elevated rounded border border-border-light dark:border-border-dark overflow-auto max-h-40">
                  <pre className="text-xs text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap break-words font-mono">
                    {details}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2 mt-4">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`${sizeStyles.button} inline-flex items-center gap-1 ${variantStyles.message} bg-surface-light dark:bg-surface-dark hover:opacity-75 border border-current rounded transition-opacity font-medium`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`${sizeStyles.button} ${variantStyles.message} hover:opacity-75 transition-opacity`}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
