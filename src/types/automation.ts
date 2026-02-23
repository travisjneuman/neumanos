/**
 * Automation Engine Types
 * Defines types for rule-based task automation system
 */

import type { Task, TaskStatus, TaskPriority } from './index';

// ============================================================================
// Store Actions Interface (for automation engine)
// ============================================================================

/**
 * Interface for Kanban store actions used by automation engine.
 * Provides type safety for store interactions.
 */
export interface AutomationStoreActions {
  moveTask: (taskId: string, status: TaskStatus) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addComment: (taskId: string, text: string) => void;
  archiveTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'created'>) => void;
  notify: (title: string, body: string) => void;
}

// ============================================================================
// Field Value Type (return type for getFieldValue)
// ============================================================================

/**
 * Union type for values that can be retrieved from task fields.
 * Used by condition evaluation in automation engine.
 */
export type TaskFieldValue =
  | TaskStatus
  | TaskPriority
  | string[]
  | string
  | number
  | undefined
  | null;

// ============================================================================
// Action Config Types (typed configs for each action type)
// ============================================================================

/**
 * Combined interface for all action configuration options.
 * Each action type uses a subset of these fields.
 * This approach allows type-safe access without complex union narrowing.
 */
export interface AutomationActionConfig {
  // move_task, set_status
  status?: TaskStatus;
  // set_priority
  priority?: TaskPriority;
  // add_tag, remove_tag
  tag?: string;
  // add_comment
  text?: string;
  // set_due_date
  dueDate?: string;
  // set_estimate
  estimatedHours?: number;
  // notify
  message?: string;
  // Extensibility for future actions
  [key: string]: unknown;
}

// ============================================================================
// Condition Value Type
// ============================================================================

/**
 * Type for condition values in automation rules.
 * Supports strings, numbers, and arrays for various operators.
 */
export type AutomationConditionValue = string | number | string[] | boolean | null;

// ============================================================================
// Trigger and Rule Types
// ============================================================================

export type AutomationTriggerType =
  | 'task.created'
  | 'task.moved'
  | 'task.updated'
  | 'task.completed'
  | 'task.overdue'
  | 'task.tagged'
  | 'recurring.generated'
  | 'time.daily'
  | 'time.weekly';

export type AutomationConditionField =
  | 'status'
  | 'priority'
  | 'tags'
  | 'dueDate'
  | 'title'
  | 'description'
  | 'estimatedHours'
  | 'progress';

export type AutomationConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_set'
  | 'is_not_set';

export type AutomationActionType =
  | 'move_task'
  | 'set_priority'
  | 'add_tag'
  | 'remove_tag'
  | 'set_status'
  | 'add_comment'
  | 'archive'
  | 'delete'
  | 'set_due_date'
  | 'set_estimate'
  | 'duplicate'
  | 'notify';

export interface AutomationTrigger {
  type: AutomationTriggerType;
  config?: Record<string, unknown>; // Trigger-specific configuration
}

export interface AutomationCondition {
  field: AutomationConditionField;
  operator: AutomationConditionOperator;
  value: AutomationConditionValue;
}

export interface AutomationAction {
  type: AutomationActionType;
  config: AutomationActionConfig; // Type-safe action configuration
  delay?: number; // Optional delay in milliseconds
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;

  // Trigger configuration
  trigger: AutomationTrigger;

  // Optional conditions (AND logic for MVP)
  conditions?: AutomationCondition[];

  // Actions to execute
  actions: AutomationAction[];

  // Metadata
  created: string;
  lastRun?: string;
  runCount: number;
}

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  taskId: string;
  taskTitle: string;
  timestamp: string;
  success: boolean;
  error?: string;
  actionsExecuted: number;
}

export interface AutomationContext {
  taskId: string;
  previousStatus?: string;
  newStatus?: string;
  changedFields?: string[];
  timestamp: string;
}
