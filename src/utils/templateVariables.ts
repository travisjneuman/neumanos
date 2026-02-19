/**
 * Template Variables Utility
 * Handles variable substitution in note templates
 * Uses {var} syntax for dynamic content generation
 */

/**
 * Context for template variable substitution
 */
export interface TemplateContext {
  title?: string;
  userName?: string;
}

/**
 * Template variable metadata
 */
export interface TemplateVariable {
  name: string;
  syntax: string;
  description: string;
  example: string;
}

/**
 * Available template variables with descriptions
 */
const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    name: 'date',
    syntax: '{date}',
    description: 'Current date in YYYY-MM-DD format',
    example: '2025-12-01',
  },
  {
    name: 'time',
    syntax: '{time}',
    description: 'Current time in HH:MM AM/PM format',
    example: '02:30 PM',
  },
  {
    name: 'datetime',
    syntax: '{datetime}',
    description: 'Current date and time',
    example: '2025-12-01 02:30 PM',
  },
  {
    name: 'title',
    syntax: '{title}',
    description: 'Note title (provided via context)',
    example: 'My Note Title',
  },
  {
    name: 'user',
    syntax: '{user}',
    description: 'User name (provided via context, defaults to "User")',
    example: 'John Doe',
  },
  {
    name: 'timestamp',
    syntax: '{timestamp}',
    description: 'Unix timestamp in milliseconds',
    example: '1733097600000',
  },
];

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time as HH:MM AM/PM
 */
function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = hours.toString().padStart(2, '0');
  return `${hoursStr}:${minutes} ${ampm}`;
}

/**
 * Format datetime as YYYY-MM-DD HH:MM AM/PM
 */
function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Get Unix timestamp
 */
function getTimestamp(date: Date): string {
  return date.getTime().toString();
}

/**
 * Substitute template variables in content
 *
 * Replaces {var} patterns with actual values:
 * - {date} → current date (YYYY-MM-DD)
 * - {time} → current time (HH:MM AM/PM)
 * - {datetime} → current date and time
 * - {title} → context.title or unchanged if not provided
 * - {user} → context.userName or "User"
 * - {timestamp} → Unix timestamp
 *
 * Unknown variables remain unchanged for safety
 *
 * @param content - Template content with {var} placeholders
 * @param context - Optional context values (title, userName)
 * @returns Content with variables replaced
 */
export function substituteTemplateVariables(
  content: string,
  context?: TemplateContext
): string {
  const now = new Date();

  // Replace variables using regex
  // Pattern: /{(w+)}/g matches {word}
  return content.replace(/{(w+)}/g, (match, varName) => {
    switch (varName) {
      case 'date':
        return formatDate(now);
      case 'time':
        return formatTime(now);
      case 'datetime':
        return formatDateTime(now);
      case 'title':
        return context?.title || match; // Keep placeholder if not provided
      case 'user':
        return context?.userName || 'User';
      case 'timestamp':
        return getTimestamp(now);
      default:
        // Unknown variable - leave unchanged (safe default)
        return match;
    }
  });
}

/**
 * Get list of available template variables
 * Used for UI hints/autocomplete in template editor
 *
 * @returns Array of template variable definitions
 */
export function getAvailableVariables(): TemplateVariable[] {
  return TEMPLATE_VARIABLES;
}

/**
 * Check if content contains any template variables
 *
 * @param content - Content to check
 * @returns True if content contains {var} patterns
 */
export function hasTemplateVariables(content: string): boolean {
  return /{w+}/.test(content);
}

/**
 * Extract all template variable names from content
 *
 * @param content - Content to analyze
 * @returns Array of unique variable names found (without braces)
 */
export function extractTemplateVariables(content: string): string[] {
  const variables = new Set<string>();
  const pattern = /{(w+)}/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}
