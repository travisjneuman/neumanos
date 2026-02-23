/**
 * Natural Language Input Bar
 *
 * A persistent input bar that parses natural language into structured actions.
 * Supports pattern-matching for quick actions:
 *   - "meeting with X tomorrow at 3pm" -> calendar event
 *   - "buy groceries #personal !high due friday" -> task
 *   - "note: ideas for project" -> note
 *
 * Falls back to AI parsing for complex inputs.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Calendar, CheckSquare, FileText, X, ArrowRight, Mic } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useKanbanStore } from '../stores/useKanbanStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useNotesStore } from '../stores/useNotesStore';
import { useToastStore } from '../stores/useToastStore';
import { formatDateKey } from '../utils/dateUtils';

type ParsedActionType = 'task' | 'event' | 'note' | 'unknown';

interface ParsedAction {
  type: ParsedActionType;
  title: string;
  tags?: string[];
  priority?: string;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  content?: string;
  confidence: number;
}

/**
 * Parse relative date references into YYYY-MM-DD format
 */
function parseRelativeDate(text: string): string | null {
  const lower = text.toLowerCase().trim();
  const today = new Date();

  if (lower === 'today') {
    return formatDateKey(today);
  }
  if (lower === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return formatDateKey(d);
  }
  if (lower === 'yesterday') {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
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

  return null;
}

/**
 * Parse time string like "3pm", "15:00", "3:30pm"
 */
function parseTime(text: string): string | null {
  const lower = text.toLowerCase().trim();

  // Match "3pm", "3:30pm", "15:00"
  const timeMatch = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const period = timeMatch[3];

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Pattern-match input text to detect action type and extract data
 */
function parseInput(text: string): ParsedAction {
  const trimmed = text.trim();

  // Note pattern: "note: ..." or "note about ..."
  const noteMatch = trimmed.match(/^note[:\s]+(.+)$/i);
  if (noteMatch) {
    return {
      type: 'note',
      title: noteMatch[1].trim(),
      content: '',
      confidence: 0.9,
    };
  }

  // Calendar pattern: "meeting with X at TIME" or "event: ..."
  const meetingMatch = trimmed.match(
    /^(?:meeting|event|call|sync|standup|lunch|dinner|appointment)[:\s]+(.+?)(?:\s+(?:on|at)\s+(.+))?$/i
  );
  if (meetingMatch) {
    const title = meetingMatch[1].trim();
    const dateTimePart = meetingMatch[2]?.trim() || '';

    // Try to extract date and time from the datetime part
    const parts = dateTimePart.split(/\s+at\s+|\s+/i);
    let dateStr: string | null = null;
    let startTime: string | null = null;

    for (const part of parts) {
      if (!dateStr) {
        dateStr = parseRelativeDate(part);
        if (dateStr) continue;
      }
      if (!startTime) {
        startTime = parseTime(part);
      }
    }

    return {
      type: 'event',
      title,
      dueDate: dateStr || formatDateKey(new Date()),
      startTime: startTime || undefined,
      confidence: 0.85,
    };
  }

  // Task pattern: text with #tags, !priority, "due DATE"
  const hasTags = /#\w+/.test(trimmed);
  const hasPriority = /!(?:high|medium|low|urgent|critical)/i.test(trimmed);
  const hasDue = /\bdue\s+\w+/i.test(trimmed);

  if (hasTags || hasPriority || hasDue) {
    // Extract tags
    const tags: string[] = [];
    const tagMatches = trimmed.matchAll(/#(\w+)/g);
    for (const match of tagMatches) {
      tags.push(match[1]);
    }

    // Extract priority
    let priority = 'medium';
    const priorityMatch = trimmed.match(/!(\w+)/i);
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (['high', 'urgent', 'critical'].includes(p)) priority = 'high';
      else if (p === 'low') priority = 'low';
    }

    // Extract due date
    let dueDate: string | undefined;
    const dueMatch = trimmed.match(/\bdue\s+(\w+)/i);
    if (dueMatch) {
      dueDate = parseRelativeDate(dueMatch[1]) || undefined;
    }

    // Clean title: remove tags, priority, due date
    const title = trimmed
      .replace(/#\w+/g, '')
      .replace(/!\w+/g, '')
      .replace(/\bdue\s+\w+/gi, '')
      .trim();

    return {
      type: 'task',
      title,
      tags,
      priority,
      dueDate,
      confidence: 0.9,
    };
  }

  // Default: treat short inputs as tasks, longer as notes
  if (trimmed.length < 80) {
    return {
      type: 'task',
      title: trimmed,
      confidence: 0.5,
    };
  }

  return {
    type: 'unknown',
    title: trimmed,
    confidence: 0,
  };
}

interface NaturalLanguageBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NaturalLanguageBar: React.FC<NaturalLanguageBarProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [parsedAction, setParsedAction] = useState<ParsedAction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToast = useToastStore((s) => s.addToast);

  // Voice input
  const voiceInput = useVoiceInput({
    onResult: useCallback((text: string) => {
      setInput((prev) => (prev ? prev + ' ' + text : text));
    }, []),
  });

  // Parse input on change
  useEffect(() => {
    if (input.trim().length > 2) {
      setParsedAction(parseInput(input));
    } else {
      setParsedAction(null);
    }
  }, [input]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(() => {
    if (!parsedAction || !input.trim()) return;

    try {
      switch (parsedAction.type) {
        case 'task': {
          const kanbanStore = useKanbanStore.getState();
          kanbanStore.addTask({
            title: parsedAction.title,
            description: '',
            status: 'todo',
            priority: (parsedAction.priority as 'low' | 'medium' | 'high') || 'medium',
            tags: parsedAction.tags || [],
            startDate: null,
            dueDate: parsedAction.dueDate || null,
            projectIds: [],
            order: 0,
          });
          addToast('success', `Task created: ${parsedAction.title}`);
          break;
        }
        case 'event': {
          const calendarStore = useCalendarStore.getState();
          const dateKey = parsedAction.dueDate || formatDateKey(new Date());
          calendarStore.addEvent(dateKey, parsedAction.title, '', {
            startTime: parsedAction.startTime,
          });
          addToast('success', `Event created: ${parsedAction.title}`);
          break;
        }
        case 'note': {
          const notesStore = useNotesStore.getState();
          notesStore.createNote({
            title: parsedAction.title,
            contentText: parsedAction.content || '',
          });
          addToast('success', `Note created: ${parsedAction.title}`);
          break;
        }
        default:
          addToast('warning', 'Could not determine action type. Try adding #tags or starting with "note:" or "meeting".');
          return;
      }

      setInput('');
      setParsedAction(null);
      onClose();
    } catch (error) {
      addToast('error', 'Failed to create item');
    }
  }, [parsedAction, input, addToast, onClose]);

  const getTypeIcon = (type: ParsedActionType) => {
    switch (type) {
      case 'task':
        return <CheckSquare size={14} className="text-accent-blue" />;
      case 'event':
        return <Calendar size={14} className="text-accent-green" />;
      case 'note':
        return <FileText size={14} className="text-accent-yellow" />;
      default:
        return <Sparkles size={14} className="text-text-dark-secondary" />;
    }
  };

  const getTypeLabel = (type: ParsedActionType) => {
    switch (type) {
      case 'task':
        return 'Task';
      case 'event':
        return 'Event';
      case 'note':
        return 'Note';
      default:
        return 'Unknown';
    }
  };

  const forceType = useCallback((type: ParsedActionType) => {
    if (!input.trim()) return;
    setParsedAction({
      ...parseInput(input),
      type,
      confidence: 1,
    });
  }, [input]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl mx-4 bg-white dark:bg-surface-dark-elevated rounded-xl shadow-2xl border border-border-light dark:border-border-dark overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Sparkles size={18} className="text-accent-primary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              voiceInput.isListening
                ? (voiceInput.interimTranscript || 'Listening...')
                : 'Try: "meeting with team tomorrow at 3pm" or "buy milk #errands !high due friday"'
            }
            className="flex-1 bg-transparent text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-tertiary outline-none text-sm"
            autoComplete="off"
          />
          {voiceInput.isSupported && (
            <button
              type="button"
              onClick={voiceInput.toggleListening}
              className={`p-1 rounded transition-colors ${
                voiceInput.isListening
                  ? 'text-accent-red voice-pulse'
                  : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-red hover:bg-accent-red/10'
              }`}
              title={voiceInput.isListening ? 'Stop voice input' : 'Start voice input'}
              aria-label={voiceInput.isListening ? 'Stop voice input' : 'Start voice input'}
            >
              <Mic size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-light-elevated dark:hover:bg-surface-dark rounded transition-colors text-text-light-secondary dark:text-text-dark-secondary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        {parsedAction && parsedAction.confidence > 0 && (
          <div className="border-t border-border-light dark:border-border-dark px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTypeIcon(parsedAction.type)}
                <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
                  Create {getTypeLabel(parsedAction.type)}
                </span>
                {parsedAction.confidence < 0.8 && (
                  <span className="text-[10px] text-text-dark-tertiary">(best guess)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => forceType('task')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    parsedAction.type === 'task'
                      ? 'bg-accent-blue/20 text-accent-blue'
                      : 'text-text-dark-tertiary hover:bg-surface-dark'
                  }`}
                >
                  Task
                </button>
                <button
                  onClick={() => forceType('event')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    parsedAction.type === 'event'
                      ? 'bg-accent-green/20 text-accent-green'
                      : 'text-text-dark-tertiary hover:bg-surface-dark'
                  }`}
                >
                  Event
                </button>
                <button
                  onClick={() => forceType('note')}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                    parsedAction.type === 'note'
                      ? 'bg-accent-yellow/20 text-accent-yellow'
                      : 'text-text-dark-tertiary hover:bg-surface-dark'
                  }`}
                >
                  Note
                </button>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-3 space-y-1.5">
              <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {parsedAction.title}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {parsedAction.tags && parsedAction.tags.length > 0 && (
                  <div className="flex gap-1">
                    {parsedAction.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-accent-blue/10 text-accent-blue rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {parsedAction.priority && parsedAction.priority !== 'medium' && (
                  <span className={`px-1.5 py-0.5 rounded ${
                    parsedAction.priority === 'high'
                      ? 'bg-accent-red/10 text-accent-red'
                      : 'bg-accent-green/10 text-accent-green'
                  }`}>
                    {parsedAction.priority}
                  </span>
                )}
                {parsedAction.dueDate && (
                  <span className="px-1.5 py-0.5 bg-accent-orange/10 text-accent-orange rounded">
                    {parsedAction.dueDate}
                  </span>
                )}
                {parsedAction.startTime && (
                  <span className="px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded">
                    {parsedAction.startTime}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create {getTypeLabel(parsedAction.type)}
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Hints */}
        {!parsedAction && (
          <div className="border-t border-border-light dark:border-border-dark px-4 py-3">
            <div className="grid grid-cols-3 gap-2 text-[11px] text-text-light-secondary dark:text-text-dark-tertiary">
              <div className="flex items-center gap-1.5">
                <CheckSquare size={12} className="text-accent-blue" />
                <span>#tag !priority due day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-accent-green" />
                <span>meeting/event at time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={12} className="text-accent-yellow" />
                <span>note: your text</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
