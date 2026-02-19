/**
 * Form Analytics Service
 * Calculates metrics and insights from form responses
 */

import type { FormTemplate, FormResponse, FieldType } from '../types/forms';

export interface FormAnalytics {
  formId: string;
  totalResponses: number;
  nonSpamResponses: number;
  spamRate: number;
  avgCompletionTimeSeconds: number;
  responsesByDay: Array<{ date: string; count: number }>;
  fieldAnalytics: FieldAnalytics[];
}

export interface FieldAnalytics {
  fieldId: string;
  fieldLabel: string;
  fieldType: FieldType;
  responseCount: number;
  // Type-specific metrics
  mostCommonAnswers?: Array<{ value: string; count: number }>;
  averageValue?: number;
  distribution?: Array<{ value: string; count: number }>;
}

/**
 * Calculate comprehensive analytics for a form
 */
export function calculateFormAnalytics(
  form: FormTemplate,
  responses: FormResponse[]
): FormAnalytics {
  const totalResponses = responses.length;
  const nonSpamResponses = responses.filter((r) => !r.isSpam).length;
  const spamRate = totalResponses > 0 ? (responses.filter((r) => r.isSpam).length / totalResponses) * 100 : 0;

  // Average completion time (excluding spam)
  const validCompletionTimes = responses
    .filter((r) => !r.isSpam && r.submissionTimeSeconds !== undefined)
    .map((r) => r.submissionTimeSeconds!);

  const avgCompletionTimeSeconds =
    validCompletionTimes.length > 0
      ? validCompletionTimes.reduce((sum, time) => sum + time, 0) / validCompletionTimes.length
      : 0;

  // Responses by day
  const responsesByDay = calculateResponsesByDay(responses);

  // Field-level analytics
  const fieldAnalytics = form.fields.map((field) =>
    calculateFieldAnalytics(field, responses)
  );

  return {
    formId: form.id,
    totalResponses,
    nonSpamResponses,
    spamRate,
    avgCompletionTimeSeconds,
    responsesByDay,
    fieldAnalytics,
  };
}

/**
 * Calculate responses grouped by day
 */
function calculateResponsesByDay(
  responses: FormResponse[]
): Array<{ date: string; count: number }> {
  const byDay: Record<string, number> = {};

  responses.forEach((response) => {
    const date = new Date(response.submittedAt);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    byDay[dateKey] = (byDay[dateKey] || 0) + 1;
  });

  // Convert to array and sort by date
  return Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate analytics for a single field
 */
function calculateFieldAnalytics(
  field: { id: string; label: string; type: FieldType; options?: string[] },
  responses: FormResponse[]
): FieldAnalytics {
  const fieldId = field.id;
  const fieldType = field.type;

  // Count responses that answered this field
  const answeredResponses = responses.filter((r) => {
    const value = r.answers[fieldId];
    return value !== null && value !== undefined && value !== '';
  });

  const responseCount = answeredResponses.length;

  const analytics: FieldAnalytics = {
    fieldId,
    fieldLabel: field.label,
    fieldType,
    responseCount,
  };

  // Type-specific analytics
  if (fieldType === 'select' || fieldType === 'radio') {
    analytics.distribution = calculateDistribution(fieldId, answeredResponses);
    analytics.mostCommonAnswers = analytics.distribution.slice(0, 5); // Top 5
  } else if (fieldType === 'multiselect' || fieldType === 'checkbox') {
    analytics.distribution = calculateMultiSelectDistribution(fieldId, answeredResponses);
    analytics.mostCommonAnswers = analytics.distribution.slice(0, 5);
  } else if (fieldType === 'rating' || fieldType === 'scale' || fieldType === 'number') {
    const values = answeredResponses
      .map((r) => Number(r.answers[fieldId]))
      .filter((v) => !isNaN(v));
    analytics.averageValue = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
    analytics.distribution = calculateNumericDistribution(values);
  }

  return analytics;
}

/**
 * Calculate distribution for single-select fields
 */
function calculateDistribution(
  fieldId: string,
  responses: FormResponse[]
): Array<{ value: string; count: number }> {
  const counts: Record<string, number> = {};

  responses.forEach((r) => {
    const value = String(r.answers[fieldId]);
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count); // Most common first
}

/**
 * Calculate distribution for multi-select fields
 */
function calculateMultiSelectDistribution(
  fieldId: string,
  responses: FormResponse[]
): Array<{ value: string; count: number }> {
  const counts: Record<string, number> = {};

  responses.forEach((r) => {
    const value = r.answers[fieldId];
    const values = Array.isArray(value) ? value : [value];

    values.forEach((v) => {
      if (v !== null && v !== undefined && v !== '') {
        const str = String(v);
        counts[str] = (counts[str] || 0) + 1;
      }
    });
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate distribution for numeric fields
 */
function calculateNumericDistribution(
  values: number[]
): Array<{ value: string; count: number }> {
  const counts: Record<string, number> = {};

  values.forEach((v) => {
    const str = String(v);
    counts[str] = (counts[str] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => Number(a.value) - Number(b.value)); // Numeric order
}
