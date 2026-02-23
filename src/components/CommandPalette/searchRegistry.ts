/**
 * Search Registry
 *
 * Dynamic registry for search sources. Any data added to the platform
 * (stores, IndexedDB, etc.) can register itself as a searchable source.
 * This ensures the command palette automatically includes all data.
 */

import type { SearchResult, NavigationPage, Command, CommandPaletteMode } from './types';
import { NAVIGATION_PAGES, SEARCH_ENGINES } from './types';
import { useNotesStore } from '../../stores/useNotesStore';
import { useKanbanStore } from '../../stores/useKanbanStore';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useLinkLibraryStore } from '../../stores/useLinkLibraryStore';
import { useDiagramsStore } from '../../stores/useDiagramsStore';
import { useFormsStore } from '../../stores/useFormsStore';
import { useTimeTrackingStore } from '../../stores/useTimeTrackingStore';
import { useAutomationStore } from '../../stores/useAutomationStore';
import { useTemplateStore } from '../../stores/useTemplateStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSidebarStore } from '../../stores/useSidebarStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useHabitStore } from '../../stores/useHabitStore';
import { useDocsStore } from '../../stores/useDocsStore';
import { useRecentItemsStore } from '../../stores/useRecentItemsStore';
import { WIDGET_REGISTRY } from '../../widgets/Dashboard/WidgetRegistry';
import { aboutUsContent } from '../../content/aboutUs';

/**
 * FAQ content for search (synchronized with SupportModal FAQS)
 * This enables users to find help content via the command palette
 */
const FAQS = [
  // Getting Started
  {
    question: 'Where is my data stored?',
    answer: 'All your data is stored locally in your browser\'s IndexedDB storage. Nothing leaves your device unless you explicitly export it. This means your notes, tasks, and settings stay private and work offline.',
    keywords: ['storage', 'local', 'indexeddb', 'privacy', 'offline', 'browser'],
  },
  {
    question: 'How do I backup my data?',
    answer: 'Go to Settings → Backup & Restore, then click "Export Brain" to download a .brain file. You can restore this file on any browser by clicking "Import Brain". For automatic backups, set up Auto-Save to a cloud folder like Dropbox or Google Drive.',
    keywords: ['backup', 'export', 'restore', 'import', 'brain file', 'save'],
  },
  {
    question: 'What happens if I clear my browser data?',
    answer: 'Clearing browser data will delete your locally stored information. Always export a backup before clearing browser data or switching browsers. You can restore from a .brain file anytime.',
    keywords: ['clear', 'delete', 'browser data', 'lost data'],
  },
  // Notes
  {
    question: 'How do I export notes to markdown?',
    answer: 'Open the Notes page, click the Export button in the header (or press Cmd/Ctrl+Shift+E), then select your export scope and click Export. Your notes will be downloaded as .md files in a ZIP archive.',
    keywords: ['export', 'markdown', 'notes', 'download', 'md'],
  },
  {
    question: 'What are wiki links and how do I use them?',
    answer: 'Wiki links are connections between notes using [[Note Title]] syntax. Type [[ in the note editor to see a list of all notes. Clicking a wiki link navigates to that note. Use the Graph View to visualize all connections between your notes.',
    keywords: ['wiki', 'links', 'connections', 'graph', 'backlinks'],
  },
  {
    question: 'Can I organize notes into folders?',
    answer: 'Yes! Notes can be organized into folders. Click the folder icon in the Notes sidebar to create folders. You can also use tags for cross-cutting organization—add tags to any note and filter by them.',
    keywords: ['folders', 'organize', 'tags', 'categories'],
  },
  // Tasks
  {
    question: 'How do I create recurring tasks?',
    answer: 'Create or edit a task, then scroll to the "Recurrence" section. Select your recurrence pattern (Daily, Weekly, Monthly, Yearly, or Custom), set the interval, and optionally set an end date.',
    keywords: ['recurring', 'repeat', 'daily', 'weekly', 'monthly'],
  },
  {
    question: 'What is the Kanban board?',
    answer: 'The Kanban board displays tasks in columns (To Do, In Progress, Done). Drag tasks between columns to update their status. You can also create custom columns and filter by project, priority, or tags.',
    keywords: ['kanban', 'board', 'columns', 'drag', 'status'],
  },
  {
    question: 'How do task dependencies work?',
    answer: 'When editing a task, you can add dependencies—tasks that must be completed before this one. The Critical Path feature (toggle in task view) highlights which tasks are blocking others.',
    keywords: ['dependencies', 'blocking', 'critical path'],
  },
  // Dashboard & Widgets
  {
    question: 'How do I customize the dashboard widgets?',
    answer: 'Click the Dashboard link in the sidebar, then click the gear icon (⚙) to open Widget Manager. Toggle widgets on/off, reorder them by dragging, and click the settings icon on individual widgets to configure them.',
    keywords: ['widgets', 'dashboard', 'customize', 'widget manager'],
  },
  {
    question: 'What widgets are available?',
    answer: 'Over 44 widgets including: Weather, News feeds, Calculator, World Clock, Pomodoro Timer, Quick Notes, Calendar, Task Summary, Time Tracking stats, Bookmarks, and many more. New widgets are added regularly.',
    keywords: ['widgets', 'list', 'available', 'weather', 'calculator', 'pomodoro'],
  },
  // Time Tracking & Calendar
  {
    question: 'How does time tracking work?',
    answer: 'Go to Time Tracking in the sidebar. Start the timer when you begin work, assign it to a project, and stop when done. View daily/weekly stats, generate reports, and export to CSV for invoicing.',
    keywords: ['time tracking', 'timer', 'projects', 'hours', 'invoicing'],
  },
  {
    question: 'Can I import calendar events?',
    answer: 'Yes! The Calendar page supports ICS file import. Click the import button and select your .ics file. You can also export your events to ICS format for use in other calendar apps.',
    keywords: ['calendar', 'import', 'ics', 'events', 'export'],
  },
  // Shortcuts & Tips
  {
    question: 'What keyboard shortcuts are available?',
    answer: 'Press F1 or Ctrl+/ to open Help. On the Notes page, Ctrl+K focuses search. In the notes editor, use Ctrl+B for bold, Ctrl+I for italic, Ctrl+Shift+E to export, and type / for slash commands. Ctrl+B toggles the sidebar, Ctrl+D creates a daily note.',
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'ctrl', 'cmd'],
  },
  {
    question: 'How do I use slash commands in notes?',
    answer: 'Type "/" in the note editor to see available commands: /heading, /bullet, /checkbox, /code, /quote, /divider, and more. This is the fastest way to format your notes.',
    keywords: ['slash', 'commands', 'formatting', 'editor'],
  },
];

/**
 * Help topics for search
 */
const HELP_TOPICS = [
  {
    title: 'Getting Started Guide',
    description: 'Learn the basics of using NeumanOS for productivity',
    keywords: ['getting started', 'beginner', 'tutorial', 'intro', 'basics'],
  },
  {
    title: 'Report an Issue',
    description: 'Send a diagnostic report to help troubleshoot problems',
    keywords: ['report', 'bug', 'issue', 'problem', 'support', 'help'],
  },
  {
    title: 'View Documentation',
    description: 'Access external documentation and guides',
    keywords: ['docs', 'documentation', 'manual', 'guide'],
  },
  {
    title: 'Privacy Information',
    description: 'All data stored locally in your browser. No telemetry, no analytics.',
    keywords: ['privacy', 'security', 'data', 'local'],
  },
];

/**
 * Simple fuzzy match scoring
 * Returns a score based on how well the query matches the text
 * Higher score = better match
 */
export function fuzzyMatch(query: string, text: string): number {
  if (!query || !text) return 0;

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  // Exact match gets highest score
  if (normalizedText === normalizedQuery) return 100;

  // Starts with query gets high score
  if (normalizedText.startsWith(normalizedQuery)) return 90;

  // Contains query as a word boundary
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(normalizedQuery)}`, 'i');
  if (wordBoundaryRegex.test(text)) return 80;

  // Contains query anywhere
  if (normalizedText.includes(normalizedQuery)) return 70;

  // Character-by-character fuzzy match
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  let totalMatches = 0;

  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++;
      totalMatches++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }

  // If all query characters were found
  if (queryIndex === normalizedQuery.length) {
    // Score based on match quality
    const matchRatio = totalMatches / normalizedText.length;
    const consecutiveBonus = maxConsecutive / normalizedQuery.length;
    return Math.round(30 + (matchRatio * 20) + (consecutiveBonus * 20));
  }

  return 0;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// SEARCH QUERY PARSING (tag:, in:, status:, date: modifiers)
// =============================================================================

import {
  parseSearchQuery as parseFilterTokens,
  getFiltersOfType,
  type SearchFilter,
  type ParsedSearchQuery as FilterParsedQuery,
} from '../../utils/searchFilterParser';

export interface ParsedSearchQuery {
  /** The text query without modifiers */
  text: string;
  /** Tags to filter by (from tag:xxx) */
  tags: string[];
  /** Date filter (from date:today, date:thisweek, etc.) */
  dateFilter: string | null;
  /** Module filter (from in:notes, in:tasks, etc.) */
  moduleFilter: string | null;
  /** Status filter (from status:done, status:todo, etc.) */
  statusFilter: string | null;
  /** All raw filters for chip display */
  filters: SearchFilter[];
}

/**
 * Parse a search query to extract all filter modifiers.
 * Supports: tag:, in:, status:, date:
 *
 * Examples:
 *   "meeting tag:work" -> { text: "meeting", tags: ["work"], ... }
 *   "in:notes status:done" -> { text: "", moduleFilter: "notes", statusFilter: "done", ... }
 *   "tag:personal date:today review" -> { text: "review", tags: ["personal"], dateFilter: "today", ... }
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const parsed: FilterParsedQuery = parseFilterTokens(query);

  const tags = getFiltersOfType(parsed.filters, 'tag');
  const dateFilters = getFiltersOfType(parsed.filters, 'date');
  const moduleFilters = getFiltersOfType(parsed.filters, 'module');
  const statusFilters = getFiltersOfType(parsed.filters, 'status');

  return {
    text: parsed.text,
    tags,
    dateFilter: dateFilters[0] ?? null,
    moduleFilter: moduleFilters[0] ?? null,
    statusFilter: statusFilters[0] ?? null,
    filters: parsed.filters,
  };
}

/**
 * Check if a result matches tag filters
 */
function matchesTagFilter(result: SearchResult, tags: string[]): boolean {
  if (tags.length === 0) return true;

  const resultTags = (result.metadata?.tags as string[] | undefined) || result.keywords || [];
  const normalizedResultTags = resultTags.map((t) => t.toLowerCase());

  return tags.some((filterTag) =>
    normalizedResultTags.some((rt) => rt.includes(filterTag))
  );
}

/** Module-to-type mapping for in: filter */
const MODULE_TYPE_MAP: Record<string, string[]> = {
  notes: ['note'],
  tasks: ['task', 'project', 'template'],
  calendar: ['event', 'time-entry'],
  docs: ['diagram', 'form', 'document'],
};

/**
 * Check if a result matches a module filter (in:notes, in:tasks, etc.)
 */
function matchesModuleFilter(result: SearchResult, module: string): boolean {
  const allowedTypes = MODULE_TYPE_MAP[module];
  if (!allowedTypes) return true;
  return allowedTypes.includes(result.type);
}

/**
 * Check if a result matches a status filter (status:done, status:todo, status:inprogress)
 */
function matchesStatusFilter(result: SearchResult, status: string): boolean {
  const resultStatus = result.metadata?.status as string | undefined;
  if (!resultStatus) return true; // don't filter out items without status
  return resultStatus === status;
}

/**
 * Check if a result matches a date filter
 */
function matchesDateFilter(result: SearchResult, dateFilter: string): boolean {
  const updatedAt = result.metadata?.updatedAt as string | undefined;
  const dateKey = result.metadata?.dateKey as string | undefined;
  const startTime = result.metadata?.startTime as string | undefined;
  const dueDate = result.metadata?.dueDate as string | undefined;
  const accessedAt = result.metadata?.accessedAt as string | undefined;

  const dateStr = updatedAt || dueDate || startTime || dateKey || accessedAt;
  if (!dateStr) return true;

  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (dateFilter) {
    case 'today':
      return itemDate >= today;
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return itemDate >= yesterday && itemDate < today;
    }
    case 'thisweek': {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return itemDate >= weekStart;
    }
    case 'thismonth': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return itemDate >= monthStart;
    }
    case 'last7days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return itemDate >= sevenDaysAgo;
    }
    case 'last30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return itemDate >= thirtyDaysAgo;
    }
    case 'overdue': {
      // Items with a due date before today
      if (!dueDate) return false;
      const due = new Date(dueDate);
      return due < today;
    }
    default:
      return true;
  }
}

/**
 * Apply all filters (tag, module, status, date) to search results
 */
export function applySearchFilters(
  results: SearchResult[],
  parsed: ParsedSearchQuery
): SearchResult[] {
  let filtered = results;

  if (parsed.tags.length > 0) {
    filtered = filtered.filter((r) => matchesTagFilter(r, parsed.tags));
  }

  if (parsed.moduleFilter) {
    filtered = filtered.filter((r) => matchesModuleFilter(r, parsed.moduleFilter!));
  }

  if (parsed.statusFilter) {
    filtered = filtered.filter((r) => matchesStatusFilter(r, parsed.statusFilter!));
  }

  if (parsed.dateFilter) {
    filtered = filtered.filter((r) => matchesDateFilter(r, parsed.dateFilter!));
  }

  return filtered;
}

/**
 * Score a search result against a query
 */
export function scoreResult(result: SearchResult, query: string): number {
  const titleScore = fuzzyMatch(query, result.title) * 2; // Title weighted 2x
  const subtitleScore = result.subtitle ? fuzzyMatch(query, result.subtitle) : 0;
  const keywordScores = result.keywords?.map(k => fuzzyMatch(query, k)) || [];
  const maxKeywordScore = keywordScores.length > 0 ? Math.max(...keywordScores) : 0;

  return titleScore + subtitleScore + maxKeywordScore;
}

/**
 * Get navigation page results
 */
export function getNavigationResults(navigate: (path: string) => void): SearchResult[] {
  return NAVIGATION_PAGES.map((page: NavigationPage) => ({
    id: `page-${page.id}`,
    type: 'page' as const,
    title: page.name,
    subtitle: page.description,
    icon: page.icon,
    score: 0,
    keywords: page.keywords,
    action: () => navigate(page.path),
  }));
}

/**
 * Get external search results for a query
 * Shows a single compact "Search Web" option using the preferred search engine
 */
export function getExternalSearchResults(
  query: string,
  preferredEngineId?: string
): SearchResult[] {
  if (!query.trim()) return [];

  const encodedQuery = encodeURIComponent(query);

  // Find the preferred engine, default to Google
  const preferredEngine = SEARCH_ENGINES.find(e => e.id === preferredEngineId) || SEARCH_ENGINES[0];

  // Return a single compact web search option
  return [{
    id: 'external-web-search',
    type: 'external' as const,
    title: `Search Web`,
    subtitle: `"${query}" on ${preferredEngine.name}`,
    icon: '🌐',
    score: 10, // Lower priority than internal results
    action: () => {
      const url = preferredEngine.urlTemplate.replace('{query}', encodedQuery);
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    metadata: { engineId: preferredEngine.id, engineName: preferredEngine.name },
  }];
}

/**
 * Get notes search results
 */
export function getNotesResults(navigate: (path: string) => void): SearchResult[] {
  const notes = useNotesStore.getState().getAllNotes();

  return notes.map((note) => ({
    id: `note-${note.id}`,
    type: 'note' as const,
    title: note.title || 'Untitled Note',
    subtitle: note.contentText?.slice(0, 100) || undefined,
    icon: note.isPinned ? '📌' : note.isFavorite ? '⭐' : '📝',
    score: 0,
    keywords: note.tags || [],
    action: () => {
      useNotesStore.getState().setActiveNote(note.id);
      navigate('/notes');
    },
    preview: note.contentText?.slice(0, 200) || undefined,
    metadata: {
      tags: note.tags,
      updatedAt: note.updatedAt,
      isPinned: note.isPinned,
      isFavorite: note.isFavorite,
      contentText: note.contentText,
    },
  }));
}

/**
 * Get tasks search results
 */
export function getTasksResults(navigate: (path: string) => void): SearchResult[] {
  const tasks = useKanbanStore.getState().tasks;

  return tasks.map((task) => {
    const statusLabel = task.status === 'done' ? 'Done' : task.status === 'inprogress' ? 'In Progress' : 'To Do';
    const dueDateLabel = task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}` : '';
    const priorityLabel = task.priority && task.priority !== 'medium' ? ` · ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority` : '';

    return {
      id: `task-${task.id}`,
      type: 'task' as const,
      title: task.title,
      subtitle: `${statusLabel}${dueDateLabel}${priorityLabel}`,
      icon: task.status === 'done' ? '✅' : task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🔵' : '📋',
      score: 0,
      keywords: task.tags || [],
      action: () => navigate('/tasks'),
      preview: task.description?.slice(0, 200) || undefined,
      metadata: {
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        tags: task.tags,
        description: task.description,
      },
    };
  });
}

/**
 * Get calendar events search results
 */
export function getEventsResults(navigate: (path: string) => void): SearchResult[] {
  const events = useCalendarStore.getState().events;
  const results: SearchResult[] = [];

  // Flatten events from all dates
  Object.entries(events).forEach(([dateKey, dateEvents]) => {
    dateEvents.forEach((event) => {
      const timeStr = event.startTime
        ? `${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}`
        : '';
      const dateLabel = dateKey;

      results.push({
        id: `event-${event.id}`,
        type: 'event' as const,
        title: event.title,
        subtitle: `${dateLabel}${timeStr ? ' · ' + timeStr : ''}`,
        icon: '📅',
        score: 0,
        keywords: [],
        action: () => navigate('/schedule'),
        preview: event.description || undefined,
        metadata: {
          dateKey,
          startTime: event.startTime,
          endTime: event.endTime,
          description: event.description,
        },
      });
    });
  });

  return results;
}

/**
 * Get bookmarks/links search results
 */
export function getBookmarksResults(): SearchResult[] {
  const links = useLinkLibraryStore.getState().getAllLinks();

  return links.map((link) => ({
    id: `bookmark-${link.id}`,
    type: 'bookmark' as const,
    title: link.title,
    subtitle: link.url,
    icon: '🔗',
    score: 0,
    keywords: link.tags || [],
    action: () => {
      // Open the bookmark URL in a new tab
      window.open(link.url, '_blank', 'noopener,noreferrer');
    },
    metadata: {
      url: link.url,
      category: link.category,
      tags: link.tags,
      isFavorite: link.isFavorite,
    },
  }));
}

/**
 * Get diagrams search results
 */
export function getDiagramsResults(navigate: (path: string) => void): SearchResult[] {
  const diagrams = useDiagramsStore.getState().diagrams;

  return diagrams.map((diagram) => ({
    id: `diagram-${diagram.id}`,
    type: 'diagram' as const,
    title: diagram.title,
    subtitle: 'Diagram',
    icon: '📊',
    score: 0,
    keywords: [],
    action: () => navigate(`/diagrams/${diagram.id}`),
    metadata: {
      createdAt: diagram.createdAt,
      updatedAt: diagram.updatedAt,
    },
  }));
}

/**
 * Get forms search results
 */
export function getFormsResults(navigate: (path: string) => void): SearchResult[] {
  const forms = useFormsStore.getState().forms;

  return forms.map((form) => ({
    id: `form-${form.id}`,
    type: 'form' as const,
    title: form.title,
    subtitle: form.description || 'Form',
    icon: '📋',
    score: 0,
    keywords: [],
    action: () => navigate(`/forms/${form.id}/edit`),
    metadata: {
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    },
  }));
}

/**
 * Get time tracking entries search results
 */
export function getTimeEntriesResults(navigate: (path: string) => void): SearchResult[] {
  const state = useTimeTrackingStore.getState();
  const entries = state.entries || [];
  const projects = state.projects || [];

  // Create a project lookup map
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return entries.slice(0, 50).map((entry) => { // Limit to 50 recent entries
    const project = entry.projectId ? projectMap.get(entry.projectId) : undefined;
    return {
      id: `time-${entry.id}`,
      type: 'time-entry' as const,
      title: entry.description || 'Time Entry',
      subtitle: project ? `Project: ${project.name}` : undefined,
      icon: '⏱️',
      score: 0,
      keywords: entry.tags || [],
      action: () => navigate('/schedule'),
      metadata: {
        projectId: entry.projectId,
        projectName: project?.name,
        duration: entry.duration,
        startTime: entry.startTime,
      },
    };
  });
}

/**
 * Get FAQ search results
 */
export function getFAQResults(openSupportModal: (tab: 'help') => void): SearchResult[] {
  return FAQS.map((faq, index) => ({
    id: `faq-${index}`,
    type: 'faq' as const,
    title: faq.question,
    subtitle: faq.answer.slice(0, 100) + (faq.answer.length > 100 ? '...' : ''),
    icon: '❓',
    score: 0,
    keywords: ['faq', 'help', 'question', ...faq.keywords],
    action: () => openSupportModal('help'),
    metadata: {
      fullAnswer: faq.answer,
    },
  }));
}

/**
 * Get Help topic search results
 */
export function getHelpResults(openSupportModal: (tab: 'report' | 'help' | 'docs') => void): SearchResult[] {
  return HELP_TOPICS.map((topic, index) => ({
    id: `help-${index}`,
    type: 'help' as const,
    title: topic.title,
    subtitle: topic.description,
    icon: '💡',
    score: 0,
    keywords: ['help', ...topic.keywords],
    action: () => {
      // Map topics to appropriate support modal tabs
      if (topic.title.includes('Report')) {
        openSupportModal('report');
      } else if (topic.title.includes('Documentation')) {
        openSupportModal('docs');
      } else {
        openSupportModal('help');
      }
    },
  }));
}

/**
 * Get widget search results from WidgetRegistry
 */
export function getWidgetsResults(navigate: (path: string) => void): SearchResult[] {
  return Object.values(WIDGET_REGISTRY).map((widget) => ({
    id: `widget-${widget.id}`,
    type: 'widget' as const,
    title: widget.name,
    subtitle: widget.description,
    icon: widget.icon,
    score: 0,
    keywords: ['widget', 'dashboard', widget.category, widget.name.toLowerCase()],
    action: () => navigate('/'), // Navigate to dashboard where widgets are
    metadata: {
      widgetId: widget.id,
      category: widget.category,
    },
  }));
}

/**
 * Get automation rules search results
 */
export function getAutomationResults(navigate: (path: string) => void): SearchResult[] {
  const rules = useAutomationStore.getState().rules;

  return rules.map((rule) => ({
    id: `automation-${rule.id}`,
    type: 'automation' as const,
    title: rule.name,
    subtitle: `${rule.trigger.type} → ${rule.actions.length} action(s)`,
    icon: '⚡',
    score: 0,
    keywords: ['automation', 'rule', 'trigger', rule.trigger.type],
    action: () => navigate('/automations'),
    metadata: {
      ruleId: rule.id,
      enabled: rule.enabled,
      triggerType: rule.trigger.type,
    },
  }));
}

/**
 * Get task templates search results
 */
export function getTemplateResults(navigate: (path: string) => void): SearchResult[] {
  const templates = useTemplateStore.getState().templates;

  return templates.map((template) => ({
    id: `template-${template.id}`,
    type: 'template' as const,
    title: template.name,
    subtitle: template.description || 'Task template',
    icon: '📋',
    score: 0,
    keywords: ['template', 'task', 'recurring', ...(template.tags || [])],
    action: () => navigate('/tasks'),
    metadata: {
      templateId: template.id,
      tags: template.tags,
    },
  }));
}

/**
 * Get projects search results from time tracking
 */
export function getProjectsResults(navigate: (path: string) => void): SearchResult[] {
  const projects = useTimeTrackingStore.getState().projects || [];

  return projects.map((project) => ({
    id: `project-${project.id}`,
    type: 'project' as const,
    title: project.name,
    subtitle: project.clientName || 'Project',
    icon: '📁',
    score: 0,
    keywords: ['project', 'time tracking', project.name.toLowerCase(), project.clientName?.toLowerCase() || ''].filter(Boolean),
    action: () => navigate('/schedule'),
    metadata: {
      projectId: project.id,
      color: project.color,
    },
  }));
}

/**
 * Settings and actions that users can search for
 */
const SETTINGS_AND_ACTIONS = [
  // Modals and Dialogs
  {
    id: 'action-about',
    title: 'About NeumanOS',
    description: 'View version information and credits',
    keywords: ['about', 'about us', 'version', 'credits', 'info', 'information'],
    actionType: 'modal' as const,
    modalId: 'about',
  },
  {
    id: 'action-privacy',
    title: 'Privacy Information',
    description: 'View privacy policy and data handling',
    keywords: ['privacy', 'policy', 'data', 'security', 'local'],
    actionType: 'modal' as const,
    modalId: 'privacy',
  },
  {
    id: 'action-support',
    title: 'Help & Support',
    description: 'Get help, report issues, view documentation',
    keywords: ['help', 'support', 'bug', 'report', 'issue', 'contact'],
    actionType: 'modal' as const,
    modalId: 'support',
  },
  {
    id: 'action-onboarding',
    title: 'Start Onboarding Tour',
    description: 'Take a guided tour of NeumanOS features',
    keywords: ['onboarding', 'tour', 'tutorial', 'getting started', 'welcome', 'guide'],
    actionType: 'modal' as const,
    modalId: 'onboarding',
  },
  // Settings sections
  {
    id: 'setting-backup',
    title: 'Backup & Restore',
    description: 'Export, import, and auto-save your data',
    keywords: ['backup', 'restore', 'export', 'import', 'save', 'brain file'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-theme',
    title: 'Theme Settings',
    description: 'Change app theme and appearance',
    keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'color'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-notifications',
    title: 'Notification Settings',
    description: 'Configure event reminders and alerts',
    keywords: ['notifications', 'alerts', 'reminders', 'events'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-time-format',
    title: 'Time Format Settings',
    description: 'Switch between 12-hour and 24-hour time',
    keywords: ['time', 'format', '12 hour', '24 hour', 'clock'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-temperature',
    title: 'Temperature Unit',
    description: 'Switch between Fahrenheit and Celsius',
    keywords: ['temperature', 'fahrenheit', 'celsius', 'weather', 'unit'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-daily-notes',
    title: 'Daily Notes Settings',
    description: 'Configure daily notes preferences',
    keywords: ['daily', 'notes', 'journal', 'template'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-pomodoro',
    title: 'Pomodoro Timer Settings',
    description: 'Configure focus and break durations',
    keywords: ['pomodoro', 'timer', 'focus', 'break', 'productivity'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-ai-terminal',
    title: 'AI Terminal Settings',
    description: 'Configure AI providers and API keys',
    keywords: ['ai', 'terminal', 'api', 'openai', 'anthropic', 'claude'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-custom-fields',
    title: 'Custom Fields',
    description: 'Manage custom task fields',
    keywords: ['custom', 'fields', 'task', 'properties'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  {
    id: 'setting-members',
    title: 'Team Members',
    description: 'Manage team members and assignees',
    keywords: ['team', 'members', 'people', 'assignees', 'users'],
    actionType: 'navigate' as const,
    path: '/settings',
  },
  // Quick Actions
  {
    id: 'action-export-notes',
    title: 'Export Notes',
    description: 'Export notes to markdown files',
    keywords: ['export', 'notes', 'markdown', 'download'],
    actionType: 'navigate' as const,
    path: '/notes',
  },
  {
    id: 'action-create-note',
    title: 'Create New Note',
    description: 'Start a new note',
    keywords: ['create', 'new', 'note', 'write'],
    actionType: 'navigate' as const,
    path: '/notes',
  },
  {
    id: 'action-create-task',
    title: 'Create New Task',
    description: 'Add a new task to the kanban board',
    keywords: ['create', 'new', 'task', 'todo', 'add'],
    actionType: 'navigate' as const,
    path: '/tasks',
  },
  {
    id: 'action-create-event',
    title: 'Create New Event',
    description: 'Add a new calendar event',
    keywords: ['create', 'new', 'event', 'calendar', 'schedule'],
    actionType: 'navigate' as const,
    path: '/schedule',
  },
  {
    id: 'action-create-diagram',
    title: 'Create New Diagram',
    description: 'Start a new diagram',
    keywords: ['create', 'new', 'diagram', 'flowchart', 'draw'],
    actionType: 'navigate' as const,
    path: '/diagrams',
  },
  {
    id: 'action-create-form',
    title: 'Create New Form',
    description: 'Build a new form or survey',
    keywords: ['create', 'new', 'form', 'survey', 'questionnaire'],
    actionType: 'navigate' as const,
    path: '/forms',
  },
  {
    id: 'action-create-automation',
    title: 'Create Automation Rule',
    description: 'Set up a new automation',
    keywords: ['create', 'new', 'automation', 'rule', 'trigger'],
    actionType: 'navigate' as const,
    path: '/automations',
  },
];

/**
 * Get settings and actions search results
 */
export function getSettingsResults(
  navigate: (path: string) => void,
  openModal?: (modalId: string) => void
): SearchResult[] {
  return SETTINGS_AND_ACTIONS.map((item) => ({
    id: item.id,
    type: (item.actionType === 'modal' ? 'action' : 'setting') as 'action' | 'setting',
    title: item.title,
    subtitle: item.description,
    icon: item.actionType === 'modal' ? '🔲' : '⚙️',
    score: 0,
    keywords: item.keywords,
    action: () => {
      if (item.actionType === 'modal' && openModal) {
        openModal(item.modalId);
      } else if (item.actionType === 'navigate') {
        navigate(item.path);
      }
    },
    metadata: {
      actionType: item.actionType,
    },
  }));
}

/**
 * About Us content for search - makes Platform & Principles and Values & Background searchable
 */
const ABOUT_US_CONTENT = [
  {
    id: 'about-platform',
    title: aboutUsContent.stories.platform.title, // 'Platform & Principles'
    subtitle: aboutUsContent.stories.platform.subtitle, // 'NeumanOS'
    description: aboutUsContent.stories.platform.content.slice(0, 150) + '...',
    keywords: [
      'about', 'about us', 'platform', 'principles', 'neumanos', 'mission',
      'local-first', 'privacy', 'ownership', 'foundation', 'philosophy', 'values',
      'why', 'purpose', 'vision'
    ],
    modalId: 'about',
  },
  {
    id: 'about-founder',
    title: aboutUsContent.stories.founder.title, // 'Values & Background'
    subtitle: aboutUsContent.stories.founder.subtitle, // 'From the Founder'
    description: aboutUsContent.stories.founder.content.slice(0, 150) + '...',
    keywords: [
      'about', 'about us', 'values', 'background', 'founder', 'travis', 'neuman',
      'story', 'mission', 'who', 'why', 'team', 'creator', 'builder'
    ],
    modalId: 'about',
  },
  {
    id: 'about-philosophy',
    title: 'Our Philosophy',
    subtitle: 'What NeumanOS Stands For',
    description: aboutUsContent.philosophy.short,
    keywords: [
      'philosophy', 'belief', 'values', 'mission', 'about', 'why', 'purpose'
    ],
    modalId: 'about',
  },
];

/**
 * Keyboard shortcuts for search
 */
const KEYBOARD_SHORTCUTS = [
  // Global
  { keys: 'Ctrl+K / ⌘K', description: 'Open Synapse', context: 'Global', settingsSection: 'synapse' },
  { keys: 'Ctrl+B / ⌘B', description: 'Toggle Sidebar', context: 'Global', settingsSection: null },
  { keys: 'F1', description: 'Open Help & Support', context: 'Global', settingsSection: null },
  { keys: 'Ctrl+/ / ⌘/', description: 'Open Help', context: 'Global', settingsSection: null },
  { keys: 'Ctrl+Shift+A', description: 'Toggle AI Terminal', context: 'Global', settingsSection: null },
  { keys: 'Ctrl+Shift+P', description: 'Toggle Project Context', context: 'Global', settingsSection: null },
  { keys: 'Escape', description: 'Close Modal/Dialog', context: 'Global', settingsSection: null },
  // Navigation (Ctrl+Number)
  { keys: 'Ctrl+1', description: 'Go to Dashboard', context: 'Navigation', settingsSection: null },
  { keys: 'Ctrl+2', description: 'Go to Today', context: 'Navigation', settingsSection: null },
  { keys: 'Ctrl+3', description: 'Go to Notes', context: 'Navigation', settingsSection: null },
  { keys: 'Ctrl+4', description: 'Go to Tasks', context: 'Navigation', settingsSection: null },
  { keys: 'Ctrl+5', description: 'Go to Schedule', context: 'Navigation', settingsSection: null },
  { keys: 'Ctrl+6', description: 'Go to Create', context: 'Navigation', settingsSection: null },
  { keys: 'Ctrl+7', description: 'Go to Links', context: 'Navigation', settingsSection: null },
  { keys: 'Ctrl+8', description: 'Go to Settings', context: 'Navigation', settingsSection: null },
  // G-then-key navigation
  { keys: 'G then D', description: 'Go to Dashboard', context: 'Go To', settingsSection: null },
  { keys: 'G then T', description: 'Go to Tasks', context: 'Go To', settingsSection: null },
  { keys: 'G then N', description: 'Go to Notes', context: 'Go To', settingsSection: null },
  { keys: 'G then H', description: 'Go to Habits', context: 'Go To', settingsSection: null },
  { keys: 'G then C', description: 'Go to Calendar', context: 'Go To', settingsSection: null },
  { keys: 'G then S', description: 'Go to Settings', context: 'Go To', settingsSection: null },
  { keys: 'G then O', description: 'Go to Today', context: 'Go To', settingsSection: null },
  { keys: 'G then L', description: 'Go to Links', context: 'Go To', settingsSection: null },
  { keys: 'G then F', description: 'Go to Focus', context: 'Go To', settingsSection: null },
  // Quick create
  { keys: 'C', description: 'Quick Add Task', context: 'Global', settingsSection: null },
  { keys: 'Ctrl+N / ⌘N', description: 'New Note', context: 'Global', settingsSection: null },
  { keys: 'Ctrl+T / ⌘T', description: 'New Task', context: 'Global', settingsSection: null },
  { keys: 'Ctrl+Shift+T', description: 'Smart Templates', context: 'Global', settingsSection: null },
  { keys: 'Ctrl+E / ⌘E', description: 'New Event', context: 'Global', settingsSection: null },
  // Notes editor
  { keys: 'Ctrl+D / ⌘D', description: 'Create Daily Note', context: 'Notes', settingsSection: 'daily-notes' },
  { keys: 'Ctrl+Shift+E', description: 'Export Notes', context: 'Notes', settingsSection: null },
  { keys: 'Ctrl+B / ⌘B', description: 'Bold Text', context: 'Editor', settingsSection: null },
  { keys: 'Ctrl+I / ⌘I', description: 'Italic Text', context: 'Editor', settingsSection: null },
  { keys: 'Ctrl+U / ⌘U', description: 'Underline Text', context: 'Editor', settingsSection: null },
  { keys: '/', description: 'Open Slash Commands', context: 'Editor', settingsSection: null },
  { keys: '[[', description: 'Insert Wiki Link', context: 'Editor', settingsSection: null },
  // Synapse
  { keys: 'Enter', description: 'Confirm/Submit', context: 'Forms', settingsSection: null },
  { keys: '↑↓', description: 'Navigate Options', context: 'Synapse', settingsSection: 'synapse' },
  { keys: 'Tab', description: 'Next Field/Option', context: 'Forms', settingsSection: null },
];

/**
 * Get About Us content search results
 */
export function getAboutUsResults(openModal?: (modalId: string) => void): SearchResult[] {
  return ABOUT_US_CONTENT.map((item) => ({
    id: item.id,
    type: 'action' as const,
    title: item.title,
    subtitle: item.description,
    icon: '📖',
    score: 0,
    keywords: item.keywords,
    action: () => {
      if (openModal) {
        openModal(item.modalId);
      }
    },
    metadata: {
      modalId: item.modalId,
    },
  }));
}

/**
 * Get keyboard shortcuts search results
 */
export function getShortcutsResults(navigate: (path: string) => void): SearchResult[] {
  return KEYBOARD_SHORTCUTS.map((shortcut, index) => ({
    id: `shortcut-${index}`,
    type: 'shortcut' as const,
    title: shortcut.keys,
    subtitle: `${shortcut.description} (${shortcut.context})`,
    icon: '⌨️',
    score: 0,
    keywords: ['shortcut', 'keyboard', 'hotkey', shortcut.context.toLowerCase(), ...shortcut.description.toLowerCase().split(' ')],
    action: () => {
      // Navigate to settings if there's a relevant section
      if (shortcut.settingsSection) {
        navigate(`/settings#${shortcut.settingsSection}`);
      } else {
        // For shortcuts without settings, navigate to settings page
        navigate('/settings');
      }
    },
    metadata: {
      context: shortcut.context,
      settingsSection: shortcut.settingsSection,
    },
  }));
}

/**
 * Get habits search results
 */
export function getHabitsResults(navigate: (path: string) => void): SearchResult[] {
  const habits = useHabitStore.getState().habits;

  return habits.map((habit) => ({
    id: `habit-${habit.id}`,
    type: 'habit' as const,
    title: habit.title,
    subtitle: `${habit.frequency} habit${habit.category ? ` · ${habit.category}` : ''}${habit.currentStreak > 0 ? ` · ${habit.currentStreak} day streak` : ''}`,
    icon: habit.icon || '🎯',
    score: 0,
    keywords: ['habit', habit.frequency, habit.category || ''].filter(Boolean),
    action: () => navigate('/tasks?tab=habits'),
    metadata: {
      frequency: habit.frequency,
      category: habit.category,
      streak: habit.currentStreak,
    },
  }));
}

/**
 * Get documents search results (Docs/Spreadsheets/Presentations)
 */
export function getDocumentsResults(navigate: (path: string) => void): SearchResult[] {
  const docs = useDocsStore.getState().docs;

  return docs.map((doc) => ({
    id: `document-${doc.id}`,
    type: 'document' as const,
    title: doc.title || 'Untitled Document',
    subtitle: `${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}${doc.updatedAt ? ` · Updated ${new Date(doc.updatedAt).toLocaleDateString()}` : ''}`,
    icon: doc.type === 'sheet' ? '📊' : doc.type === 'slides' ? '📽️' : '📄',
    score: 0,
    keywords: ['document', 'doc', doc.type],
    action: () => navigate(`/create/${doc.id}`),
    metadata: {
      docType: doc.type,
      updatedAt: doc.updatedAt,
    },
  }));
}

/**
 * Get recent items search results
 * Displayed when the palette opens with no query
 */
export function getRecentItemResults(navigate: (path: string) => void): SearchResult[] {
  const items = useRecentItemsStore.getState().getRecentItems();

  return items.map((item) => {
    const timeAgo = getTimeAgo(item.accessedAt);
    return {
      id: `recent-${item.id}`,
      type: 'recent' as const,
      title: item.title,
      subtitle: `${timeAgo}${item.subtitle ? ` · ${item.subtitle}` : ''}`,
      icon: item.icon,
      score: 300, // High priority for recent items
      keywords: [],
      action: () => navigate(item.path),
      metadata: {
        originalType: item.type,
        accessedAt: item.accessedAt,
      },
    };
  });
}

/**
 * Format a timestamp as relative time (e.g., "2 minutes ago")
 */
function getTimeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString();
}

/**
 * Generate a context snippet for a search result
 * Shows surrounding text around the match
 */
export function getContextSnippet(text: string, query: string, maxLength: number = 120): string {
  if (!text || !query) return text?.slice(0, maxLength) || '';

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return text.slice(0, maxLength);

  // Calculate window around match
  const halfWindow = Math.floor((maxLength - query.length) / 2);
  const start = Math.max(0, matchIndex - halfWindow);
  const end = Math.min(text.length, matchIndex + query.length + halfWindow);

  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Get all search results from all sources
 */
export function getAllResults(
  navigate: (path: string) => void,
  openSupportModal?: (tab: 'report' | 'help' | 'docs') => void,
  openModal?: (modalId: string) => void
): SearchResult[] {
  const results: SearchResult[] = [
    // Navigation
    ...getNavigationResults(navigate),
    // User content (dynamic from stores)
    ...getNotesResults(navigate),
    ...getTasksResults(navigate),
    ...getEventsResults(navigate),
    ...getBookmarksResults(),
    ...getDiagramsResults(navigate),
    ...getFormsResults(navigate),
    ...getTimeEntriesResults(navigate),
    ...getAutomationResults(navigate),
    ...getTemplateResults(navigate),
    ...getProjectsResults(navigate),
    // Habits and documents
    ...getHabitsResults(navigate),
    ...getDocumentsResults(navigate),
    // Platform features (static registry)
    ...getWidgetsResults(navigate),
    ...getSettingsResults(navigate, openModal),
    ...getShortcutsResults(navigate),
    // About Us content (makes Values & Background, Platform & Principles searchable)
    ...getAboutUsResults(openModal),
  ];

  // Add FAQ and Help results if openSupportModal is provided
  if (openSupportModal) {
    results.push(...getFAQResults(openSupportModal));
    results.push(...getHelpResults(openSupportModal));
  }

  return results;
}

/**
 * Search and score all results
 */
export function searchAll(
  query: string,
  navigate: (path: string) => void,
  preferredSearchEngine?: string,
  openSupportModal?: (tab: 'report' | 'help' | 'docs') => void,
  openModal?: (modalId: string) => void
): SearchResult[] {
  const trimmedQuery = query.trim();

  // Get all internal results
  const allResults = getAllResults(navigate, openSupportModal, openModal);

  // Score and filter results
  const scoredResults = allResults
    .map((result) => ({
      ...result,
      score: scoreResult(result, trimmedQuery),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  // Add external search options if there's a query
  const externalResults = trimmedQuery
    ? getExternalSearchResults(trimmedQuery, preferredSearchEngine)
    : [];

  return [...scoredResults, ...externalResults];
}

/**
 * Group results by type
 */
export function groupResultsByType(results: SearchResult[]): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();

  results.forEach((result) => {
    const existing = grouped.get(result.type) || [];
    grouped.set(result.type, [...existing, result]);
  });

  return grouped;
}

/**
 * Get display label for result type
 */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    page: 'Navigation',
    note: 'Notes',
    task: 'Tasks',
    event: 'Events',
    bookmark: 'Bookmarks',
    diagram: 'Diagrams',
    form: 'Forms',
    'time-entry': 'Time Entries',
    external: 'Search Web',
    action: 'Actions',
    faq: 'FAQ',
    help: 'Help',
    widget: 'Widgets',
    setting: 'Settings',
    automation: 'Automations',
    template: 'Templates',
    project: 'Projects',
    shortcut: 'Keyboard Shortcuts',
    command: 'Commands',
    recent: 'Recent',
    habit: 'Habits',
    document: 'Documents',
  };
  return labels[type] || type;
}

// =============================================================================
// COMMAND MODE (> prefix)
// =============================================================================

/**
 * Detect the command palette mode from query
 */
export function detectMode(query: string): CommandPaletteMode {
  const trimmed = query.trim();
  if (trimmed.startsWith('>')) return 'command';
  if (trimmed.startsWith('?')) return 'help';
  if (trimmed.startsWith('/')) return 'navigation';
  return 'search';
}

/**
 * Get the query without the mode prefix
 */
export function stripModePrefix(query: string): string {
  const trimmed = query.trim();
  if (trimmed.startsWith('>') || trimmed.startsWith('?') || trimmed.startsWith('/')) {
    return trimmed.slice(1).trim();
  }
  return trimmed;
}

/**
 * Built-in commands for command mode
 * Commands execute actions directly without navigation
 */
export function getCommands(
  navigate: (path: string) => void,
  openModal?: (modalId: string) => void
): Command[] {
  return [
    // Theme commands
    {
      id: 'cmd-toggle-dark-mode',
      name: 'Toggle Dark Mode',
      aliases: ['dark mode', 'dark theme', 'toggle theme'],
      description: 'Switch to dark theme',
      icon: '🌙',
      category: 'theme',
      keywords: ['dark', 'theme', 'mode', 'night'],
      handler: () => {
        const { mode, toggleTheme } = useThemeStore.getState();
        if (mode !== 'dark') toggleTheme();
        return true; // close palette
      },
    },
    {
      id: 'cmd-toggle-light-mode',
      name: 'Toggle Light Mode',
      aliases: ['light mode', 'light theme'],
      description: 'Switch to light theme',
      icon: '☀️',
      category: 'theme',
      keywords: ['light', 'theme', 'mode', 'day'],
      handler: () => {
        const { mode, toggleTheme } = useThemeStore.getState();
        if (mode !== 'light') toggleTheme();
        return true;
      },
    },

    // View commands
    {
      id: 'cmd-toggle-sidebar',
      name: 'Toggle Sidebar',
      aliases: ['collapse sidebar', 'expand sidebar', 'hide sidebar'],
      description: 'Show or hide the sidebar',
      icon: '📐',
      category: 'view',
      keywords: ['sidebar', 'collapse', 'expand', 'toggle', 'hide', 'show'],
      handler: () => {
        useSidebarStore.getState().toggleCollapse();
        return true;
      },
    },

    // Create commands
    {
      id: 'cmd-new-note',
      name: 'New Note',
      aliases: ['create note', 'add note'],
      description: 'Create a new note',
      icon: '📝',
      category: 'create',
      keywords: ['new', 'create', 'note', 'add'],
      handler: () => {
        const { createNote, setActiveNote } = useNotesStore.getState();
        const newNote = createNote({
          title: '',
          content: '',
          contentText: '',
          tags: [],
          isPinned: false,
          isFavorite: false,
        });
        setActiveNote(newNote.id);
        navigate('/notes');
        return true;
      },
    },
    {
      id: 'cmd-new-task',
      name: 'New Task',
      aliases: ['create task', 'add task', 'quick add'],
      description: 'Open quick add task modal',
      icon: '✅',
      category: 'create',
      keywords: ['new', 'create', 'task', 'todo', 'add'],
      handler: () => {
        if (openModal) openModal('quick-add');
        return true;
      },
    },
    {
      id: 'cmd-new-event',
      name: 'New Event',
      aliases: ['create event', 'add event', 'schedule'],
      description: 'Go to calendar to create event',
      icon: '📅',
      category: 'create',
      keywords: ['new', 'create', 'event', 'calendar', 'schedule'],
      handler: () => {
        navigate('/schedule');
        return true;
      },
    },
    {
      id: 'cmd-new-diagram',
      name: 'New Diagram',
      aliases: ['create diagram', 'add diagram'],
      description: 'Create a new diagram',
      icon: '📊',
      category: 'create',
      keywords: ['new', 'create', 'diagram', 'flowchart', 'draw'],
      handler: () => {
        navigate('/diagrams');
        return true;
      },
    },

    // Timer commands
    {
      id: 'cmd-start-timer',
      name: 'Start Timer',
      aliases: ['start tracking', 'begin timer'],
      description: 'Start time tracking',
      icon: '▶️',
      category: 'timer',
      keywords: ['start', 'timer', 'tracking', 'time', 'begin'],
      handler: () => {
        const state = useTimeTrackingStore.getState();
        if (!state.isTimerRunning()) {
          state.startTimer({ description: 'Quick timer' });
        }
        return true;
      },
    },
    {
      id: 'cmd-stop-timer',
      name: 'Stop Timer',
      aliases: ['stop tracking', 'end timer', 'pause timer'],
      description: 'Stop time tracking',
      icon: '⏹️',
      category: 'timer',
      keywords: ['stop', 'timer', 'tracking', 'time', 'end', 'pause'],
      handler: () => {
        const state = useTimeTrackingStore.getState();
        if (state.isTimerRunning()) {
          state.stopTimer();
        }
        return true;
      },
    },

    // Data commands
    {
      id: 'cmd-export-notes',
      name: 'Export Notes',
      aliases: ['download notes', 'backup notes'],
      description: 'Export notes to markdown files',
      icon: '📤',
      category: 'data',
      keywords: ['export', 'notes', 'markdown', 'download', 'backup'],
      handler: () => {
        navigate('/notes');
        // Note: The export modal would need to be triggered separately
        // For now, navigate to notes page where export is available
        return true;
      },
    },
    {
      id: 'cmd-export-brain',
      name: 'Export Brain',
      aliases: ['backup', 'export data', 'download brain'],
      description: 'Export all data to a .brain file',
      icon: '🧠',
      category: 'data',
      keywords: ['export', 'brain', 'backup', 'download', 'data'],
      handler: () => {
        navigate('/settings');
        return true;
      },
    },
    {
      id: 'cmd-clear-completed',
      name: 'Clear Completed Tasks',
      aliases: ['archive done', 'remove completed'],
      description: 'Archive all completed tasks',
      icon: '🗑️',
      category: 'data',
      keywords: ['clear', 'completed', 'done', 'archive', 'tasks'],
      handler: () => {
        const { tasks, archiveTask } = useKanbanStore.getState();
        const doneTasks = tasks.filter(t => t.status === 'done');
        doneTasks.forEach(task => archiveTask(task.id));
        return true;
      },
    },

    // Focus mode
    {
      id: 'cmd-focus-mode',
      name: 'Enter Focus Mode',
      aliases: ['focus', 'distraction free', 'deep work'],
      description: 'Full-screen distraction-free focus mode',
      icon: '🎯',
      category: 'view',
      keywords: ['focus', 'mode', 'distraction', 'free', 'deep', 'work', 'zen'],
      handler: () => {
        navigate('/focus');
        return true;
      },
    },

    // Navigation commands (quick jumps)
    {
      id: 'cmd-go-dashboard',
      name: 'Go to Dashboard',
      aliases: ['home', 'dashboard'],
      description: 'Navigate to dashboard',
      icon: '🏠',
      category: 'navigation',
      keywords: ['go', 'dashboard', 'home', 'main'],
      handler: () => {
        navigate('/');
        return true;
      },
    },
    {
      id: 'cmd-go-notes',
      name: 'Go to Notes',
      aliases: ['notes', 'documents'],
      description: 'Navigate to notes',
      icon: '📝',
      category: 'navigation',
      keywords: ['go', 'notes', 'documents'],
      handler: () => {
        navigate('/notes');
        return true;
      },
    },
    {
      id: 'cmd-go-tasks',
      name: 'Go to Tasks',
      aliases: ['tasks', 'kanban', 'todos'],
      description: 'Navigate to task board',
      icon: '✅',
      category: 'navigation',
      keywords: ['go', 'tasks', 'kanban', 'todos', 'board'],
      handler: () => {
        navigate('/tasks');
        return true;
      },
    },
    {
      id: 'cmd-go-settings',
      name: 'Go to Settings',
      aliases: ['settings', 'preferences', 'options'],
      description: 'Navigate to settings',
      icon: '⚙️',
      category: 'navigation',
      keywords: ['go', 'settings', 'preferences', 'options', 'config'],
      handler: () => {
        navigate('/settings');
        return true;
      },
    },
  ];
}

/**
 * Search commands and return matching results
 */
export function searchCommands(
  query: string,
  navigate: (path: string) => void,
  openModal?: (modalId: string) => void
): SearchResult[] {
  const commands = getCommands(navigate, openModal);
  const normalizedQuery = query.toLowerCase().trim();

  // Helper to wrap handler with tracking
  const wrapWithTracking = (cmd: Command) => () => {
    trackCommandExecution(cmd.id, cmd.name, cmd.icon);
    cmd.handler();
  };

  if (!normalizedQuery) {
    // Return all commands grouped by category when no query
    return commands.map((cmd) => ({
      id: cmd.id,
      type: 'command' as const,
      title: cmd.name,
      subtitle: cmd.description,
      icon: cmd.icon,
      score: 50, // Base score for all commands
      keywords: cmd.keywords,
      action: wrapWithTracking(cmd),
    }));
  }

  // Filter and score commands
  return commands
    .map((cmd) => {
      // Score based on name, aliases, and keywords
      let score = fuzzyMatch(normalizedQuery, cmd.name.toLowerCase());

      // Check aliases
      for (const alias of cmd.aliases) {
        const aliasScore = fuzzyMatch(normalizedQuery, alias.toLowerCase());
        score = Math.max(score, aliasScore);
      }

      // Check keywords
      for (const keyword of cmd.keywords) {
        const keywordScore = fuzzyMatch(normalizedQuery, keyword.toLowerCase()) * 0.8;
        score = Math.max(score, keywordScore);
      }

      return {
        id: cmd.id,
        type: 'command' as const,
        title: cmd.name,
        subtitle: cmd.description,
        icon: cmd.icon,
        score,
        keywords: cmd.keywords,
        action: wrapWithTracking(cmd),
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get recent commands as search results
 * Shows when palette opens with no query
 */
export function getRecentCommandResults(
  navigate: (path: string) => void,
  openModal?: (modalId: string) => void
): SearchResult[] {
  const recentCommands = useSettingsStore.getState().commandPalette.recentCommands || [];
  const allCommands = getCommands(navigate, openModal);

  const results: SearchResult[] = [];

  for (const recent of recentCommands) {
    // Find the full command definition
    const cmd = allCommands.find((c) => c.id === recent.id);
    if (!cmd) continue;

    results.push({
      id: `recent-${recent.id}`,
      type: 'command' as const,
      title: recent.name,
      subtitle: 'Recent command',
      icon: recent.icon,
      score: 200, // High priority for recent
      keywords: [],
      action: () => {
        // Track execution again (moves to top of recent)
        useSettingsStore.getState().addRecentCommand({
          id: cmd.id,
          name: cmd.name,
          icon: cmd.icon,
        });
        cmd.handler();
      },
    });
  }

  return results;
}

/**
 * Track command execution for recent commands
 */
export function trackCommandExecution(commandId: string, commandName: string, commandIcon: string): void {
  useSettingsStore.getState().addRecentCommand({
    id: commandId,
    name: commandName,
    icon: commandIcon,
  });
}

/**
 * Get quick create task result when no matches found
 */
export function getQuickCreateResult(query: string): SearchResult | null {
  const trimmed = query.trim();
  if (!trimmed || trimmed.startsWith('>') || trimmed.startsWith('?') || trimmed.startsWith('/')) {
    return null;
  }

  return {
    id: 'quick-create-task',
    type: 'action' as const,
    title: `Create task: "${trimmed}"`,
    subtitle: 'Press Enter to create this task',
    icon: '➕',
    score: 1, // Lowest priority - only shows when nothing else matches
    action: () => {
      const { addTask } = useKanbanStore.getState();
      addTask({
        title: trimmed,
        description: '',
        status: 'todo',
        priority: 'medium',
        tags: [],
        startDate: null,
        dueDate: null,
        projectIds: [],
      });
    },
  };
}
