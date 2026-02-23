/**
 * Natural Language Task Parser
 *
 * Parses rich task input syntax:
 *   - Tags: #tag
 *   - Priority: !high, !medium, !low, !1, !2, !3
 *   - Due dates: "due friday", "due tomorrow", "due 2026-03-01"
 *   - Assignee: @name
 *   - Project: ^project
 *
 * Example: "Buy groceries #personal !high due friday @me"
 * -> { title: "Buy groceries", tags: ["personal"], priority: "high", dueDate: "2026-02-27", assignees: ["me"] }
 */

import { formatDateKey } from './dateUtils';

export interface ParsedTaskInput {
  title: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low' | null;
  dueDate: string | null;
  assignees: string[];
  project: string | null;
}

/**
 * Parse a relative date string into YYYY-MM-DD format
 */
function parseDueDate(dateStr: string): string | null {
  const lower = dateStr.toLowerCase().trim();

  // ISO date format: 2026-03-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    return lower;
  }

  const today = new Date();

  if (lower === 'today') {
    return formatDateKey(today);
  }
  if (lower === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDateKey(d);
  }

  // Day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const currentDay = today.getDay();
    let daysAhead = dayIndex - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    const d = new Date(today);
    d.setDate(d.getDate() + daysAhead);
    return formatDateKey(d);
  }

  // "next week"
  if (lower === 'next week') {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return formatDateKey(d);
  }

  return null;
}

/**
 * Parse priority from shorthand notation
 */
function parsePriority(value: string): 'high' | 'medium' | 'low' | null {
  const lower = value.toLowerCase();
  if (lower === 'high' || lower === 'urgent' || lower === 'critical' || lower === '1') return 'high';
  if (lower === 'medium' || lower === 'med' || lower === '2') return 'medium';
  if (lower === 'low' || lower === '3') return 'low';
  return null;
}

/**
 * Parse natural language task input into structured fields.
 */
export function parseTaskInput(input: string): ParsedTaskInput {
  let text = input.trim();

  // Extract tags: #word
  const tags: string[] = [];
  text = text.replace(/#(\w+)/g, (_match, tag: string) => {
    tags.push(tag);
    return '';
  });

  // Extract priority: !high, !1, etc.
  let priority: 'high' | 'medium' | 'low' | null = null;
  text = text.replace(/!(\w+)/g, (_match, val: string) => {
    const p = parsePriority(val);
    if (p) {
      priority = p;
      return '';
    }
    return _match; // Not a recognized priority, leave in place
  });

  // Extract assignees: @name
  const assignees: string[] = [];
  text = text.replace(/@(\w+)/g, (_match, name: string) => {
    assignees.push(name);
    return '';
  });

  // Extract project: ^project
  let project: string | null = null;
  text = text.replace(/\^(\w+)/g, (_match, proj: string) => {
    project = proj;
    return '';
  });

  // Extract due date: "due <date>" or "due <date> <date>" (multi-word like "next week")
  let dueDate: string | null = null;
  text = text.replace(/\bdue\s+(next\s+week|\w+(?:\s*-\s*\w+)*)/gi, (_match, dateStr: string) => {
    const parsed = parseDueDate(dateStr.trim());
    if (parsed) {
      dueDate = parsed;
      return '';
    }
    return _match; // Couldn't parse, leave in place
  });

  // Clean up title: collapse whitespace, trim
  const title = text.replace(/\s+/g, ' ').trim();

  return {
    title,
    tags,
    priority,
    dueDate,
    assignees,
    project,
  };
}
