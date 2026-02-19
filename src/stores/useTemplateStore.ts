/**
 * Template Store
 * Manages task templates for recurring tasks
 *
 * Templates store reusable task configurations (description, checklist, tags, custom fields)
 * that can be automatically applied to recurring task instances.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TaskTemplate, Task } from '../types';
import { createSyncedStorage } from '../lib/syncedStorage';
import { logger } from '../services/logger';

const log = logger.module('TemplateStore');

interface TemplateState {
  templates: TaskTemplate[];

  // Actions
  createTemplate: (task: Partial<Task>) => TaskTemplate;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplate: (id: string) => TaskTemplate | undefined;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      /**
       * Create a new template from a task
       * Extracts only template-relevant fields (description, checklist, tags, custom fields)
       */
      createTemplate: (task: Partial<Task>): TaskTemplate => {
        const now = new Date().toISOString();
        const template: TaskTemplate = {
          id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: task.title || 'Untitled Template',
          description: task.description || '',
          checklist: task.checklist?.map(item => ({
            ...item,
            completed: false, // Reset completion status
          })),
          tags: task.tags || [],
          customFields: task.customFields ? { ...task.customFields } : undefined,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          templates: [...state.templates, template],
        }));

        log.info('Created template', { templateId: template.id, name: template.name });
        return template;
      },

      /**
       * Update an existing template
       */
      updateTemplate: (id: string, updates: Partial<TaskTemplate>): void => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? {
                  ...template,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : template
          ),
        }));

        log.info('Updated template', { templateId: id, updates });
      },

      /**
       * Delete a template
       * Note: Does not affect existing recurring tasks using this template
       */
      deleteTemplate: (id: string): void => {
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
        }));

        log.info('Deleted template', { templateId: id });
      },

      /**
       * Get a template by ID
       */
      getTemplate: (id: string): TaskTemplate | undefined => {
        return get().templates.find((template) => template.id === id);
      },
    }),
    {
      name: 'template-storage',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1,
      partialize: (state) => ({
        templates: state.templates,
      }),
    }
  )
);
