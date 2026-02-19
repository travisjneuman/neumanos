/**
 * Form Renderer Component
 * Renders form fields from template and handles submission
 */

import { useState, useMemo } from 'react';
import type { FormTemplate, FormValidationResult, ConditionalRule, DependentValidation, FormField, FieldType, FormAnswerValue } from '../../types/forms';
import { evaluateFormula } from '../../utils/formulaEngine';
import { replaceAnswerTokens } from '../../utils/answerPiping';
import {
  TextField,
  TextAreaField,
  NumberField,
  DateField,
  TimeField,
  SelectField,
  MultiSelectField,
  RadioField,
  CheckboxField,
  RatingField,
  ScaleField,
  FileUploadField,
} from './FieldComponents';

interface FormRendererProps {
  form: FormTemplate;
  onSubmit: (
    answers: Record<string, FormAnswerValue>,
    metadata?: {
      isSpam?: boolean;
      submissionTimeSeconds?: number;
      score?: number;
      maxScore?: number;
    }
  ) => void;
  initialValues?: Record<string, FormAnswerValue>;
}

export function FormRenderer({ form, onSubmit, initialValues = {} }: FormRendererProps) {
  // Parse URL parameters for hidden fields
  const urlParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const parsedParams: Record<string, string> = {};
    params.forEach((value, key) => {
      parsedParams[key] = value;
    });
    return parsedParams;
  }, []);

  // Initialize answers with URL parameters for hidden fields
  const [answers, setAnswers] = useState<Record<string, FormAnswerValue>>(() => {
    const initialAnswers = { ...initialValues };

    // Auto-fill hidden fields from URL parameters
    form.fields.forEach((field) => {
      if (field.type === 'hidden' && urlParams[field.label]) {
        initialAnswers[field.id] = urlParams[field.label];
      }
    });

    return initialAnswers;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formLoadTime] = useState(Date.now()); // Track when form was loaded
  const [honeypot, setHoneypot] = useState(''); // Honeypot field value

  /**
   * Calculate values for calculated fields
   * Returns a map of calculated field IDs to their computed values
   */
  const calculatedValues = useMemo(() => {
    const calculated: Record<string, FormAnswerValue> = {};

    form.fields.forEach((field) => {
      if (field.type === 'calculation' && field.calculationSettings) {
        const { formula, decimalPlaces } = field.calculationSettings;

        // Evaluate formula using current field values
        const result = evaluateFormula(formula, answers);

        if (!result.error && result.value !== null && result.value !== undefined) {
          // Format number values based on decimal places
          if (typeof result.value === 'number' && decimalPlaces !== undefined) {
            calculated[field.id] = result.value % 1 === 0
              ? result.value
              : Number(result.value.toFixed(decimalPlaces));
          } else {
            calculated[field.id] = result.value;
          }
        }
      }
    });

    return calculated;
  }, [form.fields, answers]);

  /**
   * Evaluate conditional rules to determine which fields should be visible
   * Returns a Set of field IDs that should be shown
   */
  const visibleFieldIds = useMemo(() => {
    const visible = new Set<string>();

    // Merge answers with calculated values for conditional evaluation
    const allValues = { ...answers, ...calculatedValues };

    form.fields.forEach((field) => {
      // If no conditional rules, field is always visible
      if (!field.conditionalRules || field.conditionalRules.length === 0) {
        visible.add(field.id);
        return;
      }

      // Evaluate all rules - field is shown if ANY rule evaluates to 'show' (OR logic)
      const shouldShow = field.conditionalRules.some((rule) =>
        evaluateConditionalRule(rule, allValues)
      );

      if (shouldShow) {
        visible.add(field.id);
      }
    });

    return visible;
  }, [form.fields, answers, calculatedValues]);

  /**
   * Calculate form completion progress
   * Only counts visible fields (respects conditional logic)
   */
  const progress = useMemo(() => {
    if (!form.settings.showProgressBar) return 0;

    const visibleFields = form.fields.filter((f) => visibleFieldIds.has(f.id));
    if (visibleFields.length === 0) return 0;

    const answeredFields = visibleFields.filter((field) => {
      const answer = answers[field.id];

      // Check if field has a valid answer
      if (answer === undefined || answer === null || answer === '') return false;
      if (Array.isArray(answer) && answer.length === 0) return false;

      return true;
    });

    return Math.round((answeredFields.length / visibleFields.length) * 100);
  }, [form.fields, form.settings.showProgressBar, visibleFieldIds, answers]);

  const handleFieldChange = (fieldId: string, value: FormAnswerValue) => {
    setAnswers({ ...answers, [fieldId]: value });
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors({ ...errors, [fieldId]: '' });
    }
  };

  const validateForm = (): FormValidationResult => {
    const newErrors: Record<string, string> = {};

    // Merge answers with calculated values for validation
    const allValues = { ...answers, ...calculatedValues };

    form.fields.forEach((field) => {
      // Skip validation for hidden fields (conditional logic)
      if (!visibleFieldIds.has(field.id)) {
        return;
      }

      // Skip validation for calculated fields (they are read-only)
      if (field.type === 'calculation') {
        return;
      }

      const value = answers[field.id];

      // Required validation
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = 'This field is required';
        } else if (Array.isArray(value) && value.length === 0) {
          newErrors[field.id] = 'Please select at least one option';
        }
      }

      // Number validation
      if (field.type === 'number' && value !== null && value !== undefined && value !== '') {
        if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
          newErrors[field.id] = `Minimum value is ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
          newErrors[field.id] = `Maximum value is ${field.validation.max}`;
        }
      }

      // Dependent validation
      if (field.dependentValidation && field.dependentValidation.length > 0) {
        for (const validation of field.dependentValidation) {
          const error = evaluateDependentValidation(validation, value, allValues);
          if (error) {
            newErrors[field.id] = error;
            break; // Stop at first error
          }
        }
      }
    });

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Scroll to first error
      const firstErrorField = form.fields.find((field) => validation.errors[field.id]);
      if (firstErrorField) {
        const element = document.getElementById(`field-${firstErrorField.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Spam detection (if enabled)
    let isSpam = false;
    let submissionTimeSeconds: number | undefined;

    if (form.settings.enableSpamProtection) {
      submissionTimeSeconds = (Date.now() - formLoadTime) / 1000;

      // Honeypot check: if honeypot field has value, it's spam
      if (honeypot !== '') {
        isSpam = true;
      }

      // Timing check: submissions faster than 2 seconds are suspicious
      if (submissionTimeSeconds < 2) {
        isSpam = true;
      }
    }

    // Quiz scoring (if quiz mode enabled)
    let score: number | undefined;
    let maxScore: number | undefined;

    if (form.settings.quizMode) {
      const result = calculateQuizScore(form.fields, answers);
      score = result.score;
      maxScore = result.maxScore;
    }

    // Pass answers and metadata
    onSubmit(answers, { isSpam, submissionTimeSeconds, score, maxScore });
  };

  // Sort fields by order
  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Bar */}
      {form.settings.showProgressBar && (
        <div className="sticky top-0 z-10 bg-surface-light dark:bg-surface-dark pb-4 -mt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary min-w-[4ch]">
              {progress}%
            </span>
          </div>
          {progress > 0 && progress < 100 && (
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1 text-center">
              Keep going! {progress}% complete
            </p>
          )}
          {progress === 100 && (
            <p className="text-xs text-accent-green mt-1 text-center">
              ✓ All fields completed! Ready to submit
            </p>
          )}
        </div>
      )}

      {sortedFields.map((field) => {
        // Skip rendering hidden fields (conditional logic)
        if (!visibleFieldIds.has(field.id)) {
          return null;
        }

        // Skip rendering hidden field type (they are invisible by design)
        if (field.type === 'hidden') {
          return null;
        }

        // Render calculated field
        if (field.type === 'calculation' && field.calculationSettings) {
          const calcValue = calculatedValues[field.id];
          const { decimalPlaces, prefix, suffix } = field.calculationSettings;

          // Format the calculated value
          let displayValue = '';
          if (calcValue !== null && calcValue !== undefined) {
            if (typeof calcValue === 'number') {
              const formatted =
                calcValue % 1 === 0 || decimalPlaces === undefined
                  ? String(calcValue)
                  : calcValue.toFixed(decimalPlaces);
              displayValue = `${prefix || ''}${formatted}${suffix || ''}`;
            } else {
              displayValue = String(calcValue);
            }
          }

          // Apply answer piping to label and description
          const pipedLabel = replaceAnswerTokens(field.label, answers);
          const pipedDescription = field.description
            ? replaceAnswerTokens(field.description, answers)
            : undefined;

          return (
            <div key={field.id} id={`field-${field.id}`} className="space-y-2">
              <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {pipedLabel}
                {field.required && <span className="text-accent-red ml-1">*</span>}
              </label>
              {pipedDescription && (
                <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {pipedDescription}
                </p>
              )}
              <div className="px-4 py-3 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg">
                <div className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {displayValue || '—'}
                </div>
                <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
                  Calculated value
                </div>
              </div>
            </div>
          );
        }

        // Apply answer piping to field label and description
        const pipedField = {
          ...field,
          label: replaceAnswerTokens(field.label, answers),
          description: field.description ? replaceAnswerTokens(field.description, answers) : undefined,
        };

        const fieldProps = {
          field: pipedField,
          value: answers[field.id],
          onChange: (value: FormAnswerValue) => handleFieldChange(field.id, value),
          error: errors[field.id],
        };

        return (
          <div key={field.id} id={`field-${field.id}`}>
            {field.type === 'text' && <TextField {...fieldProps} />}
            {field.type === 'textarea' && <TextAreaField {...fieldProps} />}
            {field.type === 'number' && <NumberField {...fieldProps} />}
            {field.type === 'date' && <DateField {...fieldProps} />}
            {field.type === 'time' && <TimeField {...fieldProps} />}
            {field.type === 'select' && <SelectField {...fieldProps} />}
            {field.type === 'multiselect' && <MultiSelectField {...fieldProps} />}
            {field.type === 'radio' && <RadioField {...fieldProps} />}
            {field.type === 'checkbox' && <CheckboxField {...fieldProps} />}
            {field.type === 'rating' && <RatingField {...fieldProps} />}
            {field.type === 'scale' && <ScaleField {...fieldProps} />}
            {field.type === 'file' && <FileUploadField {...fieldProps} />}
          </div>
        );
      })}

      {/* Honeypot Field (hidden from humans, visible to bots) */}
      {form.settings.enableSpamProtection && (
        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label htmlFor="email_confirm">Email Confirmation</label>
          <input
            type="text"
            id="email_confirm"
            name="email_confirm"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-6 py-3 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Submit
        </button>
      </div>
    </form>
  );
}

/**
 * Evaluate a single conditional rule
 * Returns true if the rule evaluates to "show", false if "hide" or condition not met
 */
function evaluateConditionalRule(
  rule: ConditionalRule,
  answers: Record<string, FormAnswerValue>
): boolean {
  const triggerValue = answers[rule.fieldId];

  // Evaluate the condition based on operator
  let conditionMet = false;

  switch (rule.operator) {
    case 'is_answered':
      conditionMet = triggerValue !== undefined && triggerValue !== null && triggerValue !== '';
      break;

    case 'is_not_answered':
      conditionMet = triggerValue === undefined || triggerValue === null || triggerValue === '';
      break;

    case 'equals':
      // Handle array values (multiselect - always string arrays)
      if (Array.isArray(triggerValue) && triggerValue.every(v => typeof v === 'string')) {
        conditionMet = (triggerValue as string[]).includes(String(rule.value));
      } else {
        conditionMet = String(triggerValue) === String(rule.value);
      }
      break;

    case 'not_equals':
      // Handle array values (multiselect - always string arrays)
      if (Array.isArray(triggerValue) && triggerValue.every(v => typeof v === 'string')) {
        conditionMet = !(triggerValue as string[]).includes(String(rule.value));
      } else {
        conditionMet = String(triggerValue) !== String(rule.value);
      }
      break;

    case 'contains':
      if (typeof triggerValue === 'string') {
        conditionMet = triggerValue.toLowerCase().includes(String(rule.value).toLowerCase());
      } else if (Array.isArray(triggerValue)) {
        conditionMet = triggerValue.some((v) =>
          String(v).toLowerCase().includes(String(rule.value).toLowerCase())
        );
      }
      break;

    case 'greater_than':
      conditionMet = Number(triggerValue) > Number(rule.value);
      break;

    case 'less_than':
      conditionMet = Number(triggerValue) < Number(rule.value);
      break;

    default:
      conditionMet = false;
  }

  // Return based on action (show or hide)
  // If action is 'show' and condition is met → return true (show the field)
  // If action is 'hide' and condition is met → return false (hide the field)
  // If action is 'show' and condition is NOT met → return false (don't show)
  // If action is 'hide' and condition is NOT met → return true (don't hide)
  return rule.action === 'show' ? conditionMet : !conditionMet;
}

/**
 * Evaluate dependent validation rules for a field
 * Returns error message if validation fails, undefined otherwise
 */
function evaluateDependentValidation(
  validation: DependentValidation,
  fieldValue: FormAnswerValue,
  answers: Record<string, FormAnswerValue>
): string | undefined {
  // First check if the condition is met
  const conditionMet = evaluateConditionalRule(validation.condition, answers);

  // If condition is not met, skip this validation
  if (!conditionMet) {
    return undefined;
  }

  // Condition is met, apply validation
  switch (validation.type) {
    case 'require_if':
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return validation.validationRule.message;
      }
      if (Array.isArray(fieldValue) && fieldValue.length === 0) {
        return validation.validationRule.message;
      }
      break;

    case 'min_if':
      if (Number(fieldValue) < Number(validation.validationRule.value)) {
        return validation.validationRule.message;
      }
      break;

    case 'max_if':
      if (Number(fieldValue) > Number(validation.validationRule.value)) {
        return validation.validationRule.message;
      }
      break;

    case 'pattern_if':
      if (validation.validationRule.value && typeof fieldValue === 'string' && typeof validation.validationRule.value === 'string') {
        const regex = new RegExp(validation.validationRule.value);
        if (!regex.test(fieldValue)) {
          return validation.validationRule.message;
        }
      }
      break;
  }

  return undefined;
}

/**
 * Calculate quiz score based on correct answers
 * Returns total score earned and maximum possible score
 */
function calculateQuizScore(
  fields: FormField[],
  answers: Record<string, FormAnswerValue>
): { score: number; maxScore: number } {
  let score = 0;
  let maxScore = 0;

  fields.forEach((field) => {
    // Skip fields without quiz settings
    if (!field.quizSettings) {
      return;
    }

    const { correctAnswer, points } = field.quizSettings;
    const userAnswer = answers[field.id];

    // Add to max possible score
    maxScore += points;

    // Check if answer is correct
    const isCorrect = checkAnswerCorrect(field.type, userAnswer, correctAnswer);

    if (isCorrect) {
      score += points;
    }
  });

  return { score, maxScore };
}

/**
 * Check if user answer matches correct answer for a given field type
 */
function checkAnswerCorrect(
  fieldType: FieldType,
  userAnswer: FormAnswerValue,
  correctAnswer: unknown
): boolean {
  // Handle missing/empty answers
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
    return false;
  }

  switch (fieldType) {
    case 'text':
    case 'textarea':
      // Case-insensitive string comparison
      return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();

    case 'number':
    case 'rating':
    case 'scale':
      // Numeric comparison
      return Number(userAnswer) === Number(correctAnswer);

    case 'date':
    case 'time':
      // Exact string comparison for dates/times
      return String(userAnswer) === String(correctAnswer);

    case 'select':
    case 'radio':
      // Exact match for single-select
      return String(userAnswer) === String(correctAnswer);

    case 'multiselect':
      // Array comparison (order-independent)
      if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) {
        return false;
      }
      if (userAnswer.length !== correctAnswer.length) {
        return false;
      }
      const sortedUser = [...userAnswer].sort();
      const sortedCorrect = [...(correctAnswer as string[])].sort();
      return sortedUser.every((val, idx) => val === sortedCorrect[idx]);

    case 'checkbox':
      // Boolean comparison
      return Boolean(userAnswer) === Boolean(correctAnswer);

    default:
      return false;
  }
}
