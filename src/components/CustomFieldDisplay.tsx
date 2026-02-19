import type { FieldDefinition, TimelineValue } from '../types/customFields';
import { formatTimelineValueCompact } from './FormBuilder/TimelineFieldEditor';

/**
 * CustomFieldDisplay Component
 *
 * Compact display component for custom field values.
 * Used in Kanban cards and List view.
 *
 * Features:
 * - Handles all field types (text, number, checkbox, date, select, person, status, timeline, formula)
 * - Two variants: 'card' (badge style) and 'list' (plain text)
 * - Semantic token styling for dark mode
 * - ARIA labels for accessibility
 */

interface CustomFieldDisplayProps {
  field: FieldDefinition;
  value: any;
  variant?: 'card' | 'list';
  className?: string;
}

export function CustomFieldDisplay({
  field,
  value,
  variant = 'card',
  className = ''
}: CustomFieldDisplayProps) {
  // Don't render if value is empty
  if (value === null || value === undefined || value === '') {
    if (variant === 'list') {
      // In list view, show em dash for empty cells
      return <span className="text-text-light-secondary dark:text-text-dark-secondary">—</span>;
    }
    // In card view, don't render anything
    return null;
  }

  const formatValue = (): string => {
    switch (field.type) {
      case 'date':
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: variant === 'list' ? 'numeric' : undefined
        });
      case 'checkbox':
        return value ? '✓' : '✗';
      case 'number':
        return String(value);
      case 'person':
        // Person field: single or multiple
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return String(value);
      case 'status':
        // Status field: just the label (color handled separately)
        return String(value);
      case 'timeline':
        // Timeline field: compact date range
        return formatTimelineValueCompact(value as TimelineValue);
      case 'formula':
        // Formula field: computed value
        if (value === null || value === undefined) {
          return '—';
        }
        if (typeof value === 'number') {
          return value % 1 === 0 ? String(value) : value.toFixed(2);
        }
        return String(value);
      case 'text':
      case 'select':
      default:
        return String(value);
    }
  };

  const formattedValue = formatValue();

  // Special handling for status field with colored badge
  if (field.type === 'status' && field.statusOptions) {
    const statusOption = field.statusOptions.find((opt) => opt.label === value);
    if (statusOption) {
      if (variant === 'card') {
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded bg-${statusOption.color}/10 dark:bg-${statusOption.color}/20 text-${statusOption.color} dark:text-${statusOption.color}-hover font-medium ${className}`}
            title={`${field.name}: ${statusOption.label}`}
            aria-label={`${field.name}: ${statusOption.label}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-${statusOption.color} dark:bg-${statusOption.color}-hover mr-1`}></span>
            {statusOption.label}
          </span>
        );
      } else {
        return (
          <span
            className={`text-sm inline-flex items-center gap-1 ${className}`}
            aria-label={`${field.name}: ${statusOption.label}`}
          >
            <span className={`w-2 h-2 rounded-full bg-${statusOption.color} dark:bg-${statusOption.color}-hover`}></span>
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {statusOption.label}
            </span>
          </span>
        );
      }
    }
  }

  // Special handling for person field with multiple values
  if (field.type === 'person' && Array.isArray(value) && value.length > 0) {
    if (variant === 'card') {
      return (
        <span
          className={`text-xs px-2 py-0.5 rounded bg-accent-blue/10 dark:bg-accent-blue/20 text-accent-blue dark:text-accent-blue-hover font-medium ${className}`}
          title={`${field.name}: ${value.join(', ')}`}
          aria-label={`${field.name}: ${value.join(', ')}`}
        >
          {value.length === 1 ? value[0] : `${value.length} people`}
        </span>
      );
    }
  }

  // Card variant: Badge style with field name and value
  if (variant === 'card') {
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary font-medium ${className}`}
        title={`${field.name}: ${formattedValue}`}
        aria-label={`${field.name}: ${formattedValue}`}
      >
        {field.type === 'checkbox' ? (
          // Checkbox: Show checkmark + name
          <>{formattedValue} {field.name}</>
        ) : (
          // Other types: Show name: value
          <>{field.name}: {formattedValue}</>
        )}
      </span>
    );
  }

  // List variant: Plain text for table cells
  return (
    <span
      className={`text-sm text-text-light-secondary dark:text-text-dark-secondary ${className}`}
      aria-label={`${field.name}: ${formattedValue}`}
    >
      {formattedValue}
    </span>
  );
}
