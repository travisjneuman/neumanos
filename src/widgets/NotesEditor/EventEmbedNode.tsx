/**
 * Event Embed Node for Lexical Editor
 * DecoratorNode that renders an inline calendar event card
 */

import React, { useCallback } from 'react';
import { DecoratorNode } from 'lexical';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useNavigate } from 'react-router-dom';
import type {
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  EditorConfig,
} from 'lexical';

export type SerializedEventEmbedNode = Spread<
  { eventId: string; dateKey: string },
  SerializedLexicalNode
>;

export class EventEmbedNode extends DecoratorNode<React.ReactElement> {
  __eventId: string;
  __dateKey: string;

  static getType(): string {
    return 'event-embed';
  }

  static clone(node: EventEmbedNode): EventEmbedNode {
    return new EventEmbedNode(node.__eventId, node.__dateKey, node.__key);
  }

  static importJSON(serializedNode: SerializedEventEmbedNode): EventEmbedNode {
    return new EventEmbedNode(serializedNode.eventId, serializedNode.dateKey);
  }

  exportJSON(): SerializedEventEmbedNode {
    return {
      eventId: this.__eventId,
      dateKey: this.__dateKey,
      type: 'event-embed',
      version: 1,
    };
  }

  constructor(eventId: string, dateKey: string, key?: NodeKey) {
    super(key);
    this.__eventId = eventId;
    this.__dateKey = dateKey;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.className = 'inline-block align-middle';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  decorate(): React.ReactElement {
    return (
      <EventEmbedComponent
        eventId={this.__eventId}
        dateKey={this.__dateKey}
        nodeKey={this.__key}
      />
    );
  }
}

function formatDateKey(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const [year, month, day] = parts;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const EventEmbedComponent = React.memo(function EventEmbedComponent({
  eventId,
  dateKey,
  nodeKey: _nodeKey,
}: {
  eventId: string;
  dateKey: string;
  nodeKey: NodeKey;
}) {
  const events = useCalendarStore((state) => state.events[dateKey]);
  const calendars = useCalendarStore((state) => state.calendars);
  const navigate = useNavigate();

  const event = events?.find((e) => e.id === eventId);

  const handleNavigate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Navigate to calendar — set the current date to the event's date
      const parts = dateKey.split('-');
      if (parts.length === 3) {
        const targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        useCalendarStore.getState().setCurrentDate(targetDate);
      }
      navigate('/calendar');
    },
    [navigate, dateKey]
  );

  if (!event) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
        Event not found
      </span>
    );
  }

  const calendar = event.calendarId
    ? calendars.find((c) => c.id === event.calendarId)
    : calendars[0];
  const calendarColor = calendar?.color || '#6366f1';

  const timeRange =
    event.startTime && event.endTime
      ? `${event.startTime} - ${event.endTime}`
      : event.isAllDay
        ? 'All day'
        : '';

  return (
    <span
      onClick={handleNavigate}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light-elevated dark:bg-surface-dark-elevated hover:border-accent-blue/50 transition-colors cursor-pointer text-sm my-0.5"
      title="Go to Calendar"
    >
      <span
        className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: calendarColor }}
      />

      <span className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
        {formatDateKey(dateKey)}
      </span>

      {timeRange && (
        <span className="text-text-light-tertiary dark:text-text-dark-tertiary text-xs">
          {timeRange}
        </span>
      )}

      <span className="text-text-light-primary dark:text-text-dark-primary font-medium">
        {event.title}
      </span>
    </span>
  );
});

export function $createEventEmbedNode(
  eventId: string,
  dateKey: string
): EventEmbedNode {
  return new EventEmbedNode(eventId, dateKey);
}

export function $isEventEmbedNode(
  node: LexicalNode | null | undefined
): node is EventEmbedNode {
  return node instanceof EventEmbedNode;
}
