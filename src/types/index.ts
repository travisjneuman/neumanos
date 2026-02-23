// ==================== CORE TYPES ====================

import type { CustomFieldsMap } from './customFields';

export type ViewMode = 'monthly' | 'weekly' | 'daily' | 'agenda';
export type TaskStatus = 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

// ==================== PROJECT CONTEXT TYPES ====================
// Global project/context filter system for scoping all entities

/**
 * ProjectContext - A hierarchical project/context for organizing all entities.
 * Used by the global project filter dropdown to scope the entire platform.
 *
 * Note: This is distinct from the PM-focused `Project` interface used in Gantt/resource planning.
 * ProjectContext is for user-facing organization; Project is for PM tracking features.
 */
export interface ProjectContext {
  id: string;
  name: string;
  parentId: string | null;       // null = root project (enables hierarchy)
  color: string;                 // Hex color for visual identification
  icon?: string;                 // Optional emoji/icon (e.g., "🏠", "💼")
  description?: string;          // Optional project description
  archivedAt?: string;           // ISO date - soft delete (null = active)
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
}

export interface ProjectContextState {
  // Projects data
  projects: ProjectContext[];

  // Global filter state (empty = "All")
  activeProjectIds: string[];
}

// ==================== WIDGET DATA TYPES ====================

export type EventColorCategory = 'default' | 'work' | 'personal' | 'health' | 'social' | 'travel' | 'finance' | 'education';

export interface EventColorCategoryConfig {
  id: EventColorCategory;
  label: string;
  bgClass: string;       // Tailwind bg class for event display
  textClass: string;     // Tailwind text class
  borderClass: string;   // Tailwind border class
  hex: string;           // Hex color for inline styles
}

/** A user-defined calendar grouping (Work, Personal, Birthdays, etc.) */
export interface UserCalendar {
  id: string;
  name: string;
  color: string;   // Hex color for event display
  visible: boolean; // Toggle visibility in views
}

/** A subscribed external ICS calendar URL */
export interface ICSSubscription {
  id: string;
  name: string;
  url: string;
  color: string;          // Hex color for imported events
  lastSyncedAt?: string;  // ISO date
  autoSyncMinutes: number; // 0 = manual only
  enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime?: string; // "14:00" (24-hour format)
  endTime?: string;   // "15:30"
  isAllDay?: boolean; // default true if no times specified

  // Multi-calendar support
  calendarId?: string;     // UserCalendar.id (undefined = default)
  externalSource?: string; // ICSSubscription.id (marks event as read-only)

  // Project context (global filter system)
  projectIds: string[];  // Array for multi-project support; empty = uncategorized

  // Recurrence
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // e.g., every 2 weeks
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc. (for weekly)
    dayOfMonth?: number; // 1-31 (for monthly)
    endType: 'never' | 'after' | 'until';
    endCount?: number; // if endType='after'
    endDate?: string; // if endType='until' (YYYY-MM-DD)
  };
  recurrenceId?: string; // For recurring event instances (parent event ID)
  recurrenceException?: boolean; // True if this instance was edited

  // Multi-day
  endDate?: string; // YYYY-MM-DD (if different from startDate)

  // Reminders
  reminders?: number[]; // Minutes before event (e.g., [15, 60])

  // Location
  location?: string;

  // Color category
  colorCategory?: EventColorCategory;

  // Multi-day rendering flags (internal, not persisted)
  _isMultiDayPart?: boolean;
  _isMultiDayFirst?: boolean;
  _isMultiDayLast?: boolean;
}

export interface CalendarState {
  events: Record<string, CalendarEvent[]>; // dateKey -> array of events
  viewMode: ViewMode;
  currentDate: Date;
  calendars: UserCalendar[];               // Multi-calendar support
  icsSubscriptions: ICSSubscription[];     // External ICS URL subscriptions
}

export type DependencyType =
  | 'finish-to-start'  // Task B starts when A finishes (default)
  | 'start-to-start'   // Task B starts when A starts
  | 'finish-to-finish' // Task B finishes when A finishes
  | 'start-to-finish'; // Task B finishes when A starts (rare)

export interface TaskDependency {
  taskId: string;           // ID of dependent task
  type: DependencyType;     // Type of dependency
  lag: number;              // Lag time in days (can be negative for lead)
}

// Phase 1.4: Baseline snapshot for task (stored in project baseline)
export interface BaselineTask {
  id: string;
  startDate: string | null;
  dueDate: string | null;
  progress: number;
}

// Phase 1.4: Project baseline snapshot
export interface ProjectBaseline {
  setAt: string;            // ISO date when baseline was set
  tasks: BaselineTask[];    // Snapshot of all tasks at baseline time
}

// Phase 1.4: Variance status for baseline comparison
export type VarianceStatus = 'ahead' | 'behind' | 'on-track';

// Phase 3.1: Team member for task assignment
export interface Member {
  id: string;
  name: string;
  email?: string;
  initials: string;        // Auto-generated from name
  avatarColor: string;     // Hex color for avatar background
  createdAt: string;       // ISO date
}

// Phase 3.2: File attachment for tasks
export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  fileType: string;        // MIME type (e.g., "image/png", "application/pdf")
  fileSize: number;        // Bytes
  dataUrl: string;         // Base64 data URI
  uploadedAt: string;      // ISO date
  uploadedBy?: string;     // Future: member ID
}

// Phase 4: Column definition for custom Kanban columns
export interface KanbanColumn {
  id: string;              // e.g., "backlog", "todo", or UUID for custom
  title: string;           // e.g., "Backlog", "In Progress"
  color: string;           // Tailwind class: "bg-status-info"
  order: number;           // For drag-drop reordering
  wipLimit?: number;       // Optional WIP constraint (e.g., 5 tasks max)
}

// Phase 4: Checklist item for subtasks
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  createdAt: string;       // ISO date
}

// Task Template for Recurring Tasks (P2)
export interface TaskTemplate {
  id: string;
  name: string;                    // Template name (user-defined)
  description: string;             // Template description
  checklist?: ChecklistItem[];     // Checklist items (NOT completion status)
  tags: string[];                  // Tags/labels
  customFields?: CustomFieldsMap;  // Custom field values
  createdAt: string;               // ISO date string
  updatedAt?: string;              // ISO date string
}

// Phase 5: Subtask - Rich nested tasks within a card
export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: TaskPriority;
  dueDate?: string;       // YYYY-MM-DD
  order: number;          // For manual sorting
  createdAt: string;      // ISO date
  completedAt?: string;   // ISO date (when marked complete)
}

// Phase 5: Simple task dependency (blocks/blocked-by)
export interface SimpleTaskDependency {
  id: string;
  sourceTaskId: string; // Task that blocks
  targetTaskId: string; // Task that is blocked
  createdAt: string;    // ISO date
}

// Phase 4: Comment for task discussions
export interface TaskComment {
  id: string;
  taskId: string;
  text: string;            // Markdown supported
  author: string;          // For future: user ID, for now: "You"
  createdAt: string;       // ISO date
  updatedAt?: string;      // ISO date (if edited)
}

// Phase 4: Activity log entry for tracking changes
export interface ActivityLogEntry {
  id: string;
  timestamp: string;       // ISO date
  action: 'created' | 'updated' | 'moved' | 'commented' | 'checklist_updated';
  field?: string;          // e.g., "status", "priority"
  oldValue?: string;
  newValue?: string;
  userId?: string;         // For future: "You" for now
}

// Undo system: History entry for undoing destructive actions
export interface UndoHistoryEntry {
  id: string;              // Unique ID for this action
  timestamp: string;       // ISO date
  action: 'deleteColumn' | 'replaceAllColumns' | 'deleteTask' | 'bulkDelete';
  description: string;     // Human-readable: "Deleted column 'In Progress'"
  previousState: {
    columns: KanbanColumn[];
    tasks: Task[];
  };
}

export type EffortEstimate = 1 | 2 | 3 | 5 | 8 | 13; // Story points (Fibonacci)
export type CustomStatus = 'in-review' | 'testing' | 'deployed' | 'blocked'; // Beyond base status

// Phase 4: Card templates for quick task creation
export interface CardTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;           // Pre-filled description
  defaultPriority: TaskPriority;
  defaultTags: string[];
  defaultColumn?: string;        // Optional default column
  isBuiltIn: boolean;            // System templates vs user-created
}

export interface TimeTracking {
  estimated?: number;           // Estimated hours
  actual: number;               // Actual hours spent
  activeTimerStart?: string;    // ISO date (null = timer not running)
  timerHistory: Array<{         // Time tracking history log
    id: string;
    startTime: string;          // ISO date
    endTime: string;            // ISO date
    duration: number;           // Seconds
  }>;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created: string; // ISO date string
  startDate: string | null; // Date string YYYY-MM-DD
  dueDate: string | null; // Date string YYYY-MM-DD
  priority: TaskPriority;
  tags: string[];
  order?: number; // Position within status column for drag-drop

  // Project context (global filter system)
  projectIds: string[];  // Array for multi-project support; empty = uncategorized

  // ENHANCED PM FIELDS:
  dependencies?: TaskDependency[]; // Tasks this depends on
  estimatedHours?: number;         // For resource planning
  actualHours?: number;            // For EVM calculations
  progress?: number;               // 0-100 percentage complete
  isMilestone?: boolean;           // True for milestone markers
  assignedTo?: string;             // Resource ID
  baseline?: {                     // Original plan for comparison
    startDate: string;
    dueDate: string;
  };
  isOnCriticalPath?: boolean;      // Calculated field

  // PHASE 4 FIELDS:
  checklist?: ChecklistItem[];     // Subtasks/checklist
  comments?: TaskComment[];        // Discussion/comments
  activityLog?: ActivityLogEntry[]; // Change history

  // PHASE 5 FIELDS:
  subtasks?: Subtask[];            // Rich nested tasks

  // PHASE A (QUICK WINS) FIELDS:
  archivedAt?: string;             // ISO date (when task was archived)
  lastCompletedAt?: string;        // ISO date (when moved to "done" for auto-archive)
  cardNumber?: number;             // Auto-incrementing card number (KAN-1, KAN-2, etc.)

  // PHASE B (KANBAN PM) FIELDS:
  effort?: EffortEstimate;         // Story points (1, 2, 3, 5, 8, 13)
  customStatus?: CustomStatus;     // Additional status labels (in-review, testing, deployed, blocked)
  timeTracking?: TimeTracking;     // Time tracking with history

  // RECURRING TASKS FIELDS (P1):
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // e.g., every 2 weeks
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, etc. (for weekly)
    dayOfMonth?: number; // 1-31 (for monthly)

    // P3: Ordinal patterns ("first Monday", "last Friday")
    weekOfMonth?: 1 | 2 | 3 | 4 | -1; // -1 = last
    dayOfWeekInMonth?: number; // 0-6 (combined with weekOfMonth)

    endType: 'never' | 'after' | 'until';
    endCount?: number; // if endType='after'
    endDate?: string; // if endType='until' (YYYY-MM-DD)
    recurFromCompletion?: boolean; // If true, recur from completion date instead of due date (default: false)
    templateId?: string; // P2: Task template to apply to recurring instances
  };
  recurrenceId?: string; // For recurring task instances (parent task ID)
  recurrenceException?: boolean; // True if this instance was edited
  isRecurringParent?: boolean; // True if this is the parent/template task
  nextOccurrence?: string; // YYYY-MM-DD (calculated field)

  // CUSTOM FIELDS (P2 #3):
  customFields?: CustomFieldsMap; // Custom metadata fields (fieldId -> value)

  // PHASE 3.1 FIELDS (TEAM COLLABORATION):
  assignees?: string[];           // Array of member IDs assigned to this task

  // PHASE 3.2 FIELDS (FILE ATTACHMENTS):
  attachments?: TaskAttachment[]; // File attachments for this task

  // PHASE 3.4 FIELDS (CARD COVERS):
  coverMode?: 'fit' | 'fill'; // Cover image display mode (default: 'fit')
}

export interface KanbanState {
  tasks: Task[];
  columns: KanbanColumn[];         // Phase 4: Dynamic columns
  // NOTE: dependencies moved to Task.dependencies (task-level instead of global)
  // NOTE: archivedTasks moved to useKanbanArchiveStore (Phase 8.1)
  /** @deprecated Use useKanbanArchiveStore instead. Kept for migration compatibility. */
  archivedTasks?: Task[];          // Phase A: Archived tasks (separate from active)
  nextCardNumber?: number;         // Phase A: Auto-incrementing counter for card numbers
  visibleColumns?: number;         // Number of columns to show at once before scrolling (default: 5)
  baseline?: ProjectBaseline | null; // Phase 1.4: Project baseline snapshot
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WeatherData {
  location: string;
  temp: number;
  feelsLike: number;
  desc: string;
  humidity: number;
  windSpeed: number;
  precipProbability: number;
  icon: string;
}

export interface WeatherState {
  city: string;
  coords: Coordinates;
  useGeolocation: boolean;
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
}

export interface MapState {
  coords: Coordinates;
  locationName: string;
  zoom: number;
}

// ==================== TIME TRACKING TYPES ====================

export interface TimeEntry {
  id: string;
  workspaceId: string;           // Always use default workspace for now
  projectId?: string;            // Optional: Link to TimeTrackingProject (for billing/budgets)
  taskId?: string;               // Optional: Link to Kanban task
  description: string;           // Title/what you worked on (required)
  notes?: string;                // Additional details
  tags: string[];                // Categorization (e.g., "meeting", "coding", "research")

  // Project context (global filter system)
  projectIds: string[];          // Array for multi-project support; empty = uncategorized

  // Time tracking
  startTime: string;             // ISO 8601 timestamp
  endTime?: string;              // ISO 8601 timestamp (null = running timer)
  duration: number;              // Seconds (calculated or manual)
  isPaused?: boolean;            // Is the timer currently paused?
  pausedAt?: string;             // ISO 8601 timestamp when timer was paused

  // Billing (future)
  billable: boolean;             // Is this billable time?
  hourlyRate?: number;           // USD per hour

  // Metadata
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  userId?: string;               // For multi-user support (future)
}

export interface TimeTrackingProject {
  id: string;
  name: string;
  color: string;                 // Hex color for visual distinction
  clientName?: string;           // Optional: Company/client name

  // Budget tracking
  estimatedHours?: number;       // Total estimated hours
  hourlyRate?: number;           // Default rate for this project

  // Status
  active: boolean;               // Show in active list
  archived: boolean;             // Hide from UI

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface EntryFilters {
  dateRange?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';
  startDate?: string;            // For custom date range
  endDate?: string;              // For custom date range
  projectIds: string[];          // Filter by projects
  tags: string[];                // Filter by tags
  searchQuery: string;           // Search in description/notes
}

export type TimeViewMode = 'list' | 'calendar' | 'report';

export interface TimeTrackingState {
  // Current timer
  activeEntry: TimeEntry | null;      // Currently running timer

  // History
  entries: TimeEntry[];                // All time entries (sorted desc by startTime)
  projects: TimeTrackingProject[];     // All projects

  // UI state
  selectedDate: string;                // Date filter for calendar view
  selectedProject: string | null;      // Project filter
  selectedTags: string[];              // Tag filters
  viewMode: TimeViewMode;              // Current view
  filters: EntryFilters;               // Current filters

  // Settings
  defaultProjectId?: string;           // Quick-start default
  reminderEnabled: boolean;            // Remind if not tracking (future)
  idleDetectionMinutes: number;        // Idle timeout (0 = disabled)
  roundingMinutes: 0 | 5 | 15 | 30;   // Round time entries
}

// ==================== TIME TRACKING SUMMARIES ====================

export interface DailySummary {
  date: string;              // ISO date (YYYY-MM-DD)
  totalDuration: number;     // Total seconds for this day
  entryCount: number;        // Number of entries
}

export interface WeeklySummary {
  weekStart: string;         // ISO date (Monday)
  weekEnd: string;           // ISO date (Sunday)
  totalDuration: number;     // Total seconds for the week
  entryCount: number;        // Number of entries
  dailyBreakdown: DailySummary[];  // Daily totals for each day
}

export interface MonthlyReport {
  year: number;
  month: number;             // 0-11 (JavaScript Date format)
  totalDuration: number;     // Total seconds for the month
  entryCount: number;        // Number of entries
  dailyBreakdown: DailySummary[];  // 28-31 days
  projectBreakdown: ProjectSummary[];
}

export interface ProjectSummary {
  projectId: string | null;  // null = "No Project"
  projectName: string;       // "No Project" for unassigned
  projectColor: string;      // Hex color
  totalDuration: number;     // Total seconds
  entryCount: number;        // Number of entries
  percentage: number;        // Percentage of total time (0-100)
}

// ==================== HABIT TRACKING TYPES ====================

export type HabitFrequency =
  | 'daily'
  | 'weekdays'
  | 'weekends'
  | 'specific-days'
  | 'times-per-week';

export type HabitCategory =
  | 'health'
  | 'productivity'
  | 'learning'
  | 'social'
  | 'mindfulness'
  | 'fitness'
  | 'nutrition'
  | 'creative'
  | 'finance'
  | 'uncategorized';

export type HabitDifficulty = 'trivial' | 'easy' | 'medium' | 'hard';

export interface HabitReminder {
  enabled: boolean;
  time: string;                     // "HH:MM" 24-hour format
}

export interface StreakFreezeRecord {
  date: string;                     // YYYY-M-D format date the freeze was applied
  appliedAt: string;                // ISO timestamp when the freeze was applied
  weekStart: string;                // YYYY-M-D of the week start (Monday)
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon?: string;                    // Emoji or Lucide icon name
  color: string;                    // Hex color for visual identity
  category: HabitCategory;          // Grouping category
  difficulty: HabitDifficulty;      // XP multiplier: trivial=1, easy=2, medium=3, hard=4

  // Frequency configuration
  frequency: HabitFrequency;
  targetDays?: number[];            // 0-6 for specific-days (0=Sun)
  timesPerWeek?: number;            // For times-per-week frequency

  // Reminders
  reminder?: HabitReminder;         // Optional daily reminder

  // Dependencies
  requiredHabitIds?: string[];      // Must complete these today before this unlocks

  // Progress tracking
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  totalXp: number;                  // Accumulated experience points

  // Streak freeze
  freezesPerWeek: number;           // Max freezes allowed per week (default 1)
  freezesUsed: StreakFreezeRecord[]; // History of applied freezes

  // Metadata
  projectIds: string[];             // Project context support
  createdAt: string;                // ISO date
  archivedAt?: string;              // Soft delete
  order: number;                    // For drag-drop reordering
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;                     // YYYY-M-D format (non-padded per convention)
  completedAt: string;              // ISO timestamp
  notes?: string;                   // Optional completion note
}

export type HabitAchievementType =
  | 'streak'
  | 'total'
  | 'consistency'
  | 'category-mastery'
  | 'explorer'
  | 'early-bird'
  | 'night-owl';

export interface HabitAchievement {
  id: string;
  type: HabitAchievementType;
  habitId: string;                  // Empty string for global achievements
  value: number;                    // e.g., 7 for "7-day streak"
  unlockedAt: string;               // ISO date
  label?: string;                   // Human-readable label for the achievement
  icon?: string;                    // Lucide icon name
}

export interface HabitState {
  habits: Habit[];
  completions: HabitCompletion[];
  achievements: HabitAchievement[];
}

// ==================== COMPONENT PROPS ====================

/**
 * Props for the Widget wrapper component
 *
 * Widgets are the primary dashboard building blocks. Each widget
 * displays in a card with optional header, drag controls, and
 * built-in loading/error state handling.
 *
 * @example
 * ```tsx
 * <Widget
 *   id="weather"
 *   title="Weather"
 *   category="Information"
 *   loading={isLoading}
 *   error={fetchError}
 *   onRefresh={refetch}
 * >
 *   <WeatherDisplay data={weatherData} />
 * </Widget>
 * ```
 */
export interface WidgetProps {
  /** Unique identifier for the widget (used for persistence) */
  id: string;
  /** Display title shown in widget header */
  title: string;
  /** Category label (e.g., "Information", "Productivity") */
  category?: string;
  /** Additional CSS classes for the widget container */
  className?: string;
  /** Widget content - rendered when not loading/error */
  children?: React.ReactNode;
  /** Optional content displayed in header (e.g., weather stats) */
  headerAccessory?: React.ReactNode;
  /** Whether to show drag handle (default: true) */
  draggable?: boolean;
  /** Shows loading spinner instead of children when true */
  loading?: boolean;
  /** Shows error message with retry option when set */
  error?: string | null;
  /** Callback for retry/refresh button (enables refresh button in header) */
  onRefresh?: () => void;
}

export interface DayInfo {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isOtherMonth: boolean;
  hasEvent: boolean;
  dateKey: string;
}

// ==================== THEME ====================

export type ThemeMode = 'light' | 'dark';

/** Color mode preference — 'system' follows OS preference */
export type ColorMode = 'light' | 'dark' | 'system';

export interface BackupPreferences {
  hasBackupFolder: boolean;
  backupFolderPath: string | null;
  autoSaveEnabled: boolean;
  saveInterval: number; // milliseconds, default 30000
  versionsToKeep: number; // default 7
  customFileName: string; // default "NeumanOS"
  reminderPreference: 'every-session' | 'in-7-days' | 'monthly' | 'never';
  nextReminderDate: string | null; // ISO 8601 date string
}

export interface ThemeState {
  mode: ThemeMode;
  brandTheme: string;
  colorMode: ColorMode;
  toggleTheme: () => void;
  setBrandTheme: (themeId: string) => void;
  setColorMode: (mode: ColorMode) => void;
  backupPreferences: BackupPreferences;
  updateBackupPreferences: (preferences: Partial<BackupPreferences>) => void;
}

// ==================== LAYOUT ====================

export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface LayoutState {
  layouts: WidgetLayout[];
  updateLayout: (layouts: WidgetLayout[]) => void;
}

// ==================== PROJECT MANAGEMENT TYPES ====================

export interface Resource {
  id: string;
  name: string;
  email?: string;
  capacity: number; // Hours per week
  skills: string[];
  assignedTasks: string[]; // Task IDs
  createdDate: string;
}

export interface ResourceState {
  resources: Resource[];
}

export type RiskCategory = 'technical' | 'schedule' | 'budget' | 'resource' | 'external';
export type RiskStatus = 'identified' | 'mitigating' | 'closed';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: 1 | 2 | 3 | 4 | 5; // 1=rare, 5=certain
  impact: 1 | 2 | 3 | 4 | 5; // 1=negligible, 5=catastrophic
  score: number; // probability × impact (1-25)
  mitigationPlan: string;
  owner: string; // Resource ID
  status: RiskStatus;
  relatedTasks: string[]; // Link to affected tasks
  createdDate: string;
  lastReviewed: string;
}

export interface RiskState {
  risks: Risk[];
}

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
export type ProjectHealth = 'green' | 'yellow' | 'red';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  health: ProjectHealth;
  startDate: string;
  endDate: string;
  budget?: number;
  actualSpent?: number;
  assignedResources: string[]; // Resource IDs
  taskIds: string[]; // Task IDs belonging to this project
  riskScore: number; // Aggregated from all risks
  priority: TaskPriority;
  createdDate: string;
}

export interface ProjectState {
  projects: Project[];
  activeProjectId: string | null; // Currently viewing project
}

// ==================== GANTT CHART TYPES ====================

export type GanttViewMode = 'day' | 'week' | 'month' | 'quarter';
export type GanttGroupBy = 'status' | 'priority' | 'assignee' | 'none';
export type GanttSortBy = 'start-date' | 'due-date' | 'priority' | 'manual';

export interface GanttSettings {
  viewMode: GanttViewMode;
  showCriticalPath: boolean;
  showBaseline: boolean;
  showResources: boolean;
  zoomLevel: number; // 1-5
  groupBy: GanttGroupBy;
  sortBy: GanttSortBy;
}

export interface GanttState {
  settings: GanttSettings;
  selectedTaskIds: string[];
  criticalPath: string[]; // Task IDs on critical path
  earliestStart: string | null; // ISO date string
  latestFinish: string | null; // ISO date string
}

// ==================== SYSTEM MONITORING TYPES ====================

export type SystemStatus = 'operational' | 'degraded' | 'down';

export interface SystemMetrics {
  systemId: string;
  systemName: string;
  timestamp: string;
  cpu: number; // Percentage 0-100
  memory: number; // Percentage 0-100
  disk: number; // Percentage 0-100
  network: number; // Mbps
  status: SystemStatus;
}

export interface MonitorState {
  systems: SystemMetrics[];
  lastUpdate: string | null;
}

// ==================== INCIDENT RESPONSE TYPES ====================

export type IncidentSeverity = 'sev0' | 'sev1' | 'sev2' | 'sev3' | 'sev4';
export type IncidentStatus = 'new' | 'investigating' | 'identified' | 'resolved' | 'closed';

export interface IncidentEvent {
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedSystems: string[];
  assignedTo: string; // Resource ID
  createdAt: string;
  resolvedAt?: string;
  timeline: IncidentEvent[];
  postmortem?: string;
  rootCause?: string;
  preventionPlan?: string;
}

export interface IncidentState {
  incidents: Incident[];
}

// ==================== DOCS SYSTEM TYPES ====================

export type DocType = 'doc' | 'sheet' | 'slides';
export type DocSource = 'platform' | 'user';

/**
 * Base document interface shared by all document types.
 * Documents are distinct from Notes - they are professional,
 * polished documents intended for export/sharing.
 */
export interface BaseDoc {
  id: string;
  title: string;
  source: DocSource;         // 'platform' = read-only system docs, 'user' = user-created
  type: DocType;
  folderId?: string;         // Optional folder organization
  createdAt: string;         // ISO date
  updatedAt: string;         // ISO date
  lastAccessedAt?: string;   // ISO date - last time the document was opened
  order: number;             // For manual sorting
  version: number;           // Document version (for history)
  projectIds: string[];      // Project context support
}

/**
 * Professional document (reports, proposals, specs).
 * Uses TipTap (ProseMirror-based) editor - distinct from Notes (Lexical).
 */
export interface ProfessionalDoc extends BaseDoc {
  type: 'doc';
  content: string;           // TipTap JSON content (stringified)
  pageSettings?: {
    orientation: 'portrait' | 'landscape';
    margin: 'normal' | 'narrow' | 'wide';
    size: 'letter' | 'a4' | 'legal';
  };
  templateId?: string;       // Applied template (for reports, proposals, etc.)
}

/**
 * Spreadsheet document with multiple sheets.
 * Uses HyperFormula engine for Excel-compatible formulas.
 */
export interface SpreadsheetDoc extends BaseDoc {
  type: 'sheet';
  sheets: SpreadsheetSheet[];
  activeSheetIndex: number;
}

export interface SpreadsheetSheet {
  id: string;
  name: string;
  data: string[][];          // 2D array of cell values (formulas stored as strings)
  columnWidths?: number[];   // Custom column widths
  rowHeights?: number[];     // Custom row heights
  cellStyles?: Record<string, CellStyle>; // "A1" -> style
  mergedCells?: string[];    // ["A1:B2", "C3:D4"] - merged ranges
  charts?: SpreadsheetChart[]; // Embedded charts
  frozenRows?: number;       // Number of frozen rows (0 = none)
  frozenCols?: number;       // Number of frozen columns (0 = none)
}

export type SpreadsheetChartType = 'bar' | 'line' | 'pie' | 'scatter';

export interface SpreadsheetChart {
  id: string;
  type: SpreadsheetChartType;
  title: string;
  dataRange: string;         // e.g., "A1:C10" - data source range
  labelColumn?: number;      // Column index for labels (0-based)
  position: {                // Position on sheet
    x: number;
    y: number;
    width: number;
    height: number;
  };
  colors?: string[];         // Custom color palette
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textColor?: string;        // Hex color
  backgroundColor?: string;  // Hex color
  alignment?: 'left' | 'center' | 'right';
  verticalAlignment?: 'top' | 'middle' | 'bottom';
  borderTop?: BorderStyle;
  borderRight?: BorderStyle;
  borderBottom?: BorderStyle;
  borderLeft?: BorderStyle;
  numberFormat?: string;     // e.g., "$#,##0.00"
}

export interface BorderStyle {
  color: string;             // Hex color
  style: 'thin' | 'medium' | 'thick' | 'dashed';
}

/**
 * Presentation document with slides.
 * Uses Konva (already bundled) for canvas-based rendering.
 */
export interface PresentationDoc extends BaseDoc {
  type: 'slides';
  slides: Slide[];
  theme: SlideTheme;
  defaultTransition?: SlideTransition;
}

export interface Slide {
  id: string;
  order: number;
  background: SlideBackground;
  elements: SlideElement[];
  transition?: SlideTransition;
  speakerNotes?: string;
  layout?: 'blank' | 'title' | 'content' | 'two-column' | 'section';
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image';
  color?: string;            // Hex color
  gradient?: {
    type: 'linear' | 'radial';
    angle?: number;          // For linear gradient
    stops: Array<{ color: string; position: number }>;
  };
  imageUrl?: string;         // Data URL or external URL
}

export type SlideElementType = 'text' | 'shape' | 'image' | 'chart';

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;

  // Type-specific content
  text?: {
    content: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    color: string;
  };
  shape?: {
    type: 'rectangle' | 'ellipse' | 'triangle' | 'arrow' | 'line';
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  image?: {
    src: string;             // Data URL or external URL
    fit: 'fill' | 'contain' | 'cover';
  };
  chart?: {
    type: 'bar' | 'line' | 'pie';
    data: unknown;           // Chart-specific data structure
  };

  // Animation
  animation?: {
    effect: 'fade' | 'slide' | 'zoom' | 'bounce';
    direction?: 'in' | 'out' | 'left' | 'right' | 'up' | 'down';
    duration: number;        // milliseconds
    delay?: number;          // milliseconds
    trigger: 'on-click' | 'with-previous' | 'after-previous';
  };
}

export interface SlideTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export interface SlideTransition {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration: number;          // milliseconds
}

// Union type for all document types
export type Doc = ProfessionalDoc | SpreadsheetDoc | PresentationDoc;

// Document folder for organization
export interface DocFolder {
  id: string;
  name: string;
  parentId: string | null;   // null = root
  createdAt: string;
  order: number;
}

// Platform doc metadata (built at compile time)
export interface PlatformDocMeta {
  id: string;
  title: string;
  path: string;              // e.g., "README.md"
  category: 'getting-started' | 'features' | 'guides';
  order: number;
}

export interface DocsState {
  // User documents (persisted to IndexedDB)
  docs: Doc[];
  folders: DocFolder[];

  // Platform docs metadata (loaded from build output)
  platformDocs: PlatformDocMeta[];

  // UI state
  activeFolderId: string | null;
  activeDocId: string | null;
  viewMode: 'list' | 'grid';
  sidebarExpanded: boolean;
}
