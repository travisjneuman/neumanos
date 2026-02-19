/**
 * IconButton Component
 * Button optimized for icon-only use with proper accessibility
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label (required for icon-only buttons) */
  'aria-label': string;
  /** Visual style variant */
  variant?: IconButtonVariant;
  /** Size preset */
  size?: IconButtonSize;
  /** The icon to render */
  icon: ReactNode;
  /** Loading state */
  loading?: boolean;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary:
    'bg-accent-primary text-white dark:text-text-dark-primary hover:opacity-90',
  secondary:
    'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:text-text-light-primary dark:hover:text-text-dark-primary',
  ghost:
    'bg-transparent text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:text-text-light-primary dark:hover:text-text-dark-primary',
  danger:
    'bg-transparent text-text-light-secondary dark:text-text-dark-secondary hover:bg-accent-red/10 hover:text-accent-red',
};

const sizeStyles: Record<IconButtonSize, { button: string; icon: string }> = {
  xs: { button: 'p-1', icon: 'w-3 h-3' },
  sm: { button: 'p-1.5', icon: 'w-4 h-4' },
  md: { button: 'p-2', icon: 'w-5 h-5' },
  lg: { button: 'p-2.5', icon: 'w-6 h-6' },
};

/**
 * IconButton for icon-only actions with proper accessibility
 *
 * @example
 * <IconButton
 *   aria-label="Delete item"
 *   icon={<Trash2 />}
 *   variant="danger"
 *   onClick={handleDelete}
 * />
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      icon,
      loading = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const sizeStyle = sizeStyles[size];

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          rounded-button
          transition-all duration-standard ease-smooth
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyle.button}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {loading ? (
          <LoadingSpinner className={sizeStyle.icon} />
        ) : (
          <span className={`flex-shrink-0 ${sizeStyle.icon}`}>{icon}</span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

/** Simple loading spinner */
function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default IconButton;
