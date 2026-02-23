/**
 * Search Filter Parser
 *
 * Parses filter tokens from search queries:
 * - tag:name — filter by tag
 * - in:notes / in:tasks / in:calendar / in:docs — filter by module
 * - status:done / status:todo / status:inprogress — filter by status
 * - date:today / date:thisweek / date:overdue — filter by date
 */

export type ModuleFilter = 'notes' | 'tasks' | 'calendar' | 'docs';
export type StatusFilter = 'done' | 'todo' | 'inprogress';
export type DateFilter = 'today' | 'thisweek' | 'overdue' | 'yesterday' | 'thismonth' | 'last7days' | 'last30days';

export interface SearchFilter {
  type: 'tag' | 'module' | 'status' | 'date';
  value: string;
}

export interface ParsedSearchQuery {
  /** The text query with filter tokens removed */
  text: string;
  /** All parsed filters */
  filters: SearchFilter[];
}

const VALID_MODULES: ModuleFilter[] = ['notes', 'tasks', 'calendar', 'docs'];
const VALID_STATUSES: StatusFilter[] = ['done', 'todo', 'inprogress'];
const VALID_DATES: DateFilter[] = [
  'today', 'thisweek', 'overdue', 'yesterday', 'thismonth', 'last7days', 'last30days',
];

/**
 * Parse a search query to extract filter tokens.
 *
 * Examples:
 *   "meeting tag:work" -> { text: "meeting", filters: [{ type: 'tag', value: 'work' }] }
 *   "in:notes status:done" -> { text: "", filters: [{ type: 'module', value: 'notes' }, { type: 'status', value: 'done' }] }
 *   "tag:personal date:today review" -> { text: "review", filters: [...] }
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const filters: SearchFilter[] = [];
  const parts = query.split(/\s+/);
  const textParts: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    const lowerPart = part.toLowerCase();

    if (lowerPart.startsWith('tag:') && part.length > 4) {
      filters.push({ type: 'tag', value: part.slice(4).toLowerCase() });
    } else if (lowerPart.startsWith('in:') && part.length > 3) {
      const value = part.slice(3).toLowerCase();
      if (VALID_MODULES.includes(value as ModuleFilter)) {
        filters.push({ type: 'module', value });
      } else {
        textParts.push(part);
      }
    } else if (lowerPart.startsWith('status:') && part.length > 7) {
      const value = part.slice(7).toLowerCase();
      if (VALID_STATUSES.includes(value as StatusFilter)) {
        filters.push({ type: 'status', value });
      } else {
        textParts.push(part);
      }
    } else if (lowerPart.startsWith('date:') && part.length > 5) {
      const value = part.slice(5).toLowerCase();
      if (VALID_DATES.includes(value as DateFilter)) {
        filters.push({ type: 'date', value });
      } else {
        textParts.push(part);
      }
    } else {
      textParts.push(part);
    }
  }

  return { text: textParts.join(' ').trim(), filters };
}

/** Get filters of a specific type */
export function getFiltersOfType(filters: SearchFilter[], type: SearchFilter['type']): string[] {
  return filters.filter((f) => f.type === type).map((f) => f.value);
}

/** Format a filter for display (e.g., "tag:work") */
export function formatFilter(filter: SearchFilter): string {
  switch (filter.type) {
    case 'tag': return `tag:${filter.value}`;
    case 'module': return `in:${filter.value}`;
    case 'status': return `status:${filter.value}`;
    case 'date': return `date:${filter.value}`;
  }
}
