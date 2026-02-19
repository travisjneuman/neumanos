/**
 * Forms System Type Definitions
 * Custom form builder for habit tracking, surveys, data collection
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'rating'
  | 'scale'
  | 'file' // P0: File upload field type
  | 'calculation' // P2: Calculated field type
  | 'hidden'; // P1: Hidden field type (for UTM tracking, etc.)

// P0: Conditional logic types
export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_answered'
  | 'is_not_answered';

export interface ConditionalRule {
  id: string;
  fieldId: string; // Which field triggers this rule
  operator: ConditionalOperator;
  value?: string | number | boolean; // Value to compare against (not used for is_answered/is_not_answered)
  action: 'show' | 'hide';
}

// P2: Calculation field settings
export interface CalculationSettings {
  formula: string; // Expression using field references
  referencedFields: string[]; // Field IDs used in formula
  decimalPlaces?: number; // For number formatting
  prefix?: string; // e.g., "$" for currency
  suffix?: string; // e.g., "%" for percentages
}

// P2: Dependent validation
export type DependentValidationType =
  | 'require_if'
  | 'min_if'
  | 'max_if'
  | 'pattern_if';

export interface DependentValidation {
  id: string;
  type: DependentValidationType;
  condition: ConditionalRule; // Condition that triggers validation
  validationRule: {
    message: string;
    value?: string | number; // For min/max (number) or pattern (string)
  };
}

// P1: Quiz mode settings
export interface QuizSettings {
  correctAnswer: unknown; // Can be string, number, array, etc.
  points: number; // Points for this question
  feedback?: string; // Optional feedback message (shown after submission)
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  options?: string[]; // For select/radio/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string; // Regex pattern for text validation
  };
  order: number;

  // P0: Conditional logic - rules that determine if this field is shown
  conditionalRules?: ConditionalRule[];

  // P0: File upload configuration
  fileConfig?: {
    maxSizeMB: number; // Default: 10MB
    allowedTypes: string[]; // MIME types: ['image/*', 'application/pdf']
    multiple: boolean; // Allow multiple file uploads
  };

  // P2: Calculation settings (for 'calculation' field type)
  calculationSettings?: CalculationSettings;

  // P2: Dependent validation - conditional validation rules
  dependentValidation?: DependentValidation[];

  // P1: Quiz settings (for quiz mode)
  quizSettings?: QuizSettings;
}

export interface FormSettings {
  allowMultipleSubmissions: boolean;
  showSubmissionCount: boolean;
  resetPeriod?: 'daily' | 'weekly' | 'monthly' | 'never';
  showProgressBar?: boolean; // P0: Show progress indicator
  enableSpamProtection?: boolean; // P0: Enable honeypot + timing validation
  quizMode?: boolean; // P1: Enable quiz mode with scoring
}

export interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
  settings: FormSettings;
}

// P0: File upload answer structure
export interface FileUploadAnswer {
  fileName: string;
  fileType: string;
  fileSize: number;
  base64Data: string; // Base64 encoded file content
  uploadedAt: Date;
}

/**
 * Union type for all possible form answer values
 * This provides type safety for form answer handling
 */
export type FormAnswerValue =
  | string // text, textarea, date, time, select, radio, hidden
  | number // number, rating, scale
  | boolean // checkbox
  | string[] // multiselect
  | FileUploadAnswer // file (single)
  | FileUploadAnswer[] // file (multiple)
  | null
  | undefined;

export interface FormResponse {
  id: string;
  formId: string;
  answers: Record<string, FormAnswerValue>; // field.id -> value
  submittedAt: Date;
  isSpam?: boolean; // P0: Flag for suspicious responses
  submissionTimeSeconds?: number; // P0: Time from form load to submit
  score?: number; // P1: Quiz score (total points earned)
  maxScore?: number; // P1: Maximum possible score
}

export interface FormWithStats extends FormTemplate {
  responseCount: number;
  lastSubmittedAt?: Date;
}

// CSV export types
export interface CSVExportOptions {
  includeTimestamp?: boolean;
  includeFormInfo?: boolean;
}

// Form validation result
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>; // field.id -> error message
}

// P0: Analytics types
export interface FieldAnalytics {
  fieldId: string;
  fieldType: FieldType;
  responseCount: number; // How many people answered this field
  // Type-specific metrics
  mostCommonAnswers?: Array<{ value: string; count: number }>; // For select/radio
  averageValue?: number; // For rating/scale/number
  distribution?: Record<string, number>; // Value -> count
}

export interface FormAnalytics {
  formId: string;
  totalResponses: number;
  completionRate: number; // % of users who started and finished (future: requires session tracking)
  avgCompletionTimeSeconds: number;
  responsesByDay: Record<string, number>; // YYYY-MM-DD -> count
  fieldAnalytics: Record<string, FieldAnalytics>; // field.id -> analytics
}
