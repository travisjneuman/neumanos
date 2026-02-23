/**
 * EmbedPlugin for Lexical Editor
 *
 * Registers slash commands for embedding tasks, events, and spreadsheets.
 * Shows picker modals for entity selection.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_LOW,
  createCommand,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { useKanbanStore } from '../../../stores/useKanbanStore';
import { useCalendarStore } from '../../../stores/useCalendarStore';
import { useDocsStore } from '../../../stores/useDocsStore';
import { $createTaskEmbedNode } from '../nodes/TaskEmbedNode';
import { $createEventEmbedNode } from '../nodes/EventEmbedNode';
import { $createSpreadsheetEmbedNode } from '../nodes/SpreadsheetEmbedNode';
import type { Task, CalendarEvent, SpreadsheetDoc } from '../../../types';

type PickerType = 'task' | 'event' | 'sheet' | null;

export const INSERT_TASK_EMBED: LexicalCommand<void> = createCommand('INSERT_TASK_EMBED');
export const INSERT_EVENT_EMBED: LexicalCommand<void> = createCommand('INSERT_EVENT_EMBED');
export const INSERT_SHEET_EMBED: LexicalCommand<void> = createCommand('INSERT_SHEET_EMBED');

export default function EmbedPlugin() {
  const [editor] = useLexicalComposerContext();
  const [pickerType, setPickerType] = useState<PickerType>(null);

  useEffect(() => {
    const unregisterTask = editor.registerCommand(
      INSERT_TASK_EMBED,
      () => {
        setPickerType('task');
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
    const unregisterEvent = editor.registerCommand(
      INSERT_EVENT_EMBED,
      () => {
        setPickerType('event');
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
    const unregisterSheet = editor.registerCommand(
      INSERT_SHEET_EMBED,
      () => {
        setPickerType('sheet');
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterTask();
      unregisterEvent();
      unregisterSheet();
    };
  }, [editor]);

  // Listen for slash commands typed in the editor
  useEffect(() => {
    return editor.registerTextContentListener((text) => {
      // Check if any paragraph ends with a slash command
      if (text.endsWith('/embed-task')) {
        // Remove the slash command text and open picker
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const textContent = node.getTextContent();
            if (textContent.endsWith('/embed-task') && 'setTextContent' in node) {
              const newText = textContent.slice(0, -'/embed-task'.length);
              (node as unknown as { setTextContent(text: string): void }).setTextContent(newText);
            }
          }
        });
        setPickerType('task');
      } else if (text.endsWith('/embed-event')) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const textContent = node.getTextContent();
            if (textContent.endsWith('/embed-event') && 'setTextContent' in node) {
              const newText = textContent.slice(0, -'/embed-event'.length);
              (node as unknown as { setTextContent(text: string): void }).setTextContent(newText);
            }
          }
        });
        setPickerType('event');
      } else if (text.endsWith('/embed-sheet')) {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const textContent = node.getTextContent();
            if (textContent.endsWith('/embed-sheet') && 'setTextContent' in node) {
              const newText = textContent.slice(0, -'/embed-sheet'.length);
              (node as unknown as { setTextContent(text: string): void }).setTextContent(newText);
            }
          }
        });
        setPickerType('sheet');
      }
    });
  }, [editor]);

  const handleSelectTask = useCallback(
    (task: Task) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createTaskEmbedNode(task.id);
          selection.insertNodes([node]);
        }
      });
      setPickerType(null);
    },
    [editor]
  );

  const handleSelectEvent = useCallback(
    (event: CalendarEvent, dateKey: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createEventEmbedNode(event.id, dateKey);
          selection.insertNodes([node]);
        }
      });
      setPickerType(null);
    },
    [editor]
  );

  const handleSelectSheet = useCallback(
    (doc: SpreadsheetDoc) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createSpreadsheetEmbedNode(doc.id);
          selection.insertNodes([node]);
        }
      });
      setPickerType(null);
    },
    [editor]
  );

  if (!pickerType) return null;

  return (
    <PickerModal
      type={pickerType}
      onClose={() => setPickerType(null)}
      onSelectTask={handleSelectTask}
      onSelectEvent={handleSelectEvent}
      onSelectSheet={handleSelectSheet}
    />
  );
}

function PickerModal({
  type,
  onClose,
  onSelectTask,
  onSelectEvent,
  onSelectSheet,
}: {
  type: PickerType;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  onSelectEvent: (event: CalendarEvent, dateKey: string) => void;
  onSelectSheet: (doc: SpreadsheetDoc) => void;
}) {
  const [search, setSearch] = useState('');

  const title =
    type === 'task'
      ? 'Embed Task'
      : type === 'event'
        ? 'Embed Event'
        : 'Embed Spreadsheet';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-elevated border border-border-light dark:border-border-dark w-full max-w-md max-h-[60vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
            {title}
          </h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="mt-2 w-full px-3 py-1.5 text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {type === 'task' && (
            <TaskPickerList search={search} onSelect={onSelectTask} />
          )}
          {type === 'event' && (
            <EventPickerList search={search} onSelect={onSelectEvent} />
          )}
          {type === 'sheet' && (
            <SheetPickerList search={search} onSelect={onSelectSheet} />
          )}
        </div>
      </div>
    </div>
  );
}

function TaskPickerList({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (task: Task) => void;
}) {
  const tasks = useKanbanStore((state) => state.tasks);
  const filtered = useMemo(
    () =>
      tasks.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      ),
    [tasks, search]
  );

  if (filtered.length === 0) {
    return (
      <p className="text-center text-xs text-text-light-secondary dark:text-text-dark-secondary py-4">
        No tasks found
      </p>
    );
  }

  return (
    <>
      {filtered.map((task) => (
        <button
          key={task.id}
          onClick={() => onSelect(task)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              task.priority === 'high'
                ? 'bg-red-500'
                : task.priority === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
            }`}
          />
          <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
            {task.title}
          </span>
          <span className="ml-auto text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {task.status}
          </span>
        </button>
      ))}
    </>
  );
}

function EventPickerList({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (event: CalendarEvent, dateKey: string) => void;
}) {
  const allEvents = useCalendarStore((state) => state.events);

  // Flatten events into a list with dateKey, sorted by date (upcoming first)
  const flatEvents = useMemo(() => {
    const result: Array<{ event: CalendarEvent; dateKey: string }> = [];

    // Sort date keys and take upcoming/recent ones
    const sortedKeys = Object.keys(allEvents).sort();
    for (const dateKey of sortedKeys) {
      const events = allEvents[dateKey];
      if (!events) continue;
      for (const event of events) {
        if (event.title.toLowerCase().includes(search.toLowerCase())) {
          result.push({ event, dateKey });
        }
      }
    }

    return result.slice(0, 50); // Cap for performance
  }, [allEvents, search]);

  if (flatEvents.length === 0) {
    return (
      <p className="text-center text-xs text-text-light-secondary dark:text-text-dark-secondary py-4">
        No events found
      </p>
    );
  }

  return (
    <>
      {flatEvents.map(({ event, dateKey }) => (
        <button
          key={`${dateKey}-${event.id}`}
          onClick={() => onSelect(event, dateKey)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
        >
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary w-20 flex-shrink-0">
            {dateKey}
          </span>
          <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
            {event.title}
          </span>
          {event.startTime && (
            <span className="ml-auto text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              {event.startTime}
            </span>
          )}
        </button>
      ))}
    </>
  );
}

function SheetPickerList({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (doc: SpreadsheetDoc) => void;
}) {
  const docs = useDocsStore((state) => state.docs);
  const sheets = useMemo(
    () =>
      docs.filter(
        (d): d is SpreadsheetDoc =>
          d.type === 'sheet' &&
          d.title.toLowerCase().includes(search.toLowerCase())
      ),
    [docs, search]
  );

  if (sheets.length === 0) {
    return (
      <p className="text-center text-xs text-text-light-secondary dark:text-text-dark-secondary py-4">
        No spreadsheets found
      </p>
    );
  }

  return (
    <>
      {sheets.map((sheet) => (
        <button
          key={sheet.id}
          onClick={() => onSelect(sheet)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
        >
          <svg
            className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
          <span className="text-sm text-text-light-primary dark:text-text-dark-primary truncate">
            {sheet.title}
          </span>
          <span className="ml-auto text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {sheet.sheets.length} sheet{sheet.sheets.length !== 1 ? 's' : ''}
          </span>
        </button>
      ))}
    </>
  );
}
