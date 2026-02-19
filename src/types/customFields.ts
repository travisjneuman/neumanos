/**
 * Custom Fields Type Definitions
 *
 * Defines types for custom field system that allows users to add
 * structured metadata to tasks and notes beyond default fields.
 */

/**
 * Supported custom field types
 */
export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'person'      // P2: Person/user assignment
  | 'status'      // P2: Status with visual indicators
  | 'timeline'    // P2: Date range (start/end)
  | 'formula';    // P2: Calculated fields

/**
 * Status option configuration for status field type
 */
export interface StatusOption {
  label: string;
  color: string; // Semantic token color (e.g., 'accent-blue', 'accent-green')
}

/**
 * Timeline value structure
 */
export interface TimelineValue {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

/**
 * Field definition - describes a custom field's schema
 */
export interface FieldDefinition {
  /** Unique identifier for the field */
  id: string;
  /** Display name of the field */
  name: string;
  /** Field data type */
  type: FieldType;
  /** Default value when field is added to a task/note */
  defaultValue?: any;
  /** For 'select' type: list of allowed options */
  options?: string[];
  /** Whether this field is required */
  required?: boolean;
  /** Optional description/help text */
  description?: string;
  /** Whether field is visible on Kanban cards (default: true) */
  visibleInCard?: boolean;
  /** Whether field is visible in List view (default: true) */
  visibleInList?: boolean;
  /** Timestamp when field was created */
  createdAt: Date;
  /** Timestamp when field was last modified */
  updatedAt: Date;

  // P2: Advanced field type settings
  /** For 'person' type: allow multiple people */
  allowMultiple?: boolean;
  /** For 'status' type: status options with colors */
  statusOptions?: StatusOption[];
  /** For 'formula' type: formula expression */
  formulaExpression?: string;
  /** For 'formula' type: referenced field IDs */
  referencedFields?: string[];
}

/**
 * Custom field value instance
 */
export interface CustomFieldValue {
  /** ID of the field definition this value corresponds to */
  fieldId: string;
  /** Actual value (type varies based on field.type) */
  value: any;
}

/**
 * Map of field values on a task/note
 * Key: fieldId, Value: actual value
 */
export type CustomFieldsMap = Record<string, any>;

/**
 * Field validation result
 */
export interface FieldValidationResult {
  /** Whether the value is valid for this field type */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Validates a field value based on field definition
 */
export function validateFieldValue(
  field: FieldDefinition,
  value: any
): FieldValidationResult {
  // Empty values are valid if field is not required
  if (value === null || value === undefined || value === '') {
    if (field.required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true };
  }

  switch (field.type) {
    case 'text':
      if (typeof value !== 'string') {
        return { valid: false, error: 'Value must be text' };
      }
      return { valid: true };

    case 'number':
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof num !== 'number' || isNaN(num)) {
        return { valid: false, error: 'Value must be a valid number' };
      }
      return { valid: true };

    case 'date':
      // Accept Date objects or ISO date strings
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          return { valid: false, error: 'Invalid date' };
        }
        return { valid: true };
      }
      if (typeof value === 'string') {
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) {
          return { valid: false, error: 'Invalid date format' };
        }
        return { valid: true };
      }
      return { valid: false, error: 'Value must be a date' };

    case 'select':
      if (!field.options || field.options.length === 0) {
        return { valid: false, error: 'No options defined for this field' };
      }
      if (!field.options.includes(value)) {
        return { valid: false, error: 'Value must be one of the predefined options' };
      }
      return { valid: true };

    case 'checkbox':
      if (typeof value !== 'boolean') {
        return { valid: false, error: 'Value must be true or false' };
      }
      return { valid: true };

    case 'person':
      // Person field: single string or array of strings
      if (field.allowMultiple) {
        if (!Array.isArray(value)) {
          return { valid: false, error: 'Value must be an array of people' };
        }
        if (!value.every((v) => typeof v === 'string')) {
          return { valid: false, error: 'All people must be strings' };
        }
      } else {
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a person name' };
        }
      }
      return { valid: true };

    case 'status':
      // Status field: must be one of configured options
      if (!field.statusOptions || field.statusOptions.length === 0) {
        return { valid: false, error: 'No status options configured' };
      }
      const statusLabels = field.statusOptions.map((opt) => opt.label);
      if (!statusLabels.includes(value)) {
        return { valid: false, error: 'Value must be one of the configured statuses' };
      }
      return { valid: true };

    case 'timeline':
      // Timeline field: object with startDate and endDate
      if (typeof value !== 'object' || !value.startDate || !value.endDate) {
        return { valid: false, error: 'Timeline must have both start and end dates' };
      }
      const startDate = new Date(value.startDate);
      const endDate = new Date(value.endDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { valid: false, error: 'Invalid date format' };
      }
      if (endDate < startDate) {
        return { valid: false, error: 'End date must be after or equal to start date' };
      }
      return { valid: true };

    case 'formula':
      // Formula fields are computed, always valid (read-only)
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown field type' };
  }
}

/**
 * Get default value for a field type
 */
export function getDefaultFieldValue(field: FieldDefinition): any {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  switch (field.type) {
    case 'text':
      return '';
    case 'number':
      return 0;
    case 'date':
      return new Date();
    case 'select':
      return field.options?.[0] || '';
    case 'checkbox':
      return false;
    case 'person':
      return field.allowMultiple ? [] : '';
    case 'status':
      return field.statusOptions?.[0]?.label || '';
    case 'timeline':
      return { startDate: new Date().toISOString(), endDate: new Date().toISOString() };
    case 'formula':
      return null; // Formulas are computed, no default value
    default:
      return null;
  }
}
