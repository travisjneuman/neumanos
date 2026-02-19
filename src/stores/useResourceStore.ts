import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resource, ResourceState } from '../types';

interface ResourceStore extends ResourceState {
  // Actions
  addResource: (resource: Omit<Resource, 'id' | 'createdDate'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  assignTaskToResource: (resourceId: string, taskId: string) => void;
  unassignTaskFromResource: (resourceId: string, taskId: string) => void;
  getResourceUtilization: (id: string, estimatedHoursPerTask: Map<string, number>) => number;
  getAvailableResources: (requiredSkills?: string[]) => Resource[];
  clearAllResources: () => void;
}

export const useResourceStore = create<ResourceStore>()(
  persist(
    (set, get) => ({
      resources: [],

      addResource: (resource) => {
        const newResource: Resource = {
          ...resource,
          id: Date.now().toString(),
          createdDate: new Date().toISOString(),
          assignedTasks: resource.assignedTasks || [],
        };
        set((state) => ({
          resources: [...state.resources, newResource],
        }));
      },

      updateResource: (id, updates) =>
        set((state) => ({
          resources: state.resources.map((resource) =>
            resource.id === id ? { ...resource, ...updates } : resource
          ),
        })),

      deleteResource: (id) =>
        set((state) => ({
          resources: state.resources.filter((resource) => resource.id !== id),
        })),

      assignTaskToResource: (resourceId, taskId) =>
        set((state) => ({
          resources: state.resources.map((resource) =>
            resource.id === resourceId
              ? {
                  ...resource,
                  assignedTasks: [...resource.assignedTasks, taskId],
                }
              : resource
          ),
        })),

      unassignTaskFromResource: (resourceId, taskId) =>
        set((state) => ({
          resources: state.resources.map((resource) =>
            resource.id === resourceId
              ? {
                  ...resource,
                  assignedTasks: resource.assignedTasks.filter((id) => id !== taskId),
                }
              : resource
          ),
        })),

      getResourceUtilization: (id, estimatedHoursPerTask) => {
        const resource = get().resources.find((r) => r.id === id);
        if (!resource) return 0;

        const totalAssignedHours = resource.assignedTasks.reduce((sum, taskId) => {
          return sum + (estimatedHoursPerTask.get(taskId) || 0);
        }, 0);

        return resource.capacity > 0 ? (totalAssignedHours / resource.capacity) * 100 : 0;
      },

      getAvailableResources: (requiredSkills) => {
        const resources = get().resources;
        if (!requiredSkills || requiredSkills.length === 0) {
          return resources;
        }
        return resources.filter((resource) =>
          requiredSkills.some((skill) => resource.skills.includes(skill))
        );
      },

      clearAllResources: () => set({ resources: [] }),
    }),
    {
      name: 'resource-storage',
      partialize: (state) => ({ resources: state.resources }),
    }
  )
);
