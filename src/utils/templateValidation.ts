/**
 * Template Validation Utility
 * Validates and sanitizes user-created note templates
 * Protects against XSS while preserving markdown and template variables
 */

import type { NoteTemplate } from '../types/notes';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate note template
 *
 * Checks:
 * - Required fields (name, description)
 * - Name length (1-100 chars)
 * - Description length (1-50000 chars)
 *
 * @param template - Template to validate
 * @param existingTemplates - Existing templates for duplicate check
 * @returns Validation result with errors if any
 */
export function validateNoteTemplate(
  template: Partial<NoteTemplate>,
  existingTemplates: NoteTemplate[] = []
): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push('Name is required');
  } else {
    // Check name length
    if (template.name.length < 1 || template.name.length > 100) {
      errors.push('Name must be between 1 and 100 characters');
    }

    // Check for duplicate names (case-insensitive)
    const nameLower = template.name.toLowerCase();
    const isDuplicate = existingTemplates.some(
      (t) => t.id !== template.id && t.name.toLowerCase() === nameLower
    );

    if (isDuplicate) {
      errors.push(`Template with name "${template.name}" already exists`);
    }
  }

  if (!template.description || template.description.trim().length === 0) {
    errors.push('Description is required');
  } else {
    // Check description length
    if (template.description.length < 1 || template.description.length > 50000) {
      errors.push('Description must be between 1 and 50000 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize template content
 *
 * Removes potentially dangerous content while preserving:
 * - Markdown formatting
 * - Template variables ({date}, {time}, etc.)
 * - Safe HTML entities
 *
 * Strips:
 * - <script> tags and content
 * - Event handlers (onclick, onerror, etc.)
 * - javascript: URLs
 * - data: URLs (except safe image types)
 *
 * @param content - Template content to sanitize
 * @returns Sanitized content safe for storage and rendering
 */
export function sanitizeTemplateContent(content: string): string {
  if (!content) return '';

  let sanitized = content;

  // Strip script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Strip event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');

  // Strip javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Strip data: URLs (except safe image types)
  sanitized = sanitized.replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,)[^\s"']+/gi, '');

  // Strip style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Strip iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed)\b[^>]*>/gi, '');

  // Trim excess whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize template name
 *
 * Removes control characters and normalizes whitespace
 *
 * @param name - Template name to sanitize
 * @returns Sanitized name
 */
export function sanitizeTemplateName(name: string): string {
  if (!name) return '';

  let sanitized = name;

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Normalize whitespace (replace multiple spaces/tabs/newlines with single space)
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate and sanitize template
 *
 * Combines validation and sanitization in one step.
 * Returns sanitized template if valid, or validation errors if invalid.
 *
 * @param template - Template to validate and sanitize
 * @param existingTemplates - Existing templates for duplicate check
 * @returns Validation result with sanitized template if valid
 */
export function validateAndSanitizeTemplate(
  template: Partial<NoteTemplate>,
  existingTemplates: NoteTemplate[] = []
): ValidationResult & { sanitized?: Partial<NoteTemplate> } {
  // Sanitize first
  const sanitized: Partial<NoteTemplate> = {
    ...template,
    name: template.name ? sanitizeTemplateName(template.name) : '',
    description: template.description ? sanitizeTemplateContent(template.description) : '',
  };

  // Then validate
  const validation = validateNoteTemplate(sanitized, existingTemplates);

  if (validation.valid) {
    return {
      ...validation,
      sanitized,
    };
  }

  return validation;
}
