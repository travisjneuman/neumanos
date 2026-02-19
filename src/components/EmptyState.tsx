import React from 'react';
import { Button } from './ui';

export interface EmptyStateProps {
  /**
   * Icon to display (from lucide-react)
   */
  icon: React.ComponentType<{ className?: string }>;

  /**
   * Main heading text
   */
  title: string;

  /**
   * Description or explanation text
   */
  description: string;

  /**
   * Optional call-to-action button
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };

  /**
   * Optional secondary action button
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

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

const sizeConfig = {
  sm: {
    container: 'py-8',
    iconWrapper: 'p-4',
    icon: 'w-10 h-10',
    title: 'text-lg',
    description: 'text-sm',
    button: 'text-sm px-4 py-2',
  },
  md: {
    container: 'py-12',
    iconWrapper: 'p-6',
    icon: 'w-16 h-16',
    title: 'text-2xl',
    description: 'text-base',
    button: 'text-base px-6 py-3',
  },
  lg: {
    container: 'py-16',
    iconWrapper: 'p-8',
    icon: 'w-20 h-20',
    title: 'text-3xl',
    description: 'text-lg',
    button: 'text-lg px-8 py-4',
  },
};

/**
 * EmptyState - Friendly empty state component with icon, message, and CTA
 *
 * @example
 * // Basic empty state
 * <EmptyState
 *   icon={FileText}
 *   title="No notes yet"
 *   description="Start capturing your thoughts and ideas"
 *   action={{
 *     label: "Create your first note",
 *     onClick: () => createNote()
 *   }}
 * />
 *
 * @example
 * // With secondary action
 * <EmptyState
 *   icon={ClipboardList}
 *   title="No tasks in this column"
 *   description="Drag tasks here or create a new one"
 *   action={{
 *     label: "Add Task",
 *     onClick: () => addTask()
 *   }}
 *   secondaryAction={{
 *     label: "Learn more",
 *     onClick: () => openHelp()
 *   }}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}) => {
  const config = sizeConfig[size];

  return (
    <div className={`text-center ${config.container} ${className} animate-fade-in`}>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className={`${config.iconWrapper} bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 dark:from-accent-primary/10 dark:to-accent-primary/10 rounded-2xl`}>
          <Icon className={`${config.icon} text-accent-primary`} />
        </div>
      </div>

      {/* Title */}
      <h3 className={`${config.title} font-bold text-text-light-primary dark:text-text-dark-primary mb-3`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`${config.description} text-text-light-secondary dark:text-text-dark-secondary mb-6 max-w-md mx-auto`}>
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {action && (
            <Button
              variant={action.variant === 'secondary' ? 'outline' : 'primary'}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
