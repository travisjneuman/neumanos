/**
 * Smart Template Store
 *
 * Manages workflow templates that can create multiple items across modules
 * (notes, tasks, events, docs, timers) in a single action.
 * Persisted to IndexedDB via syncedStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSyncedStorage } from '../lib/syncedStorage';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================

export type TemplateActionType =
  | 'create-note'
  | 'create-task'
  | 'create-event'
  | 'create-doc'
  | 'start-timer';

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'date' | 'select';
  options?: string[]; // For 'select' type
  defaultValue?: string;
}

export interface TemplateAction {
  id: string;
  type: TemplateActionType;
  data: Record<string, unknown>;
}

export interface SmartTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workflow' | 'meeting' | 'planning' | 'custom';
  actions: TemplateAction[];
  variables: TemplateVariable[];
  usageCount: number;
  isBuiltIn: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== BUILT-IN TEMPLATES ====================

const BUILT_IN_TEMPLATES: SmartTemplate[] = [
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Create a weekly review note and planning tasks',
    icon: '📅',
    category: 'planning',
    actions: [
      {
        id: 'wr-note',
        type: 'create-note',
        data: {
          title: 'Weekly Review — {{date}}',
          content:
            '## Weekly Review\n\n**Week of:** {{date}}\n\n### Accomplishments\n- \n\n### Challenges\n- \n\n### Lessons Learned\n- \n\n### Next Week Goals\n- [ ] \n\n### Notes\n',
          tags: ['review', 'weekly'],
        },
      },
      {
        id: 'wr-task-1',
        type: 'create-task',
        data: {
          title: 'Review goals and OKRs',
          description: 'Part of weekly review for {{date}}',
          priority: 'high',
          tags: ['weekly-review'],
        },
      },
      {
        id: 'wr-task-2',
        type: 'create-task',
        data: {
          title: 'Clear inbox to zero',
          description: 'Part of weekly review for {{date}}',
          priority: 'medium',
          tags: ['weekly-review'],
        },
      },
      {
        id: 'wr-task-3',
        type: 'create-task',
        data: {
          title: 'Plan next week priorities',
          description: 'Part of weekly review for {{date}}',
          priority: 'high',
          tags: ['weekly-review'],
        },
      },
      {
        id: 'wr-task-4',
        type: 'create-task',
        data: {
          title: 'Review and update project status',
          description: 'Part of weekly review for {{date}}',
          priority: 'medium',
          tags: ['weekly-review'],
        },
      },
      {
        id: 'wr-task-5',
        type: 'create-task',
        data: {
          title: 'Archive completed tasks',
          description: 'Part of weekly review for {{date}}',
          priority: 'low',
          tags: ['weekly-review'],
        },
      },
    ],
    variables: [
      {
        key: 'date',
        label: 'Week of',
        type: 'date',
        defaultValue: new Date().toISOString().split('T')[0],
      },
    ],
    usageCount: 0,
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    description: 'Set up tasks for a new sprint cycle',
    icon: '🏃',
    category: 'planning',
    actions: [
      {
        id: 'sp-task-1',
        type: 'create-task',
        data: {
          title: 'Review backlog and prioritize items',
          description: 'Sprint: {{sprintName}}',
          priority: 'high',
          tags: ['sprint', '{{sprintName}}'],
        },
      },
      {
        id: 'sp-task-2',
        type: 'create-task',
        data: {
          title: 'Estimate story points for selected items',
          description: 'Sprint: {{sprintName}}',
          priority: 'high',
          tags: ['sprint', '{{sprintName}}'],
        },
      },
      {
        id: 'sp-task-3',
        type: 'create-task',
        data: {
          title: 'Define acceptance criteria',
          description: 'Sprint: {{sprintName}}',
          priority: 'medium',
          tags: ['sprint', '{{sprintName}}'],
        },
      },
      {
        id: 'sp-task-4',
        type: 'create-task',
        data: {
          title: 'Assign tasks to team members',
          description: 'Sprint: {{sprintName}}',
          priority: 'medium',
          tags: ['sprint', '{{sprintName}}'],
        },
      },
      {
        id: 'sp-task-5',
        type: 'create-task',
        data: {
          title: 'Set up sprint board and tracking',
          description: 'Sprint: {{sprintName}}',
          priority: 'low',
          tags: ['sprint', '{{sprintName}}'],
        },
      },
    ],
    variables: [
      {
        key: 'sprintName',
        label: 'Sprint Name',
        type: 'text',
        defaultValue: 'Sprint 1',
      },
    ],
    usageCount: 0,
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Create a meeting note and calendar event',
    icon: '📋',
    category: 'meeting',
    actions: [
      {
        id: 'mn-note',
        type: 'create-note',
        data: {
          title: '{{meetingTitle}} — Meeting Notes',
          content:
            '## {{meetingTitle}}\n\n**Date:** {{date}}\n**Attendees:** {{attendees}}\n\n### Agenda\n1. \n\n### Discussion Points\n- \n\n### Action Items\n- [ ] \n\n### Next Steps\n',
          tags: ['meeting'],
        },
      },
      {
        id: 'mn-event',
        type: 'create-event',
        data: {
          title: '{{meetingTitle}}',
          duration: 60,
        },
      },
    ],
    variables: [
      {
        key: 'meetingTitle',
        label: 'Meeting Title',
        type: 'text',
        defaultValue: 'Team Sync',
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        defaultValue: new Date().toISOString().split('T')[0],
      },
      {
        key: 'attendees',
        label: 'Attendees',
        type: 'text',
        defaultValue: '',
      },
    ],
    usageCount: 0,
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'daily-standup',
    name: 'Daily Standup',
    description: 'Create a standup note with standard format',
    icon: '☀️',
    category: 'workflow',
    actions: [
      {
        id: 'ds-note',
        type: 'create-note',
        data: {
          title: 'Standup — {{date}}',
          content:
            '## Daily Standup — {{date}}\n\n### Yesterday\n- \n\n### Today\n- \n\n### Blockers\n- \n',
          tags: ['standup', 'daily'],
        },
      },
    ],
    variables: [
      {
        key: 'date',
        label: 'Date',
        type: 'date',
        defaultValue: new Date().toISOString().split('T')[0],
      },
    ],
    usageCount: 0,
    isBuiltIn: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// ==================== STORE ====================

interface SmartTemplateState {
  templates: SmartTemplate[];

  createTemplate: (
    template: Omit<SmartTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>
  ) => SmartTemplate;
  updateTemplate: (id: string, updates: Partial<SmartTemplate>) => void;
  deleteTemplate: (id: string) => void;
  incrementUsage: (id: string) => void;
  getTemplatesByCategory: (category: string) => SmartTemplate[];
}

export const useSmartTemplateStore = create<SmartTemplateState>()(
  persist(
    (set, get) => ({
      templates: [...BUILT_IN_TEMPLATES],

      createTemplate: (templateData) => {
        const now = new Date().toISOString();
        const newTemplate: SmartTemplate = {
          ...templateData,
          id: uuidv4(),
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        return newTemplate;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (!template || template.isBuiltIn) return;

        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      incrementUsage: (id) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      getTemplatesByCategory: (category) => {
        return get().templates.filter((t) => t.category === category);
      },
    }),
    {
      name: 'smart-templates',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1,
      partialize: (state) => ({
        templates: state.templates,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<SmartTemplateState>;
        const persistedTemplates = persistedState.templates || [];

        // Ensure built-in templates are always present
        const builtInIds = BUILT_IN_TEMPLATES.map((t) => t.id);
        const customTemplates = persistedTemplates.filter(
          (t) => !builtInIds.includes(t.id)
        );
        // Preserve usage counts for built-ins
        const mergedBuiltIns = BUILT_IN_TEMPLATES.map((builtIn) => {
          const persisted = persistedTemplates.find((t) => t.id === builtIn.id);
          return persisted
            ? { ...builtIn, usageCount: persisted.usageCount }
            : builtIn;
        });

        return {
          ...current,
          templates: [...mergedBuiltIns, ...customTemplates],
        };
      },
    }
  )
);
