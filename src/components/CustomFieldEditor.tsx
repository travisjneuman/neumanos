import { useState, useEffect } from 'react';
import type { FieldDefinition } from '../types/customFields';
import { validateFieldValue } from '../types/customFields';
import { PersonFieldEditor } from './FormBuilder/PersonFieldEditor';
import { StatusFieldEditor } from './FormBuilder/StatusFieldEditor';
import { TimelineFieldEditor } from './FormBuilder/TimelineFieldEditor';

/**
 * Custom Field Editor Component
 *
 * Renders the appropriate input control based on field type.
 * Handles validation and value changes.
 *
 * Supported field types:
 * - text: Single-line text input
 * - number: Number input (integer or decimal)
 * - date: Date picker
 * - select: Dropdown with predefined options
 * - checkbox: Boolean toggle
 * - person: Person selector with autocomplete (P2)
 * - status: Status dropdown with colored badges (P2)
 * - timeline: Date range picker (P2)
 * - formula: Computed field (read-only) (P2)
 */

interface CustomFieldEditorProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  allFields?: FieldDefinition[]; // For formula field preview
  className?: string;
}

export function CustomFieldEditor({ field, value, onChange, className = '' }: CustomFieldEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);

    // Validate
    const validation = validateFieldValue(field, newValue);
    if (!validation.valid) {
      setError(validation.error || 'Invalid value');
    } else {
      setError(null);
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    // Final validation on blur
    const validation = validateFieldValue(field, localValue);
    if (!validation.valid) {
      setError(validation.error || 'Invalid value');
    } else {
      setError(null);
    }
  };

  // Text field
  if (field.type === 'text') {
    return (
      <div className={className}>
        <input
          type="text"
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
          className={`w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
            error
              ? 'border-status-error dark:border-status-error'
              : 'border-border-light dark:border-border-dark'
          } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
          }`}
          aria-label={field.name}
          aria-required={field.required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Number field
  if (field.type === 'number') {
    return (
      <div className={className}>
        <input
          type="number"
          value={localValue ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseFloat(e.target.value);
            handleChange(val);
          }}
          onBlur={handleBlur}
          placeholder={field.description || `Enter ${field.name.toLowerCase()}`}
          step="any"
          className={`w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
            error
              ? 'border-status-error dark:border-status-error'
              : 'border-border-light dark:border-border-dark'
          } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
          }`}
          aria-label={field.name}
          aria-required={field.required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Date field
  if (field.type === 'date') {
    const dateValue =
      localValue instanceof Date
        ? localValue.toISOString().split('T')[0]
        : localValue
        ? new Date(localValue).toISOString().split('T')[0]
        : '';

    return (
      <div className={className}>
        <input
          type="date"
          value={dateValue}
          onChange={(e) => {
            const val = e.target.value ? new Date(e.target.value) : null;
            handleChange(val);
          }}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
            error
              ? 'border-status-error dark:border-status-error'
              : 'border-border-light dark:border-border-dark'
          } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
          }`}
          aria-label={field.name}
          aria-required={field.required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Select field
  if (field.type === 'select') {
    return (
      <div className={className}>
        <select
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
            error
              ? 'border-status-error dark:border-status-error'
              : 'border-border-light dark:border-border-dark'
          } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
          }`}
          aria-label={field.name}
          aria-required={field.required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        >
          <option value="">-- Select {field.name} --</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Multi-select field
  if (field.type === 'multi-select') {
    const selectedValues: string[] = Array.isArray(localValue) ? localValue : [];

    const toggleOption = (option: string) => {
      const newValues = selectedValues.includes(option)
        ? selectedValues.filter((v) => v !== option)
        : [...selectedValues, option];
      handleChange(newValues);
    };

    return (
      <div className={className}>
        <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg">
          {field.options?.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  isSelected
                    ? 'bg-accent-blue text-white'
                    : 'bg-surface-light dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-accent-blue/10 hover:text-accent-blue'
                }`}
              >
                {option}
              </button>
            );
          })}
          {(!field.options || field.options.length === 0) && (
            <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary italic">
              No options defined
            </span>
          )}
        </div>
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // URL field
  if (field.type === 'url') {
    return (
      <div className={className}>
        <div className="flex gap-2">
          <input
            type="url"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.description || 'https://example.com'}
            className={`flex-1 px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
              error
                ? 'border-status-error dark:border-status-error'
                : 'border-border-light dark:border-border-dark'
            } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
              error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
            }`}
            aria-label={field.name}
            aria-required={field.required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${field.id}-error` : undefined}
          />
          {localValue && !error && (
            <a
              href={localValue}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Open
            </a>
          )}
        </div>
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Email field
  if (field.type === 'email') {
    return (
      <div className={className}>
        <div className="flex gap-2">
          <input
            type="email"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.description || 'name@example.com'}
            className={`flex-1 px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border ${
              error
                ? 'border-status-error dark:border-status-error'
                : 'border-border-light dark:border-border-dark'
            } rounded-lg text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 ${
              error ? 'focus:ring-status-error' : 'focus:ring-accent-blue'
            }`}
            aria-label={field.name}
            aria-required={field.required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${field.id}-error` : undefined}
          />
          {localValue && !error && (
            <a
              href={`mailto:${localValue}`}
              className="px-3 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Send
            </a>
          )}
        </div>
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Checkbox field
  if (field.type === 'checkbox') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          type="checkbox"
          checked={localValue || false}
          onChange={(e) => handleChange(e.target.checked)}
          onBlur={handleBlur}
          className="w-4 h-4 rounded border-border-light dark:border-border-dark focus:ring-2 focus:ring-accent-blue"
          aria-label={field.name}
          aria-required={field.required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
        <label className="text-sm text-text-light-primary dark:text-text-dark-primary">
          {field.name}
          {field.required && <span className="text-status-error-text dark:text-status-error-text-dark ml-1">*</span>}
        </label>
        {error && (
          <p id={`${field.id}-error`} className="ml-6 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Person field (P2)
  if (field.type === 'person') {
    return (
      <div className={className}>
        <PersonFieldEditor
          value={localValue}
          allowMultiple={field.allowMultiple || false}
          onChange={handleChange}
          placeholder={field.description || 'Select person...'}
        />
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Status field (P2)
  if (field.type === 'status') {
    return (
      <div className={className}>
        <StatusFieldEditor
          value={localValue || ''}
          statusOptions={field.statusOptions || []}
          onChange={handleChange}
          placeholder={field.description || 'Select status...'}
        />
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Timeline field (P2)
  if (field.type === 'timeline') {
    return (
      <div className={className}>
        <TimelineFieldEditor
          value={localValue}
          onChange={handleChange}
        />
        {error && (
          <p id={`${field.id}-error`} className="mt-1 text-xs text-status-error-text dark:text-status-error-text-dark">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Formula field (P2) - Read-only, computed value
  if (field.type === 'formula') {
    return (
      <div className={className}>
        <div className="px-3 py-2 bg-surface-light-elevated/50 dark:bg-surface-dark-elevated/50 border border-border-light dark:border-border-dark rounded-lg text-text-light-secondary dark:text-text-dark-secondary italic">
          {localValue !== null && localValue !== undefined ? String(localValue) : 'Not calculated'}
        </div>
        <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Computed field (read-only)
        </p>
      </div>
    );
  }

  // Unknown field type
  return (
    <div className={className}>
      <p className="text-sm text-status-error-text dark:text-status-error-text-dark">
        Unknown field type: {field.type}
      </p>
    </div>
  );
}
