/**
 * Answer Piping Utility
 * Replaces {{field_id}} tokens in text with actual answer values
 */

/**
 * Replaces answer tokens ({{field_id}}) in text with actual values
 *
 * @param text - Text containing {{field_id}} tokens
 * @param answers - Record of field_id -> answer value
 * @returns Text with tokens replaced by answer values (HTML escaped)
 *
 * Features:
 * - Supports multiple tokens in one text string
 * - Handles missing/empty answers gracefully (shows placeholder)
 * - Escapes HTML to prevent XSS attacks
 * - Supports all field types (text, select, arrays, numbers, etc.)
 *
 * Examples:
 * - "Hello {{name}}!" → "Hello John!"
 * - "Your favorite {{product}} is great!" → "Your favorite Tesla is great!"
 * - "You chose {{missing}}" → "You chose [not answered]"
 */
export function replaceAnswerTokens(
  text: string,
  answers: Record<string, unknown>
): string {
  // Regex to match {{field_id}} tokens
  const tokenRegex = /\{\{([^}]+)\}\}/g;

  return text.replace(tokenRegex, (_match, fieldId) => {
    const trimmedFieldId = fieldId.trim();
    const answer = answers[trimmedFieldId];

    // Handle missing/empty answers
    if (answer === undefined || answer === null || answer === '') {
      return '[not answered]';
    }

    // Handle array values (multiselect)
    if (Array.isArray(answer)) {
      if (answer.length === 0) {
        return '[not answered]';
      }
      // Join array with commas (escape each item)
      return answer.map(escapeHtml).join(', ');
    }

    // Handle file upload answers
    if (typeof answer === 'object' && answer !== null) {
      // Check if it's a file upload answer
      if ('fileName' in answer) {
        return escapeHtml(String((answer as Record<string, unknown>).fileName));
      }
      // Unknown object type - stringify safely
      return '[complex value]';
    }

    // Handle primitive values (string, number, boolean)
    return escapeHtml(String(answer));
  });
}

/**
 * Escapes HTML special characters to prevent XSS
 *
 * @param text - Text to escape
 * @returns HTML-safe text
 */
function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}
