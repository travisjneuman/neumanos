/**
 * Template Executor Service
 *
 * Executes smart templates by creating items across multiple stores
 * (notes, tasks, events, docs, timers).
 */

import { useNotesStore } from '../stores/useNotesStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useDocsStore } from '../stores/useDocsStore';
import { useTimeTrackingStore } from '../stores/useTimeTrackingStore';
import { useSmartTemplateStore } from '../stores/useSmartTemplateStore';
import type { SmartTemplate, TemplateAction } from '../stores/useSmartTemplateStore';

/**
 * Replace {{key}} placeholders with variable values
 */
export function resolveVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

/**
 * Recursively resolve variables in an object/array/string
 */
function resolveDataVariables(
  data: Record<string, unknown>,
  variables: Record<string, string>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      resolved[key] = resolveVariables(value, variables);
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) =>
        typeof item === 'string' ? resolveVariables(item, variables) : item
      );
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Execute a single template action
 */
export function executeTemplateAction(
  action: TemplateAction,
  variables: Record<string, string>
): string {
  const data = resolveDataVariables(action.data, variables);

  switch (action.type) {
    case 'create-note': {
      const notesStore = useNotesStore.getState();
      const note = notesStore.createNote({
        title: (data.title as string) || 'Untitled',
        contentText: (data.content as string) || '',
        tags: (data.tags as string[]) || [],
        isPinned: false,
      });
      return `Note: ${note.title}`;
    }

    case 'create-task': {
      const kanbanStore = useKanbanStore.getState();
      kanbanStore.addTask({
        title: (data.title as string) || 'Untitled Task',
        description: (data.description as string) || '',
        status: 'todo',
        priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
        tags: (data.tags as string[]) || [],
        startDate: null,
        dueDate: null,
        projectIds: [],
      });
      return `Task: ${data.title}`;
    }

    case 'create-event': {
      const calendarStore = useCalendarStore.getState();
      const dateKey =
        variables.date || new Date().toISOString().split('T')[0];
      const duration = (data.duration as number) || 60;

      // Create event with a reasonable default time
      const startHour = 9;
      const startTime = `${String(startHour).padStart(2, '0')}:00`;
      const endMinutes = startHour * 60 + duration;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      calendarStore.addEvent(dateKey, (data.title as string) || 'Event', undefined, {
        startTime,
        endTime,
      });
      return `Event: ${data.title}`;
    }

    case 'create-doc': {
      const docsStore = useDocsStore.getState();
      const docType = (data.type as 'doc' | 'sheet') || 'doc';
      const docId = docsStore.createDoc(
        docType,
        (data.title as string) || 'Untitled Document'
      );
      return `Doc: ${data.title} (${docId})`;
    }

    case 'start-timer': {
      const timeStore = useTimeTrackingStore.getState();
      timeStore.startTimer({
        description: (data.description as string) || 'Timer',
      });
      return `Timer: ${data.description}`;
    }

    default:
      return `Unknown action type: ${action.type}`;
  }
}

/**
 * Execute all actions in a template
 */
export function executeTemplate(
  template: SmartTemplate,
  variables: Record<string, string>
): { success: boolean; created: string[] } {
  const created: string[] = [];

  try {
    for (const action of template.actions) {
      const result = executeTemplateAction(action, variables);
      created.push(result);
    }

    // Increment usage count
    useSmartTemplateStore.getState().incrementUsage(template.id);

    return { success: true, created };
  } catch (error) {
    console.error('Template execution failed:', error);
    return { success: false, created };
  }
}
