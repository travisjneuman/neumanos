/**
 * ResourceAssignmentSection
 *
 * Section component for assigning resources to tasks in CardDetailPanel.
 * Features:
 * - Shows current assignee with avatar/initials
 * - Dropdown to select from available resources
 * - Utilization percentage display
 * - Over-capacity warning indicator
 */

import React, { useState, useMemo } from 'react';
import { useResourceStore } from '../../../stores/useResourceStore';
import { useKanbanStore } from '../../../stores/useKanbanStore';
import type { Task } from '../../../types';

interface ResourceAssignmentSectionProps {
  task: Task;
  onFieldBlur: (field: keyof Task, value: unknown) => void;
}

export const ResourceAssignmentSection: React.FC<ResourceAssignmentSectionProps> = ({
  task,
  onFieldBlur,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const resources = useResourceStore((s) => s.resources);
  const assignTaskToResource = useResourceStore((s) => s.assignTaskToResource);
  const unassignTaskFromResource = useResourceStore((s) => s.unassignTaskFromResource);
  const tasks = useKanbanStore((s) => s.tasks);

  // Build estimated hours map for utilization calculation
  const estimatedHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.estimatedHours) {
        map.set(t.id, t.estimatedHours);
      }
    });
    return map;
  }, [tasks]);

  // Calculate utilization for each resource
  const resourcesWithUtilization = useMemo(() => {
    return resources.map((resource) => {
      const totalAssignedHours = resource.assignedTasks.reduce((sum, taskId) => {
        return sum + (estimatedHoursMap.get(taskId) || 0);
      }, 0);
      const utilization = resource.capacity > 0
        ? (totalAssignedHours / resource.capacity) * 100
        : 0;
      return {
        ...resource,
        utilization,
        isOverCapacity: utilization > 100,
      };
    });
  }, [resources, estimatedHoursMap]);

  // Find current assignee
  const currentAssignee = useMemo(() => {
    if (!task.assignedTo) return null;
    return resourcesWithUtilization.find((r) => r.id === task.assignedTo) || null;
  }, [task.assignedTo, resourcesWithUtilization]);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle assignment
  const handleAssign = (resourceId: string | null) => {
    // Unassign from current resource
    if (task.assignedTo) {
      unassignTaskFromResource(task.assignedTo, task.id);
    }

    // Assign to new resource
    if (resourceId) {
      assignTaskToResource(resourceId, task.id);
    }

    // Update task
    onFieldBlur('assignedTo', resourceId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
        Assigned To
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-left hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors flex items-center gap-2"
      >
        {currentAssignee ? (
          <>
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
              currentAssignee.isOverCapacity ? 'bg-status-error' : 'bg-accent-primary'
            }`}>
              {getInitials(currentAssignee.name)}
            </div>
            <span className="flex-1 text-text-light-primary dark:text-text-dark-primary">
              {currentAssignee.name}
            </span>
            <span className={`text-xs ${
              currentAssignee.isOverCapacity
                ? 'text-status-error'
                : currentAssignee.utilization > 80
                  ? 'text-status-warning'
                  : 'text-text-light-secondary dark:text-text-dark-secondary'
            }`}>
              {Math.round(currentAssignee.utilization)}%
            </span>
          </>
        ) : (
          <span className="text-text-light-secondary dark:text-text-dark-secondary">
            + Assign resource
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Unassign option */}
          {currentAssignee && (
            <button
              onClick={() => handleAssign(null)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border-b border-border-light dark:border-border-dark"
            >
              Unassign
            </button>
          )}

          {resourcesWithUtilization.length === 0 ? (
            <div className="px-3 py-4 text-sm text-text-light-secondary dark:text-text-dark-secondary text-center">
              No resources available.
              <br />
              Add resources in Settings.
            </div>
          ) : (
            resourcesWithUtilization.map((resource) => (
              <button
                key={resource.id}
                onClick={() => handleAssign(resource.id)}
                disabled={resource.id === task.assignedTo}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                  resource.id === task.assignedTo
                    ? 'bg-accent-primary/10 cursor-default'
                    : 'hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                }`}
              >
                {/* Avatar */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                  resource.isOverCapacity ? 'bg-status-error' : 'bg-accent-primary'
                }`}>
                  {getInitials(resource.name)}
                </div>

                <div className="flex-1">
                  <div className="text-text-light-primary dark:text-text-dark-primary">
                    {resource.name}
                  </div>
                  {resource.skills.length > 0 && (
                    <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {resource.skills.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>

                {/* Utilization indicator */}
                <div className="text-right">
                  <div className={`text-xs font-medium ${
                    resource.isOverCapacity
                      ? 'text-status-error'
                      : resource.utilization > 80
                        ? 'text-status-warning'
                        : 'text-status-success'
                  }`}>
                    {Math.round(resource.utilization)}%
                  </div>
                  {resource.isOverCapacity && (
                    <div className="text-[10px] text-status-error">
                      Over capacity
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceAssignmentSection;
