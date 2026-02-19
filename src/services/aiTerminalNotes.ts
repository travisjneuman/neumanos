/**
 * AI Terminal Notes Service
 *
 * Handles saving AI Terminal messages to Notes.
 * Supports:
 * - Auto-creating "AI Terminal" folder
 * - Daily notes pattern within AI Terminal folder
 * - Formatting messages with full metadata
 * - Appending to existing notes
 *
 * @module services/aiTerminalNotes
 */

import type { Message } from '../stores/useTerminalStore';
import type { Note } from '../types/notes';
import { useFoldersStore } from '../stores/useFoldersStore';
import { useNotesStore } from '../stores/useNotesStore';
import { useTerminalStore } from '../stores/useTerminalStore';
import { markdownToLexical, appendMarkdownToLexical } from '../utils/markdownToLexical';
import { formatDateLong } from '../utils/dateUtils';
import { logger } from './logger';

const log = logger.module('AITerminalNotes');

/**
 * AI Terminal folder configuration
 */
export const AI_TERMINAL_FOLDER_NAME = 'AI Terminal';
export const AI_TERMINAL_FOLDER_ICON = '🤖';

/**
 * Daily note template for AI Terminal folder
 */
export const AI_TERMINAL_DAILY_TEMPLATE = `# AI Terminal - {date}

## Conversations

`;

/**
 * Get or create the AI Terminal folder
 *
 * @returns Folder ID of the AI Terminal folder
 */
export function getOrCreateAITerminalFolder(): string {
  const foldersStore = useFoldersStore.getState();
  const terminalStore = useTerminalStore.getState();

  // Check if we have a cached folder ID
  const cachedFolderId = terminalStore.aiTerminalFolderId;
  if (cachedFolderId) {
    const folder = foldersStore.getFolder(cachedFolderId);
    if (folder) {
      return cachedFolderId;
    }
    // Folder was deleted, clear cache
    log.debug('Cached AI Terminal folder no longer exists, creating new one');
  }

  // Look for existing AI Terminal folder
  const folders = Object.values(foldersStore.folders);
  const existingFolder = folders.find(
    (f) => f.name === AI_TERMINAL_FOLDER_NAME && f.parentId === null
  );

  if (existingFolder) {
    log.debug('Found existing AI Terminal folder', { folderId: existingFolder.id });
    // Cache the folder ID
    useTerminalStore.setState({ aiTerminalFolderId: existingFolder.id });
    return existingFolder.id;
  }

  // Create new AI Terminal folder
  const newFolder = foldersStore.createFolder({
    name: AI_TERMINAL_FOLDER_NAME,
    icon: AI_TERMINAL_FOLDER_ICON,
    parentId: null,
  });

  log.info('Created AI Terminal folder', { folderId: newFolder.id });

  // Cache the folder ID
  useTerminalStore.setState({ aiTerminalFolderId: newFolder.id });

  return newFolder.id;
}

/**
 * Get or create a daily note inside the AI Terminal folder
 *
 * @param date - Date for the daily note (defaults to today)
 * @returns Note object
 */
export function getOrCreateAITerminalDailyNote(date: Date = new Date()): Note {
  const folderId = getOrCreateAITerminalFolder();
  const notesStore = useNotesStore.getState();

  // Format the date for the note title
  const dateTitle = formatDateLong(date);
  const fullTitle = `AI Terminal - ${dateTitle}`;

  // Look for existing daily note - IMPORTANT: Search ALL notes, not filtered ones
  // getAllNotes() applies filters which can cause missing notes and duplicate creation
  const allNotes = Object.values(notesStore.notes);
  const existingNote = allNotes.find(
    (n) =>
      n.folderId === folderId &&
      n.title === fullTitle &&
      n.tags.includes('ai-terminal')
  );

  if (existingNote) {
    log.debug('Found existing AI Terminal daily note', { noteId: existingNote.id, date: dateTitle });
    return existingNote;
  }

  // Create new daily note
  const template = AI_TERMINAL_DAILY_TEMPLATE.replace('{date}', dateTitle);

  const newNote = notesStore.createNote({
    title: fullTitle,
    folderId,
    contentText: template,
    content: markdownToLexical(template),
    tags: ['ai-terminal', 'daily-note'],
    icon: '📅',
  });

  log.info('Created AI Terminal daily note', { noteId: newNote.id, date: dateTitle });

  return newNote;
}

/**
 * Check if a message has already been saved to a note
 * Uses the terminal store's tracking instead of content markers
 *
 * @param noteId - The note ID to check
 * @param messageId - The message ID to check
 * @returns True if the message is already saved to this note
 */
export function isMessageAlreadySaved(noteId: string, messageId: string): boolean {
  const terminalStore = useTerminalStore.getState();
  return terminalStore.isMessageSavedToNote(noteId, messageId);
}

/**
 * Mark a message as saved to a note
 *
 * @param noteId - The note ID
 * @param messageId - The message ID
 */
export function markMessageAsSaved(noteId: string, messageId: string): void {
  const terminalStore = useTerminalStore.getState();
  terminalStore.markMessageSaved(noteId, messageId);
}

/**
 * Format a message for saving to a note
 *
 * @param message - The AI Terminal message
 * @param promptMessage - Optional prompt message (if saving a response)
 * @returns Formatted markdown string
 */
export function formatMessageForNote(
  message: Message,
  promptMessage?: Message
): string {
  const lines: string[] = [];

  // Separator
  lines.push('---');
  lines.push('');

  // Header with metadata
  lines.push('## AI Terminal Capture');

  // Format timestamp
  const date = new Date(message.timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  lines.push(`**Date:** ${dateStr} at ${timeStr}`);

  // Model info
  if (message.model && message.provider) {
    lines.push(`**Model:** ${message.model} (${message.provider})`);
  } else if (message.model) {
    lines.push(`**Model:** ${message.model}`);
  }

  lines.push('');

  // Include prompt if provided (for response saves)
  if (promptMessage) {
    lines.push('### Prompt');
    lines.push(promptMessage.content);
    lines.push('');
  }

  // Main content
  if (message.role === 'user') {
    lines.push('### Prompt');
  } else {
    lines.push('### Response');
  }
  lines.push(message.content);
  lines.push('');

  return lines.join('\n');
}

/**
 * Format multiple messages (conversation) for saving
 *
 * @param messages - Array of messages to format
 * @param filter - Filter type: 'all', 'user', 'assistant'
 * @returns Formatted markdown string
 */
export function formatConversationForNote(
  messages: Message[],
  filter: 'all' | 'user' | 'assistant' = 'all'
): string {
  // Filter messages
  let filteredMessages = messages;
  if (filter === 'user') {
    filteredMessages = messages.filter((m) => m.role === 'user');
  } else if (filter === 'assistant') {
    filteredMessages = messages.filter((m) => m.role === 'assistant');
  }

  if (filteredMessages.length === 0) {
    return '';
  }

  const lines: string[] = [];

  // Header
  lines.push('---');
  lines.push('');
  lines.push('## AI Terminal Conversation');

  // Timestamp range
  const firstDate = new Date(filteredMessages[0].timestamp);
  const dateStr = firstDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  lines.push(`**Date:** ${dateStr}`);
  lines.push(`**Messages:** ${filteredMessages.length}`);
  lines.push('');

  // Messages
  filteredMessages.forEach((msg) => {
    const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (msg.role === 'user') {
      lines.push(`### [${time}] Prompt`);
    } else {
      const modelInfo = msg.model ? ` (${msg.model})` : '';
      lines.push(`### [${time}] Response${modelInfo}`);
    }
    lines.push(msg.content);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Result of save operation
 */
export interface SaveResult {
  success: boolean;
  skipped: boolean;
  reason?: string;
}

/**
 * Save a message to a specific note
 *
 * @param params - Save parameters
 * @returns SaveResult indicating success/skip status
 */
export function saveMessageToNote(params: {
  message: Message;
  promptMessage?: Message;
  targetNoteId: string;
  position?: 'append' | 'prepend';
}): SaveResult {
  const { message, promptMessage, targetNoteId, position = 'append' } = params;
  const notesStore = useNotesStore.getState();

  const note = notesStore.getNote(targetNoteId);
  if (!note) {
    log.error('Target note not found', { noteId: targetNoteId });
    throw new Error('Target note not found');
  }

  // Check for duplicate - skip if message already saved to this note
  if (isMessageAlreadySaved(targetNoteId, message.id)) {
    log.debug('Message already saved to note, skipping', {
      messageId: message.id,
      noteId: targetNoteId,
    });
    return { success: true, skipped: true, reason: 'Message already saved' };
  }

  // Format the message
  const markdown = formatMessageForNote(message, promptMessage);

  // Append/prepend to note
  // Pass empty separator since formatMessageForNote already includes a '---' separator
  let newContent: string;
  if (position === 'prepend') {
    newContent = appendMarkdownToLexical('', markdown + '\n\n' + (note.contentText || ''), '\n\n');
  } else {
    newContent = appendMarkdownToLexical(note.content, markdown, '\n\n');
  }

  // Update note
  notesStore.updateNote(targetNoteId, {
    content: newContent,
    contentText: (note.contentText || '') + '\n\n' + markdown,
  });

  // Track that this message has been saved to this note
  markMessageAsSaved(targetNoteId, message.id);

  log.info('Saved message to note', {
    messageId: message.id,
    noteId: targetNoteId,
    position,
  });

  return { success: true, skipped: false };
}

/**
 * Save a conversation to a specific note
 *
 * @param params - Save parameters
 */
export function saveConversationToNote(params: {
  messages: Message[];
  targetNoteId: string;
  filter?: 'all' | 'user' | 'assistant';
}): void {
  const { messages, targetNoteId, filter = 'all' } = params;
  const notesStore = useNotesStore.getState();

  const note = notesStore.getNote(targetNoteId);
  if (!note) {
    log.error('Target note not found', { noteId: targetNoteId });
    throw new Error('Target note not found');
  }

  // Format the conversation
  const markdown = formatConversationForNote(messages, filter);

  if (!markdown) {
    log.warn('No messages to save after filtering');
    return;
  }

  // Append to note
  const newContent = appendMarkdownToLexical(note.content, markdown);

  // Update note
  notesStore.updateNote(targetNoteId, {
    content: newContent,
    contentText: (note.contentText || '') + '\n\n' + markdown,
  });

  log.info('Saved conversation to note', {
    messageCount: messages.length,
    noteId: targetNoteId,
    filter,
  });
}

/**
 * Result of save to daily note operation
 */
export interface SaveToDailyNoteResult {
  note: Note;
  saveResult: SaveResult;
}

/**
 * Save message to today's AI Terminal daily note
 *
 * @param message - Message to save
 * @param promptMessage - Optional prompt (for response saves)
 * @returns Object containing the note and save result (including skip status)
 */
export function saveMessageToDailyNote(
  message: Message,
  promptMessage?: Message
): SaveToDailyNoteResult {
  const dailyNote = getOrCreateAITerminalDailyNote();

  const saveResult = saveMessageToNote({
    message,
    promptMessage,
    targetNoteId: dailyNote.id,
    position: 'append',
  });

  // Track as recent destination
  addRecentDestination(dailyNote.id);

  return { note: dailyNote, saveResult };
}

/**
 * Save conversation to today's AI Terminal daily note
 *
 * @param messages - Messages to save
 * @param filter - Filter type
 */
export function saveConversationToDailyNote(
  messages: Message[],
  filter: 'all' | 'user' | 'assistant' = 'all'
): Note {
  const dailyNote = getOrCreateAITerminalDailyNote();

  saveConversationToNote({
    messages,
    targetNoteId: dailyNote.id,
    filter,
  });

  // Track as recent destination
  addRecentDestination(dailyNote.id);

  return dailyNote;
}

/**
 * Create a new note with message content
 *
 * @param params - Creation parameters
 * @returns Created note
 */
export function createNoteWithMessage(params: {
  message: Message;
  promptMessage?: Message;
  title: string;
  folderId?: string | null;
  tags?: string[];
}): Note {
  const { message, promptMessage, title, folderId, tags = [] } = params;
  const notesStore = useNotesStore.getState();

  // Format the message
  const markdown = formatMessageForNote(message, promptMessage);

  // Determine folder - use AI Terminal folder if not specified
  const targetFolderId = folderId ?? getOrCreateAITerminalFolder();

  // Create note
  const note = notesStore.createNote({
    title,
    folderId: targetFolderId,
    content: markdownToLexical(markdown),
    contentText: markdown,
    tags: ['ai-terminal', ...tags],
    icon: '💬',
  });

  // Track as recent destination
  addRecentDestination(note.id);

  log.info('Created note with message', { noteId: note.id, title });

  return note;
}

/**
 * Create a new note with conversation content
 *
 * @param params - Creation parameters
 * @returns Created note
 */
export function createNoteWithConversation(params: {
  messages: Message[];
  title: string;
  filter?: 'all' | 'user' | 'assistant';
  folderId?: string | null;
  tags?: string[];
}): Note {
  const { messages, title, filter = 'all', folderId, tags = [] } = params;
  const notesStore = useNotesStore.getState();

  // Format the conversation
  const markdown = formatConversationForNote(messages, filter);

  if (!markdown) {
    throw new Error('No messages to save after filtering');
  }

  // Determine folder - use AI Terminal folder if not specified
  const targetFolderId = folderId ?? getOrCreateAITerminalFolder();

  // Create note
  const note = notesStore.createNote({
    title,
    folderId: targetFolderId,
    content: markdownToLexical(markdown),
    contentText: markdown,
    tags: ['ai-terminal', 'conversation', ...tags],
    icon: '💬',
  });

  // Track as recent destination
  addRecentDestination(note.id);

  log.info('Created note with conversation', { noteId: note.id, title, messageCount: messages.length });

  return note;
}

/**
 * Add a note ID to recent destinations
 *
 * @param noteId - Note ID to track
 */
export function addRecentDestination(noteId: string): void {
  const terminalStore = useTerminalStore.getState();
  const recent = terminalStore.recentNoteDestinations || [];

  // Remove if already in list, add to front
  const filtered = recent.filter((id) => id !== noteId);
  const updated = [noteId, ...filtered].slice(0, 5); // Keep last 5

  useTerminalStore.setState({ recentNoteDestinations: updated });
}

/**
 * Get recent note destinations with note details
 *
 * @returns Array of recent notes
 */
export function getRecentDestinations(): Note[] {
  const terminalStore = useTerminalStore.getState();
  const notesStore = useNotesStore.getState();

  const recent = terminalStore.recentNoteDestinations || [];

  return recent
    .map((id) => notesStore.getNote(id))
    .filter((note): note is Note => note !== undefined);
}

/**
 * Get the user's prompt that preceded an AI response
 *
 * @param responseMessage - The AI response message
 * @returns The preceding user prompt, or undefined
 */
export function getPrecedingPrompt(responseMessage: Message): Message | undefined {
  if (responseMessage.role !== 'assistant') {
    return undefined;
  }

  const terminalStore = useTerminalStore.getState();
  const messages = terminalStore.messages;

  // Find this message's index
  const responseIndex = messages.findIndex((m) => m.id === responseMessage.id);
  if (responseIndex <= 0) {
    return undefined;
  }

  // Look backwards for the preceding user message
  for (let i = responseIndex - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i];
    }
  }

  return undefined;
}

// ============================================================================
// QUICK NOTE FUNCTIONS
// ============================================================================

/**
 * Quick Note configuration
 */
export const QUICK_NOTE_TITLE = '⚡ Quick Note';
export const QUICK_NOTE_ICON = '⚡';

/**
 * Quick Note template for initial creation
 */
export const QUICK_NOTE_TEMPLATE = `# ⚡ Quick Note

Fast capture for quick thoughts. Use "Move to Daily Note" to organize later.

`;

/**
 * Format a timestamp for Quick Note entries
 * Format: [Dec 25, 2025 @ 2:34 PM]
 *
 * @param date - Date to format (defaults to now)
 * @returns Formatted timestamp string
 */
export function formatQuickNoteTimestamp(date: Date = new Date()): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `[${month} ${day}, ${year} @ ${time}]`;
}

/**
 * Get or create the Quick Note
 *
 * @returns Quick Note object
 */
export function getOrCreateQuickNote(): Note {
  const folderId = getOrCreateAITerminalFolder();
  const notesStore = useNotesStore.getState();
  const terminalStore = useTerminalStore.getState();

  // Check if we have a cached Quick Note ID
  const cachedQuickNoteId = terminalStore.quickNoteId;
  if (cachedQuickNoteId) {
    const note = notesStore.getNote(cachedQuickNoteId);
    if (note && note.isQuickNote) {
      return note;
    }
    // Note was deleted or no longer marked as Quick Note, clear cache
    log.debug('Cached Quick Note no longer exists or not marked as Quick Note, looking for existing');
  }

  // Look for existing Quick Note in AI Terminal folder
  const allNotes = notesStore.getAllNotes();
  const existingQuickNote = allNotes.find(
    (n) =>
      n.folderId === folderId &&
      n.isQuickNote === true
  );

  if (existingQuickNote) {
    log.debug('Found existing Quick Note', { noteId: existingQuickNote.id });
    // Cache the Quick Note ID
    useTerminalStore.setState({ quickNoteId: existingQuickNote.id });
    return existingQuickNote;
  }

  // Create new Quick Note
  const newNote = notesStore.createNote({
    title: QUICK_NOTE_TITLE,
    folderId,
    contentText: QUICK_NOTE_TEMPLATE,
    content: markdownToLexical(QUICK_NOTE_TEMPLATE),
    tags: ['ai-terminal', 'quick-note'],
    icon: QUICK_NOTE_ICON,
    isQuickNote: true,
    isPinned: true, // Always pinned
  });

  log.info('Created Quick Note', { noteId: newNote.id });

  // Cache the Quick Note ID
  useTerminalStore.setState({ quickNoteId: newNote.id });

  return newNote;
}

/**
 * Append timestamped content to Quick Note
 *
 * @param content - Content to append
 * @returns Updated Quick Note
 */
export function appendToQuickNote(content: string): Note {
  const quickNote = getOrCreateQuickNote();
  const notesStore = useNotesStore.getState();

  // Format the entry with timestamp
  const timestamp = formatQuickNoteTimestamp();
  const entry = `---
**${timestamp}**

${content.trim()}

`;

  // Append to note
  const newContent = appendMarkdownToLexical(quickNote.content, entry);
  const newContentText = (quickNote.contentText || '') + '\n' + entry;

  // Update note
  notesStore.updateNote(quickNote.id, {
    content: newContent,
    contentText: newContentText,
  });

  log.info('Appended to Quick Note', { noteId: quickNote.id, contentLength: content.length });

  // Return updated note
  return notesStore.getNote(quickNote.id)!;
}

/**
 * Parse timestamp from Quick Note content
 * Matches format: [Dec 25, 2025 @ 2:34 PM]
 *
 * @param content - Content containing timestamp
 * @returns Parsed Date or null if not found
 */
export function parseTimestampFromContent(content: string): Date | null {
  // Match [Mon DD, YYYY @ H:MM AM/PM]
  const pattern = /\[([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})\s+@\s+(\d{1,2}):(\d{2})\s+(AM|PM)\]/i;
  const match = content.match(pattern);

  if (!match) {
    return null;
  }

  const [, monthStr, dayStr, yearStr, hourStr, minuteStr, ampm] = match;

  // Parse month
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const month = months[monthStr];
  if (month === undefined) {
    return null;
  }

  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Convert to 24-hour format
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return new Date(year, month, day, hour, minute);
}

/**
 * Extract all timestamps from Quick Note content
 *
 * @param content - Content to search
 * @returns Array of parsed dates with their positions
 */
export function extractAllTimestamps(content: string): Array<{ date: Date; start: number; end: number }> {
  const pattern = /\[([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})\s+@\s+(\d{1,2}):(\d{2})\s+(AM|PM)\]/gi;
  const results: Array<{ date: Date; start: number; end: number }> = [];

  let match;
  while ((match = pattern.exec(content)) !== null) {
    const date = parseTimestampFromContent(match[0]);
    if (date) {
      results.push({
        date,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return results;
}

/**
 * Move content from Quick Note to a Daily Note
 * The content is REMOVED from Quick Note (moved, not copied)
 *
 * @param content - Content to move
 * @param targetDate - Target date for Daily Note (auto-detected from content if not provided)
 * @returns The target Daily Note
 */
export function moveContentToDailyNote(
  content: string,
  targetDate?: Date
): Note {
  const quickNote = getOrCreateQuickNote();
  const notesStore = useNotesStore.getState();

  // If no target date, try to parse from content
  const effectiveDate = targetDate || parseTimestampFromContent(content) || new Date();

  // Get or create the target Daily Note
  const dailyNote = getOrCreateAITerminalDailyNote(effectiveDate);

  // Format content for Daily Note (add header if needed)
  const movedContent = `---
**Moved from Quick Note**

${content.trim()}

`;

  // Append to Daily Note
  const newDailyContent = appendMarkdownToLexical(dailyNote.content, movedContent);
  notesStore.updateNote(dailyNote.id, {
    content: newDailyContent,
    contentText: (dailyNote.contentText || '') + '\n' + movedContent,
  });

  // Remove content from Quick Note
  const quickNoteContent = quickNote.contentText || '';
  const updatedQuickNoteContent = quickNoteContent.replace(content, '').trim();

  // Also clean up any orphaned separators
  const cleanedContent = updatedQuickNoteContent
    .replace(/---\s*---/g, '---')  // Remove double separators
    .replace(/\n{3,}/g, '\n\n');    // Remove excessive newlines

  notesStore.updateNote(quickNote.id, {
    content: markdownToLexical(cleanedContent),
    contentText: cleanedContent,
  });

  log.info('Moved content to Daily Note', {
    fromNoteId: quickNote.id,
    toNoteId: dailyNote.id,
    targetDate: effectiveDate.toISOString(),
    contentLength: content.length,
  });

  return dailyNote;
}

/**
 * Count entries in Quick Note
 *
 * @returns Number of entries (based on timestamp markers)
 */
export function countQuickNoteEntries(): number {
  const quickNote = getOrCreateQuickNote();
  const timestamps = extractAllTimestamps(quickNote.contentText || '');
  return timestamps.length;
}

/**
 * Get Quick Note summary info
 *
 * @returns Summary object with entry count and last entry time
 */
export function getQuickNoteSummary(): {
  entryCount: number;
  lastEntryTime: Date | null;
  noteId: string;
} {
  const quickNote = getOrCreateQuickNote();
  const timestamps = extractAllTimestamps(quickNote.contentText || '');

  return {
    entryCount: timestamps.length,
    lastEntryTime: timestamps.length > 0
      ? timestamps.reduce((latest, t) => t.date > latest.date ? t : latest).date
      : null,
    noteId: quickNote.id,
  };
}
